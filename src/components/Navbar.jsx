import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Repeat as TransactionIcon, PieChart, Users as Wallet, CheckSquare, Target, MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const location = useLocation();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const mainItems = [
        { name: 'الرئيسية', icon: Home, path: '/' },
        { name: 'المعاملات', icon: TransactionIcon, path: '/transactions' },
        { name: 'البطاقات', icon: CreditCard, path: '/cards' },
        { name: 'الإحصائيات', icon: PieChart, path: '/stats' },
    ];

    const moreItems = [
        { name: 'الديون', icon: Wallet, path: '/debts' },
        { name: 'المهام', icon: CheckSquare, path: '/todos' },
        { name: 'الأهداف', icon: Target, path: '/goals' },
    ];

    return (
        <>
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            className="fixed bottom-24 left-4 right-4 glass z-[60] p-6 rounded-[2.5rem] border border-white/10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-lg">المزيد من الميزات</h3>
                                <button onClick={() => setIsMoreOpen(false)} className="p-2 glass rounded-full opacity-50">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {moreItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMoreOpen(false)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all ${isActive ? 'bg-primary text-black' : 'glass border border-white/5 text-gray-400'
                                                }`}
                                        >
                                            <Icon size={24} />
                                            <span className="text-[10px] mt-2 font-bold">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <nav
                className="fixed bottom-0 left-0 right-0 glass flex items-center justify-around px-4 z-50 rounded-t-2xl border-t border-white/5"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)', paddingTop: '12px' }}
            >
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path && !isMoreOpen;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMoreOpen(false)}
                            className={`flex flex-col items-center justify-center transition-colors min-w-[60px] ${isActive ? 'text-primary' : 'text-gray-400'
                                }`}
                        >
                            <Icon size={22} />
                            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                        </Link>
                    );
                })}

                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`flex flex-col items-center justify-center transition-colors min-w-[60px] ${isMoreOpen ? 'text-primary' : 'text-gray-400'
                        }`}
                >
                    <MoreHorizontal size={22} />
                    <span className="text-[10px] mt-1 font-medium">المزيد</span>
                </button>
            </nav>
        </>
    );
};

export default Navbar;
