import { Disease, Medication, IDisease, IMedication, MedicationEffectiveness } from './health.model';
import { Section, SectionStatus } from '../sections/section.model';
import { InventoryItem, InventoryCategory } from '../inventory/inventory.model';
import { emitDiseaseCreated, emitDiseaseUpdated, emitDiseaseDeleted, emitMedicationCreated, emitMedicationUpdated, emitMedicationDeleted, emitHealthAlert, RealtimeEvent } from '../../realtime/events';

// Configuration
const HIGH_MORTALITY_THRESHOLD = 50; // Alert if daily mortality exceeds this

interface CreateDiseaseData {
    sectionId: string;
    dateDetected: string;
    diseaseName: string;
    affectedChicks: number;
    mortality: number;
    notes?: string;
    createdBy: string;
}

interface CreateMedicationData {
    sectionId: string;
    dateGiven: string;
    medicationName: string;
    dose: string;
    quantityUsed?: number;        // Inventory dan ayiriladigan miqdor
    unitCost?: number;            // Bir birlik narxi
    givenToChicks: number;
    effectiveness?: MedicationEffectiveness;
    notes?: string;
    createdBy: string;
}

export class HealthService {
    // --- DISEASE MANAGEMENT ---

    static async createDisease(data: CreateDiseaseData): Promise<IDisease> {
        const section = await Section.findById(data.sectionId);
        if (!section) throw new Error('Section not found');
        if (section.status !== SectionStatus.ACTIVE) throw new Error('Cannot add disease record to inactive section');

        const disease = new Disease({
            ...data,
            dateDetected: new Date(data.dateDetected),
        });
        await disease.save();

        emitDiseaseCreated(disease);

        if (disease.mortality >= HIGH_MORTALITY_THRESHOLD) {
            emitHealthAlert(RealtimeEvent.DISEASE_ALERT_HIGH_MORTALITY, {
                sectionId: section._id,
                diseaseId: disease._id,
                diseaseName: disease.diseaseName,
                mortality: disease.mortality,
                message: `⚠️ High Mortality Alert: ${disease.mortality} birds died in Section ${section.name} due to ${disease.diseaseName}`,
                severity: 'critical'
            });
        }

        return disease;
    }

    static async updateDisease(id: string, data: Partial<CreateDiseaseData>): Promise<IDisease> {
        const disease = await Disease.findById(id);
        if (!disease) throw new Error('Disease record not found');

        if (data.diseaseName) disease.diseaseName = data.diseaseName;
        if (data.dateDetected) disease.dateDetected = new Date(data.dateDetected);
        if (data.affectedChicks !== undefined) disease.affectedChicks = data.affectedChicks;
        if (data.mortality !== undefined) disease.mortality = data.mortality;
        if (data.notes !== undefined) disease.notes = data.notes;

        await disease.save();
        emitDiseaseUpdated(disease);

        // Check alert again if mortality changed
        if (data.mortality !== undefined && data.mortality >= HIGH_MORTALITY_THRESHOLD) {
            const section = await Section.findById(disease.sectionId);
            if (section) {
                emitHealthAlert(RealtimeEvent.DISEASE_ALERT_HIGH_MORTALITY, {
                    sectionId: section._id,
                    diseaseId: disease._id,
                    diseaseName: disease.diseaseName,
                    mortality: disease.mortality,
                    message: `⚠️ High Mortality Alert Updated: ${disease.mortality} birds died in Section ${section.name}`,
                    severity: 'critical'
                });
            }
        }

        return disease;
    }

    static async getDiseases(sectionId: string): Promise<IDisease[]> {
        return Disease.find({ sectionId }).sort({ dateDetected: -1 });
    }

    static async deleteDisease(id: string): Promise<void> {
        const disease = await Disease.findById(id);
        if (!disease) throw new Error('Disease record not found');

        await disease.deleteOne();
        emitDiseaseDeleted({ id: disease._id, sectionId: disease.sectionId });
    }

    // --- MEDICATION MANAGEMENT ---

