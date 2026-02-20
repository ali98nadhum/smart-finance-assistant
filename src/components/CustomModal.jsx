import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, CheckCircle2, X } from 'lucide-react';

const CustomModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info', // 'info', 'confirm', 'error', 'success'
    confirmText = 'تأكيد',
    cancelText = 'إلغاء'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-sm glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden text-center"
                    >
                        {/* Header Icon */}
                        <div className="mb-6 flex justify-center">
                            {type === 'confirm' ? (
                                <div className="p-4 bg-yellow-500/20 text-yellow-500 rounded-3xl">
                                    <HelpCircle size={40} />
                                </div>
                            ) : type === 'error' ? (
                                <div className="p-4 bg-red-500/20 text-red-500 rounded-3xl">
                                    <AlertCircle size={40} />
                                </div>
                            ) : (
                                <div className="p-4 bg-primary/20 text-primary rounded-3xl">
                                    <CheckCircle2 size={40} />
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl font-bold mb-2">{title}</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            {message}
                        </p>

                        <div className="flex gap-3">
                            {type === 'confirm' ? (
                                <>
                                    <button
                                        onClick={onConfirm}
                                        className="flex-[2] bg-primary text-black p-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 glass p-4 rounded-2xl font-bold opacity-50 hover:opacity-100 transition-all"
                                    >
                                        {cancelText}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full bg-primary text-black p-4 rounded-2xl font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                    حسناً
                                </button>
                            )}
                        </div>

                        {/* Background Decor */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${type === 'confirm' ? 'bg-yellow-500' : type === 'error' ? 'bg-red-500' : 'bg-primary'
                            }`}></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomModal;
