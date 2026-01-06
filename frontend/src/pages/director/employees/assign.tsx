import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserCog, ArrowLeft, AlertCircle, RefreshCw, Link2, Unlink, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useSections, useUpdateSection } from '@/hooks';

// Color palette for connections
const CONNECTION_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

interface Connection {
    workerId: string;
    sectionId: string;
    color: string;
}

interface LinePosition {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function AssignEmployeePage() {
    const navigate = useNavigate();
    const { data: users, isLoading: usersLoading, isError: usersError, refetch: refetchUsers } = useUsers();
    const { data: sections, isLoading: sectionsLoading, refetch: refetchSections } = useSections();
    const updateSection = useUpdateSection();

    // Refs for position calculation
    const containerRef = useRef<HTMLDivElement>(null);
    const workerListRef = useRef<HTMLDivElement>(null);
    const workerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // State
    const [connections, setConnections] = useState<Connection[]>([]);
    const [linePositions, setLinePositions] = useState<Record<string, LinePosition>>({});
    const [draggingWorker, setDraggingWorker] = useState<string | null>(null);
    const [dragOverSection, setDragOverSection] = useState<string | null>(null);
    const [hoveredLine, setHoveredLine] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Build connections from sections data
    useEffect(() => {
        if (!sections || !users) return;

        const newConnections: Connection[] = [];
        sections.filter(s => !s.isArchived).forEach((section, sectionIndex) => {
            const color = CONNECTION_COLORS[sectionIndex % CONNECTION_COLORS.length];
            section.assignedWorkers?.forEach(worker => {
                // Handle both populated objects and raw string IDs
                const workerId = typeof worker === 'string' ? worker : (worker as { _id: string })._id;
                if (workerId) {
                    newConnections.push({
                        workerId,
                        sectionId: section._id,
                        color,
                    });
                }
            });
        });
        setConnections(newConnections);
    }, [sections, users]);

    // Calculate line positions
    const calculateLinePositions = useCallback(() => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newPositions: Record<string, LinePosition> = {};

        connections.forEach(conn => {
            const workerEl = workerRefs.current[conn.workerId];
            const sectionEl = sectionRefs.current[conn.sectionId];

            if (workerEl && sectionEl) {
                const workerRect = workerEl.getBoundingClientRect();
                const sectionRect = sectionEl.getBoundingClientRect();

                newPositions[`${conn.workerId}-${conn.sectionId}`] = {
                    x1: workerRect.right - containerRect.left,
                    y1: workerRect.top + workerRect.height / 2 - containerRect.top,
                    x2: sectionRect.left - containerRect.left,
                    y2: sectionRect.top + sectionRect.height / 2 - containerRect.top,
                };
            }
        });

        setLinePositions(newPositions);
    }, [connections]);

    // Initial calculation after mount + refs populated
    useEffect(() => {
        // Wait for refs to be populated after render
        const timer = setTimeout(() => {
            calculateLinePositions();
        }, 100);

        return () => clearTimeout(timer);
    }, [calculateLinePositions, users, sections]);

    // Recalculate on scroll and resize
    useEffect(() => {
        const workerList = workerListRef.current;
        if (workerList) {
            workerList.addEventListener('scroll', calculateLinePositions);
        }
        window.addEventListener('resize', calculateLinePositions);

        return () => {
            if (workerList) {
                workerList.removeEventListener('scroll', calculateLinePositions);
            }
            window.removeEventListener('resize', calculateLinePositions);
        };
    }, [calculateLinePositions]);

    // Drag handlers
    const handleDragStart = (workerId: string) => {
        setDraggingWorker(workerId);
    };

    const handleDragOver = (e: React.DragEvent, sectionId: string) => {
        e.preventDefault();
        setDragOverSection(sectionId);
    };

    const handleDragLeave = () => {
        setDragOverSection(null);
    };

    const handleDrop = async (sectionId: string) => {
        if (!draggingWorker) return;

        setDragOverSection(null);
        setDraggingWorker(null);

        // Check if already connected
        const exists = connections.some(c => c.workerId === draggingWorker && c.sectionId === sectionId);
        if (exists) return;

        try {
            const section = sections?.find(s => s._id === sectionId);
            // Fix: Ensure we only send IDs, not populated objects
            const currentWorkerIds = section?.assignedWorkers?.map(w =>
                typeof w === 'string' ? w : (w as any)._id
            ) || [];

            await updateSection.mutateAsync({
                id: sectionId,
                payload: {
                    assignedWorkers: [...currentWorkerIds, draggingWorker],
                },
            });
            refetchSections();
        } catch (err) {
            console.error('Assign error:', err);
        }
    };

