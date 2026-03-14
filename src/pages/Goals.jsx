import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, Target, Trash2, Edit2, Calendar, TrendingUp, ChevronLeft, Archive, ArrowRight, Flame, Trophy, Zap, Ban, Coffee, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomModal from '../components/CustomModal';
import AmountInput from '../components/AmountInput';
import confetti from 'canvas-confetti';


const VIEWS = [
    { id: 'ACTIVE', label: 'الأهداف النشطة' },
    { id: 'CHALLENGES', label: 'تحديات الادخار' },
    { id: 'ARCHIVED', label: 'الأرشيف' }
];

const CHALLENGE_PRESETS = [
    { id: '1', name: 'لا للأكل الخارجي', type: 'NO_SPENDING', categoryId: '3', categoryName: 'طعام', duration: 7, icon: Coffee, color: '#f59e0b', description: 'توقف عن طلب الطعام لمدة أسبوع كامل.' },
    { id: '2', name: 'توقف عن التسوق', type: 'NO_SPENDING', categoryId: '1', categoryName: 'تسوق', duration: 3, icon: Zap, color: '#ec4899', description: 'توقف عن شراء أي كماليات لمدة ٣ أيام.' },
    { id: '3', name: 'توفير ترفيهي', type: 'NO_SPENDING', categoryId: '6', categoryName: 'ترفيه', duration: 5, icon: Ban, color: '#8b5cf6', description: 'وفر مبلغ الترفيه لمدة ٥ أيام.' },
];

