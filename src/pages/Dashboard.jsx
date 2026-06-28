import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Bell, Settings, Edit2, Calendar as CalIcon, DollarSign, RefreshCw, ArrowRightLeft, Zap, Sparkles, Lock, FileText, Printer, X } from 'lucide-react';
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
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [budgetForm, setBudgetForm] = useState({ dailyLimit: '', date: new Date().toLocaleDateString('en-CA') });
    const [savingsForm, setSavingsForm] = useState({ amount: '', type: 'SET' });
    const [aiInsights, setAiInsights] = useState([]);
    const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

    // Master Unified Report State
    const [isMasterReportOpen, setIsMasterReportOpen] = useState(false);
    const [masterReportData, setMasterReportData] = useState({ transactions: [], projects: [], stats: { byCategory: [] }, budget: { startingCapital: 0 } });
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
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

    const handleOpenMasterReport = async () => {
        setLoadingReport(true);
        try {
            const [txRes, projRes, statsRes, budgetRes] = await Promise.all([
                api.getTransactions(1, 1000),
                api.getFutureProjects(),
                api.getRangeStats('monthly'),
                api.getProjectsBudget()
            ]);
            setMasterReportData({
                transactions: txRes.data?.transactions || txRes.data || [],
                projects: projRes.data || [],
                stats: statsRes.data || { byCategory: [] },
                budget: budgetRes.data || { startingCapital: 0 }
            });
            setIsMasterReportOpen(true);
        } catch (error) {
            console.error("Error loading master report data", error);
        } finally {
            setLoadingReport(false);
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        try {
            await api.upsertBudget({
                date: budgetForm.date,
                dailyLimit: parseFloat(budgetForm.dailyLimit)
            });
            setIsEditingBudget(false);
            fetchData();
        } catch (error) {
            console.error("Error updating budget", error);
        }
    };

    const handleUpdateSavings = async () => {
        try {
            let newAmount = parseFloat(savingsForm.amount || 0);
            if (savingsForm.type === 'INCREMENT') newAmount = savings + newAmount;
            if (savingsForm.type === 'DECREMENT') newAmount = Math.max(0, savings - newAmount);

            await api.updateSavings(newAmount);
            setIsAdjustingSavings(false);
            fetchData();
            setAlertModal({ isOpen: true, title: 'تم التحديث', message: 'تم تحديث رصيد الادخار بنجاح' });
        } catch (error) {
            console.error("Error updating savings", error);
        }
    };

    const handleSetPin = () => {
        setPinInput("");
        setShowPinModal(true);
    };

    const submitPin = async (code) => {
        if (code && code.length !== 4) return;
        try {
            await api.updateSecuritySettings({ pinCode: code, isLocked: !!code });
            setShowPinModal(false);
            setAlertModal({
                isOpen: true,
                title: code ? 'تم تفعيل القفل' : 'تم إلغاء القفل',
                message: code ? 'تم إعداد رمز قفل التطبيق بنجاح.' : 'تم إزالة رمز القفل بنجاح.'
            });
        } catch (error) {
            console.error("Error saving PIN", error);
        }
    };

    const totalBalance = cards.reduce((acc, card) => acc + card.balance, 0);
    const byCategory = [...(masterReportData.stats.byCategory || [])].sort((a, b) => b.amount - a.amount);
    const totalSpentReport = byCategory.reduce((acc, c) => acc + c.amount, 0);

    return (
        <div className="pb-32 pt-6 px-4 max-w-4xl mx-auto overflow-x-hidden" dir="rtl">
            {/* Top Navbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>👋</span> مرحباً بك في مساعدك المالي
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">نظرة عامة على رصيدك، مصاريفك اليومية وأهدافك المالية</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    <button
                        onClick={handleOpenMasterReport}
                        disabled={loadingReport}
                        className="bg-purple-500 hover:bg-purple-400 text-black font-black px-4 py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-500/20 text-xs shrink-0 active:scale-95 flex-1 sm:flex-initial"
                    >
                        <FileText size={16} />
                        <span>{loadingReport ? 'جاري التحضير...' : '📑 التقرير الشامل PDF'}</span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleSetPin}
                            className="p-3 glass rounded-2xl flex items-center justify-center opacity-70 hover:opacity-100 transition-all active:scale-95"
                            title="إعدادات القفل"
                        >
                            <Lock size={18} />
                        </button>
                        <button onClick={() => setIsNotifOpen(true)} className="p-3 glass rounded-2xl flex items-center justify-center relative active:scale-95">
                            <Bell size={18} />
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-dark"></div>
                        </button>
                        <button onClick={() => setShowSettingsManager(true)} className="p-3 glass rounded-2xl flex items-center justify-center active:scale-95">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-gradient rounded-[2rem] sm:rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8 shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <TrendingUp size={80} />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                        <p className="text-blue-100 text-xs mb-1">إجمالي الرصيد</p>
                        <h2 className="text-2xl sm:text-3xl font-black break-words">{totalBalance.toLocaleString('en-US')} د.ع</h2>
                    </div>
                    <div className="text-right sm:text-left w-full sm:w-auto bg-black/20 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
                        <p className="text-blue-100 text-xs mb-1">صندوق الادخار</p>
                        <button
                            onClick={() => {
                                setSavingsForm({ amount: '', type: 'SET' });
                                setIsAdjustingSavings(true);
                            }}
                            className="text-base sm:text-lg font-black bg-white/20 px-3.5 py-1.5 rounded-xl hover:bg-white/30 transition-colors w-full sm:w-auto text-center"
                        >
                            {savings.toLocaleString('en-US')} د.ع
                        </button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-xs sm:text-sm bg-white/20 px-3 py-1 rounded-full font-bold">
                        <ArrowDownLeft size={14} className="text-green-300 shrink-0" />
                        <span>الوضع المالي مستقر!</span>
                    </div>
                </div>
            </motion.div>

            {/* AI Mentor Card */}
            {aiInsights.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative mb-6 sm:mb-8 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 bg-gradient-to-br from-indigo-500/20 via-primary/10 to-blue-500/20 border border-primary/20 shadow-2xl group active:scale-95 transition-all cursor-pointer"
                    onClick={() => setCurrentInsightIndex((prev) => (prev + 1) % aiInsights.length)}
                >
                    <div className="flex gap-3.5 sm:gap-4 items-center relative z-10">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/30 shrink-0">
                            <Zap size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-primary flex items-center gap-1 truncate">
                                    <Sparkles size={10} className="shrink-0" /> مدربك المالي الذكي
                                </span>
                                <span className="text-[10px] opacity-40 shrink-0">اضغط للمزيد</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentInsightIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-xs sm:text-sm font-bold leading-relaxed break-words"
                                >
                                    {aiInsights[currentInsightIndex].text}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Monthly Progress / Daily Budget */}
            <div className="glass rounded-[2rem] sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-white/5 relative group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base">ميزانية يوم:</h3>
                        <input
                            type="date"
                            className="bg-transparent text-xs sm:text-sm text-primary font-bold outline-none cursor-pointer"
                            value={budgetForm.date}
                            onChange={(e) => setBudgetForm({ ...budgetForm, date: e.target.value })}
                        />
                    </div>
                    <div className="text-left w-full sm:w-auto">
                        <button
                            onClick={() => {
                                setBudgetForm(prev => ({ ...prev, dailyLimit: budgetStatus.budget || '' }));
                                setIsEditingBudget(true);
                            }}
                            className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 hover:opacity-80 transition-opacity bg-white/5 px-3.5 py-2 rounded-xl border border-white/5 group-hover:border-primary/30"
                            title="تعديل الميزانية اليومية"
                        >
                            <h2 className="text-lg sm:text-xl font-black text-primary">{Math.round(budgetStatus.budget || 0).toLocaleString('en-US')} د.ع</h2>
                            <Edit2 size={14} className="text-gray-400 shrink-0" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400 flex-wrap gap-1">
                        <span>المصروف: <span className="text-white">{Math.round(budgetStatus.spent || 0).toLocaleString('en-US')} د.ع</span></span>
                        <span>المتبقي: <span className={budgetStatus.remaining >= 0 ? "text-green-400" : "text-red-400"}>{Math.round(budgetStatus.remaining || 0).toLocaleString('en-US')} د.ع</span></span>
                    </div>
                    <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${budgetStatus.spent > budgetStatus.budget ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-green-400'}`}
                            style={{ width: `${Math.min(100, (budgetStatus.spent / (budgetStatus.budget || 1)) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Comprehensive Report Export Banner */}
            <div className="mb-8">
                <div className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-purple-500/30 text-center relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-black/40 to-primary/20 space-y-4 shadow-2xl">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
                        <FileText size={30} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white">تصدير التقرير المالي والإحصائي الشامل</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            زر واحد يجمع لك كل شيء! استخرج مستند PDF احترافي يحتوي على كافة الصرفيات، الأقسام، الإحصائيات، وسجل المعاملات والمشاريع المجدولة بضغطة واحدة.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenMasterReport}
                        disabled={loadingReport}
                        className="bg-purple-500 hover:bg-purple-400 text-black font-black px-6 sm:px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-500/20 text-xs sm:text-sm active:scale-95 w-full sm:w-auto"
                    >
                        <Printer size={18} />
                        <span>{loadingReport ? 'جاري تجهيز كافة البيانات...' : 'استعراض وتصدير التقرير الشامل PDF'}</span>
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-base sm:text-lg">آخر الحركات</h3>
                    <button onClick={() => window.location.href = '/transactions'} className="text-primary text-xs sm:text-sm font-bold">الكل</button>
                </div>
                <div className="space-y-3 sm:space-y-4">
                    {recentTransactions.map((tx) => (
                        <div key={tx.id} className="glass p-3.5 sm:p-4 rounded-2xl flex items-center justify-between border border-white/5 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${tx.type === 'EXPENSE' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    <Plus size={18} className={tx.type === 'EXPENSE' ? 'rotate-45' : ''} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-xs sm:text-sm truncate">{tx.description}</h4>
                                    <p className="text-[10px] text-gray-500">{new Date(tx.date).toLocaleDateString('en-US')}</p>
                                </div>
                            </div>
                            <p className="font-black text-xs sm:text-sm shrink-0">{tx.amount.toLocaleString('en-US')} د.ع</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Budget Editing Modal */}
            <AnimatePresence>
                {isEditingBudget && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-6 sm:p-8 rounded-[2rem] border border-white/10 space-y-4"
                        >
                            <h3 className="text-lg sm:text-xl font-bold text-center">تعديل ميزانية اليوم</h3>
                            <form onSubmit={handleUpdateBudget} className="space-y-4">
                                <div className="glass p-4 rounded-2xl border border-white/5">
                                    <label className="text-xs text-gray-500 block mb-1">الحد اليومي (د.ع)</label>
                                    <AmountInput
                                        className="w-full bg-transparent text-xl sm:text-2xl font-black focus:outline-none text-left"
                                        placeholder="0"
                                        value={budgetForm.dailyLimit}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, dailyLimit: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-primary p-4 rounded-2xl font-bold text-black shadow-lg shadow-primary/20 text-sm active:scale-95"
                                    >
                                        حفظ التعديل
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingBudget(false)}
                                        className="flex-1 glass p-4 rounded-2xl font-bold opacity-70 text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Savings Adjustment Modal */}
            <AnimatePresence>
                {isAdjustingSavings && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-6 sm:p-8 rounded-[2rem] border border-white/10 space-y-4"
                        >
                            <h3 className="text-lg sm:text-xl font-bold text-center">إدارة صندوق الادخار</h3>
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
                                        className="w-full bg-transparent text-xl sm:text-2xl font-black focus:outline-none text-left"
                                        placeholder="0"
                                        value={savingsForm.amount}
                                        onChange={(e) => setSavingsForm({ ...savingsForm, amount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUpdateSavings}
                                        className="flex-[2] bg-primary p-4 rounded-2xl font-bold text-black shadow-lg shadow-primary/20 text-sm active:scale-95"
                                    >
                                        تأكيد
                                    </button>
                                    <button
                                        onClick={() => setIsAdjustingSavings(false)}
                                        className="flex-1 glass p-4 rounded-2xl font-bold opacity-70 text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PIN Setup Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md glass rounded-[2rem] p-6 sm:p-8 text-center border border-white/10"
                        >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="text-primary" size={28} />
                            </div>

                            <h2 className="text-xl sm:text-2xl font-bold mb-1">إعداد رمز القفل</h2>
                            <p className="text-gray-400 text-xs sm:text-sm mb-6">أدخل 4 أرقام لحماية تطبيقك وبياناتك</p>

                            <div className="flex justify-center gap-3 sm:gap-4 mb-6">
                                {[1, 2, 3, 4].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-10 h-14 sm:w-12 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${pinInput.length > i ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-800/50'
                                            }`}
                                    >
                                        {pinInput.length > i && <div className="w-3 h-3 bg-white rounded-full" />}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => pinInput.length < 4 && setPinInput(prev => prev + num)}
                                        className="h-14 sm:h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold active:scale-95 transition-all"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => submitPin("")}
                                    className="h-14 sm:h-16 rounded-2xl text-red-400 hover:bg-red-400/10 flex items-center justify-center text-xs sm:text-sm font-bold active:scale-95"
                                >
                                    إلغاء القفل
                                </button>
                                <button
                                    onClick={() => pinInput.length < 4 && setPinInput(prev => prev + "0")}
                                    className="h-14 sm:h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold active:scale-95 transition-all"
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setPinInput(prev => prev.slice(0, -1))}
                                    className="h-14 sm:h-16 rounded-2xl glass hover:bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold active:scale-95 transition-all"
                                >
                                    ←
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPinModal(false)}
                                    className="flex-1 py-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 font-bold transition-all text-sm active:scale-95"
                                >
                                    إغلاق
                                </button>
                                <button
                                    onClick={() => pinInput.length === 4 && submitPin(pinInput)}
                                    disabled={pinInput.length !== 4}
                                    className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm active:scale-95 ${pinInput.length === 4 ? 'bg-primary text-black hover:opacity-90' : 'bg-gray-700 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    تأكيد
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Master Unified Comprehensive PDF Report Modal */}
            <AnimatePresence>
                {isMasterReportOpen && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[200] overflow-y-auto p-3 sm:p-8 flex justify-center items-start">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="print-modal-root bg-slate-900 border border-white/20 w-full max-w-4xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-10 shadow-2xl relative my-4 sm:my-6 text-white space-y-6 sm:space-y-8"
                        >
                            {/* Action Bar */}
                            <div className="no-print flex flex-col sm:flex-row justify-between items-center gap-4 pb-6 border-b border-white/10">
                                <div className="text-center sm:text-right">
                                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                                        <FileText className="text-purple-400 shrink-0" size={24} />
                                        <span>التقرير المالي والإحصائي الشامل الموحد</span>
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-1">يجمع هذا التقرير كل بياناتك (الصرفيات، الأقسام، المعاملات، والمشاريع) في مكان واحد.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => window.print()}
                                        className="bg-purple-500 hover:bg-purple-400 text-black font-black px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-500/20 text-xs sm:text-sm active:scale-95 flex-1 sm:flex-initial"
                                    >
                                        <Printer size={18} />
                                        🖨️ طباعة وحفظ PDF
                                    </button>
                                    <button
                                        onClick={() => setIsMasterReportOpen(false)}
                                        className="glass px-5 py-3.5 rounded-2xl font-bold text-gray-300 hover:text-white transition-all text-xs sm:text-sm active:scale-95"
                                    >
                                        إغلاق
                                    </button>
                                </div>
                            </div>

                            {/* Printable Report Content */}
                            <div className="space-y-6 sm:space-y-8 bg-slate-900 sm:p-4 rounded-2xl text-white">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 gap-4">
                                    <div>
                                        <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2">
                                            <span>📑</span> التقرير المالي والإحصائي الشامل
                                        </h1>
                                        <p className="text-gray-300 text-xs sm:text-sm mt-1">وثيقة مالية متكاملة لرصيدك، أقسامك، حركاتك وخططك المستقبلية</p>
                                    </div>
                                    <div className="text-left bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-mono text-gray-300 w-full sm:w-auto">
                                        <div>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-IQ')}</div>
                                        <div>إجمالي المعاملات: {masterReportData.transactions.length}</div>
                                    </div>
                                </div>

                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block truncate">إجمالي الرصيد الحالي</span>
                                        <span className="text-base sm:text-lg font-black text-white mt-1 block truncate">{totalBalance.toLocaleString()} د.ع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block truncate">صندوق الادخار</span>
                                        <span className="text-base sm:text-lg font-black text-green-400 mt-1 block truncate">+{savings.toLocaleString()} د.ع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block truncate">إجمالي مصاريف الشهر</span>
                                        <span className="text-base sm:text-lg font-black text-red-400 mt-1 block truncate">{totalSpentReport.toLocaleString()} د.ع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block truncate">رأس مال المشاريع المتاح</span>
                                        <span className="text-base sm:text-lg font-black text-purple-300 mt-1 block truncate">{parseFloat(masterReportData.budget.startingCapital || 0).toLocaleString()} د.ع</span>
                                    </div>
                                </div>

                                {/* Table 1: Expenses by Category Breakdown */}
                                <div className="space-y-3">
                                    <h3 className="text-base sm:text-lg font-black text-white border-r-4 border-primary pr-3">
                                        📂 أولاً: تحليل الصرفيات وتوزيعها حسب الأقسام (Categories Breakdown)
                                    </h3>
                                    {byCategory.length === 0 ? (
                                        <p className="text-xs text-gray-400">لا توجد مصاريف مسجلة في هذا الشهر.</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-white/10">
                                            <table className="w-full text-xs sm:text-sm text-right">
                                                <thead className="bg-white/10 text-white font-black text-xs">
                                                    <tr>
                                                        <th className="p-3 whitespace-nowrap">الرقم</th>
                                                        <th className="p-3 whitespace-nowrap">اسم القسم (Category)</th>
                                                        <th className="p-3 whitespace-nowrap">المبلغ المصروف</th>
                                                        <th className="p-3 whitespace-nowrap">النسبة المئوية من الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10 font-bold text-gray-200">
                                                    {byCategory.map((cat, idx) => {
                                                        const pct = totalSpentReport > 0 ? ((cat.amount / totalSpentReport) * 100).toFixed(1) : 0;
                                                        return (
                                                            <tr key={cat.name} className="hover:bg-white/5">
                                                                <td className="p-3 text-gray-400 font-mono whitespace-nowrap">#{idx + 1}</td>
                                                                <td className="p-3 font-black text-white whitespace-nowrap">{cat.name}</td>
                                                                <td className="p-3 text-red-400 font-black whitespace-nowrap">{cat.amount.toLocaleString()} د.ع</td>
                                                                <td className="p-3 text-primary whitespace-nowrap">{pct}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Table 2: Detailed Transactions Log */}
                                <div className="space-y-3 pt-4">
                                    <h3 className="text-base sm:text-lg font-black text-white border-r-4 border-purple-400 pr-3">
                                        💳 ثانياً: سجل المعاملات والصرفيات التفصيلي (Transactions Log)
                                    </h3>
                                    {masterReportData.transactions.length === 0 ? (
                                        <p className="text-xs text-gray-400">لا توجد معاملات مسجلة.</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-2xl border border-white/10 max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-xs sm:text-sm text-right">
                                                <thead className="bg-white/10 text-white font-black text-xs sticky top-0">
                                                    <tr>
                                                        <th className="p-3 whitespace-nowrap">التاريخ</th>
                                                        <th className="p-3 whitespace-nowrap">الوصف والبيان</th>
                                                        <th className="p-3 whitespace-nowrap">القسم</th>
                                                        <th className="p-3 whitespace-nowrap">المبلغ</th>
                                                        <th className="p-3 whitespace-nowrap">النوع</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10 font-bold text-gray-200">
                                                    {masterReportData.transactions.slice(0, 50).map((tx) => (
                                                        <tr key={tx.id} className="hover:bg-white/5">
                                                            <td className="p-3 text-xs font-mono text-gray-400 whitespace-nowrap" dir="ltr">
                                                                {new Date(tx.date || Date.now()).toLocaleDateString('en-US')}
                                                            </td>
                                                            <td className="p-3 font-black text-white whitespace-nowrap">{tx.description || 'بدون وصف'}</td>
                                                            <td className="p-3 text-gray-300 whitespace-nowrap">{tx.category?.name || 'عام'}</td>
                                                            <td className={`p-3 font-black whitespace-nowrap ${tx.type === 'EXPENSE' ? 'text-red-400' : 'text-green-400'}`}>
                                                                {parseFloat(tx.amount || 0).toLocaleString()} د.ع
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${tx.type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {tx.type === 'EXPENSE' ? 'صرفية' : 'دخل'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {masterReportData.transactions.length > 50 && (
                                                <div className="p-3 text-center text-xs text-gray-400 bg-white/5">
                                                    تم عرض أحدث 50 معاملة في هذا الجدول.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Table 3: Planned Future Projects Summary */}
                                {masterReportData.projects.length > 0 && (
                                    <div className="space-y-3 pt-4">
                                        <h3 className="text-base sm:text-lg font-black text-white border-r-4 border-green-400 pr-3">
                                            🚀 ثالثاً: ملخص المشاريع والخطط المستقبلية المجدولة
                                        </h3>
                                        <div className="overflow-x-auto rounded-2xl border border-white/10">
                                            <table className="w-full text-xs sm:text-sm text-right">
                                                <thead className="bg-white/10 text-white font-black text-xs">
                                                    <tr>
                                                        <th className="p-3 whitespace-nowrap">اسم المشروع</th>
                                                        <th className="p-3 whitespace-nowrap">شهر التنفيذ</th>
                                                        <th className="p-3 whitespace-nowrap">التكلفة المقدرة / الفعلية</th>
                                                        <th className="p-3 whitespace-nowrap">الحالة</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10 font-bold text-gray-200">
                                                    {masterReportData.projects.slice(0, 15).map(project => {
                                                        const min = parseFloat(project.costMin !== undefined ? project.costMin : (project.estimatedCost || 0));
                                                        const max = parseFloat(project.costMax !== undefined ? project.costMax : (project.estimatedCost || 0));
                                                        return (
                                                            <tr key={project.id} className="hover:bg-white/5">
                                                                <td className="p-3 font-black text-white whitespace-nowrap">{project.name}</td>
                                                                <td className="p-3 whitespace-nowrap" dir="ltr">{project.targetMonth || '📦 Unscheduled'}</td>
                                                                <td className="p-3 text-primary whitespace-nowrap" dir="ltr">
                                                                    {min === max ? max.toLocaleString() : `${min.toLocaleString()} - ${max.toLocaleString()}`} د.ع
                                                                </td>
                                                                <td className="p-3 whitespace-nowrap">
                                                                    <span className="text-xs font-bold text-gray-300">
                                                                        {project.status === 'COMPLETED' ? '✅ مكتمل' : '⏳ مخطط له'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Footer Note */}
                                <div className="text-center pt-6 text-xs text-gray-400 border-t border-white/10">
                                    تم إنشاء هذا التقرير تلقائياً بواسطة نظام الذكاء المالي - التقرير الشامل والموحد لحساباتك.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
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
