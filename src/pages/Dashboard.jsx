import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Bell, Settings, Edit2, Calendar as CalIcon, DollarSign, RefreshCw, ArrowRightLeft, Zap, Sparkles, Lock } from 'lucide-react';
import NotificationsModal from '../components/NotificationsModal';
import SettingsManager from '../components/SettingsManager';
import { motion, AnimatePresence } from 'framer-motion';
import CustomModal from '../components/CustomModal';
import AmountInput from '../components/AmountInput';


const Dashboard = () => {
    const [cards, setCards] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState({ budget: 0, spent: 0, remaining: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [savings, setSavings] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const [showSettingsManager, setShowSettingsManager] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [isAdjustingSavings, setIsAdjustingSavings] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ dailyLimit: '', date: new Date().toLocaleDateString('en-CA') });
    const [savingsForm, setSavingsForm] = useState({ amount: '', type: 'SET' });
    const [aiInsights, setAiInsights] = useState([]);
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

    useEffect(() => {
        // Refresh date on mount and when window gains focus
        const handleFocus = () => {
            const today = new Date().toLocaleDateString('en-CA');
            setBudgetForm(prev => ({ ...prev, date: today }));
        };
        window.addEventListener('focus', handleFocus);
        fetchData();
        return () => window.removeEventListener('focus', handleFocus);
    }, [budgetForm.date]);

    const fetchData = async () => {
        try {
            const [cardsRes, budgetRes, transRes, savingsRes, aiRes] = await Promise.all([
                api.getCards(),
                api.getBudgetStatus(budgetForm.date),
                api.getTransactions(),
                api.getSavings(),
                api.getAIInsights()
            ]);
            setCards(cardsRes.data);
            setBudgetStatus(budgetRes.data);
            setRecentTransactions(transRes.data.transactions.slice(0, 5));
            setSavings(savingsRes.data.savings);
            setAiInsights(aiRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        try {
            await api.upsertBudget({
                dailyLimit: parseFloat(budgetForm.dailyLimit),
                date: budgetForm.date
            });
            setIsEditingBudget(false);
            fetchData();

        } catch (error) {
            console.error("Error updating budget", error);
        }
    };

    const handleUpdateSavings = async (e) => {
        e.preventDefault();
        try {
            await api.updateSavings(parseFloat(savingsForm.amount), savingsForm.type);
            setIsAdjustingSavings(false);
            setSavingsForm({ amount: '', type: 'SET' });
            fetchData();

        } catch (error) {
            console.error("Error updating savings", error);
        }
    };

    const totalBalance = cards.reduce((acc, card) => acc + card.balance, 0);

    const handleSetPin = () => {
        setPinInput("");
        setShowPinModal(true);
    };

    const submitPin = async (finalPin) => {
        await api.setPin(finalPin || null);
        setShowPinModal(false);
        setAlertModal({
            isOpen: true,
            title: "إعدادات القفل",
            message: finalPin ? "تم تفعيل القفل بنجاح" : "تم إلغاء القفل"
        });
    };

    return (
        <div className="px-5 pt-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold">مرحباً بك</h1>
                    <p className="text-gray-400 text-xs">إليك ملخص حياتك المالية اليوم</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSetPin}
                        className="p-3 glass rounded-2xl flex items-center justify-center opacity-50 hover:opacity-100 transition-all"
                        title="إعدادات القفل"
                    >
                        <Lock size={20} />
                    </button>
                    <button onClick={() => setIsNotifOpen(true)} className="p-3 glass rounded-2xl flex items-center justify-center relative">
                        <Bell size={24} />
                        <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-dark"></div>
                    </button>
                    <button onClick={() => setShowSettingsManager(true)} className="p-3 glass rounded-2xl flex items-center justify-center">
                        <Settings size={24} />
                    </button>
                </div>
            </div>

            {/* Main Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-gradient rounded-3xl p-6 mb-8 shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <TrendingUp size={80} />
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-blue-100 text-xs mb-1">إجمالي الرصيد</p>
                        <h2 className="text-2xl font-bold mb-4">{totalBalance.toLocaleString('en-US')} د.ع</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 text-sm mb-1">صندوق الادخار</p>
                        <button
                            onClick={() => {
                                setSavingsForm({ amount: '', type: 'SET' });
                                setIsAdjustingSavings(true);
                            }}
                            className="text-lg font-bold bg-white/20 px-3 py-1 rounded-xl hover:bg-white/30 transition-colors"
                        >
                            {savings.toLocaleString('en-US')} د.ع
                        </button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                        <ArrowDownLeft size={14} className="text-green-300" />
                        <span>ماشي عدل!</span>
                    </div>
                </div>
            </motion.div>

            {/* AI Mentor Card */}
            {aiInsights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative mb-8 overflow-hidden rounded-[2.5rem] p-6 bg-gradient-to-br from-indigo-500/20 via-primary/10 to-blue-500/20 border border-primary/20 shadow-2xl group active:scale-95 transition-all cursor-pointer"
                    onClick={() => setCurrentInsightIndex((prev) => (prev + 1) % aiInsights.length)}
                >
                    <div className="flex gap-4 items-center relative z-10">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/30 shrink-0">
                            <Zap size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-primary flex items-center gap-1">
                                    <Sparkles size={10} /> مدربك المالي الذكي
                                </span>
                                <span className="text-[10px] opacity-40">اضغط للمزيد</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentInsightIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-sm font-bold leading-relaxed"
                                >
                                    {aiInsights[currentInsightIndex].text}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Monthly Progress / Daily Budget */}
            <div className="glass rounded-2xl p-5 mb-8 border border-white/5 relative group">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">ميزانية يوم:</h3>
                        <input
                            type="date"
                            className="bg-transparent text-sm text-primary font-bold outline-none cursor-pointer"
                            value={budgetForm.date}
                            onChange={(e) => setBudgetForm({ ...budgetForm, date: e.target.value })}
                        />
                    </div>
                    <div className="text-left">
                        {budgetStatus.isActiveDay ? (
                            <h2 className="text-xl font-black text-primary">{Math.round(budgetStatus.budget).toLocaleString('en-US')} د.ع</h2>
                        ) : (
                            <h2 className="text-sm font-bold text-gray-400">غير مخصص للصرف</h2>
                        )}
                    </div>
                </div>

                {budgetStatus.isActiveDay ? (
                    <>
                        <div className="w-full bg-gray-700/50 h-3 rounded-full overflow-hidden mb-3 border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((budgetStatus.spent / (Math.round(budgetStatus.budget) || 1)) * 100, 100)}%` }}
                                className={`h-full rounded-full ${(budgetStatus.spent / Math.round(budgetStatus.budget)) > 0.9 ? 'bg-red-500' : 'bg-primary'}`}
                            ></motion.div>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">صرفت: {Math.round(budgetStatus.spent).toLocaleString('en-US')}</span>
                            <span className={budgetStatus.remaining < 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                                {budgetStatus.remaining < 0 ? 'تجاوزت بـ: ' : 'باقي لك: '}
                                {Math.abs(Math.round(budgetStatus.remaining)).toLocaleString('en-US')} د.ع
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-between items-center text-xs mt-2 p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-gray-400">ما قمت بصرفه اليوم:</span>
                        <span className="font-black text-white">{Math.round(budgetStatus.spent).toLocaleString('en-US')} د.ع</span>
                    </div>
                )}
            </div>

            {/* Savings Adjustment Modal */}
            <AnimatePresence>
                {isAdjustingSavings && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-8 rounded-[2rem] border border-white/10"
                        >
                            <h3 className="text-xl font-bold mb-6 text-center">إدارة صندوق الادخار</h3>
                            <div className="space-y-4">
                                <div className="flex gap-2 mb-4">
                                    {['SET', 'INCREMENT', 'DECREMENT'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSavingsForm({ ...savingsForm, type })}
                                            className={`flex-1 p-2 rounded-xl text-[10px] font-bold transition-all ${savingsForm.type === type ? 'bg-primary text-black' : 'glass opacity-50'}`}
                                        >
                                            {type === 'SET' ? 'تحديد' : type === 'INCREMENT' ? 'إضافة' : 'سحب'}
                                        </button>
                                    ))}
                                </div>
                                <div className="glass p-4 rounded-2xl border border-white/5">
                                    <label className="text-xs text-gray-500 block mb-1">المبلغ (د.ع)</label>
                                    <AmountInput
                                        className="w-full bg-transparent text-2xl font-black focus:outline-none"
                                        placeholder="0"
                                        value={savingsForm.amount}
                                        onChange={(e) => setSavingsForm({ ...savingsForm, amount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUpdateSavings}
                                        className="flex-[2] bg-primary p-4 rounded-2xl font-bold shadow-lg shadow-primary/20"
                                    >
                                        تأكيد
                                    </button>
                                    <button
                                        onClick={() => setIsAdjustingSavings(false)}
                                        className="flex-1 glass p-4 rounded-2xl font-bold opacity-50"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Recent Transactions */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">آخر الحركات</h3>
                    <button className="text-primary text-sm font-bold">الكل</button>
                </div>
                <div className="space-y-4">
                    {recentTransactions.map((tx) => (
                        <div key={tx.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${tx.type === 'EXPENSE' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    <Plus size={20} className={tx.type === 'EXPENSE' ? 'rotate-45' : ''} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs">{tx.description}</h4>
                                    <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleDateString('en-US')}</p>
                                </div>
                            </div>
                            <p className="font-black text-sm">{tx.amount.toLocaleString('en-US')} د.ع</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* PIN Setup Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md glass rounded-3xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="text-primary" size={32} />
                            </div>

                            <h2 className="text-2xl font-bold mb-2">إعداد رمز القفل</h2>
                            <p className="text-gray-400 mb-8">أدخل 4 أرقام لحماية بياناتك</p>

                            <div className="flex justify-center gap-4 mb-8">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-12 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${pinInput.length > i ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800/50'
                                            }`}
                                    >
                                        {pinInput.length > i && <div className="w-3 h-3 bg-white rounded-full" />}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => pinInput.length < 4 && setPinInput(prev => prev + num)}
                                        className="h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => submitPin("")}
                                    className="h-16 rounded-2xl text-red-400 hover:bg-red-400/10 flex items-center justify-center text-sm font-bold"
                                >
                                    إلغاء القفل
                                </button>
                                <button
                                    onClick={() => pinInput.length < 4 && setPinInput(prev => prev + "0")}
                                    className="h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setPinInput(prev => prev.slice(0, -1))}
                                    className="h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
                                >
                                    ←
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={() => pinInput.length === 4 && submitPin(pinInput)}
                                    disabled={pinInput.length !== 4}
                                    className={`flex-1 py-4 rounded-2xl font-bold transition-all ${pinInput.length === 4 ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-700 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    تأكيد
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <NotificationsModal
                isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            <SettingsManager isOpen={showSettingsManager} onClose={() => setShowSettingsManager(false)} />

            <CustomModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                type="success"
            />
        </div>
    );
};

export default Dashboard;
