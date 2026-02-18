import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Calendar, Clock, PieChart as PieIcon, TrendingUp, ChevronRight, ChevronLeft, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Statistics = () => {
    const [range, setRange] = useState('weekly'); // daily, weekly, monthly
    const [dailyData, setDailyData] = useState({ hourly: [], byCategory: [] });
    const [rangeData, setRangeData] = useState({ timeline: [], byCategory: [] });
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
            }
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoading(false);
        }
    };

    const currentByCat = (range === 'daily' ? dailyData.byCategory : rangeData.byCategory) || [];
    const totalSpent = currentByCat.reduce((acc, curr) => acc + curr.amount, 0);
    const topCategory = [...currentByCat].sort((a, b) => b.amount - a.amount)[0];

    return (
        <div className="pb-32 pt-8 px-5" dir="rtl">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-black">التحليلات</h1>
                <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10">
                    {['daily', 'weekly', 'monthly'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${range === r ? 'bg-primary text-black shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white'
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
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-5 rounded-[2rem] border border-white/5"
                        >
                            <p className="text-[10px] text-gray-400 font-bold mb-1 opacity-60">إجمالي المصاريف</p>
                            <h4 className="text-xl font-black text-white">{totalSpent.toLocaleString('en-US')} <span className="text-[10px] opacity-40">د.ع</span></h4>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-5 rounded-[2rem] border border-white/5"
                        >
                            <p className="text-[10px] text-gray-400 font-bold mb-1 opacity-60">أعلى فئة صرف</p>
                            <h4 className="text-lg font-black text-primary truncate">{topCategory?.name || '---'}</h4>
                        </motion.div>
                    </div>

                    {/* Main Trend Chart */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative"
                    >
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                                <TrendingUp size={24} className="text-primary" />
                                نبضات الصرف
                            </h3>
                            <p className="text-xs text-gray-500 mb-8">حركة السيولة خلال {range === 'weekly' ? 'الأيام السبعة الماضية' : 'الشهر الحالي'}</p>

                            <div className="h-64 w-full">
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
                        {/* Background Gradient */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
                    </motion.div>

                    {/* Category Breakdown */}
                    <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                            <PieIcon size={24} className="text-primary" />
                            أين تذهب أموالك؟
                        </h3>

                        {currentByCat.length > 0 ? (
                            <div className="space-y-6">
                                <div className="h-48 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={currentByCat}
                                                innerRadius={60}
                                                outerRadius={80}
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
                                <div className="grid grid-cols-1 gap-3">
                                    {currentByCat.map((item, index) => {
                                        const percent = ((item.amount / totalSpent) * 100).toFixed(0);
                                        return (
                                            <div key={item.name} className="flex items-center justify-between p-4 glass rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <div>
                                                        <h4 className="text-sm font-bold">{item.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{percent}% من الإجمالي</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-sm">{item.amount.toLocaleString('en-US')} د.ع</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 opacity-30">
                                <Info size={40} className="mx-auto mb-2" />
                                <p className="text-sm">لا توجد بيانات كافية للتحليل</p>
                            </div>
                        )}
                    </div>

                    {/* AI Insights Concept */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-6 rounded-[2.5rem] border border-primary/20 flex gap-4 items-center"
                    >
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/30">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-sm text-primary">نصيحة الذكاء الاصطناعي</h4>
                            <p className="text-xs text-white/70 leading-relaxed mt-1">
                                {totalSpent > 100000
                                    ? "صرفك على قسم الطعام ارتفع بنسبة 15٪ هذا الأسبوع. ربما تود تقليل الطلبات الخارجية!"
                                    : "أنت تقوم بعمل رائع في التوفير هذا الأسبوع! استمر على هذا المنوال."}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Statistics;
