import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, Trash2, Edit2, Sparkles, Rocket, Briefcase, Check, Clock, DollarSign, X, Settings, TrendingUp, Wallet, AlertTriangle, Link as LinkIcon, Edit3, FileText, Printer, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AmountInput from '../components/AmountInput';
import confetti from 'canvas-confetti';
import html2pdf from 'html2pdf.js';

const PRIORITY_LABELS = {
    HIGH: { label: 'أولوية قصوى', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔥' },
    MEDIUM: { label: 'أولوية متوسطة', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '⚡' },
    LOW: { label: 'أولوية عادية', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🍃' }
};

const FuturePlanner = () => {
    const [projects, setProjects] = useState([]);
    const [budgetSettings, setBudgetSettings] = useState({ startingCapital: 0, monthlyAddition: 0, customMonthlyAdditions: {} });
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [linkModalMonth, setLinkModalMonth] = useState(null);
    const [customMonthModal, setCustomMonthModal] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Completion modal state
    const [completeModalProject, setCompleteModalProject] = useState(null);
    const [finalCostInput, setFinalCostInput] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('printable-future-report');
        if (!element) return;
        setIsDownloading(true);
        const opt = {
            margin:       [8, 8, 8, 8],
            filename:     `Future_Projects_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        try {
            await html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error("Error generating future projects PDF:", e);
            window.print();
        } finally {
            setIsDownloading(false);
        }
    };

    // Form state
    const [form, setForm] = useState({
        name: '',
        costMin: '',
        costMax: '',
        targetMonth: '',
        priority: 'MEDIUM',
        description: ''
    });

    // Budget form state
    const [budgetForm, setBudgetForm] = useState({
        startingCapital: '',
        monthlyAddition: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projectsRes, budgetRes] = await Promise.all([
                api.getFutureProjects(),
                api.getProjectsBudget()
            ]);
            setProjects(projectsRes.data || []);
            const bData = budgetRes.data || { startingCapital: 0, monthlyAddition: 0, customMonthlyAdditions: {} };
            setBudgetSettings({
                startingCapital: bData.startingCapital || 0,
                monthlyAddition: bData.monthlyAddition || 0,
                customMonthlyAdditions: bData.customMonthlyAdditions || {}
            });
            setBudgetForm({
                startingCapital: bData.startingCapital || '',
                monthlyAddition: bData.monthlyAddition || ''
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        const min = parseFloat(form.costMin || 0);
        const max = parseFloat(form.costMax || min || 0);

        const data = {
            ...form,
            costMin: min,
            costMax: max,
            estimatedCost: max,
            status: editingId ? (projects.find(p => p.id === editingId)?.status || 'IDEA') : 'IDEA'
        };

        if (editingId) {
            await api.updateFutureProject(editingId, data);
        } else {
            await api.createFutureProject(data);
        }

        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
        fetchData();
    };

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        const data = {
            startingCapital: parseFloat(budgetForm.startingCapital || 0),
            monthlyAddition: parseFloat(budgetForm.monthlyAddition || 0)
        };
        await api.updateProjectsBudget(data);
        setIsBudgetModalOpen(false);
        fetchData();
    };

    const handleSaveCustomMonthAddition = async (e) => {
        e.preventDefault();
        if (!customMonthModal) return;

        const newMap = { ...budgetSettings.customMonthlyAdditions };
        const val = parseFloat(customMonthModal.amount || 0);
        newMap[customMonthModal.monthStr] = val;

        await api.updateProjectsBudget({ customMonthlyAdditions: newMap });
        setCustomMonthModal(null);
        fetchData();
    };

    const handleResetCustomMonthAddition = async (monthStr) => {
        const newMap = { ...budgetSettings.customMonthlyAdditions };
        delete newMap[monthStr];

        await api.updateProjectsBudget({ customMonthlyAdditions: newMap });
        setCustomMonthModal(null);
        fetchData();
    };

    const handleEdit = (project) => {
        const min = project.costMin !== undefined ? project.costMin : (project.estimatedCost || '');
        const max = project.costMax !== undefined ? project.costMax : (project.estimatedCost || '');
        setForm({
            name: project.name || '',
            costMin: min,
            costMax: max,
            targetMonth: project.targetMonth || '',
            priority: project.priority || 'MEDIUM',
            description: project.description || ''
        });
        setEditingId(project.id);
        setIsModalOpen(true);
    };

    const handleToggleCompleteClick = async (project) => {
        if (project.status === 'COMPLETED') {
            await api.updateFutureProject(project.id, { status: 'IDEA' });
            fetchData();
        } else {
            const defaultCost = project.costMax !== undefined ? project.costMax : (project.estimatedCost || '');
            setFinalCostInput(defaultCost);
            setCompleteModalProject(project);
        }
    };

    const handleConfirmCompletion = async (e) => {
        e.preventDefault();
        if (!completeModalProject) return;

        const finalVal = parseFloat(finalCostInput || 0);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        await api.updateFutureProject(completeModalProject.id, {
            status: 'COMPLETED',
            costMin: finalVal,
            costMax: finalVal,
            estimatedCost: finalVal,
            actualCost: finalVal
        });

        setCompleteModalProject(null);
        fetchData();
    };

    const handleQuickMonthChange = async (project, newMonth) => {
        await api.updateFutureProject(project.id, { targetMonth: newMonth });
        fetchData();
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
            await api.deleteFutureProject(id);
            fetchData();
        }
    };

    const openAddForMonth = (monthStr) => {
        resetForm();
        setForm(prev => ({ ...prev, targetMonth: monthStr === 'UNSCHEDULED' ? '' : monthStr }));
        setEditingId(null);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setForm({
            name: '',
            costMin: '',
            costMax: '',
            targetMonth: '',
            priority: 'MEDIUM',
            description: ''
        });
    };

    const formatMonthName = (monthStr) => {
        if (!monthStr || monthStr === 'UNSCHEDULED') return 'Unscheduled Projects 📦';
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
        } catch (e) {
            return monthStr;
        }
    };

    const getTimelineMonths = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();

        const monthsSet = new Set();
        for (let m = currentMonthIndex; m <= 11; m++) {
            const mStr = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
            monthsSet.add(mStr);
        }

        projects.forEach(p => {
            if (p.targetMonth && p.targetMonth.trim() !== '') {
                monthsSet.add(p.targetMonth);
            }
        });

        const sorted = Array.from(monthsSet).sort((a, b) => a.localeCompare(b));
        return ['UNSCHEDULED', ...sorted];
    };

    const timelineMonths = getTimelineMonths();

    const groupedProjects = projects.reduce((acc, project) => {
        const month = project.targetMonth && project.targetMonth.trim() !== '' ? project.targetMonth : 'UNSCHEDULED';
        if (!acc[month]) acc[month] = [];
        acc[month].push(project);
        return acc;
    }, {});

    const unscheduledProjects = groupedProjects['UNSCHEDULED'] || [];
    const activeProjects = projects.filter(p => p.status !== 'COMPLETED');
    const totalMinCost = activeProjects.reduce((acc, p) => acc + parseFloat(p.costMin !== undefined ? p.costMin : (p.estimatedCost || 0)), 0);
    const totalMaxCost = activeProjects.reduce((acc, p) => acc + parseFloat(p.costMax !== undefined ? p.costMax : (p.estimatedCost || 0)), 0);

    let runningBudgetMin = parseFloat(budgetSettings.startingCapital || 0);
    let runningBudgetMax = parseFloat(budgetSettings.startingCapital || 0);
    const defaultMonthlyAddition = parseFloat(budgetSettings.monthlyAddition || 0);

    // Calculate simulation data for report & timeline
    let reportRunningMin = parseFloat(budgetSettings.startingCapital || 0);
    let reportRunningMax = parseFloat(budgetSettings.startingCapital || 0);

    const monthlyForecastData = timelineMonths.filter(m => m !== 'UNSCHEDULED').map(monthStr => {
        const mProjects = groupedProjects[monthStr] || [];
        const activeMProjects = mProjects.filter(p => p.status !== 'COMPLETED');
        const minCost = activeMProjects.reduce((acc, p) => acc + parseFloat(p.costMin !== undefined ? p.costMin : (p.estimatedCost || 0)), 0);
        const maxCost = activeMProjects.reduce((acc, p) => acc + parseFloat(p.costMax !== undefined ? p.costMax : (p.estimatedCost || 0)), 0);
        
        const hasCustom = budgetSettings.customMonthlyAdditions && budgetSettings.customMonthlyAdditions[monthStr] !== undefined;
        const addition = hasCustom ? parseFloat(budgetSettings.customMonthlyAdditions[monthStr]) : defaultMonthlyAddition;
        
        const expAvailMin = reportRunningMin + addition;
        const expAvailMax = reportRunningMax + addition;

        const remMin = expAvailMin - maxCost;
        const remMax = expAvailMax - minCost;

        reportRunningMin = remMin;
        reportRunningMax = remMax;

        return {
            monthStr,
            monthName: formatMonthName(monthStr),
            expAvailMin,
            expAvailMax,
            addition,
            minCost,
            maxCost,
            remMin,
            remMax,
            projectsCount: mProjects.length
        };
    });

    return (
        <div className="pb-32 pt-6 px-4 max-w-4xl mx-auto space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <Rocket className="text-primary animate-bounce shrink-0" size={26} />
                        <span>مشاريعي وخططي المستقبلية</span>
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">تابع أموالك المتوقعة، وخصص ميزانية كل شهر بمرونة تامة للتحكم بمستقبلك ✨</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="glass border border-purple-500/40 text-purple-300 font-bold px-3.5 py-3 rounded-2xl flex items-center gap-2 hover:bg-purple-500/10 transition-all text-xs sm:text-sm shrink-0 active:scale-95 flex-1 sm:flex-initial justify-center shadow-lg shadow-purple-500/10"
                    >
                        <FileText size={18} />
                        تصدير PDF
                    </button>
                    <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="glass border border-primary/40 text-primary font-bold px-3.5 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/10 transition-all text-xs sm:text-sm shrink-0 active:scale-95 flex-1 sm:flex-initial justify-center"
                    >
                        <Settings size={18} />
                        الميزانية
                    </button>
                    <button
                        onClick={() => openAddForMonth('')}
                        className="bg-primary text-black font-bold px-4 py-3 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all text-xs sm:text-sm shadow-lg shadow-primary/20 shrink-0 active:scale-95 flex-1 sm:flex-initial justify-center"
                    >
                        <Plus size={18} />
                        إضافة مشروع
                    </button>
                </div>
            </div>

            {/* Budget & Compounding Summary Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-5 sm:p-6 rounded-3xl border border-primary/30 relative overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 space-y-4"
            >
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/30 shrink-0">
                            <Wallet size={22} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block truncate">رأس المال المخصص</span>
                            <span className="text-base sm:text-lg font-black text-white truncate block"><span dir="ltr" className="font-sans inline-block">{parseFloat(budgetSettings.startingCapital || 0).toLocaleString('en-US')}</span> <span className="text-xs text-primary">د.ع</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
                            <TrendingUp size={22} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block truncate">الإضافة الافتراضية الشهرياً</span>
                            <span className="text-base sm:text-lg font-black text-green-400 truncate block">+<span dir="ltr" className="font-sans inline-block">{defaultMonthlyAddition.toLocaleString('en-US')}</span> <span className="text-xs text-gray-400">د.ع</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            <DollarSign size={22} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block truncate">إجمالي التكلفة (من - إلى)</span>
                            <span className="text-sm sm:text-base font-black text-white block truncate" dir="ltr">
                                <span className="font-sans inline-block">{totalMinCost === totalMaxCost ? totalMaxCost.toLocaleString('en-US') : `${totalMinCost.toLocaleString('en-US')} - ${totalMaxCost.toLocaleString('en-US')}`}</span> <span className="text-[10px] text-purple-300">د.ع</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-200 leading-relaxed">
                    <Sparkles size={18} className="text-primary shrink-0 animate-pulse" />
                    <p>
                        💡 عند تنفيذ المشروع والضغط على زر الإتمام ✅ سيطلب منك التطبيق إدخال التكلفة الفعلية النهائية لتنفيذه لتعتمد كقيمة رسمية!
                    </p>
                </div>
            </motion.div>

            {/* Timeline of Remaining Months & Unscheduled */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 font-bold">جاري تحميل المشاريع والأشهر...</div>
            ) : (
                <div className="space-y-8">
                    {timelineMonths.map((monthStr) => {
                        const monthProjects = groupedProjects[monthStr] || [];
                        const activeMonthProjects = monthProjects.filter(p => p.status !== 'COMPLETED');
                        
                        const minTotalCost = activeMonthProjects.reduce((acc, p) => acc + parseFloat(p.costMin !== undefined ? p.costMin : (p.estimatedCost || 0)), 0);
                        const maxTotalCost = activeMonthProjects.reduce((acc, p) => acc + parseFloat(p.costMax !== undefined ? p.costMax : (p.estimatedCost || 0)), 0);
                        
                        const isUnscheduled = monthStr === 'UNSCHEDULED';

                        const hasCustomAddition = budgetSettings.customMonthlyAdditions && budgetSettings.customMonthlyAdditions[monthStr] !== undefined;
                        const monthAdditionAmount = hasCustomAddition ? parseFloat(budgetSettings.customMonthlyAdditions[monthStr]) : defaultMonthlyAddition;

                        let expAvailMin = runningBudgetMin;
                        let expAvailMax = runningBudgetMax;
                        let remMin = runningBudgetMin;
                        let remMax = runningBudgetMax;

                        if (!isUnscheduled) {
                            expAvailMin = runningBudgetMin + monthAdditionAmount;
                            expAvailMax = runningBudgetMax + monthAdditionAmount;
                            remMin = expAvailMin - maxTotalCost;
                            remMax = expAvailMax - minTotalCost;
                            runningBudgetMin = remMin;
                            runningBudgetMax = remMax;
                        }

                        if (isUnscheduled && monthProjects.length === 0 && projects.length > 0) return null;

                        return (
                            <div key={monthStr} className="space-y-3">
                                {/* Month Section Header / Financial Bar */}
                                <div className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 ${
                                    isUnscheduled ? 'glass border-amber-500/30 bg-amber-500/5' : 'glass border-white/10 bg-white/[0.02]'
                                }`}>
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2.5 rounded-2xl font-bold text-base sm:text-lg shrink-0 ${isUnscheduled ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                {isUnscheduled ? '📦' : '📅'}
                                            </div>
                                            <div>
                                                <h2 className="text-base sm:text-lg font-black text-white tracking-wide break-words" dir="ltr">
                                                    {formatMonthName(monthStr)}
                                                </h2>
                                                <span className="text-xs text-gray-400">
                                                    {monthProjects.length} مشاريع مرتبطة بهذا الشهر
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions for this specific month */}
                                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                                            {!isUnscheduled && (
                                                <button
                                                    onClick={() => setCustomMonthModal({ monthStr, amount: monthAdditionAmount })}
                                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                                                        monthAdditionAmount === 0
                                                            ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                                            : hasCustomAddition
                                                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                                            : 'glass border-white/10 text-green-400 hover:border-green-400/40'
                                                    }`}
                                                    title="اضغط لتغيير أو تصفير ميزانية هذا الشهر فقط"
                                                >
                                                    <Edit3 size={13} />
                                                    <span>إضافة الشهر: {monthAdditionAmount === 0 ? '0 د.ع' : <span dir="ltr" className="font-sans inline-block">+{monthAdditionAmount.toLocaleString('en-US')} د.ع</span>}</span>
                                                </button>
                                            )}

                                            {!isUnscheduled && unscheduledProjects.length > 0 && (
                                                <button
                                                    onClick={() => setLinkModalMonth(monthStr)}
                                                    className="px-3 py-1.5 rounded-xl glass border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                                                >
                                                    <LinkIcon size={13} />
                                                    ربط مشروع
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openAddForMonth(monthStr)}
                                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                                            >
                                                <Plus size={13} />
                                                إضافة
                                            </button>
                                        </div>
                                    </div>

                                    {/* Monthly Compounding Financial Forecast */}
                                    {!isUnscheduled && (
                                        <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                            <div className="bg-black/30 p-2.5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                                <span className="text-gray-400">💵 المتوقع توفره بالشهر:</span>
                                                <span className="font-black text-white text-xs sm:text-sm mt-0.5" dir="ltr">
                                                    <span className="font-sans inline-block">{expAvailMin === expAvailMax ? expAvailMax.toLocaleString('en-US') : `${expAvailMin.toLocaleString('en-US')} - ${expAvailMax.toLocaleString('en-US')}`}</span> د.ع
                                                </span>
                                            </div>

                                            <div className="bg-black/30 p-2.5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                                <span className="text-gray-400">⚡ تكلفة المشاريع (من - إلى):</span>
                                                <span className="font-black text-purple-300 text-xs sm:text-sm mt-0.5" dir="ltr">
                                                    <span className="font-sans inline-block">{minTotalCost === maxTotalCost ? maxTotalCost.toLocaleString('en-US') : `${minTotalCost.toLocaleString('en-US')} - ${maxTotalCost.toLocaleString('en-US')}`}</span> د.ع
                                                </span>
                                            </div>

                                            <div className={`p-2.5 rounded-2xl border flex flex-col justify-center ${
                                                remMin >= 0 
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                                    : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                                            }`}>
                                                <div className="flex items-center gap-1 font-bold">
                                                    {remMin < 0 && <AlertTriangle size={13} />}
                                                    <span>📉 المتبقي للأشهر القادمة (من - إلى):</span>
                                                </div>
                                                <span className="font-black text-xs sm:text-sm mt-0.5" dir="ltr">
                                                    <span className="font-sans inline-block">{remMin === remMax ? remMax.toLocaleString('en-US') : `${remMin.toLocaleString('en-US')} - ${remMax.toLocaleString('en-US')}`}</span> د.ع
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Projects Grid for this month */}
                                {monthProjects.length === 0 ? (
                                    <div className="text-center py-6 glass rounded-2xl border border-dashed border-white/10 text-gray-500 text-xs">
                                        لا توجد مشاريع مربوطة في {formatMonthName(monthStr)}. اضغط على "إضافة" لجدولة أفكارك!
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {monthProjects.map((project) => {
                                            const priorityInfo = PRIORITY_LABELS[project.priority || 'MEDIUM'];
                                            const min = parseFloat(project.costMin !== undefined ? project.costMin : (project.estimatedCost || 0));
                                            const max = parseFloat(project.costMax !== undefined ? project.costMax : (project.estimatedCost || 0));
                                            const isCompleted = project.status === 'COMPLETED';

                                            return (
                                                <motion.div
                                                    key={project.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`glass p-4 sm:p-5 rounded-3xl border transition-all space-y-4 relative group ${
                                                        isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <button
                                                                onClick={() => handleToggleCompleteClick(project)}
                                                                className={`mt-1 p-2.5 rounded-2xl border transition-all shrink-0 active:scale-95 ${
                                                                    isCompleted
                                                                        ? 'bg-green-500 text-black border-green-400 shadow-lg shadow-green-500/20'
                                                                        : 'glass border-white/20 text-gray-400 hover:text-white hover:border-primary'
                                                                }`}
                                                                title={isCompleted ? 'إعادة كمخطط' : 'تحديد كمكتمل وتأكيد التكلفة'}
                                                            >
                                                                <Check size={18} strokeWidth={3} />
                                                            </button>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className={`font-black text-base leading-snug break-words ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                                                                    {project.name}
                                                                </h3>
                                                                {project.description && (
                                                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed break-words">{project.description}</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <button
                                                                onClick={() => handleEdit(project)}
                                                                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(project.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Priority Badge, Month Selector & Range Cost Footer */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 flex-wrap gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${priorityInfo.color}`}>
                                                                <span>{priorityInfo.icon}</span>
                                                                <span>{priorityInfo.label}</span>
                                                            </span>

                                                            <div className="relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass border border-white/10 hover:border-primary transition-all text-xs font-bold text-purple-300 cursor-pointer overflow-hidden max-w-[140px]">
                                                                <Clock size={13} className="text-purple-400 shrink-0" />
                                                                <span dir="ltr" className="truncate">
                                                                    {project.targetMonth ? formatMonthName(project.targetMonth).replace(' 20', ' \'') : '+ Set Month'}
                                                                </span>
                                                                <input
                                                                    type="month"
                                                                    value={project.targetMonth || ''}
                                                                    onChange={(e) => handleQuickMonthChange(project, e.target.value)}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                                    title="تغيير أو ربط الشهر"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 bg-black/30 px-3.5 py-1.5 rounded-2xl border border-white/5">
                                                            <DollarSign size={15} className="text-primary shrink-0" />
                                                            <span className="text-xs sm:text-sm font-black text-white" dir="ltr">
                                                                <span className="font-sans inline-block">{min === max ? max.toLocaleString('en-US') : `${min.toLocaleString('en-US')} - ${max.toLocaleString('en-US')}`}</span>
                                                                <span className="text-[10px] font-normal text-gray-400 ml-1">د.ع</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* End of Months: PDF Export Banner */}
            <div className="pt-8 pb-4">
                <div className="glass p-6 sm:p-8 rounded-[2.5rem] border border-purple-500/30 text-center relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-black/40 to-primary/20 space-y-4 shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
                        <FileText size={32} />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white">تصدير تقرير المشاريع والخطط PDF</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            احصل على تقرير مالي محترف بتصميم أنيق يوثق نطاق التكاليف والمتبقي المالي لكل شهر.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="bg-purple-500 hover:bg-purple-400 text-black font-black px-6 sm:px-8 py-4 rounded-2xl inline-flex items-center gap-2 transition-all shadow-xl shadow-purple-500/20 text-xs sm:text-sm active:scale-95"
                    >
                        <Printer size={18} />
                        استعراض وتصدير التقرير PDF
                    </button>
                </div>
            </div>

            {/* Modal: Add/Edit Project */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark border border-white/10 w-full max-w-lg p-5 sm:p-8 rounded-[2.5rem] shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                    <Rocket className="text-primary" size={22} />
                                    {editingId ? 'تعديل بيانات المشروع' : 'إضافة مشروع مستقبلي'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 glass rounded-full opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProject} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم المشروع أو الفكرة <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="مثال: مشروع متجر أونلاين، شراء لابتوب..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">التكلفة من (الحد الأدنى - د.ع)</label>
                                        <AmountInput
                                            value={form.costMin}
                                            onChange={(e) => setForm({ ...form, costMin: e.target.value })}
                                            placeholder="مثال: 1000000"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">التكلفة إلى (الحد الأقصى - د.ع)</label>
                                        <AmountInput
                                            value={form.costMax}
                                            onChange={(e) => setForm({ ...form, costMax: e.target.value })}
                                            placeholder="مثال: 1500000"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">شهر التنفيذ المخطط له (اختياري)</label>
                                    <input
                                        type="month"
                                        value={form.targetMonth}
                                        onChange={(e) => setForm({ ...form, targetMonth: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">أهمية المشروع (الأولوية)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(PRIORITY_LABELS).map(([key, value]) => (
                                            <button
                                                type="button"
                                                key={key}
                                                onClick={() => setForm({ ...form, priority: key })}
                                                className={`p-3 rounded-2xl text-xs font-bold border flex flex-col items-center justify-center gap-1 transition-all ${
                                                    form.priority === key
                                                        ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20 scale-105'
                                                        : 'glass border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <span className="text-base">{value.icon}</span>
                                                <span>{value.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ملاحظات أو تفاصيل إضافية (اختياري)</label>
                                    <textarea
                                        rows="2"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="اكتب أي تفاصيل إضافية عن المشروع..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white text-sm focus:border-primary outline-none resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl bg-primary text-black font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Plus size={18} />
                                        {editingId ? 'حفظ التعديلات' : 'إضافة المشروع الآن'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 glass py-4 rounded-2xl font-bold opacity-70 hover:opacity-100 transition-all text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Confirm Final Actual Cost upon Completion */}
            <AnimatePresence>
                {completeModalProject && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark border border-green-500/40 w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative space-y-5 bg-gradient-to-b from-green-950/20 to-dark"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Check className="text-green-400" size={22} />
                                    إتمام تنفيذ المشروع بنجاح 🎉
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setCompleteModalProject(null)}
                                    className="p-2 glass rounded-full opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-white text-base">{completeModalProject.name}</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    الرجاء إدخال <strong>القيمة النهائية الفعلية</strong> التي تم صرفها لتنفيذ هذا المشروع لتعتمد رسمياً في الحسابات وتصفي النطاق التقديري:
                                </p>
                            </div>

                            <form onSubmit={handleConfirmCompletion} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-green-400 mb-1.5">القيمة النهائية الفعلية للتنفيذ (د.ع)</label>
                                    <AmountInput
                                        value={finalCostInput}
                                        onChange={(e) => setFinalCostInput(e.target.value)}
                                        placeholder="ادخل المبلغ النهائي..."
                                        className="w-full bg-black/60 border border-green-500/40 rounded-2xl p-4 text-white font-black focus:border-green-400 outline-none text-base text-left"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl bg-green-500 text-black font-black hover:opacity-90 transition-all shadow-lg shadow-green-500/20 text-sm flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Check size={18} />
                                        تأكيد الإتمام وحفظ التكلفة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCompleteModalProject(null)}
                                        className="flex-1 glass py-4 rounded-2xl font-bold opacity-70 hover:opacity-100 transition-all text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Customize Specific Month Addition */}
            <AnimatePresence>
                {customMonthModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Edit3 className="text-amber-400" size={20} />
                                    تخصيص إضافة {formatMonthName(customMonthModal.monthStr)}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setCustomMonthModal(null)}
                                    className="p-2 glass rounded-full opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                يمكنك تغيير مبلغ الادخار المضاف لميزانية المشاريع في هذا الشهر فقط. إذا كان شهر بدون ميزانية، اضغط على زر "جعلها 0 د.ع".
                            </p>

                            <form onSubmit={handleSaveCustomMonthAddition} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">الإضافة المخصصة لهذا الشهر (د.ع)</label>
                                    <AmountInput
                                        value={customMonthModal.amount}
                                        onChange={(e) => setCustomMonthModal({ ...customMonthModal, amount: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomMonthModal({ ...customMonthModal, amount: 0 })}
                                        className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all"
                                    >
                                        🚫 جعلها 0 د.ع
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleResetCustomMonthAddition(customMonthModal.monthStr)}
                                        className="p-3 rounded-2xl glass text-gray-300 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                                    >
                                        🔄 للافتراضي
                                    </button>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl bg-primary text-black font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Check size={18} />
                                        حفظ التخصيص
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomMonthModal(null)}
                                        className="flex-1 glass py-4 rounded-2xl font-bold opacity-70 hover:opacity-100 transition-all text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Link Unscheduled Project to Month */}
            <AnimatePresence>
                {linkModalMonth && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <LinkIcon className="text-purple-400" size={20} />
                                    ربط مشروع بشهر {formatMonthName(linkModalMonth)}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setLinkModalMonth(null)}
                                    className="p-2 glass rounded-full opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mb-4">اختر أحد مشاريعك غير المجدولة لربطه فوراً بهذا الشهر وخصم تكلفته من الميزانية المتوقعة:</p>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {unscheduledProjects.map(project => {
                                    const min = parseFloat(project.costMin !== undefined ? project.costMin : (project.estimatedCost || 0));
                                    const max = parseFloat(project.costMax !== undefined ? project.costMax : (project.estimatedCost || 0));

                                    return (
                                        <button
                                            key={project.id}
                                            onClick={async () => {
                                                await handleQuickMonthChange(project, linkModalMonth);
                                                setLinkModalMonth(null);
                                            }}
                                            className="w-full p-3.5 rounded-2xl glass hover:bg-primary/10 hover:border-primary/40 border border-white/10 flex items-center justify-between gap-3 text-right transition-all group/item active:scale-98"
                                        >
                                            <div className="truncate">
                                                <div className="font-bold text-sm text-white group-hover/item:text-primary transition-colors truncate">{project.name}</div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">تكلفة: <span dir="ltr" className="font-sans inline-block">{min === max ? max.toLocaleString('en-US') : `${min.toLocaleString('en-US')} - ${max.toLocaleString('en-US')}`}</span> د.ع</div>
                                            </div>
                                            <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-xl shrink-0">ربط ➕</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setLinkModalMonth(null)}
                                className="w-full mt-6 py-3.5 rounded-2xl glass font-bold text-gray-300 text-sm hover:bg-white/10 transition-all"
                            >
                                إغلاق
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Set Budget */}
            <AnimatePresence>
                {isBudgetModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-dark border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Settings className="text-primary" size={22} />
                                    ضبط ميزانية المشاريع
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsBudgetModalOpen(false)}
                                    className="p-2 glass rounded-full opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveBudget} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">رأس المال الحالي المخصص للمشاريع (د.ع)</label>
                                    <AmountInput
                                        value={budgetForm.startingCapital}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, startingCapital: e.target.value })}
                                        placeholder="مثال: 5000000"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">المبلغ المتاح حالياً الذي تستطيع الصرف منه على مشاريعك القادمة.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">الإضافة الافتراضية الشهرية (د.ع)</label>
                                    <AmountInput
                                        value={budgetForm.monthlyAddition}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, monthlyAddition: e.target.value })}
                                        placeholder="مثال: 1000000"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white font-bold focus:border-primary outline-none text-sm text-left"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">المبلغ الافتراضي الذي تخطط لادخاره وإضافته للميزانية كل شهر.</p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 rounded-2xl bg-primary text-black font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <Check size={18} />
                                        حفظ الميزانية
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsBudgetModalOpen(false)}
                                        className="flex-1 glass py-4 rounded-2xl font-bold opacity-70 hover:opacity-100 transition-all text-sm active:scale-95"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: PDF Report Preview & Print */}
            <AnimatePresence>
                {isReportModalOpen && (
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
                                        <span>معاينة تقرير المشاريع والخطط قبل التصدير</span>
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-1">اختر "طباعة وحفظ كملف PDF" ليقوم المتصفح بتوليد ملف المستند الاحترافي.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isDownloading}
                                        className="bg-purple-500 hover:bg-purple-400 text-black font-black px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-purple-500/20 text-xs sm:text-sm active:scale-95 flex-1 sm:flex-initial"
                                    >
                                        <Download size={18} />
                                        <span>{isDownloading ? 'جاري التحميل...' : '📥 تحميل ملف PDF مباشر'}</span>
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="glass px-4 py-3.5 rounded-2xl font-bold text-purple-300 hover:text-white transition-all text-xs sm:text-sm active:scale-95 hidden sm:flex items-center gap-1"
                                        title="طباعة تقليدية"
                                    >
                                        <Printer size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsReportModalOpen(false)}
                                        className="glass px-5 py-3.5 rounded-2xl font-bold text-gray-300 hover:text-white transition-all text-xs sm:text-sm active:scale-95"
                                    >
                                        إغلاق
                                    </button>
                                </div>
                            </div>

                            {/* Printable Report Content */}
                            <div id="printable-future-report" className="space-y-6 sm:space-y-8 bg-slate-900 sm:p-4 rounded-2xl text-white">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 pb-6 gap-4">
                                    <div>
                                        <h1 className="text-xl sm:text-3xl font-black text-white flex items-center gap-2">
                                            <span>🚀</span> التقرير المالي للخطط والمشاريع المستقبلية
                                        </h1>
                                        <p className="text-gray-300 text-xs sm:text-sm mt-1">المساعد المالي الذكي - توثيق المحاكاة التراكمية وتكاليف المشاريع</p>
                                    </div>
                                    <div className="text-left bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-mono text-gray-300 w-full sm:w-auto">
                                        <div>تاريخ التصدير: <span dir="ltr" className="font-sans font-bold">{new Date().toLocaleDateString('en-GB')}</span></div>
                                        <div>إجمالي المشاريع: <span dir="ltr" className="font-sans font-bold">{projects.length}</span></div>
                                    </div>
                                </div>

                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block">رأس المال الأساسي</span>
                                        <span className="text-base sm:text-lg font-black text-white mt-1 block"><span dir="ltr" className="font-sans">{parseFloat(budgetSettings.startingCapital || 0).toLocaleString('en-US')}</span> د.ع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block">الادخار الشهري</span>
                                        <span className="text-base sm:text-lg font-black text-green-400 mt-1 block">+<span dir="ltr" className="font-sans">{defaultMonthlyAddition.toLocaleString('en-US')}</span> د.ع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block">المشاريع المنجزة</span>
                                        <span className="text-base sm:text-lg font-black text-primary mt-1 block"><span dir="ltr" className="font-sans">{projects.filter(p => p.status === 'COMPLETED').length}</span> مشروع</span>
                                    </div>
                                    <div className="print-card glass p-4 rounded-2xl border border-white/10">
                                        <span className="text-xs text-gray-400 block">إجمالي تكاليف المشاريع</span>
                                        <span className="text-sm sm:text-base font-black text-purple-300 mt-1 block" dir="ltr">
                                            <span className="font-sans">{totalMinCost === totalMaxCost ? totalMaxCost.toLocaleString('en-US') : `${totalMinCost.toLocaleString('en-US')} - ${totalMaxCost.toLocaleString('en-US')}`}</span> د.ع
                                        </span>
                                    </div>
                                </div>

                                {/* Table 1: Monthly Compounding Forecast Table */}
                                <div className="space-y-3">
                                    <h3 className="text-base sm:text-lg font-black text-white border-r-4 border-primary pr-3">
                                        📅 أولاً: التوقعات والسيولة المالية الشهرية المتبقية من السنة
                                    </h3>
                                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                                        <table className="w-full text-xs sm:text-sm text-right">
                                            <thead className="bg-white/10 text-white font-black text-xs">
                                                <tr>
                                                    <th className="p-3 whitespace-nowrap">الشهر</th>
                                                    <th className="p-3 whitespace-nowrap">المتوقع توفره</th>
                                                    <th className="p-3 whitespace-nowrap">الإضافة</th>
                                                    <th className="p-3 whitespace-nowrap">تكلفة مشاريع الشهر</th>
                                                    <th className="p-3 whitespace-nowrap">المتبقي للأشهر القادمة (من - إلى)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10 font-bold text-gray-200">
                                                {monthlyForecastData.map(row => (
                                                    <tr key={row.monthStr} className="hover:bg-white/5">
                                                        <td className="p-3 font-black text-white whitespace-nowrap" dir="ltr">{row.monthName}</td>
                                                        <td className="p-3 whitespace-nowrap" dir="ltr">
                                                            <span className="font-sans">{row.expAvailMin === row.expAvailMax ? row.expAvailMax.toLocaleString('en-US') : `${row.expAvailMin.toLocaleString('en-US')} - ${row.expAvailMax.toLocaleString('en-US')}`}</span> د.ع
                                                        </td>
                                                        <td className="p-3 text-green-400 whitespace-nowrap" dir="ltr">
                                                            {row.addition === 0 ? '0 (بدون إضافة)' : <span className="font-sans">+{row.addition.toLocaleString('en-US')} د.ع</span>}
                                                        </td>
                                                        <td className="p-3 text-purple-300 whitespace-nowrap" dir="ltr">
                                                            <span className="font-sans">{row.minCost === row.maxCost ? row.maxCost.toLocaleString('en-US') : `${row.minCost.toLocaleString('en-US')} - ${row.maxCost.toLocaleString('en-US')}`}</span> د.ع
                                                        </td>
                                                        <td className={`p-3 font-black whitespace-nowrap ${row.remMin >= 0 ? 'text-green-400' : 'text-red-400'}`} dir="ltr">
                                                            <span className="font-sans">{row.remMin === row.remMax ? row.remMax.toLocaleString('en-US') : `${row.remMin.toLocaleString('en-US')} - ${row.remMax.toLocaleString('en-US')}`}</span> د.ع
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Table 2: Detailed Projects List */}
                                <div className="space-y-3 pt-4">
                                    <h3 className="text-base sm:text-lg font-black text-white border-r-4 border-purple-400 pr-3">
                                        ⚡ ثانياً: قائمة المشاريع والخطط المجدولة وغير المجدولة
                                    </h3>
                                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                                        <table className="w-full text-xs sm:text-sm text-right">
                                            <thead className="bg-white/10 text-white font-black text-xs">
                                                <tr>
                                                    <th className="p-3 whitespace-nowrap">اسم المشروع</th>
                                                    <th className="p-3 whitespace-nowrap">شهر التنفيذ</th>
                                                    <th className="p-3 whitespace-nowrap">الأولوية</th>
                                                    <th className="p-3 whitespace-nowrap">التكلفة المقدرة / الفعلية</th>
                                                    <th className="p-3 whitespace-nowrap">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/10 font-bold text-gray-200">
                                                {projects.map(project => {
                                                    const priorityInfo = PRIORITY_LABELS[project.priority || 'MEDIUM'];
                                                    const min = parseFloat(project.costMin !== undefined ? project.costMin : (project.estimatedCost || 0));
                                                    const max = parseFloat(project.costMax !== undefined ? project.costMax : (project.estimatedCost || 0));
                                                    const isCompleted = project.status === 'COMPLETED';

                                                    return (
                                                        <tr key={project.id} className={isCompleted ? 'bg-green-500/5 opacity-80' : 'hover:bg-white/5'}>
                                                            <td className={`p-3 font-black text-white ${isCompleted ? 'line-through' : ''}`}>
                                                                {project.name}
                                                                {project.description && <div className="text-[11px] font-normal text-gray-400 mt-0.5">{project.description}</div>}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap" dir="ltr">
                                                                {project.targetMonth ? formatMonthName(project.targetMonth) : '📦 Unscheduled'}
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span>{priorityInfo.icon}</span>
                                                                    <span>{priorityInfo.label}</span>
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-primary whitespace-nowrap" dir="ltr">
                                                                <span className="font-sans">{min === max ? max.toLocaleString('en-US') : `${min.toLocaleString('en-US')} - ${max.toLocaleString('en-US')}`}</span> د.ع
                                                            </td>
                                                            <td className="p-3 whitespace-nowrap">
                                                                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-300'}`}>
                                                                    {isCompleted ? '✅ مكتمل بالتكلفة الفعلية' : '⏳ مخطط له'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="text-center pt-6 text-xs text-gray-400 border-t border-white/10">
                                    تم إنشاء هذا التقرير تلقائياً بواسطة نظام الذكاء المالي للمشاريع المستقبلية.
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FuturePlanner;