    const handleDragEnd = () => {
        setDraggingWorker(null);
        setDragOverSection(null);
    };

    // Remove connection
    const removeConnection = async (workerId: string, sectionId: string) => {
        setIsRemoving(true);
        try {
            const section = sections?.find(s => s._id === sectionId);
            const currentWorkerIds = section?.assignedWorkers?.map(w =>
                typeof w === 'string' ? w : (w as any)._id
            ) || [];

            const newWorkers = currentWorkerIds.filter(id => id !== workerId);

            await updateSection.mutateAsync({
                id: sectionId,
                payload: {
                    assignedWorkers: newWorkers,
                },
            });
            refetchSections();
        } catch (err) {
            console.error('Remove error:', err);
        } finally {
            setIsRemoving(false);
            setHoveredLine(null);
        }
    };

    // Generate bezier path
    const getBezierPath = (pos: LinePosition) => {
        const midX = (pos.x1 + pos.x2) / 2;
        return `M ${pos.x1} ${pos.y1} C ${midX} ${pos.y1}, ${midX} ${pos.y2}, ${pos.x2} ${pos.y2}`;
    };

    // Get worker's sections
    const getWorkerSections = (workerId: string) => {
        return connections.filter(c => c.workerId === workerId);
    };

    if (usersError) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Ma'lumot yuklanmadi</p>
                <button onClick={() => refetchUsers()} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg">
                    <RefreshCw className="h-4 w-4" />Qayta yuklash
                </button>
            </motion.div>
        );
    }

    const activeUsers = users?.filter(u => u.isActive) || [];
    const activeSections = sections?.filter(s => !s.isArchived) || [];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/director/employees')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <UserCog className="h-6 w-6" />
                        Sexga Biriktirish
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Ishchini sexga sudrab tashlang • {connections.length} ta ulanish
                    </p>
                </div>
            </div>

            {/* Main Container */}
            <div ref={containerRef} className="relative flex gap-0 h-[calc(100%-60px)]">
                {/* Workers Panel (Left) */}
                <div className="w-72 flex-shrink-0 bg-white dark:bg-slate-900 rounded-l-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Ishchilar ({activeUsers.length})
                        </h3>
                    </div>
                    <div ref={workerListRef} className="overflow-y-auto h-[calc(100%-48px)] p-2 space-y-1">
                        {usersLoading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ))
                        ) : (
                            activeUsers.map((user) => {
                                const workerConnections = getWorkerSections(user._id);
                                const isConnected = workerConnections.length > 0;
                                const isDragging = draggingWorker === user._id;

                                return (
                                    <div
                                        key={user._id}
                                        ref={el => { workerRefs.current[user._id] = el; }}
                                        draggable
                                        onDragStart={() => handleDragStart(user._id)}
                                        onDragEnd={handleDragEnd}
                                        className={`
                                            relative flex items-center gap-2 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all
                                            ${isDragging ? 'opacity-50 scale-95' : ''}
                                            ${isConnected
                                                ? 'bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent border-l-4'
                                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }
                                        `}
                                        style={{ borderLeftColor: isConnected ? workerConnections[0]?.color : 'transparent' }}
                                    >
                                        <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                                                {user.fullName}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                                        </div>
                                        {isConnected && (
                                            <div className="flex gap-0.5">
                                                {workerConnections.map(c => (
                                                    <div
                                                        key={c.sectionId}
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Spacer for visible gap */}
                <div className="flex-1 min-w-[100px]" />

                {/* SVG Canvas - Absolute overlay on entire container */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                    <defs>
                        {activeSections.map((section, i) => (
                            <linearGradient key={section._id} id={`gradient-${section._id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={CONNECTION_COLORS[i % CONNECTION_COLORS.length]} stopOpacity="0.3" />
                                <stop offset="50%" stopColor={CONNECTION_COLORS[i % CONNECTION_COLORS.length]} stopOpacity="1" />
                                <stop offset="100%" stopColor={CONNECTION_COLORS[i % CONNECTION_COLORS.length]} stopOpacity="0.3" />
                            </linearGradient>
                        ))}
                    </defs>

                    {connections.map(conn => {
                        const key = `${conn.workerId}-${conn.sectionId}`;
                        const pos = linePositions[key];
                        if (!pos) return null;

                        const isHovered = hoveredLine === key;

                        return (
                            <g key={key}>
                                {/* Invisible wider path for hover detection - Enable pointer events explicitly */}
                                <path
                                    d={getBezierPath(pos)}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="20"
                                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredLine(key)}
                                    onMouseLeave={() => setHoveredLine(null)}
                                />
                                {/* Visible bezier curve */}
                                <motion.path
                                    d={getBezierPath(pos)}
                                    fill="none"
                                    stroke={conn.color}
                                    strokeWidth={isHovered ? 4 : 2}
                                    strokeOpacity={isHovered ? 1 : 0.7}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ pointerEvents: 'none' }}
                                />
                                {/* Animated dot on line */}
                                {isHovered && (
                                    <circle r="5" fill={conn.color}>
                                        <animateMotion dur="2s" repeatCount="indefinite" path={getBezierPath(pos)} />
                                    </circle>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Remove button overlay */}
                {hoveredLine && linePositions[hoveredLine] && (
                    <div
                        className="absolute z-20 pointer-events-auto"
                        style={{
                            left: (linePositions[hoveredLine].x1 + linePositions[hoveredLine].x2) / 2 - 16,
                            top: (linePositions[hoveredLine].y1 + linePositions[hoveredLine].y2) / 2 - 16,
                        }}
                        onMouseEnter={() => setHoveredLine(hoveredLine)} // Keep hover active when over button
                    >
                        <button
                            onClick={() => {
                                const [workerId, sectionId] = hoveredLine.split('-');
                                removeConnection(workerId, sectionId);
                            }}
                            disabled={isRemoving}
                            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            <Unlink className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Drag indicator */}
                {draggingWorker && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
                        <div className="px-4 py-2 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg text-blue-600 dark:text-blue-400 text-sm font-medium">
                            <Link2 className="h-4 w-4 inline mr-2" />
                            Sexga tashlang
                        </div>
                    </div>
                )}

                {/* Sections Panel (Right) */}
                <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 rounded-r-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Sexlar ({activeSections.length})
                        </h3>
                    </div>
                    <div className="p-2 space-y-1 overflow-y-auto h-[calc(100%-48px)]">
                        {sectionsLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ))
                        ) : (
                            activeSections.map((section, i) => {
                                const sectionConnections = connections.filter(c => c.sectionId === section._id);
                                const color = CONNECTION_COLORS[i % CONNECTION_COLORS.length];
                                const isDragOver = dragOverSection === section._id;

                                return (
                                    <div
                                        key={section._id}
                                        ref={el => { sectionRefs.current[section._id] = el; }}
                                        onDragOver={(e) => handleDragOver(e, section._id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={() => handleDrop(section._id)}
                                        className={`
                                            relative p-3 rounded-lg transition-all border-l-4
                                            ${isDragOver
                                                ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 scale-105'
                                                : 'bg-slate-50 dark:bg-slate-800'
                                            }
                                        `}
                                        style={{ borderLeftColor: color }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                {section.name}
                                            </span>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                                style={{ backgroundColor: `${color}20`, color }}
                                            >
                                                {section.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            {sectionConnections.length} ishchi biriktirilgan
                                        </div>
                                        {/* Worker avatars */}
                                        {sectionConnections.length > 0 && (
                                            <div className="flex -space-x-1 mt-2">
                                                {sectionConnections.slice(0, 5).map(c => {
                                                    const worker = users?.find(u => u._id === c.workerId);
                                                    return (
                                                        <div
                                                            key={c.workerId}
                                                            className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white text-[10px] font-medium flex items-center justify-center border-2 border-white dark:border-slate-900"
                                                            title={worker?.fullName}
                                                        >
                                                            {worker?.fullName?.charAt(0) || '?'}
                                                        </div>
                                                    );
                                                })}
                                                {sectionConnections.length > 5 && (
                                                    <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] font-medium flex items-center justify-center border-2 border-white dark:border-slate-900">
                                                        +{sectionConnections.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
