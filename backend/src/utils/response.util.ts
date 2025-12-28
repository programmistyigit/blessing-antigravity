interface SuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

interface ErrorResponse {
    success: false;
    error: string;
    details?: any;
}

/**
 * Standard success response format
 */
export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
    return {
        success: true,
        data,
        ...(message && { message }),
    };
}

/**
 * Standard error response format
 */
export function errorResponse(error: string, details?: any): ErrorResponse {
    return {
        success: false,
        error,
        ...(details && { details }),
    };
}
