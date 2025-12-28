/**
 * Excel Mapping Layer
 * Maps backend fields to Excel terminology (Russian/Uzbek)
 * 
 * Bu layer keyingi Excel/PDF export uchun tayyor:
 * - Hozircha faqat mapping mantiqi
 * - Export hali yo'q
 */

// Excel column mappings (Russian terminology matching Excel format)
export const ExcelMappings = {
    // Daily fields
    startOfDayChicks: 'Остаток на начало',     // Kun boshidagi qoldiq
    deaths: 'Падеж',                            // O'lim
    chickOut: 'Расход',                         // Chiqim
    endOfDayChicks: 'Остаток на конец',        // Kun oxiridagi qoldiq
    date: 'Дата',                               // Sana

    // Summary fields
    totalDeaths: 'Итого падеж',                // Jami o'lim
    totalChickOut: 'Итого расход',             // Jami chiqim
    finalChickCount: 'Конечный остаток',       // Yakuniy qoldiq
    startChickCount: 'Начальное количество',   // Boshlang'ich son
    totalDays: 'Количество дней',              // Kunlar soni
    averageDailyMortality: 'Среднесуточный падеж', // O'rtacha kunlik o'lim

    // Batch info
    batchId: 'ID партии',
    sectionName: 'Секция',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    status: 'Статус',
} as const;

// Uzbek terminology (alternative)
export const ExcelMappingsUz = {
    // Daily fields
    startOfDayChicks: 'Kun boshidagi qoldiq',
    deaths: 'O\'lim',
    chickOut: 'Chiqim',
    endOfDayChicks: 'Kun oxiridagi qoldiq',
    date: 'Sana',

    // Summary fields
    totalDeaths: 'Jami o\'lim',
    totalChickOut: 'Jami chiqim',
    finalChickCount: 'Yakuniy qoldiq',
    startChickCount: 'Boshlang\'ich son',
    totalDays: 'Kunlar soni',
    averageDailyMortality: 'O\'rtacha kunlik o\'lim',

    // Batch info
    batchId: 'Partiya ID',
    sectionName: 'Seksiya',
    startDate: 'Boshlanish sanasi',
    endDate: 'Tugash sanasi',
    status: 'Holat',
} as const;

// Type for mapping keys
export type ExcelFieldKey = keyof typeof ExcelMappings;

/**
 * Get field label by language
 */
export function getFieldLabel(field: ExcelFieldKey, language: 'ru' | 'uz' = 'ru'): string {
    if (language === 'uz') {
        return ExcelMappingsUz[field] || field;
    }
    return ExcelMappings[field] || field;
}

/**
 * Map batch summary to Excel-compatible object
 */
export interface ExcelBatchSummary {
    [ExcelMappings.batchId]: string;
    [ExcelMappings.startChickCount]: number;
    [ExcelMappings.totalDeaths]: number;
    [ExcelMappings.totalChickOut]: number;
    [ExcelMappings.finalChickCount]: number;
    [ExcelMappings.totalDays]: number;
    [ExcelMappings.averageDailyMortality]: number;
}

/**
 * Map daily balance to Excel-compatible object
 */
export interface ExcelDailyRow {
    [ExcelMappings.date]: string;
    [ExcelMappings.startOfDayChicks]: number;
    [ExcelMappings.deaths]: number;
    [ExcelMappings.chickOut]: number;
    [ExcelMappings.endOfDayChicks]: number;
}