const MOTIVATIONAL_PHRASES = [
    "عاش، يوم جديد وإنجاز جديد! 💪",
    "بطل، قربت توصل للهدف! 🚀",
    "استمر، الخطوات الصغيرة تسوي فرق كبير! ✨",
    "كل يوم يمر هو خطوة أقرب للنجاح! 🏆",
    "عاشت إيدك، الالتزام هو سر النجاح! 🌟",
    "يوم ثاني وتحدي ثاني، گدها! 🔥",
    "قربت النهاية، لا توقف! 🏁"
];

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingChallenge, setIsAddingChallenge] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [view, setView] = useState('ACTIVE');
    const [modal, setModal] = useState({ isOpen: false, id: null });
    const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '', useGrid: false, type: 'SAVINGS' });
    const [allocationAmount, setAllocationAmount] = useState('');
    const [goalForm, setGoalForm] = useState({ name: '', target: '', useGrid: true, presetCategory: '' });
    const [categories, setCategories] = useState([]);
    const [isCustom, setIsCustom] = useState(false);
    const [customChallenge, setCustomChallenge] = useState({ name: '', duration: 7, durationUnit: 'DAYS', categoryId: '', categoryName: '' });



    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [goalsRes, challengesRes, catsRes] = await Promise.all([
                api.getGoals(),
                api.getChallenges(),
                api.getCategories()
            ]);
            setGoals(goalsRes.data);
            setChallenges(challengesRes.data);
            setCategories(catsRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const handleStartChallenge = async (data) => {
        try {
            await api.createChallenge({
                name: data.name,
                type: data.type || 'NO_SPENDING',
                categoryId: data.categoryId,
                categoryName: data.categoryName,
                duration: data.duration,
                durationUnit: data.durationUnit || 'DAYS', // Add durationUnit
                icon: data.categoryId // simple mapping
            });
            setIsAddingChallenge(false);
            setIsCustom(false);
            setCustomChallenge({ name: '', duration: 7, durationUnit: 'DAYS', categoryId: '', categoryName: '' });
            fetchData();
        } catch (error) {
            console.error("Error starting challenge", error);
        }
    };

    const handleDeleteChallenge = async (id) => {
        try {
            await api.deleteChallenge(id);
            fetchData();
        } catch (error) {
            console.error("Error deleting challenge", error);
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
            fetchData();
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
            fetchData();

        } catch (error) {
            console.error("Error allocating to goal", error);
        }
    };

    const handleToggleCell = async (goalId, cellId) => {
        try {
            const goal = goals.find(g => g.id === goalId);
            const cell = goal?.grid?.find(c => c.id === cellId);

            // Add haptic feedback
            if (window.navigator.vibrate) {
                window.navigator.vibrate([50, 30, 50]);
            }

            // If marking as completed, trigger confetti
            if (!cell?.completed) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f59e0b', '#fbbf24', '#ffffff']
                });
            }

            await api.toggleGoalCell(goalId, cellId);
            fetchData();
        } catch (error) {
            console.error("Error toggling cell", error);
        }
    };

    const handleArchive = async (id) => {
        try {
            await api.archiveGoal(id);
            fetchData();
        } catch (error) {
            console.error("Error archiving goal", error);
        }
    };

    const handleDeleteGoal = async (id) => {
        setModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        try {
            await api.deleteGoal(modal.id);
            setModal({ isOpen: false, id: null });
            fetchData();
        } catch (error) {
            console.error("Error deleting goal", error);
        }
    };

    return (
        <div className="px-5 pt-8 pb-32" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black">{view === 'CHALLENGES' ? 'تحديات الادخار' : 'أهداف الادخار'}</h1>
                <button
                    onClick={() => view === 'CHALLENGES' ? setIsAddingChallenge(true) : setIsAdding(true)}
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
                {view === 'CHALLENGES' ? (
                    challenges.length === 0 ? (
                        <div className="text-center py-16 glass rounded-[2.5rem] border border-dashed border-white/10">
                            <Zap size={48} className="mx-auto mb-4 text-primary opacity-30" />
                            <p className="opacity-50">ابدأ تحدياً جديداً لتطوير عاداتك المالية</p>
                            <button
                                onClick={() => setIsAddingChallenge(true)}
                                className="mt-6 bg-primary/10 text-primary px-8 py-3 rounded-2xl font-bold border border-primary/20"
                            >
                                تصفح التحديات
                            </button>
                        </div>
                    ) : (
                        challenges.sort((a, b) => (a.status === 'ACTIVE' ? -1 : 1)).map((c) => {
                            const isFailed = c.status === 'FAILED';
                            const isCompleted = c.status === 'COMPLETED';
                            const duration = parseInt(c.duration);

                            // Determine Time Remaining Logic
                            let remainingDisplay = '';
                            let progress = 0;

                            if (c.durationUnit === 'HOURS' && c.endDate && !isFailed && !isCompleted) {
                                const end = new Date(c.endDate);
                                const msRemaining = Math.max(0, end - now);
                                const totalMs = duration * 60 * 60 * 1000;

                                if (msRemaining === 0) {
                                    // State should update on next fetch, mock it visually here
                                    remainingDisplay = "00:00:00";
                                    progress = 100;
                                } else {
                                    const h = Math.floor(msRemaining / (1000 * 60 * 60)).toString().padStart(2, '0');
                                    const m = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                                    const s = Math.floor((msRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0');
                                    remainingDisplay = `${h}:${m}:${s}`;
                                    progress = ((totalMs - msRemaining) / totalMs) * 100;
                                }
                            } else {
                                progress = (c.daysCompleted / duration) * 100;
                            }

                            return (
                                <motion.div
                                    layout
                                    key={c.id}
                                    className={`glass rounded-[2rem] p-6 border border-white/10 relative overflow-hidden ${isFailed ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${isFailed ? 'bg-gray-500/20' : isCompleted ? 'bg-emerald-500/20' : 'bg-primary/20'}`}>
                                                {isCompleted ? <Trophy size={28} className="text-emerald-500" /> : isFailed ? <Ban size={28} className="text-gray-500" /> : <Flame size={28} className="text-primary animate-pulse" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{c.name}</h3>
                                                <p className="text-xs text-gray-500">{c.categoryName} • {duration} {c.durationUnit === 'HOURS' ? 'ساعة' : 'يوم'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteChallenge(c.id)}
                                            className="p-3 glass rounded-2xl text-red-500/50 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {!isFailed && !isCompleted && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-3xl font-black text-primary">{c.daysCompleted}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{c.durationUnit === 'HOURS' ? 'ساعة مكتملة' : 'يوم مكتمل'}</span>
                                                </div>
                                                <div className="h-10 w-px bg-white/10 mx-2"></div>
                                                <div className="text-left">
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">الهدف</div>
                                                    <div className="text-sm font-black text-white">{duration} {c.durationUnit === 'HOURS' ? 'ساعة' : 'يوم'}</div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                />
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <p className="text-[10px] font-bold text-gray-400">بدأ: {new Date(c.startDate).toLocaleDateString('ar-IQ')}</p>
                                                {c.durationUnit === 'HOURS' ? (
                                                    <p className="text-xs text-secondary font-black tabular-nums font-mono">
                                                        متبقي {remainingDisplay}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-secondary font-black">
                                                        متبقي {Math.max(0, duration - c.daysCompleted)} أيام
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isFailed && (
                                        <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-center font-bold text-sm">
                                            لقد تعثرت هذه المرة! حاول مجدداً. 💔
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2">
                                            <Trophy size={16} /> تم الإنجاز بنجاح! أنت بطل.
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )
                ) : (
                    goals.filter(g => view === 'ARCHIVED' ? g.isArchived : !g.isArchived).length === 0 ? (
                        <div className="text-center py-20 glass rounded-[2.5rem] opacity-30 border border-dashed border-white/10">
                            <Target size={48} className="mx-auto mb-4" />
                            <p>{view === 'ARCHIVED' ? 'لا توجد أهداف مؤرشفة' : 'لم تضف أي أهداف بعد'}</p>
                        </div>
                    ) : (
                        goals.filter(g => view === 'ARCHIVED' ? g.isArchived : !g.isArchived).map((goal) => {
                            const isCountdown = goal.type === 'COUNTDOWN';
                            const progress = isCountdown
                                ? (goal.grid ? (goal.grid.filter(c => c.completed).length / goal.grid.length) * 100 : 0)
                                : Math.min((goal.current / goal.target) * 100, 100);

                            const randomPhrase = MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];

                            // Calculate real elapsed days
                            const getElapsedDays = (startStr) => {
                                if (!startStr) return 0;
                                const start = new Date(startStr);
                                start.setHours(0, 0, 0, 0);
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                const diff = now - start;
                                return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
                            };
                            const elapsedDays = isCountdown ? getElapsedDays(goal.startDate || goal.createdAt) : 0;

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
                                                className="p-2 glass rounded-xl text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleArchive(goal.id)}
                                                className="p-2 glass rounded-xl text-primary opacity-60 hover:opacity-100 transition-opacity"
                                                title={goal.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                                            >
                                                {goal.isArchived ? <ArrowRight size={16} className="rotate-180" /> : <Archive size={16} />}
                                            </button>
                                            {!goal.isArchived && !isCountdown && (
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
                                            <span className="text-gray-400">
                                                {isCountdown ? `المدة: ${goal.grid?.length || 0} أيام` : `الهدف: ${goal.target.toLocaleString('en-US')} د.ع`}
                                            </span>
                                            <span className="font-bold text-primary">{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5 p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className={`h-full bg-gradient-to-l ${isCountdown ? 'from-orange-500 to-yellow-500' : 'from-primary to-blue-500'} rounded-full relative`}
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-sm"></div>
                                            </motion.div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs text-gray-500">{isCountdown ? 'المتبقي: ' : 'تم توفير: '}</span>
                                                <span className="text-sm font-black">
                                                    {isCountdown ? `${(goal.grid?.length || 0) - goal.current} يوم` : `${goal.current.toLocaleString('en-US')} د.ع`}
                                                </span>
                                            </div>
                                            {isCountdown && progress > 0 && progress < 100 && (
                                                <p className="text-[10px] text-primary font-bold animate-pulse">{randomPhrase}</p>
                                            )}
                                        </div>
                                    </div>

                                    {goal.useGrid && goal.grid && (
                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <h4 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                                                <TrendingUp size={12} /> {isCountdown ? 'متابعة الأيام' : 'شبكة الادخار'}
                                            </h4>
                                            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {goal.grid.map((cell) => {
                                                    const isMissed = isCountdown && !cell.completed && cell.day < elapsedDays;
                                                    const isToday = isCountdown && cell.day === elapsedDays;

                                                    return (
                                                        <motion.button
                                                            key={cell.id}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => handleToggleCell(goal.id, cell.id)}
                                                            className={`w-11 h-11 rounded-xl text-[9px] font-bold transition-all duration-500 flex flex-col items-center justify-center border relative overflow-hidden ${cell.completed
                                                                ? (isCountdown ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/30' : 'bg-primary border-primary text-black shadow-lg shadow-primary/20')
                                                                : isMissed
                                                                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                                                                    : isToday
                                                                        ? 'bg-primary/10 border-primary/50 text-primary border-dashed animate-pulse'
                                                                        : 'glass border-white/5 text-gray-400 opacity-60 hover:opacity-100'
                                                                }`}
                                                        >
                                                            {cell.completed && isCountdown && (
                                                                <motion.div
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                                                                    className="absolute inset-0 bg-white/20 flex items-center justify-center"
                                                                >
                                                                    <CheckCircle2 size={20} className="text-white" />
                                                                </motion.div>
                                                            )}
                                                            {isMissed && !cell.completed && (
                                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                            )}
                                                            <span className={cell.completed && isCountdown ? 'relative z-10 text-[7px] mt-1 font-black opacity-30 transition-opacity' : 'relative z-10'}>
                                                                {isCountdown ? `يوم ${cell.day}` : `${(cell.amount / 1000)}k`}
                                                            </span>
                                                            {isToday && !cell.completed && (
                                                                <span className="absolute bottom-1 text-[6px] font-black opacity-50">اليوم</span>
                                                            )}

                                                            {cell.completed && isCountdown && (
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 1 }}
                                                                    animate={{ scale: 2.5, opacity: 0 }}
                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                    className="absolute inset-0 border-4 border-white rounded-xl pointer-events-none"
                                                                />
                                                            )}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {progress >= 100 && (
                                        <div className="absolute top-2 right-2 rotate-12">
                                            <div className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">تم الانجاز! 🏁</div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )
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
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-right">هدف جديد</h3>
                                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setNewGoal({ ...newGoal, type: 'SAVINGS', useGrid: false, target: 0 })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newGoal.type === 'SAVINGS' ? 'bg-primary text-black' : 'opacity-50'}`}
                                    >ادخار مالي</button>
                                    <button
                                        type="button"
                                        onClick={() => setNewGoal({ ...newGoal, type: 'COUNTDOWN', useGrid: true, target: 0 })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newGoal.type === 'COUNTDOWN' ? 'bg-primary text-black' : 'opacity-50'}`}
                                    >عد تنازلي</button>
                                </div>
                            </div>
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
                                {newGoal.type === 'SAVINGS' && (
                                    <div className="glass p-5 rounded-[2rem] border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2 text-right">المبلغ المستهدف (د.ع)</label>
                                        <AmountInput
                                            className="w-full bg-transparent outline-none font-bold text-3xl text-right"
                                            placeholder="0"
                                            value={newGoal.target}
                                            onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                                    <div className="text-right">
                                        <label className="block text-sm font-bold">
                                            {newGoal.type === 'COUNTDOWN' ? 'تفعيل تتبع الأيام' : 'تفعيل شبكة الادخار'}
                                        </label>
                                        <p className="text-[10px] text-gray-500">
                                            {newGoal.type === 'COUNTDOWN' ? 'عرض شبكة للأيام المتبقية للهدف' : 'تقسيم الهدف إلى مبالغ صغيرة (٥، ١٠، ١٥ ألف)'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNewGoal({ ...newGoal, useGrid: true })}
                                        disabled={newGoal.type === 'COUNTDOWN'}
                                        className={`w-14 h-8 rounded-full transition-all relative ${newGoal.useGrid || newGoal.type === 'COUNTDOWN' ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${newGoal.useGrid || newGoal.type === 'COUNTDOWN' ? 'right-1 bg-black' : 'right-7 bg-white'}`}></div>
                                    </button>
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">
                                        {newGoal.type === 'COUNTDOWN' ? 'تاريخ نهاية الهدف (مطلوب)' : 'الموعد المستهدف (اختياري)'}
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                        required={newGoal.type === 'COUNTDOWN'}
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
                                    <AmountInput
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

            <AnimatePresence>
                {isAddingChallenge && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-dark-lighter w-full p-8 rounded-t-[3rem] shadow-2xl border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-right">تحدي جديد</h3>
                                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setIsCustom(false)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isCustom ? 'bg-primary text-black' : 'opacity-50'}`}
                                    >نماذج جاهزة</button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCustom(true)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isCustom ? 'bg-primary text-black' : 'opacity-50'}`}
                                    >تحدي مخصص</button>
                                </div>
                            </div>

                            {!isCustom ? (
                                <div className="space-y-4 mb-8">
                                    <p className="text-sm text-gray-500 mb-4 text-right">طور عاداتك المالية من خلال هذه التحديات الذكية.</p>
                                    {CHALLENGE_PRESETS.map((p) => {
                                        const Icon = p.icon;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => handleStartChallenge(p)}
                                                className="w-full glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="text-right">
                                                        <h4 className="font-bold">{p.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{p.description}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-xl opacity-30 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight size={18} className="rotate-180" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6 mb-8">
                                    <div className="glass p-5 rounded-[2rem] border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2 text-right">اسم التحدي</label>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                            placeholder="مثال: تحدي القهوة"
                                            value={customChallenge.name}
                                            onChange={(e) => setCustomChallenge({ ...customChallenge, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="glass p-5 rounded-[2rem] border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2 text-right">المدة المحددة للتحدي</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                className="flex-[2] bg-transparent outline-none font-bold text-xl text-right"
                                                placeholder="7"
                                                value={customChallenge.duration}
                                                onChange={(e) => setCustomChallenge({ ...customChallenge, duration: e.target.value })}
                                                required
                                            />
                                            <select
                                                className="flex-1 bg-white/5 outline-none font-bold text-sm px-4 rounded-xl cursor-pointer text-right appearance-none"
                                                value={customChallenge.durationUnit}
                                                onChange={(e) => setCustomChallenge({ ...customChallenge, durationUnit: e.target.value })}
                                            >
                                                <option value="DAYS" className="bg-dark text-white">يوم</option>
                                                <option value="HOURS" className="bg-dark text-white">ساعة</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="glass p-5 rounded-[2rem] border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-4 text-right">التصنيف المحظور (الاختياري)</label>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setCustomChallenge({ ...customChallenge, categoryId: cat.id, categoryName: cat.name })}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${customChallenge.categoryId === cat.id ? 'bg-primary border-primary text-black' : 'glass border-white/5 opacity-50'}`}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleStartChallenge(customChallenge)}
                                        disabled={!customChallenge.name}
                                        className="w-full bg-primary text-black p-5 rounded-3xl font-black shadow-xl disabled:opacity-30"
                                    >
                                        ابدأ التحدي الآن
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setIsAddingChallenge(false)}
                                className="w-full glass p-5 rounded-3xl font-bold opacity-50"
                            >
                                إغلاق
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CustomModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="حذف الهدف"
                message="هل أنت متأكد من حذف هذا الهدف؟ لا يمكن التراجع عن هذا الإجراء."
                type="confirm"
            />
        </div>
    );
};

export default Goals;
