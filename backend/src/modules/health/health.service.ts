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
        const section = await Section.findById(data.sectionId);
        if (!section) throw new Error('Section not found');
        if (section.status !== SectionStatus.ACTIVE) throw new Error('Cannot add medication record to inactive section');

        const medication = new Medication({
            ...data,
            dateGiven: new Date(data.dateGiven),
        });
        await medication.save();

        emitMedicationCreated(medication);

        // Inventory Check
        // Try to find inventory item with same name
        const inventoryItem = await InventoryItem.findOne({
            name: new RegExp(`^${data.medicationName}$`, 'i'), // Case insensitive match
            category: InventoryCategory.MEDICINE,
            isActive: true
        });

        if (inventoryItem) {
            // Check if stock is low (alert logic only, consumption is manual in Phase 11/12 via Inventory API usually, 
            // unless we auto-deduct. Prompt didn't strictly say auto-deduct, but "medication_alert_low_stock if minThreshold reached".
            // Since we aren't deducting here (dose is string e.g. "10ml", unit in inventory could be "Liters"), 
            // exact deduction is hard without unit conversion.
            // We'll just check current stock vs threshold.

            if (inventoryItem.quantity <= inventoryItem.minThreshold) {
                emitHealthAlert(RealtimeEvent.MEDICATION_ALERT_LOW_STOCK, {
                    sectionId: section._id,
                    medicationId: medication._id,
                    medicationName: medication.medicationName,
                    currentStock: inventoryItem.quantity,
                    minThreshold: inventoryItem.minThreshold,
                    message: `⚠️ Low Stock Alert: Medication ${inventoryItem.name} is low (${inventoryItem.quantity} ${inventoryItem.unit})`,
                    severity: 'warning'
                });
            }
        }

        return medication;
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
