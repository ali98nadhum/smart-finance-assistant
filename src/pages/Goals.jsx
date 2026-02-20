import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, Target, Trash2, Edit2, Calendar, TrendingUp, ChevronLeft, Archive, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const VIEWS = [
    { id: 'ACTIVE', label: 'الأهداف النشطة' },
    { id: 'ARCHIVED', label: 'الأرشيف' }
];

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [view, setView] = useState('ACTIVE');
    const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '', useGrid: false });
    const [allocationAmount, setAllocationAmount] = useState('');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.getGoals();
            setGoals(res.data);
        } catch (error) {
            console.error("Error fetching goals", error);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            await api.createGoal({
                ...newGoal,
                target: parseFloat(newGoal.target),
                current: 0
            });
            setIsAdding(false);
            setNewGoal({ name: '', target: '', deadline: '', useGrid: false });
            fetchGoals();
        } catch (error) {
            console.error("Error adding goal", error);
        }
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        try {
            await api.allocateToGoal(selectedGoal.id, parseFloat(allocationAmount));
            setIsAllocating(false);
            setSelectedGoal(null);
            setAllocationAmount('');
            fetchGoals();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (error) {
            console.error("Error allocating to goal", error);
        }
    };

    const handleToggleCell = async (goalId, cellId) => {
        try {
            await api.toggleGoalCell(goalId, cellId);
            fetchGoals();
        } catch (error) {
            console.error("Error toggling cell", error);
        }
    };

    const handleArchive = async (id) => {
        try {
            await api.archiveGoal(id);
            fetchGoals();
        } catch (error) {
            console.error("Error archiving goal", error);
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm("هل أنت متأكد من حذف هذا الهدف؟")) return;
        try {
            await api.deleteGoal(id);
            fetchGoals();
        } catch (error) {
            console.error("Error deleting goal", error);
        }
    };

    return (
        <div className="px-5 pt-8 pb-32" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black">أهداف الادخار</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* View Switcher */}
            <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-[2rem] border border-white/5">
                {VIEWS.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setView(v.id)}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${view === v.id ? 'bg-primary shadow-lg shadow-primary/20' : 'glass opacity-50'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-6">
                {goals.filter(g => view === 'ARCHIVED' ? g.isArchived : !g.isArchived).length === 0 ? (
                    <div className="text-center py-20 glass rounded-[2.5rem] opacity-30 border border-dashed border-white/10">
                        <Target size={48} className="mx-auto mb-4" />
                        <p>{view === 'ARCHIVED' ? 'لا توجد أهداف مؤرشفة' : 'لم تضف أي أهداف بعد'}</p>
                    </div>
                ) : (
                    goals.filter(g => view === 'ARCHIVED' ? g.isArchived : !g.isArchived).map((goal) => {
                        const progress = Math.min((goal.current / goal.target) * 100, 100);
                        return (
                            <motion.div
                                layout
                                key={goal.id}
                                className="glass rounded-[2rem] p-6 border border-white/10 relative overflow-hidden group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{goal.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Calendar size={12} />
                                                <span>{goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US') : 'بدون موعد'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="p-2 glass rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleArchive(goal.id)}
                                            className="p-2 glass rounded-xl text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={goal.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                                        >
                                            {goal.isArchived ? <ArrowRight size={16} className="rotate-180" /> : <Archive size={16} />}
                                        </button>
                                        {!goal.isArchived && (
                                            <button
                                                onClick={() => {
                                                    setSelectedGoal(goal);
                                                    setIsAllocating(true);
                                                }}
                                                className="bg-primary text-black text-xs font-black px-4 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
                                            >
                                                ادخار لهذا الهدف
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">الهدف: {goal.target.toLocaleString('en-US')} د.ع</span>
                                        <span className="font-bold text-primary">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5 p-0.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-gradient-to-l from-primary to-blue-500 rounded-full relative"
                                        >
                                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm"></div>
                                        </motion.div>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-xs text-gray-500">تم توفير: </span>
                                        <span className="text-sm font-black">{goal.current.toLocaleString('en-US')} د.ع</span>
                                    </div>
                                </div>

                                {goal.useGrid && goal.grid && (
                                    <div className="mt-8 pt-6 border-t border-white/5">
                                        <h4 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                                            <TrendingUp size={12} /> شبكة الادخار
                                        </h4>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {goal.grid.map((cell) => (
                                                <button
                                                    key={cell.id}
                                                    onClick={() => handleToggleCell(goal.id, cell.id)}
                                                    className={`w-10 h-10 rounded-xl text-[8px] font-bold transition-all duration-300 flex items-center justify-center border ${cell.completed
                                                        ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-95'
                                                        : 'glass border-white/5 text-gray-400 opacity-60 hover:opacity-100'
                                                        }`}
                                                >
                                                    {(cell.amount / 1000)}k
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Progress Elements */}
                                {progress >= 100 && (
                                    <div className="absolute top-2 right-2 rotate-12">
                                        <div className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">تم الانجاز! 🏁</div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Goal Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-dark-lighter w-full p-8 rounded-t-[3rem] shadow-2xl border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <h3 className="text-2xl font-black mb-8 text-right">هدف جديد</h3>
                            <form onSubmit={handleAddGoal} className="space-y-6">
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">عنوان الهدف</label>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                        placeholder="مثال: شراء لابتوب، سفرة، سيارة..."
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">المبلغ المستهدف (د.ع)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent outline-none font-bold text-3xl text-right"
                                        placeholder="0"
                                        value={newGoal.target}
                                        onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                                    <div className="text-right">
                                        <label className="block text-sm font-bold">تفعيل شبكة الادخار</label>
                                        <p className="text-[10px] text-gray-500">تقسيم الهدف إلى مبالغ صغيرة (٥، ١٠، ١٥ ألف)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewGoal({ ...newGoal, useGrid: !newGoal.useGrid })}
                                        className={`w-14 h-8 rounded-full transition-all relative ${newGoal.useGrid ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${newGoal.useGrid ? 'right-1 bg-black' : 'right-7 bg-white'}`}></div>
                                    </button>
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">الموعد المستهدف (اختياري)</label>
                                    <input
                                        type="date"
                                        className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-[2] bg-primary text-black p-5 rounded-3xl font-black shadow-xl">تأكيد الهدف</button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Allocate Modal */}
            <AnimatePresence>
                {isAllocating && selectedGoal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-8 rounded-[3rem] border border-white/10"
                        >
                            <h3 className="text-xl font-bold mb-2 text-center">ادخار للهدف</h3>
                            <p className="text-center text-xs text-gray-500 mb-6">{selectedGoal.name}</p>

                            <form onSubmit={handleAllocate} className="space-y-6">
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">المبلغ المراد ادخاره (د.ع)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent outline-none font-bold text-3xl text-right"
                                        placeholder="0"
                                        value={allocationAmount}
                                        onChange={(e) => setAllocationAmount(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" className="flex-[2] bg-primary text-black p-5 rounded-2xl font-black shadow-xl shadow-primary/20">تأكيد المبلغ</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAllocating(false);
                                            setSelectedGoal(null);
                                        }}
                                        className="flex-1 glass p-5 rounded-2xl font-bold opacity-50"
                                    >إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Goals;
