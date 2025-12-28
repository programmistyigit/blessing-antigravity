// English - Backend messages
import type { BackendTranslationKeys } from './uz';

export const en: BackendTranslationKeys = {
    errors: {
        // Auth
        unauthorized: "Authorization required",
        forbidden: "Access denied",
        invalidCredentials: "Invalid username or password",
        tokenExpired: "Session expired. Please login again",
        tokenInvalid: "Invalid token",

        // Validation
        validationError: "Validation error",
        required: "Required field",
        invalidFormat: "Invalid format",

        // Resources
        notFound: "Not found",
        userNotFound: "User not found",
        sectionNotFound: "Section not found",
        roleNotFound: "Role not found",
        reportNotFound: "Report not found",

        // Actions
        alreadyExists: "Already exists",
        reportAlreadySubmitted: "Today's report has already been submitted",
        cannotDelete: "Cannot delete",
        cannotUpdate: "Cannot update",

        // Server
        serverError: "Server error. Please try again later",
        databaseError: "Database error",
    },
    success: {
        // Auth
        loginSuccess: "Successfully logged in",
        logoutSuccess: "Successfully logged out",

        // CRUD
        created: "Successfully created",
        updated: "Successfully updated",
        deleted: "Successfully deleted",

        // Reports
        reportSubmitted: "Report successfully submitted",
        reportApproved: "Report approved",
        reportRejected: "Report rejected",
    },
    warnings: {
        highMortality: "High mortality rate detected",
        lowFeed: "Feed stock is running low",
        reminderDailyReport: "Don't forget to submit your daily report",
    },
};
