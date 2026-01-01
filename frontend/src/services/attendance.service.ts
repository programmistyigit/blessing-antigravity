import api, { type ApiResponse } from '@/lib/api';

/**
 * Attendance Types
 */
export type AttendanceStatus = 'PENDING' | 'PRESENT' | 'LATE' | 'ABSENT' | 'APPROVED' | 'REJECTED';

export interface Attendance {
    id: string;
    userId: string;
    sectionId: string;
    date: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: AttendanceStatus;
    arrivalDiff: number;
    arrivalSymbol: 'EARLY' | 'ON_TIME' | 'LATE';
    isFake: boolean;
    location: { lat: number; lng: number } | null;
    createdAt: string;
}

export interface CompanyLocation {
    lat: number;
    lng: number;
    radius: number;
}

export interface CheckInPayload {
    checkInTime: string;
    location: { lat: number; lng: number };
    plannedStartTime?: string;
}

export interface CheckOutPayload {
    checkOutTime: string;
}

/**
 * GET /api/company/location
 * Get company attendance location
 */
export async function getCompanyLocation(): Promise<CompanyLocation | null> {
    const response = await api.get<ApiResponse<CompanyLocation | null>>('/company/location');
    return response.data.data;
}

/**
 * PATCH /api/company/location
 * Update company attendance location
 */
export async function updateCompanyLocation(location: { lat: number; lng: number; radius?: number }): Promise<CompanyLocation> {
    const response = await api.patch<ApiResponse<CompanyLocation>>('/company/location', location);
    return response.data.data;
}

/**
 * POST /api/sections/:id/attendance
 * Check-in to a section
 */
export async function checkIn(sectionId: string, payload: CheckInPayload): Promise<Attendance> {
    const response = await api.post<ApiResponse<Attendance>>(`/sections/${sectionId}/attendance`, payload);
    return response.data.data;
}

/**
 * PATCH /api/attendance/:id
 * Update attendance (check-out)
 */
export async function checkOut(attendanceId: string, payload: CheckOutPayload): Promise<Attendance> {
    const response = await api.patch<ApiResponse<Attendance>>(`/attendance/${attendanceId}`, payload);
    return response.data.data;
}

/**
 * GET /api/sections/:id/attendance
 * Get section attendance records
 */
export async function getSectionAttendance(sectionId: string, date?: string): Promise<Attendance[]> {
    const url = date ? `/sections/${sectionId}/attendance?date=${date}` : `/sections/${sectionId}/attendance`;
    const response = await api.get<ApiResponse<Attendance[]>>(url);
    return response.data.data;
}

/**
 * POST /api/attendance/:id/approve
 * Approve attendance
 */
export async function approveAttendance(attendanceId: string): Promise<Attendance> {
    const response = await api.post<ApiResponse<Attendance>>(`/attendance/${attendanceId}/approve`);
    return response.data.data;
}
