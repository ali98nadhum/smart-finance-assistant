import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, Users, CheckCircle, Clock, ChevronDown, ChevronUp, Wallet, ArrowRight, Landmark, Edit2, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const Debts = () => {
    const [debts, setDebts] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [storeForm, setStoreForm] = useState({ amount: '', type: 'SET', debtId: null });
    const [isAdjustingStore, setIsAdjustingStore] = useState(false);
    const [newDebt, setNewDebt] = useState({ amount: '', personName: '', type: 'OWED_BY_ME', notes: '' });
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editedNote, setEditedNote] = useState('');
    const [view, setView] = useState('ACTIVE'); // 'ACTIVE' or 'ARCHIVED'

    const VIEWS = [
        { id: 'ACTIVE', label: 'الديون النشطة' },
        { id: 'ARCHIVED', label: 'الأرشيف' }
    ];

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const res = await api.getDebts();
            setDebts(res.data);
        } catch (error) {
            console.error("Error fetching debts", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createDebt({ ...newDebt, amount: parseFloat(newDebt.amount) });
            setIsAdding(false);
            setNewDebt({ amount: '', personName: '', type: 'OWED_BY_ME', notes: '' });
            fetchDebts();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (error) {
            console.error("Error creating debt", error);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        if (!storeForm.amount || !storeForm.debtId) return;
        try {
            await api.storeAmount(storeForm.debtId, parseFloat(storeForm.amount), storeForm.type);
            setIsAdjustingStore(false);
            setStoreForm({ amount: '', type: 'SET', debtId: null });
            fetchDebts();
            confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 }, colors: ['#f59e0b'] });
        } catch (error) {
            console.error("Error updating store amount", error);
        }
    };

    const handleAddPayment = async (debtId) => {
        if (!paymentAmount) return;
        try {
            await api.addPayment({ debtId, amount: parseFloat(paymentAmount) });
            setPaymentAmount('');
            fetchDebts();
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#3b82f6', '#10b981'] });
        } catch (error) {
            console.error("Error adding payment", error);
        }
    };

    const handleUpdateNote = async (debtId) => {
        try {
            await api.updateDebt(debtId, { notes: editedNote });
            setEditingNoteId(null);
            fetchDebts();
        } catch (error) {
            console.error("Error updating note", error);
        }
    };

    const handleArchive = async (debtId) => {
        try {
            await api.archiveDebt(debtId);
            fetchDebts();
        } catch (error) {
            console.error("Error archiving debt", error);
        }
    };

    const calculateTotalPaid = (payments) => {
        return payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    };

    return (
        <div className="pb-32 pt-8 px-6 animate-fade-in" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">الديون والالتزامات</h1>
                <button onClick={() => setIsAdding(true)} className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 transition-transform active:scale-95">
                    <Plus size={24} />
                </button>
            </div>

            {/* View Tabs */}
            <div className="flex gap-4 mb-8">
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

            <div className="space-y-6">
                {debts.filter(d => view === 'ARCHIVED' ? d.isArchived : !d.isArchived).length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Wallet size={48} className="mx-auto mb-4" />
                        <p>{view === 'ARCHIVED' ? 'لا توجد ديون مؤرشفة' : 'لا توجد ديون نشطة'}</p>
                    </div>
                ) : (
                    debts
                        .filter(d => view === 'ARCHIVED' ? d.isArchived : !d.isArchived)
                        .map((debt) => {
                            const paid = calculateTotalPaid(debt.payments);
                            const remaining = debt.amount - paid;
                            const percentage = Math.min((paid / debt.amount) * 100, 100);
                            const isExpanded = expandedId === debt.id;

                            return (
                                <motion.div
                                    layout
                                    key={debt.id}
                                    className={`glass rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/20 bg-white/5' : ''}`}
                                >
                                    <div
                                        className="p-6 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : debt.id)}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-4 rounded-3xl ${debt.type === 'OWED_BY_ME' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl">{debt.personName}</h4>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {debt.type === 'OWED_BY_ME' ? 'أنا مدين له' : 'هو مدين لي'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-xl">{debt.amount.toLocaleString('en-US')} د.ع</p>
                                                <div className="flex items-center gap-1 justify-end mt-1">
                                                    {debt.status === 'PAID' ? (
                                                        <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                                            <CheckCircle size={10} /> تم التسديد
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                                                            <Clock size={10} /> متبقي: {remaining.toLocaleString('en-US')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <div className="flex gap-3">
                                                    <span className="text-primary">{percentage.toFixed(0)}% مكتمل</span>
                                                    {debt.storedAmount > 0 && (
                                                        <span className="text-yellow-500 flex items-center gap-1">
                                                            <Landmark size={10} /> مخزون: {debt.storedAmount.toLocaleString('en-US')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-gray-500">{paid.toLocaleString('en-US')} من {debt.amount.toLocaleString('en-US')} د.ع</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                                <div
                                                    className={`h-full absolute left-0 transition-all duration-1000 ${debt.type === 'OWED_BY_ME' ? 'bg-red-500' : 'bg-green-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-center text-gray-500">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-6 pb-6 pt-2 border-t border-white/5 bg-white/5 space-y-4"
                                            >
                                                {/* Debt Summary */}
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="glass p-3 rounded-2xl text-center">
                                                        <p className="text-[10px] text-gray-500">المبلغ الكلي</p>
                                                        <p className="font-bold">{debt.amount.toLocaleString('en-US')}</p>
                                                    </div>
                                                    <div className="glass p-3 rounded-2xl text-center border-yellow-500/20">
                                                        <p className="text-[10px] text-yellow-500">المبلغ المخزون</p>
                                                        <p className="font-bold text-yellow-500">{debt.storedAmount?.toLocaleString('en-US') || 0}</p>
                                                    </div>
                                                </div>

                                                {/* Notes Section */}
                                                <div className="glass p-4 rounded-2xl border border-white/5 relative group/note">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h5 className="text-xs font-bold text-gray-400">ملاحظات</h5>
                                                        {editingNoteId !== debt.id ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingNoteId(debt.id);
                                                                    setEditedNote(debt.notes || '');
                                                                }}
                                                                className="p-1 text-gray-500 hover:text-primary transition-colors opacity-0 group-hover/note:opacity-100"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateNote(debt.id)}
                                                                    className="text-green-500 hover:text-green-400"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingNoteId(null)}
                                                                    className="text-red-500 hover:text-red-400"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {editingNoteId === debt.id ? (
                                                        <textarea
                                                            className="w-full bg-white/5 p-2 rounded-xl outline-none font-medium text-sm border border-white/10 focus:border-primary/50 transition-colors resize-none"
                                                            rows="3"
                                                            value={editedNote}
                                                            onChange={(e) => setEditedNote(e.target.value)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <p className={`text-sm leading-relaxed font-medium ${debt.notes ? 'text-gray-200' : 'text-gray-600 italic'}`}>
                                                            {debt.notes || 'لا توجد ملاحظات...'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions Section */}
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleArchive(debt.id);
                                                        }}
                                                        className={`flex-1 p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${debt.isArchived ? 'bg-green-500/10 text-green-500' : 'glass text-gray-400 hover:text-white'}`}
                                                    >
                                                        <ArrowRight size={18} className={debt.isArchived ? 'rotate-180' : ''} />
                                                        {debt.isArchived ? 'إلغاء الأرشفة' : 'أرشفة الدين'}
                                                    </button>
                                                </div>

                                                {/* Payment History */}
                                                <div className="space-y-3">
                                                    <h5 className="text-xs font-bold text-gray-400">سجل الدفعات</h5>
                                                    {debt.payments?.length === 0 ? (
                                                        <p className="text-[10px] text-gray-600 text-center py-2">لا توجد دفعات مسجلة</p>
                                                    ) : (
                                                        debt.payments.map((p, i) => (
                                                            <div key={p.id} className="flex justify-between items-center text-xs p-3 glass rounded-xl border border-white/5">
                                                                <span className="font-bold text-primary">الدفعة #{debt.payments.length - i}</span>
                                                                <span className="font-black">{p.amount.toLocaleString('en-US')} د.ع</span>
                                                                <span className="text-[10px] text-gray-500">{new Date(p.createdAt).toLocaleDateString('en-US')}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Payment Action */}
                                                {debt.status !== 'PAID' && (
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="مبلغ الدفعة"
                                                                className="flex-1 glass p-4 rounded-2xl outline-none text-sm font-bold"
                                                                value={paymentAmount}
                                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => handleAddPayment(debt.id)}
                                                                className="bg-primary px-6 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                                                            >
                                                                تسديد
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                setStoreForm({ amount: '', type: 'SET', debtId: debt.id });
                                                                setIsAdjustingStore(true);
                                                            }}
                                                            className="w-full glass p-4 rounded-2xl text-yellow-500 font-bold text-sm border-yellow-500/20 hover:bg-yellow-500/10 transition-colors"
                                                        >
                                                            تعديل المبلغ المخزون للدين
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-dark-lighter w-full p-8 rounded-t-[3rem] shadow-2xl border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <h3 className="text-2xl font-black mb-8">تسجيل دين جديد</h3>
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setNewDebt({ ...newDebt, type: 'OWED_BY_ME' })} className={`flex-1 p-4 rounded-2xl font-bold transition-all ${newDebt.type === 'OWED_BY_ME' ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'glass border border-white/5 opacity-50'}`}>أنا مدين</button>
                                    <button type="button" onClick={() => setNewDebt({ ...newDebt, type: 'OWED_TO_ME' })} className={`flex-1 p-4 rounded-2xl font-bold transition-all ${newDebt.type === 'OWED_TO_ME' ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'glass border border-white/5 opacity-50'}`}>أنا دائن</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="glass p-4 rounded-2xl border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2">اسم الشخص</label>
                                        <input type="text" className="w-full bg-transparent outline-none font-bold" placeholder="مثال: علي محمد" value={newDebt.personName} onChange={(e) => setNewDebt({ ...newDebt, personName: e.target.value })} required />
                                    </div>
                                    <div className="glass p-4 rounded-2xl border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2">المبلغ الإجمالي (د.ع)</label>
                                        <input type="number" className="w-full bg-transparent text-2xl font-bold outline-none" placeholder="0" value={newDebt.amount} onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })} required />
                                    </div>
                                    <div className="glass p-4 rounded-2xl border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2">ملاحظات (اختياري)</label>
                                        <textarea
                                            className="w-full bg-transparent outline-none font-bold text-sm resize-none"
                                            placeholder="أضف أي تفاصيل إضافية هنا..."
                                            rows="3"
                                            value={newDebt.notes}
                                            onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="submit" className="flex-[2] bg-primary p-5 rounded-3xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-transform">حفظ الدين</button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Store Amount Adjustment Modal */}
            <AnimatePresence>
                {isAdjustingStore && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-6" dir="rtl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-8 rounded-[2rem] border border-white/10"
                        >
                            <h3 className="text-xl font-bold mb-6 text-center">إدارة المبلغ المخزون للدين</h3>
                            <div className="space-y-4 text-right">
                                <div className="flex gap-2 mb-4">
                                    {['SET', 'INCREMENT', 'DECREMENT'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setStoreForm({ ...storeForm, type })}
                                            className={`flex-1 p-2 rounded-xl text-[10px] font-bold transition-all ${storeForm.type === type ? 'bg-yellow-500 text-black' : 'glass opacity-50'}`}
                                        >
                                            {type === 'SET' ? 'تحديد' : type === 'INCREMENT' ? 'إضافة' : 'سحب'}
                                        </button>
                                    ))}
                                </div>
                                <div className="glass p-4 rounded-2xl border border-white/5">
                                    <label className="text-xs text-gray-500 block mb-1">المبلغ (د.ع)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-2xl font-black focus:outline-none"
                                        placeholder="0"
                                        value={storeForm.amount}
                                        onChange={(e) => setStoreForm({ ...storeForm, amount: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleUpdateStore}
                                        className="flex-[2] bg-yellow-500 text-black p-4 rounded-2xl font-bold shadow-lg shadow-yellow-500/20"
                                    >
                                        تأكيد
                                    </button>
                                    <button
                                        onClick={() => setIsAdjustingStore(false)}
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
        </div>
    );
};

export default Debts;
