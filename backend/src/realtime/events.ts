import { socketManager } from './socket';

/**
 * Real-time Event Types
 */
export enum RealtimeEvent {
    // User events
    USER_CREATED = 'user_created',
    USER_UPDATED = 'user_updated',
    USER_DELETED = 'user_deleted',

    // Role events
    ROLE_CREATED = 'role_created',
    ROLE_UPDATED = 'role_updated',
    PERMISSION_UPDATED = 'permission_updated',

    // Section events (for future implementation)
    SECTION_CREATED = 'section_created',
    SECTION_UPDATED = 'section_updated',
    SECTION_ASSIGNED = 'section_assigned',
    SECTION_CLOSED = 'section_closed',

    // Daily report events (for future implementation)
    DAILY_REPORT_CREATED = 'daily_report_created',
    DAILY_REPORT_UPDATED = 'daily_report_updated',

    // Inventory events
    INVENTORY_ITEM_CREATED = 'inventory_item_created',
    INVENTORY_ITEM_UPDATED = 'inventory_item_updated',
    INVENTORY_ITEM_REMOVED = 'inventory_item_removed',
    INVENTORY_ALERT_MIN_THRESHOLD = 'inventory_alert_min_threshold',
    INVENTORY_ALERT_MAX_THRESHOLD = 'inventory_alert_max_threshold',
    INVENTORY_LOW_STOCK = 'inventory_low_stock',

    // Health events (Phase 12)
    DISEASE_CREATED = 'disease_created',
    DISEASE_UPDATED = 'disease_updated',
    DISEASE_DELETED = 'disease_deleted',
    MEDICATION_CREATED = 'medication_created',
    MEDICATION_UPDATED = 'medication_updated',
    MEDICATION_DELETED = 'medication_deleted',
    MEDICATION_ALERT_LOW_STOCK = 'medication_alert_low_stock',
    DISEASE_ALERT_HIGH_MORTALITY = 'disease_alert_high_mortality',

    // Attendance events (for future implementation)
    // Attendance events (Phase 13)
    ATTENDANCE_CREATED = 'attendance_created',
    ATTENDANCE_UPDATED = 'attendance_updated',
    ATTENDANCE_APPROVED = 'attendance_approved',
    ATTENDANCE_FAKE_DETECTED = 'attendance_fake_detected',
    ATTENDANCE_LATE_ALERT = 'attendance_late_alert',
    ATTENDANCE_EARLY_ALERT = 'attendance_early_alert',
    ATTENDANCE_ABSENT_ALERT = 'attendance_absent_alert',

    // Batch & Production events (Phase 16)
    BATCH_STARTED = 'batch_started',
    BATCH_CLOSED = 'batch_closed',
    CHICK_OUT_CREATED = 'chick_out_created',
    SECTION_STATUS_CHANGED = 'section_status_changed',
    DELEGATION_ACTIVATED = 'delegation_activated',
    DELEGATION_DEACTIVATED = 'delegation_deactivated',

    // Salary events
    SALARY_ADVANCE_GIVEN = 'salary_advance_given',
    SALARY_BONUS_GIVEN = 'salary_bonus_given',
    SALARY_EXPENSE_FINALIZED = 'salary_expense_finalized',

    // Feed, Utility, Price events
    FEED_DELIVERY_RECORDED = 'feed_delivery_recorded',
    UTILITY_COST_RECORDED = 'utility_cost_recorded',
    PRICE_CHANGED = 'price_changed',

    // Financial events
    EXPENSE_CREATED = 'expense_created',
    PERIOD_PL_UPDATED = 'period_pl_updated',
    SECTION_PL_UPDATED = 'section_pl_updated',
    PERIOD_CLOSED = 'period_closed',

    // System events
    SYSTEM_NOTIFICATION = 'system_notification',
}

/**
 * Emit user created event
 * Broadcast to users channel
 */
export function emitUserCreated(userData: any): void {
    socketManager.broadcastToChannel('users', RealtimeEvent.USER_CREATED, userData);
}

/**
 * Emit user updated event
 * Broadcast to users channel
 */
export function emitUserUpdated(userData: any): void {
    socketManager.broadcastToChannel('users', RealtimeEvent.USER_UPDATED, userData);
}

/**
 * Emit role created event
 * Broadcast to roles channel and system admins
 */
export function emitRoleCreated(roleData: any): void {
    socketManager.broadcastToChannel('roles', RealtimeEvent.ROLE_CREATED, roleData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.ROLE_CREATED, roleData);
}

/**
 * Emit role updated event
 * Broadcast to roles channel and system admins
 */
export function emitRoleUpdated(roleData: any): void {
    socketManager.broadcastToChannel('roles', RealtimeEvent.ROLE_UPDATED, roleData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.ROLE_UPDATED, roleData);
}

