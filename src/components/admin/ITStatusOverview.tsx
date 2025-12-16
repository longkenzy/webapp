'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useRouter } from 'next/navigation';
import { Clock, User, Briefcase } from 'lucide-react';

interface ITStaff {
    id: string;
    name: string;
    avatar: string | null;
    position: string;
    isOnline: boolean;
    currentCase?: {
        id: string;
        title: string;
        type: string;
        client: string;
        startTime: Date | string | null;
    } | null;
}

export default function ITStatusOverview() {
    const [staff, setStaff] = useState<ITStaff[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredMember, setHoveredMember] = useState<ITStaff | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ top: number, left: number } | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { socket } = useSocket();
    const router = useRouter();

    const handleMouseEnter = (member: ITStaff, e: React.MouseEvent<HTMLDivElement>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const rect = e.currentTarget.getBoundingClientRect();
        // Position below the element
        setTooltipPosition({
            top: rect.bottom + 10,
            left: rect.left + rect.width / 2
        });
        setHoveredMember(member);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setHoveredMember(null);
            setTooltipPosition(null);
        }, 100);
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/it-status');
            if (res.ok) {
                const data = await res.json();
                setStaff(data);
            }
        } catch (error) {
            console.error('Failed to fetch IT status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Refresh when socket notifies of case changes
        if (socket) {
            socket.on('refresh_notifications', () => { // We can reuse this event or listen to more specific case events
                fetchStatus();
            });

            socket.on('refresh_dashboard', () => {
                fetchStatus();
            });
        }

        // Poll every 30 seconds as backup
        const interval = setInterval(fetchStatus, 30000);

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off('refresh_notifications');
                socket.off('refresh_dashboard');
            }
        };
    }, [socket]);

    if (loading && staff.length === 0) {
        return (
            <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 mb-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-shrink-0 w-32 h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Trạng thái hoạt động IT</h3>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-gray-600">Đang xử lý (Online)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="text-gray-600">Rảnh (Offline)</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {staff.map((member) => (
                    <div
                        key={member.id}
                        onMouseEnter={(e) => handleMouseEnter(member, e)}
                        onMouseLeave={handleMouseLeave}
                        className={`relative flex-shrink-0 w-32 p-2 rounded-lg border flex flex-col items-center transition-all cursor-pointer ${member.isOnline
                            ? 'bg-green-50/50 border-green-200 hover:shadow-md'
                            : 'bg-white border-gray-200 opacity-75 hover:opacity-100'
                            }`}
                    >
                        <div className="relative mb-2">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
                                {member.avatar ? (
                                    <img src={member.avatar.startsWith('/') ? member.avatar : `/avatars/${member.avatar}`} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                                        {member.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${member.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                }`}></span>
                        </div>

                        <p className="text-xs font-medium text-gray-900 text-center w-full break-words" title={member.name}>
                            {member.name}
                        </p>

                        {/* Hover Tooltip / Detail View */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-left pointer-events-none">
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-t border-l border-gray-100"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                        <p className="text-xs text-gray-500">{member.position}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${member.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {member.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>

                                {member.isOnline && member.currentCase ? (
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 p-2.5 rounded-md border border-blue-100">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Briefcase className="h-3 w-3 text-blue-600" />
                                                <span className="text-[10px] font-semibold text-blue-700 uppercase">{member.currentCase.type}</span>
                                            </div>
                                            <p className="text-xs text-gray-900 font-medium line-clamp-2 mb-1">{member.currentCase.title}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 text-xs">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="h-3 w-3" />
                                                <span className="truncate">KH: {member.currentCase.client}</span>
                                            </div>
                                            {member.currentCase.startTime && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        Bắt đầu: {new Date(member.currentCase.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        <span className="text-gray-400 mx-1">•</span>
                                                        {new Date(member.currentCase.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100 text-center">
                                        <p className="text-xs text-gray-500 italic">Hiện không xử lý case nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {staff.length === 0 && (
                    <div className="flex-1 text-center py-4 text-gray-500 text-sm">
                        Không có nhân viên IT nào trong hệ thống.
                    </div>
                )}
            </div>

            {/* Fixed Overlay Tooltip */}
            {hoveredMember && tooltipPosition && (
                <div
                    className="fixed z-[9999] w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 text-left pointer-events-none"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-t border-l border-gray-100"></div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{hoveredMember.name}</p>
                                <p className="text-xs text-gray-500">{hoveredMember.position}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${hoveredMember.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {hoveredMember.isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {hoveredMember.isOnline && hoveredMember.currentCase ? (
                            <div className="space-y-3">
                                <div className="bg-blue-50 p-2.5 rounded-md border border-blue-100">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Briefcase className="h-3 w-3 text-blue-600" />
                                        <span className="text-[10px] font-semibold text-blue-700 uppercase">{hoveredMember.currentCase.type}</span>
                                    </div>
                                    <p className="text-xs text-gray-900 font-medium line-clamp-2 mb-1">{hoveredMember.currentCase.title}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">KH: {hoveredMember.currentCase.client}</span>
                                    </div>
                                    {hoveredMember.currentCase.startTime && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                Bắt đầu: {new Date(hoveredMember.currentCase.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                <span className="text-gray-400 mx-1">•</span>
                                                {new Date(hoveredMember.currentCase.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 italic">Hiện không xử lý case nào</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
