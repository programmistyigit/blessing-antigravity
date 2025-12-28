/**
 * Static Permission Enum
 * All permissions in the system are defined here
 */
export enum Permission {
    // System-level permission - grants access to everything
    SYSTEM_ALL = 'SYSTEM_ALL',

    // Role management permissions
    ROLE_CREATE = 'ROLE_CREATE',
    ROLE_UPDATE = 'ROLE_UPDATE',
    ROLE_VIEW = 'ROLE_VIEW',

    // User management permissions
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_VIEW = 'USER_VIEW',

    // Section management permissions
    SECTION_CREATE = 'SECTION_CREATE',
    SECTION_UPDATE = 'SECTION_UPDATE',
    SECTION_VIEW = 'SECTION_VIEW',
    SECTION_ASSIGN_WORKER = 'SECTION_ASSIGN_WORKER',
    SECTION_CLOSE = 'SECTION_CLOSE',

    // Section daily report permissions
    SECTION_DAILY_REPORT_CREATE = 'SECTION_DAILY_REPORT_CREATE',
    SECTION_DAILY_REPORT_UPDATE = 'SECTION_DAILY_REPORT_UPDATE',
    SECTION_DAILY_REPORT_VIEW = 'SECTION_DAILY_REPORT_VIEW',

    // Section disease management permissions
    SECTION_DISEASE_CREATE = 'SECTION_DISEASE_CREATE',
    SECTION_DISEASE_UPDATE = 'SECTION_DISEASE_UPDATE',
    SECTION_DISEASE_VIEW = 'SECTION_DISEASE_VIEW',

    // Warehouse permissions
    WAREHOUSE_VIEW = 'WAREHOUSE_VIEW',
    WAREHOUSE_IN = 'WAREHOUSE_IN',
    WAREHOUSE_OUT = 'WAREHOUSE_OUT',
    WAREHOUSE_UPDATE = 'WAREHOUSE_UPDATE',

    // Inventory permissions (Phase 11)
    INVENTORY_CREATE = 'INVENTORY_CREATE',
    INVENTORY_READ = 'INVENTORY_READ',
    INVENTORY_UPDATE = 'INVENTORY_UPDATE',
    INVENTORY_DELETE = 'INVENTORY_DELETE',
    INVENTORY_APPROVE = 'INVENTORY_APPROVE',
    INVENTORY_ALERT_VIEW = 'INVENTORY_ALERT_VIEW',
    INVENTORY_ALERT_RESOLVE = 'INVENTORY_ALERT_RESOLVE',

    // Medication permissions (Phase 12)
    MEDICATION_READ = 'MEDICATION_READ',
    MEDICATION_CREATE = 'MEDICATION_CREATE',
    MEDICATION_UPDATE = 'MEDICATION_UPDATE',
    MEDICATION_DELETE = 'MEDICATION_DELETE',

    // Disease permissions (Phase 12)
    DISEASE_READ = 'DISEASE_READ',
    DISEASE_CREATE = 'DISEASE_CREATE',
    DISEASE_UPDATE = 'DISEASE_UPDATE',
    DISEASE_DELETE = 'DISEASE_DELETE',

    // Attendance permissions

    // Attendance permissions (Phase 13)
    ATTENDANCE_READ = 'ATTENDANCE_READ',
    ATTENDANCE_CREATE = 'ATTENDANCE_CREATE',
    ATTENDANCE_UPDATE = 'ATTENDANCE_UPDATE',
    ATTENDANCE_DELETE = 'ATTENDANCE_DELETE',
    ATTENDANCE_APPROVE = 'ATTENDANCE_APPROVE',

    // GPS Monitor permissions (Phase 13)
    GPS_MONITOR_READ = 'GPS_MONITOR_READ',
    GPS_MONITOR_UPDATE = 'GPS_MONITOR_UPDATE',

    // Reporting permissions
    REPORT_VIEW = 'REPORT_VIEW',
    REPORT_EXPORT = 'REPORT_EXPORT',

    // Dashboard permissions (Phase 15)
    DASHBOARD_READ = 'DASHBOARD_READ',
    KPI_READ = 'KPI_READ',

    // Batch & Production permissions (Phase 16)
    BATCH_CREATE = 'BATCH_CREATE',
    BATCH_CLOSE = 'BATCH_CLOSE',
    CHICK_OUT_CREATE = 'CHICK_OUT_CREATE',
    CHICKOUT_COMPLETE = 'CHICKOUT_COMPLETE',
    SECTION_STATUS_UPDATE = 'SECTION_STATUS_UPDATE',
    DELEGATE_PERMISSIONS = 'DELEGATE_PERMISSIONS',

    // Period permissions
    PERIOD_CREATE = 'PERIOD_CREATE',
    PERIOD_VIEW = 'PERIOD_VIEW',
    PERIOD_CLOSE = 'PERIOD_CLOSE',
    PERIOD_UPDATE = 'PERIOD_UPDATE',
    PERIOD_EXPENSE_CREATE = 'PERIOD_EXPENSE_CREATE',

    // Asset permissions
    ASSET_MANAGE = 'ASSET_MANAGE',

    // Technical Incident permissions
    TECH_REPORT_CREATE = 'TECH_REPORT_CREATE',
    TECH_REPORT_VIEW = 'TECH_REPORT_VIEW',
    TECH_REPORT_UPDATE = 'TECH_REPORT_UPDATE',

    // Finance permissions
    FINANCE_EXPENSE_APPROVE = 'FINANCE_EXPENSE_APPROVE',

    // Salary permissions
    SALARY_VIEW = 'SALARY_VIEW',
    SALARY_MANAGE = 'SALARY_MANAGE',
    SALARY_ADVANCE_GIVE = 'SALARY_ADVANCE_GIVE',
    SALARY_BONUS_GIVE = 'SALARY_BONUS_GIVE',

    // Feed & Utility permissions
    FEED_MANAGE = 'FEED_MANAGE',
    WATER_REPORT = 'WATER_REPORT',
    ELECTRICITY_REPORT = 'ELECTRICITY_REPORT',
    PRICE_MANAGE = 'PRICE_MANAGE',
}

/**
 * Get all permission values as an array
 */
export const getAllPermissions = (): Permission[] => {
    return Object.values(Permission);
};

/**
 * Check if a permission string is valid
 */
export const isValidPermission = (permission: string): permission is Permission => {
    return Object.values(Permission).includes(permission as Permission);
};