/**
 * Emit permission updated event
 * Broadcast to affected users and system admins
 */
export function emitPermissionUpdated(permissionData: any): void {
    socketManager.broadcastToChannel('roles', RealtimeEvent.PERMISSION_UPDATED, permissionData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.PERMISSION_UPDATED, permissionData);
}

/**
 * Send system notification to a specific user
 */
export function sendSystemNotification(userId: string, message: string): void {
    socketManager.sendToUser(userId, RealtimeEvent.SYSTEM_NOTIFICATION, { message });
}

/**
 * Broadcast system notification to a channel
 */
export function broadcastSystemNotification(channel: string, message: string): void {
    socketManager.broadcastToChannel(channel, RealtimeEvent.SYSTEM_NOTIFICATION, { message });
}

/**
 * Emit section created event
 */
export function emitSectionCreated(sectionData: any): void {
    // Notify all users who can view sections or specific channel if needed.
    // Usually director/managers listen to system:* or explicit list
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_CREATED, sectionData);
    // Also broadcast to those subscribed to generic 'sections' channel if it exists? 
    // For now, based on requirements: "Director -> system:*", "Section workers -> section:{sectionId}"
    // Section created is relevant for Directors mostly until workers are assigned.
}

/**
 * Emit section updated event
 */
export function emitSectionUpdated(sectionData: any): void {
    socketManager.broadcastToChannel(`section:${sectionData.id}`, RealtimeEvent.SECTION_UPDATED, sectionData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_UPDATED, sectionData);
}

/**
 * Emit section assigned event
 */
export function emitSectionAssigned(sectionData: any): void {
    socketManager.broadcastToChannel(`section:${sectionData.id}`, RealtimeEvent.SECTION_ASSIGNED, sectionData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_ASSIGNED, sectionData);
}

/**
 * Emit section closed event
 */
export function emitSectionClosed(sectionData: any): void {
    socketManager.broadcastToChannel(`section:${sectionData.id}`, RealtimeEvent.SECTION_CLOSED, sectionData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_CLOSED, sectionData);
}

/**
 * Emit daily report created event
 */
export function emitDailyReportCreated(reportData: any): void {
    socketManager.broadcastToChannel(`section:${reportData.sectionId}`, RealtimeEvent.DAILY_REPORT_CREATED, reportData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DAILY_REPORT_CREATED, reportData);
}

/**
 * Emit daily report updated event
 */
export function emitDailyReportUpdated(reportData: any): void {
    socketManager.broadcastToChannel(`section:${reportData.sectionId}`, RealtimeEvent.DAILY_REPORT_UPDATED, reportData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DAILY_REPORT_UPDATED, reportData);
}


export function emitInventoryItemCreated(itemData: any): void {
    socketManager.broadcastToChannel('system:inventory:*', RealtimeEvent.INVENTORY_ITEM_CREATED, itemData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.INVENTORY_ITEM_CREATED, itemData);
}

export function emitInventoryItemUpdated(itemData: any): void {
    socketManager.broadcastToChannel(`inventory:${itemData.id}`, RealtimeEvent.INVENTORY_ITEM_UPDATED, itemData);
    socketManager.broadcastToChannel('system:inventory:*', RealtimeEvent.INVENTORY_ITEM_UPDATED, itemData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.INVENTORY_ITEM_UPDATED, itemData);
}

export function emitInventoryItemRemoved(itemData: any): void {
    socketManager.broadcastToChannel(`inventory:${itemData.id}`, RealtimeEvent.INVENTORY_ITEM_REMOVED, itemData);
    socketManager.broadcastToChannel('system:inventory:*', RealtimeEvent.INVENTORY_ITEM_REMOVED, itemData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.INVENTORY_ITEM_REMOVED, itemData);
}

export function emitInventoryThresholdAlert(eventId: string, itemData: any): void {
    const channel = 'system:inventory:*'; // Alerts go to managers
    socketManager.broadcastToChannel(channel, eventId, itemData);
    socketManager.broadcastToChannel('system:*', eventId, itemData);
}

export function emitInventoryLowStock(alertData: any): void {
    const channel = 'system:inventory:*';
    socketManager.broadcastToChannel(channel, RealtimeEvent.INVENTORY_LOW_STOCK, alertData);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.INVENTORY_LOW_STOCK, alertData);
    if (alertData.sectionId) {
        socketManager.broadcastToChannel(`section:${alertData.sectionId}`, RealtimeEvent.INVENTORY_LOW_STOCK, alertData);
    }
}


export function emitDiseaseCreated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.DISEASE_CREATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.DISEASE_CREATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DISEASE_CREATED, data);
}

