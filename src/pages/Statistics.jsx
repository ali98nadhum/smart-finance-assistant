import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Calendar, Clock, PieChart as PieIcon, TrendingUp, ChevronRight, ChevronLeft, Zap, Info, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Statistics = () => {
    const [range, setRange] = useState('monthly'); // daily, weekly, monthly
    const [dailyData, setDailyData] = useState({ hourly: [], byCategory: [] });
    const [rangeData, setRangeData] = useState({ timeline: [], byCategory: [] });
    const [statsInsights, setStatsInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [range]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (range === 'daily') {
                const res = await api.getDailyStats();
                setDailyData(res.data);
            } else {
                const res = await api.getRangeStats(range);
                setRangeData(res.data);

                // Fetch dynamic insights
                const insightsRes = await api.getStatsInsights(
                    range,
                    res.data.byCategory.reduce((acc, curr) => acc + curr.amount, 0),
                    res.data.byCategory,
                    res.data.timeline
                );
                setStatsInsights(insightsRes.data);
            }
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoading(false);
        }
    };

    const currentByCat = [...((range === 'daily' ? dailyData.byCategory : rangeData.byCategory) || [])].sort((a, b) => b.amount - a.amount);
    const totalSpent = currentByCat.reduce((acc, curr) => acc + curr.amount, 0);
    const topCategory = currentByCat[0];

    // Arabic Month Name
    const currentMonthName = new Intl.DateTimeFormat('ar-IQ', { month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="pb-32 pt-6 px-4 max-w-4xl mx-auto overflow-x-hidden" dir="rtl">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                        <span>📊</span> التحليلات والإحصائيات
                    </h1>
                    <p className="text-gray-400 text-xs mt-1">تتبع حركة أموالك والأقسام الأكثر صرفاً بوضوح وسهولة ✨</p>
                </div>

                <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 w-full sm:w-auto justify-between sm:justify-end">
                    {['daily', 'weekly', 'monthly'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 rounded-xl text-xs font-black transition-all ${range === r ? 'bg-primary text-black shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {r === 'daily' ? 'اليوم' : r === 'weekly' ? 'الأسبوع' : 'الشهر'}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-4 sm:p-5 rounded-[2rem] border border-white/5"
                        >
                            <p className="text-[10px] text-gray-400 font-bold mb-1 opacity-60 truncate">إجمالي المصاريف</p>
                            <h4 className="text-lg sm:text-xl font-black text-white truncate">{totalSpent.toLocaleString('en-US')} <span className="text-[10px] opacity-40">د.ع</span></h4>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-4 sm:p-5 rounded-[2rem] border border-white/5"
                        >
                            <p className="text-[10px] text-gray-400 font-bold mb-1 opacity-60 truncate">أعلى فئة صرف</p>
                            <h4 className="text-base sm:text-lg font-black text-primary truncate">{topCategory?.name || '---'}</h4>
                        </motion.div>
                    </div>

                    {/* Main Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative"
                    >
                        <div className="relative z-10">
                            <h3 className="text-lg sm:text-xl font-black mb-1 flex items-center gap-2">
                                <TrendingUp size={22} className="text-primary shrink-0" />
                                <span>نبضات الصرف</span>
                            </h3>
                            <p className="text-xs text-gray-500 mb-6 sm:mb-8 break-words">حركة السيولة خلال {range === 'weekly' ? 'الأيام السبعة الماضية' : `شهر ${currentMonthName}`}</p>

                            <div className="h-56 sm:h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={range === 'daily' ? [] : rangeData.timeline}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="rgba(255,255,255,0.2)"
                                            fontSize={8}
                                            tickFormatter={(val) => val.split('-').slice(2).join('/')}
                                            hide={range === 'daily'}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', direction: 'rtl' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#64748b', fontSize: '10px' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorAmt)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
                    </motion.div>

                    {/* Category Breakdown */}
                    <div className="glass p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <h3 className="text-lg sm:text-xl font-black mb-6 sm:mb-8 flex items-center gap-2.5">
                            <PieIcon size={22} className="text-primary shrink-0" />
                            <span>أين تذهب أموالك؟</span>
                        </h3>

                        {currentByCat.length > 0 ? (
                            <div className="space-y-6">
                                <div className="h-44 sm:h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={currentByCat}
                                                innerRadius={50}
                                                outerRadius={75}
                                                paddingAngle={10}
                                                dataKey="amount"
                                                stroke="none"
                                            >
                                                {currentByCat.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {currentByCat.map((item, index) => {
                                        const percent = ((item.amount / totalSpent) * 100).toFixed(0);
                                        return (
                                            <div key={item.name} className="flex items-center justify-between p-3.5 glass rounded-2xl border border-white/5 gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs sm:text-sm font-bold truncate">{item.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{percent}% من الإجمالي</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-xs sm:text-sm shrink-0">{item.amount.toLocaleString('en-US')} د.ع</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 opacity-30">
                                <Info size={36} className="mx-auto mb-2" />
                                <p className="text-xs sm:text-sm">لا توجد بيانات كافية للتحليل</p>
                            </div>
                        )}
                    </div>

                    {/* AI Insights Section */}
                    <div className="space-y-3 sm:space-y-4">
                        <AnimatePresence mode="wait">
                            {statsInsights.map((insight, idx) => (
                                <motion.div
                                    key={`${range}-${idx}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border flex gap-3.5 sm:gap-4 items-center ${insight.type === 'WARNING' ? 'bg-red-500/10 border-red-500/20' :
                                        insight.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/20' :
                                            'bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20'
                                        }`}
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-black shadow-lg shrink-0 ${insight.type === 'WARNING' ? 'bg-red-500 shadow-red-500/30' :
                                        insight.type === 'SUCCESS' ? 'bg-green-500 shadow-green-500/30' :
                                            'bg-primary shadow-primary/30'
                                        }`}>
                                        {insight.type === 'WARNING' ? <Info size={22} /> :
                                            insight.type === 'SUCCESS' ? <Trophy size={22} /> :
                                                <Zap size={22} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className={`font-black text-xs sm:text-sm truncate ${insight.type === 'WARNING' ? 'text-red-400' :
                                            insight.type === 'SUCCESS' ? 'text-green-400' :
                                                'text-primary'
                                            }`}>{insight.title}</h4>
                                        <p className="text-xs text-white/70 leading-relaxed mt-1 break-words">
                                            {insight.text}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Statistics;
