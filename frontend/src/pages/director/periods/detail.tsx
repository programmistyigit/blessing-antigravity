import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, Eye, Building2, Loader2, AlertCircle, GripVertical } from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { usePeriod, useUpdatePeriod, useSections, useUpdateSection } from '@/hooks';
import type { Section } from '@/services/sections.service';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const statusColors: Record<string, { bg: string; text: string }> = {
    EMPTY: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
    PREPARING: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    ACTIVE: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    PARTIAL_OUT: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
    CLEANING: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
};

const statusLabels: Record<string, string> = {
    EMPTY: 'Bo\'sh',
    PREPARING: 'Tayyorlanmoqda',
    ACTIVE: 'Faol',
    PARTIAL_OUT: 'Qisman chiqarilgan',
    CLEANING: 'Tozalanmoqda',
};

// Draggable Section Card
function DraggableSectionCard({ section }: { section: Section }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: section._id,
        data: { section },
    });

    const colors = statusColors[section.status] || statusColors.EMPTY;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-50 scale-95' : 'hover:border-blue-300 dark:hover:border-blue-600'
                }`}
        >
            <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{section.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {statusLabels[section.status]}
                </span>
            </div>
        </div>
    );
}

// Assigned Section Card (not draggable, has view button)
function AssignedSectionCard({ section, onUnassign, isUnassigning }: {
    section: Section;
    onUnassign: () => void;
    isUnassigning: boolean;
}) {
    const navigate = useNavigate();
    const colors = statusColors[section.status] || statusColors.EMPTY;

    return (
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{section.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {statusLabels[section.status]}
                </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={() => navigate(`/director/sections/${section._id}`)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                    <Eye className="h-3 w-3" />
                    Ko'rish
                </button>
                <button
                    onClick={onUnassign}
                    disabled={isUnassigning}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                >
                    {isUnassigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Chiqarish'}
                </button>
            </div>
        </div>
    );
}

// Droppable Zone
function DroppableZone({ children, isEmpty }: { children: React.ReactNode; isEmpty: boolean }) {
    const { isOver, setNodeRef } = useDroppable({ id: 'assigned-zone' });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[200px] p-4 rounded-xl border-2 border-dashed transition-all ${isOver
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                : isEmpty
                    ? 'border-slate-300 dark:border-slate-600'
                    : 'border-transparent'
                }`}
        >
            {isEmpty ? (
                <div className={`flex flex-col items-center justify-center h-full py-8 ${isOver ? 'scale-105' : ''} transition-transform`}>
                    <Building2 className={`h-12 w-12 mb-3 ${isOver ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    <p className={`text-sm font-medium ${isOver ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isOver ? 'Qo\'yish uchun qo\'yib yuboring!' : 'Sexni bu yerga torting'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">{children}</div>
            )}
        </div>
    );
}

// Drag Overlay Card
function DragOverlayCard({ section }: { section: Section }) {
    const colors = statusColors[section.status] || statusColors.EMPTY;
    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border-2 border-blue-400 shadow-lg cursor-grabbing">
            <GripVertical className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{section.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {statusLabels[section.status]}
                </span>
            </div>
        </div>
    );
}

export default function PeriodDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: period, isLoading: periodLoading, isError } = usePeriod(id);
    const { data: allSections, refetch: refetchSections } = useSections();
    const updatePeriod = useUpdatePeriod();
    const updateSection = useUpdateSection();

    const [activeSection, setActiveSection] = useState<Section | null>(null);
    const [unassigningId, setUnassigningId] = useState<string | null>(null);

    // Available sections (not assigned to any period, not archived)
    const availableSections = allSections?.filter(s =>
        !s.isArchived && !s.activePeriodId
    ) || [];

    // Assigned sections (this period's sections)
    const assignedSections = allSections?.filter(s =>
        s.activePeriodId === id
    ) || [];

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const section = event.active.data.current?.section as Section;
        if (section) setActiveSection(section);
    };

    // Handle drag end - assign section to period
    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveSection(null);

        const { active, over } = event;
        if (!over || over.id !== 'assigned-zone' || !period) return;

        const section = active.data.current?.section as Section;
        if (!section) return;


        try {
            // Update section's activePeriodId
            await updateSection.mutateAsync({
                id: section._id,
                payload: { activePeriodId: period._id }
            });
            // Update period's sections array
            const newSections = [...(period.sections || []), section._id];
            await updatePeriod.mutateAsync({
                id: period._id,
                payload: { sections: newSections }
            });
            refetchSections();
        } catch (err) {
            console.error('Assign section error:', err);
        } finally {

        }
    };

    // Unassign section from period
    const handleUnassign = async (section: Section) => {
        if (!period || unassigningId) return;
        setUnassigningId(section._id);
        try {
            await updateSection.mutateAsync({
                id: section._id,
                payload: { activePeriodId: null }
            });
            const newSections = (period.sections || []).filter(s => s !== section._id);
            await updatePeriod.mutateAsync({
                id: period._id,
                payload: { sections: newSections }
            });
            refetchSections();
        } catch (err) {
            console.error('Unassign section error:', err);
        } finally {
            setUnassigningId(null);
        }
    };

    if (periodLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (isError || !period) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500">Davr topilmadi</p>
            </div>
        );
    }

    const isClosed = period.status === 'CLOSED';

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/director/periods')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="h-6 w-6" />
                        {period.name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(period.startDate).toLocaleDateString('uz-UZ')}
                        {period.endDate && ` — ${new Date(period.endDate).toLocaleDateString('uz-UZ')}`}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${isClosed
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            }`}>
                            {isClosed ? 'Yopilgan' : 'Faol'}
                        </span>
                    </p>
                </div>
            </motion.div>

            {/* Closed Info */}
            {isClosed && (
                <motion.div variants={itemVariants} className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ Bu davr yopilgan. Sexlar biriktirish yoki o'zgartirish mumkin emas.
                </motion.div>
            )}

            {/* Drag & Drop Hint */}
            {!isClosed && availableSections.length > 0 && (
                <motion.div variants={itemVariants} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    💡 Sexni davrga biriktirish uchun chapdan o'ngga torting
                </motion.div>
            )}

            {/* Two Panel Layout with DnD */}
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Available Sections (Draggable) */}
                    <motion.div variants={itemVariants}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Mavjud Sexlar
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Biriktirilmagan ({availableSections.length})
                                </p>
                            </div>
                            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                                {availableSections.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">
                                        Barcha sexlar biriktirilgan
                                    </p>
                                ) : isClosed ? (
                                    availableSections.map(section => (
                                        <div key={section._id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg opacity-50">
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{section.name}</p>
                                        </div>
                                    ))
                                ) : (
                                    availableSections.map(section => (
                                        <DraggableSectionCard key={section._id} section={section} />
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Assigned Sections (Droppable) */}
                    <motion.div variants={itemVariants}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
                                <h3 className="font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Biriktirilgan Sexlar
                                </h3>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    Bu davrga ({assignedSections.length})
                                </p>
                            </div>
                            <DroppableZone isEmpty={assignedSections.length === 0 && !isClosed}>
                                {assignedSections.map(section => (
                                    <AssignedSectionCard
                                        key={section._id}
                                        section={section}
                                        onUnassign={() => handleUnassign(section)}
                                        isUnassigning={unassigningId === section._id}
                                    />
                                ))}
                            </DroppableZone>
                        </div>
                    </motion.div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeSection ? <DragOverlayCard section={activeSection} /> : null}
                </DragOverlay>
            </DndContext>
        </motion.div>
    );
}