export function emitDiseaseUpdated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.DISEASE_UPDATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.DISEASE_UPDATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DISEASE_UPDATED, data);
}

export function emitDiseaseDeleted(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.DISEASE_DELETED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.DISEASE_DELETED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DISEASE_DELETED, data);
}

export function emitMedicationCreated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.MEDICATION_CREATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.MEDICATION_CREATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.MEDICATION_CREATED, data);
}

export function emitMedicationUpdated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.MEDICATION_UPDATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.MEDICATION_UPDATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.MEDICATION_UPDATED, data);
}

export function emitMedicationDeleted(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.MEDICATION_DELETED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.MEDICATION_DELETED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.MEDICATION_DELETED, data);
}

export function emitHealthAlert(eventId: string, data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, eventId, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, eventId, data);
    socketManager.broadcastToChannel('system:*', eventId, data);
}


export function emitAttendanceCreated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_CREATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_CREATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.ATTENDANCE_CREATED, data);
}

export function emitAttendanceUpdated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_UPDATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_UPDATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.ATTENDANCE_UPDATED, data);
}

export function emitAttendanceApproved(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_APPROVED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.ATTENDANCE_APPROVED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.ATTENDANCE_APPROVED, data);
}

export function emitAttendanceAlert(eventId: string, data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, eventId, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, eventId, data);
    socketManager.broadcastToChannel('system:*', eventId, data);
}

// === Batch & Production Events (Phase 16) ===

export function emitBatchStarted(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.BATCH_STARTED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.BATCH_STARTED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.BATCH_STARTED, data);
}

export function emitBatchClosed(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.BATCH_CLOSED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.BATCH_CLOSED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.BATCH_CLOSED, data);
}

export function emitChickOutCreated(data: any): void {
    socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.CHICK_OUT_CREATED, data);
    socketManager.broadcastToChannel(`system:section:${data.sectionId}`, RealtimeEvent.CHICK_OUT_CREATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.CHICK_OUT_CREATED, data);
}

export function emitSectionStatusChanged(data: any): void {
    socketManager.broadcastToChannel(`section:${data._id || data.id}`, RealtimeEvent.SECTION_STATUS_CHANGED, data);
    socketManager.broadcastToChannel(`system:section:${data._id || data.id}`, RealtimeEvent.SECTION_STATUS_CHANGED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_STATUS_CHANGED, data);
}

export function emitDelegationActivated(data: any): void {
    // Notify both users involved
    socketManager.sendToUser(data.fromUserId?.toString(), RealtimeEvent.DELEGATION_ACTIVATED, data);
    socketManager.sendToUser(data.toUserId?.toString(), RealtimeEvent.DELEGATION_ACTIVATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DELEGATION_ACTIVATED, data);
}

export function emitDelegationDeactivated(data: any): void {
    socketManager.sendToUser(data.fromUserId?.toString(), RealtimeEvent.DELEGATION_DEACTIVATED, data);
    socketManager.sendToUser(data.toUserId?.toString(), RealtimeEvent.DELEGATION_DEACTIVATED, data);
    socketManager.broadcastToChannel('system:*', RealtimeEvent.DELEGATION_DEACTIVATED, data);
}

// Salary events
export function emitSalaryAdvanceGiven(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SALARY_ADVANCE_GIVEN, data);
}

export function emitSalaryBonusGiven(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SALARY_BONUS_GIVEN, data);
}

// Feed, Utility, Price events
export function emitFeedDeliveryRecorded(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.FEED_DELIVERY_RECORDED, data);
    if (data.sectionId) {
        socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.FEED_DELIVERY_RECORDED, data);
    }
}

export function emitUtilityCostRecorded(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.UTILITY_COST_RECORDED, data);
    if (data.sectionId) {
        socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.UTILITY_COST_RECORDED, data);
    }
}

export function emitPriceChanged(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.PRICE_CHANGED, data);
}

// === Financial Events ===
export function emitSalaryExpenseFinalized(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SALARY_EXPENSE_FINALIZED, data);
}

export function emitExpenseCreated(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.EXPENSE_CREATED, data);
    if (data.sectionId) {
        socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.EXPENSE_CREATED, data);
    }
}

export function emitPeriodPLUpdated(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.PERIOD_PL_UPDATED, data);
}

export function emitSectionPLUpdated(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.SECTION_PL_UPDATED, data);
    if (data.sectionId) {
        socketManager.broadcastToChannel(`section:${data.sectionId}`, RealtimeEvent.SECTION_PL_UPDATED, data);
    }
}

export function emitPeriodClosed(data: any): void {
    socketManager.broadcastToChannel('system:*', RealtimeEvent.PERIOD_CLOSED, data);
}
