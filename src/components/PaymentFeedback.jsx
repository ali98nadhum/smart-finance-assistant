import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Coins, CreditCard, ArrowRight } from 'lucide-react';

export const TopUpSuccess = ({ isOpen, onClose, amount }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
                    dir="rtl"
                >
                    <div className="text-center relative">
                        {/* Coin Animation */}
                        <div className="relative h-48 w-48 mx-auto mb-8 flex items-center justify-center">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -100, opacity: 0, scale: 0 }}
                                    animate={{
                                        y: [null, 0],
                                        opacity: [0, 1, 1],
                                        scale: [0, 1, 1],
                                        rotate: [0, 360]
                                    }}
                                    transition={{
                                        delay: i * 0.1,
                                        duration: 0.8,
                                        ease: "easeOut"
                                    }}
                                    className="absolute"
                                >
                                    <Coins size={40} className="text-yellow-500 shadow-lg" />
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8, type: "spring" }}
                                className="bg-primary/20 p-8 rounded-full border border-primary/20"
                            >
                                <CheckCircle2 size={64} className="text-primary" />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <h3 className="text-3xl font-black mb-2 text-white">تم الشحن بنجاح!</h3>
                            <p className="text-primary text-2xl font-black mb-8">
                                + {amount?.toLocaleString('en-US')} <span className="text-sm">د.ع</span>
                            </p>
                            <button
                                onClick={onClose}
                                className="px-12 py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                            >
                                ممتاز
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const PaymentFailed = ({ isOpen, onClose, message, onSwitchCard }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
                    dir="rtl"
                >
                    <div className="text-center max-w-sm w-full">
                        <motion.div
                            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                            animate={{
                                scale: 1,
                                rotate: 0,
                                opacity: 1,
                                x: [-10, 10, -10, 10, 0]
                            }}
                            transition={{
                                type: "spring",
                                duration: 0.6
                            }}
                            className="bg-gradient-to-br from-red-500/20 to-red-900/40 p-12 rounded-[3.5rem] border border-red-500/30 mb-8 inline-block relative shadow-2xl shadow-red-500/10"
                        >
                            <CreditCard size={100} className="text-red-500 opacity-20 absolute inset-0 m-auto blur-[2px]" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <AlertCircle size={90} className="text-red-500 relative z-10 drop-shadow-glow" />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="text-3xl font-black mb-4 text-white">فشلت عملية الدفع</h3>
                            <p className="text-gray-400 mb-10 text-lg font-medium leading-relaxed">
                                {message || "عذراً، لا يوجد رصيد كافٍ في هذه البطاقة لإتمام العملية. يرجى الشحن أو اختيار وسيلة دفع أخرى."}
                            </p>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={onSwitchCard}
                                    className="group flex items-center justify-center gap-3 w-full p-6 bg-white text-black font-black rounded-[2rem] shadow-2xl active:scale-95 transition-all overflow-hidden relative"
                                >
                                    <span className="relative z-10">اختر بطاقة دفع أخرى</span>
                                    <ArrowRight size={22} className="relative z-10 group-hover:translate-x-[-10px] transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full p-6 glass border border-white/5 text-white/50 font-bold rounded-[2rem] hover:text-white hover:bg-white/5 transition-all"
                                >
                                    إلغاء المعاملة وتغيير المبلغ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