    static async createMedication(data: CreateMedicationData): Promise<IMedication> {
        const mongoose = await import('mongoose');
        const session = await mongoose.default.startSession();
        session.startTransaction();

        try {
            const section = await Section.findById(data.sectionId).session(session);
            if (!section) throw new Error('Section not found');
            if (section.status !== SectionStatus.ACTIVE) throw new Error('Cannot add medication record to inactive section');

            // Find inventory item for this medication
            const inventoryItem = await InventoryItem.findOne({
                name: new RegExp(`^${data.medicationName}$`, 'i'),
                category: InventoryCategory.MEDICINE,
                isActive: true
            }).session(session);

            let expenseId = null;
            let quantityUsed = data.quantityUsed;
            let unitCost = data.unitCost;

            // If quantityUsed provided and inventory exists → deduct from inventory
            if (quantityUsed && quantityUsed > 0 && inventoryItem) {
                if (inventoryItem.quantity < quantityUsed) {
                    throw new Error(`Omborda yetarli dori yo'q. Mavjud: ${inventoryItem.quantity} ${inventoryItem.unit}`);
                }

                // Deduct from inventory
                inventoryItem.quantity -= quantityUsed;
                inventoryItem.lastUpdatedAt = new Date();
                await inventoryItem.save({ session });

                // Create expense if section has active period
                if (section.activePeriodId && unitCost && unitCost > 0) {
                    const { PeriodExpense, ExpenseCategory } = await import('../periods/period-expense.model');
                    const totalCost = quantityUsed * unitCost;

                    const [expense] = await PeriodExpense.create([{
                        periodId: section.activePeriodId,
                        category: ExpenseCategory.MEDICINE,
                        amount: totalCost,
                        quantity: quantityUsed,
                        unitCost: unitCost,
                        description: `Dori sarfi: ${data.medicationName} - ${quantityUsed} ${inventoryItem.unit}`,
                        expenseDate: new Date(data.dateGiven),
                        sectionId: data.sectionId,
                        source: 'MANUAL',
                        createdBy: data.createdBy,
                    }], { session });

                    expenseId = expense._id;
                }
            }

            // Create medication record
            const medication = new Medication({
                sectionId: data.sectionId,
                dateGiven: new Date(data.dateGiven),
                medicationName: data.medicationName,
                dose: data.dose,
                quantityUsed: quantityUsed || null,
                unitCost: unitCost || null,
                givenToChicks: data.givenToChicks,
                effectiveness: data.effectiveness || 'UNKNOWN',
                notes: data.notes || '',
                expenseId: expenseId,
                createdBy: data.createdBy,
            });
            await medication.save({ session });

            await session.commitTransaction();

            // Emit events after successful commit
            emitMedicationCreated(medication);

            // Emit inventory consumption event
            if (quantityUsed && quantityUsed > 0 && inventoryItem) {
                const { emitInventoryItemUpdated } = await import('../../realtime/events');
                emitInventoryItemUpdated(inventoryItem);

                // Check low stock alert
                if (inventoryItem.quantity <= inventoryItem.minThreshold) {
                    emitHealthAlert(RealtimeEvent.MEDICATION_ALERT_LOW_STOCK, {
                        sectionId: section._id,
                        medicationId: medication._id,
                        medicationName: medication.medicationName,
                        currentStock: inventoryItem.quantity,
                        minThreshold: inventoryItem.minThreshold,
                        message: `⚠️ Low Stock Alert: ${inventoryItem.name} (${inventoryItem.quantity} ${inventoryItem.unit})`,
                        severity: 'warning'
                    });
                }
            }

            return medication;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    static async updateMedication(id: string, data: Partial<CreateMedicationData>): Promise<IMedication> {
        const medication = await Medication.findById(id);
        if (!medication) throw new Error('Medication record not found');

        if (data.medicationName) medication.medicationName = data.medicationName;
        if (data.dateGiven) medication.dateGiven = new Date(data.dateGiven);
        if (data.dose) medication.dose = data.dose;
        if (data.givenToChicks !== undefined) medication.givenToChicks = data.givenToChicks;
        if (data.effectiveness) medication.effectiveness = data.effectiveness;
        if (data.notes !== undefined) medication.notes = data.notes;

        await medication.save();
        emitMedicationUpdated(medication);

        return medication;
    }

    static async getMedications(sectionId: string): Promise<IMedication[]> {
        return Medication.find({ sectionId }).sort({ dateGiven: -1 });
    }

    static async deleteMedication(id: string): Promise<void> {
        const medication = await Medication.findById(id);
        if (!medication) throw new Error('Medication record not found');

        await medication.deleteOne();
        emitMedicationDeleted({ id: medication._id, sectionId: medication.sectionId });
    }
}
