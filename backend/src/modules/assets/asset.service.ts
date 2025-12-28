import { Asset, IAsset, AssetStatus, AssetCategory, IAssetLocation } from './asset.model';
import { AssetHistory, IAssetHistory } from './asset-history.model';
import { Period, PeriodStatus } from '../periods/period.model';
import { PeriodExpense, ExpenseCategory } from '../periods/period-expense.model';

interface CreateAssetData {
    name: string;
    category: AssetCategory;
    sectionId?: string;
    location?: IAssetLocation;
    isNewPurchase?: boolean;
    purchaseCost?: number;
    periodId?: string;  // Faqat sectionId yo'q + isNewPurchase = true bo'lganda
    createdBy: string;
}

/**
 * Asset Service
 * Uskuna boshqaruvi
 */
export class AssetService {
    /**
     * Create new asset
     * Default status = ACTIVE
     * 
     * Biznes mantiq:
     * 1. isNewPurchase = false → purchaseCost majburiy emas, xarajat yaratilmaydi
     * 2. isNewPurchase = true → purchaseCost majburiy
     *    - sectionId mavjud → ACTIVE period avtomatik topiladi
     *    - sectionId null → periodId qo'lda berilishi kerak
     */
    static async createAsset(data: CreateAssetData): Promise<IAsset> {
        const isNewPurchase = data.isNewPurchase ?? false;

        // Validation: Agar yangi xarid bo'lsa, purchaseCost majburiy
        if (isNewPurchase && (!data.purchaseCost || data.purchaseCost <= 0)) {
            throw new Error('purchaseCost is required for new purchases and must be greater than 0');
        }

        // Validation: Agar eski uskuna bo'lsa, purchaseCost kiritilmaydi
        if (!isNewPurchase && data.purchaseCost) {
            throw new Error('purchaseCost is not allowed for legacy assets (isNewPurchase = false)');
        }

        let purchasePeriodId: string | null = null;

        // Yangi xarid uchun period aniqlash
        if (isNewPurchase && data.purchaseCost) {
            if (data.sectionId) {
                // Sexga bog'langan uskuna → section'ning ACTIVE periodini topish
                const activePeriod = await Period.findOne({
                    sections: data.sectionId,
                    status: PeriodStatus.ACTIVE
                });

                if (activePeriod) {
                    purchasePeriodId = activePeriod._id.toString();
                }
                // Agar period topilmasa → xarajat yozilmaydi (ERROR emas!)
            } else {
                // Sexga bog'lanmagan uskuna → periodId majburiy
                if (!data.periodId) {
                    throw new Error('periodId is required for assets without section when isNewPurchase is true');
                }

                // Berilgan periodning mavjudligini va ACTIVE ekanini tekshirish
                const period = await Period.findById(data.periodId);
                if (!period) {
                    throw new Error('Period not found');
                }
                if (period.status !== PeriodStatus.ACTIVE) {
                    throw new Error('Cannot add expense to closed period');
                }

                purchasePeriodId = data.periodId;
            }
        }

        // Asset yaratish
        const asset = new Asset({
            name: data.name,
            category: data.category,
            sectionId: data.sectionId || null,
            location: data.location || null,
            isNewPurchase: isNewPurchase,
            purchaseCost: isNewPurchase ? data.purchaseCost : null,
            purchasePeriodId: purchasePeriodId,
            status: AssetStatus.ACTIVE,
            createdBy: data.createdBy,
        });

        await asset.save();

        // Xarajatni davrga yozish (faqat period aniqlangan bo'lsa)
        if (isNewPurchase && data.purchaseCost && purchasePeriodId) {
            await PeriodExpense.create({
                periodId: purchasePeriodId,
                category: ExpenseCategory.ASSET_PURCHASE,
                amount: data.purchaseCost,
                description: `Asset purchase: ${data.name}`,
                expenseDate: new Date(),
                createdBy: data.createdBy,
            });
        }

        return asset;
    }

    /**
     * Update asset status
     * History yoziladi - AUDIT TRAIL
     */
    static async updateStatus(
        assetId: string,
        newStatus: AssetStatus,
        userId: string
    ): Promise<IAsset> {
        const asset = await Asset.findById(assetId);
        if (!asset) {
            throw new Error('Asset not found');
        }

        const oldStatus = asset.status;

        // Agar status o'zgargan bo'lsa
        if (oldStatus !== newStatus) {
            // History yozish - AUDIT TRAIL
            await AssetHistory.create({
                assetId: asset._id,
                oldStatus,
                newStatus,
                changedBy: userId,
                changedAt: new Date(),
            });

            // Status yangilash
            asset.status = newStatus;
            await asset.save();
        }

        return asset;
    }

    /**
     * Get asset by ID
     */
    static async getAssetById(assetId: string): Promise<IAsset | null> {
        return Asset.findById(assetId)
            .populate('sectionId', 'name status')
            .populate('createdBy', 'fullName username');
    }

    /**
     * Get assets by section
     */
    static async getAssetsBySection(sectionId: string): Promise<IAsset[]> {
        return Asset.find({ sectionId })
            .populate('createdBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all assets
     */
    static async getAllAssets(): Promise<IAsset[]> {
        return Asset.find()
            .populate('sectionId', 'name status')
            .populate('createdBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get assets without section (umumiy uskunalar)
     */
    static async getUnassignedAssets(): Promise<IAsset[]> {
        return Asset.find({ sectionId: null })
            .populate('createdBy', 'fullName username')
            .sort({ createdAt: -1 });
    }

    /**
     * Get asset status history
     */
    static async getAssetHistory(assetId: string): Promise<IAssetHistory[]> {
        return AssetHistory.find({ assetId })
            .populate('changedBy', 'fullName username')
            .sort({ changedAt: -1 });
    }
}
