import React, { useState, useEffect, useRef } from 'react';
import { apiBase } from '../../lib/api';
import BadgeIcon from '../ui/BadgeIcon';

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
}

export default function NotificationPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            let token = '';
            try {
                const sessionData = JSON.parse(localStorage.getItem('sia-session') || 'null');
                if (sessionData && sessionData.token) token = sessionData.token;
            } catch (e) { /* ignore */ }

            const response = await fetch(apiBase('/api/siswa/notifications'), {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setNotifications(data);
            
            // Periksa notifikasi mana saja yang belum dibaca dari LocalStorage
            const readList = JSON.parse(localStorage.getItem('readNotifications') || '[]');
            const unread = data.filter(n => !readList.includes(n.id));
            setUnreadCount(unread.length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling setiap 5 menit
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Tutup dropdown saat klik di luar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        
        // Tandai semua sebagai telah dibaca jika dibuka
        if (newState && unreadCount > 0) {
            const allIds = notifications.map(n => n.id);
            localStorage.setItem('readNotifications', JSON.stringify(allIds));
            setUnreadCount(0);
        }
    };

    const renderIcon = (notif) => {
        if (notif.type === 'badge') {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-accent">
                    <BadgeIcon name={notif.icon_data} className="w-6 h-6" />
                </div>
            );
        }
        if (notif.type === 'catatan') {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
            );
        }
        if (notif.type === 'ujian') {
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-error">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="relative mr-4" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute -right-2 sm:right-0 mt-3 w-72 sm:w-80 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 focus:outline-none z-50">
                    <div className="border-b border-slate-100 px-4 py-3 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                        <h3 className="text-sm font-semibold text-slate-900">Notifikasi</h3>
                        <button 
                            onClick={fetchNotifications}
                            className="text-xs text-primary hover:text-primary/85 font-medium"
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Memuat...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                Belum ada notifikasi
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {notifications.map((notif) => (
                                    <li key={notif.id} className="group relative border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                        {notif.link ? (
                                            <a href={notif.link} className="flex gap-4 p-4 w-full h-full cursor-pointer focus:outline-none focus:bg-slate-50">
                                                {renderIcon(notif)}
                                                <div className="flex-1 space-y-1 text-left">
                                                    <p className="text-sm text-slate-900 line-clamp-3 leading-snug">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 font-medium">
                                                        {timeAgo(notif.timestamp)}
                                                    </p>
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="flex gap-4 p-4">
                                                {renderIcon(notif)}
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm text-slate-900 line-clamp-3 leading-snug">
                                                        {notif.message}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 font-medium">
                                                        {timeAgo(notif.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
