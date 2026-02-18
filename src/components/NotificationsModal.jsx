import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { X, Bell, CheckCircle } from 'lucide-react';

const NotificationsModal = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await api.getNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    const markRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
            <div className="bg-dark-lighter w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-dark/50">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Bell size={20} className="text-primary" />
                        الإشعارات
                    </h3>
                    <button onClick={onClose} className="p-2 glass rounded-full ring-primary">
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <Bell size={48} className="mx-auto mb-4 opacity-20" />
                            <p>لا توجد إشعارات حالياً</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`p-4 rounded-2xl glass border-l-4 ${n.isRead ? 'border-transparent opacity-60' : 'border-primary'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm">{n.title}</h4>
                                    {!n.isRead && (
                                        <button onClick={() => markRead(n.id)} className="text-[10px] text-primary underline">
                                            تمييز كمقروء
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400">{n.message}</p>
                                <p className="text-[8px] mt-2 text-gray-600">{new Date(n.createdAt).toLocaleString('ar-IQ')}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
