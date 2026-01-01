import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCompanyLocation,
    updateCompanyLocation,
    checkIn,
    checkOut,
    getSectionAttendance,
    approveAttendance,
    type CompanyLocation,
    type Attendance,
    type CheckInPayload,
    type CheckOutPayload,
} from '@/services/attendance.service';

/**
 * Hook for getting company location
 */
export function useCompanyLocation() {
    return useQuery<CompanyLocation | null, Error>({
        queryKey: ['company-location'],
        queryFn: getCompanyLocation,
        staleTime: 60 * 1000,
    });
}

/**
 * Hook for updating company location
 */
export function useUpdateCompanyLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (location: { lat: number; lng: number; radius?: number }) =>
            updateCompanyLocation(location),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-location'] });
        },
    });
}

/**
 * Hook for check-in
 */
export function useCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sectionId, payload }: { sectionId: string; payload: CheckInPayload }) =>
            checkIn(sectionId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

/**
 * Hook for check-out
 */
export function useCheckOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ attendanceId, payload }: { attendanceId: string; payload: CheckOutPayload }) =>
            checkOut(attendanceId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

/**
 * Hook for getting section attendance
 */
export function useSectionAttendance(sectionId: string | undefined, date?: string) {
    return useQuery<Attendance[], Error>({
        queryKey: ['attendance', sectionId, date],
        queryFn: () => getSectionAttendance(sectionId!, date),
        enabled: !!sectionId,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for approving attendance
 */
export function useApproveAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (attendanceId: string) => approveAttendance(attendanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}
