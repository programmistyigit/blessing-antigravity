import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getSections,
    createSection,
    updateSection,
    assignWorkersToSection,
    getSectionPL,
    type Section,
    type SectionPL,
    type CreateSectionPayload,
    type UpdateSectionPayload,
} from '@/services/sections.service';

/**
 * Hook for fetching section P&L metrics
 */
export function useSectionPL(id: string | undefined) {
    return useQuery<SectionPL, Error>({
        queryKey: ['sections', id, 'pl'],
        queryFn: () => getSectionPL(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook for fetching all sections
 * queryKey: ['sections']
 */
export function useSections() {
    return useQuery<Section[], Error>({
        queryKey: ['sections'],
        queryFn: getSections,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for getting a single section from cache
 * Uses select to filter from sections list
 */
export function useSection(id: string | undefined) {
    return useQuery<Section[], Error, Section | undefined>({
        queryKey: ['sections'],
        queryFn: getSections,
        select: (data: Section[]) => data.find((s: Section) => s._id === id),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

/**
 * Hook for creating a new section
 */
export function useCreateSection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateSectionPayload) => createSection(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}

/**
 * Hook for updating a section
 */
export function useUpdateSection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateSectionPayload }) =>
            updateSection(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
}

/**
 * Hook for assigning workers to a section
 */
export function useAssignWorkersToSection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sectionId, workerIds }: { sectionId: string; workerIds: string[] }) =>
            assignWorkersToSection(sectionId, workerIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
