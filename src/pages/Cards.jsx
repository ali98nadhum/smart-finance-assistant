import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, CreditCard, Trash2, Edit2, Zap, TrendingUp, Sparkles, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomModal from '../components/CustomModal';
import { TopUpSuccess } from '../components/PaymentFeedback';

const Cards = () => {
    const [cards, setCards] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRecharging, setIsRecharging] = useState(false);
    const [showRechargeSuccess, setShowRechargeSuccess] = useState(false);
    const [lastCardError, setLastCardError] = useState(false);
    const [cardToDelete, setCardToDelete] = useState(null);
    const [cardToRecharge, setCardToRecharge] = useState(null);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [editForm, setEditForm] = useState(null);
    const [newCard, setNewCard] = useState({ name: '', balance: 0, isBudgeted: true });

    const GRADIENTS = [
        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    ];

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const res = await api.getCards();
            setCards(res.data);
        } catch (error) {
            console.error("Error fetching cards", error);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        try {
            const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
            await api.createCard({
                ...newCard,
                balance: parseFloat(newCard.balance || 0),
                style: randomGradient,
                isBudgeted: newCard.isBudgeted
            });
            setIsAdding(false);
            setNewCard({ name: '', balance: 0, isBudgeted: true });
            fetchCards();
        } catch (error) {
            console.error("Error adding card", error);
        }
    };

    const handleUpdateCard = async (e) => {
        e.preventDefault();
        try {
            await api.updateCard(editForm.id, {
                name: editForm.name,
                balance: parseFloat(editForm.balance),
                isBudgeted: editForm.isBudgeted
            });
            setIsEditing(false);
            setEditForm(null);
            fetchCards();
        } catch (error) {
            console.error("Error updating card", error);
        }
    };

    const confirmDelete = async () => {
        if (!cardToDelete) return;
        try {
            const success = await api.deleteCard(cardToDelete.id);
            if (success) {
                setIsDeleting(false);
                setCardToDelete(null);
                fetchCards();
            }
        } catch (error) {
            console.error("Error deleting card", error);
        }
    };

    const handleRecharge = async (e) => {
        e.preventDefault();
        try {
            await api.topUpCard(cardToRecharge.id, parseFloat(rechargeAmount));
            fetchCards();
            setIsRecharging(false);
            setShowRechargeSuccess(true);
        } catch (error) {
            console.error("Error recharging card", error);
        }
    };

    const ProfessionalCardDecor = () => (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-20%] right-[-10%] w-48 h-48 bg-black/20 rounded-full blur-2xl opacity-30" />
            <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );

    return (
        <div className="px-5 pt-8 pb-32" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-black">المحافظ</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </div>

            <div className="space-y-6">
                {cards.length === 0 ? (
                    <div className="text-center py-20 glass rounded-[2.5rem] opacity-30 border border-dashed border-white/10">
                        <CreditCard size={48} className="mx-auto mb-4" />
                        <p>لا توجد محافظ مضافة</p>
                    </div>
                ) : (
                    cards.map((card) => (
                        <motion.div
                            layout
                            key={card.id}
                            className="rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden h-56 flex flex-col justify-between group border border-white/10 active:scale-[0.98] transition-all"
                            style={{ background: card.style || GRADIENTS[0] }}
                        >
                            <ProfessionalCardDecor />

                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3.5 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg">
                                    <CreditCard size={24} className="text-white/80" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditForm(card);
                                            setIsEditing(true);
                                        }}
                                        className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-md border border-white/5 shadow-sm"
                                    >
                                        <Edit2 size={18} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCardToDelete(card);
                                            setIsDeleting(true);
                                        }}
                                        className="p-3 bg-red-500/10 rounded-2xl hover:bg-red-500/30 transition-colors backdrop-blur-md text-white border border-red-500/10 shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="text-white font-bold text-base tracking-wide opacity-90">{card.name}</h3>
                                    {card.isBudgeted && (
                                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">نشط</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mb-0.5">الرصيد الحالي</p>
                                        <h2 className="text-3xl font-black tracking-tight text-white line-clamp-1">
                                            {card.balance.toLocaleString('en-US')} <span className="text-xs font-medium opacity-30 text-white">د.ع</span>
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCardToRecharge(card);
                                            setIsRecharging(true);
                                        }}
                                        className="bg-white text-black px-5 py-2.5 rounded-[1.25rem] font-black text-xs shadow-xl active:scale-95 transition-all hover:bg-gray-100"
                                    >
                                        شحن الرصيد
                                    </button>
                                </div>
                            </div>

                            {/* Samarra-style spiral light effects */}
                            <div className="absolute top-[-30%] right-[-15%] w-72 h-72 bg-white/10 rounded-full blur-[90px] pointer-events-none"></div>
                            <div className="absolute bottom-[-10%] right-1/4 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Modal */}
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
                            <h3 className="text-2xl font-black mb-8 text-right">محفظة جديدة</h3>
                            <form onSubmit={handleAddCard} className="space-y-6">
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">اسم المحفظة</label>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                        placeholder="مثال: زين كاش، التجاري..."
                                        value={newCard.name}
                                        onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">الرصيد الافتتاحي</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent outline-none font-bold text-3xl text-right"
                                        placeholder="0"
                                        value={newCard.balance}
                                        onChange={(e) => setNewCard({ ...newCard, balance: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                                    <span className="text-sm font-bold opacity-60">تتبع في الميزانية اليومية</span>
                                    <button
                                        type="button"
                                        onClick={() => setNewCard({ ...newCard, isBudgeted: !newCard.isBudgeted })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${newCard.isBudgeted ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${newCard.isBudgeted ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-[2] bg-primary p-5 rounded-3xl font-black shadow-xl shadow-primary/20">تأكيد الحفظ</button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && editForm && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-dark-lighter w-full p-8 rounded-t-[3rem] shadow-2xl border-t border-white/10"
                        >
                            <h3 className="text-2xl font-black mb-8 text-right">تعديل المحفظة</h3>
                            <form onSubmit={handleUpdateCard} className="space-y-6">
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">الاسم الجديد</label>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent outline-none font-bold text-xl text-right"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">الرصيد الحالي</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent outline-none font-bold text-3xl text-right"
                                        value={editForm.balance}
                                        onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                                    <span className="text-sm font-bold opacity-60">تتبع في الميزانية اليومية</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditForm({ ...editForm, isBudgeted: !editForm.isBudgeted })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${editForm.isBudgeted ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.isBudgeted ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-[2] bg-secondary p-5 rounded-3xl font-black shadow-xl">تحديث البيانات</button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleting && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass w-full max-w-sm p-8 rounded-[3rem] border border-white/10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black mb-2">هل أنت متأكد؟</h3>
                            <p className="text-gray-400 mb-8 text-sm">أنت على وشك حذف محفظة "{cardToDelete?.name}". لا يمكن التراجع عن هذا الإجراء.</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmDelete}
                                    className="w-full bg-red-500 p-5 rounded-2xl font-black shadow-xl shadow-red-500/20"
                                >
                                    نعم، احذف المحفظة
                                </button>
                                <button
                                    onClick={() => setIsDeleting(false)}
                                    className="w-full glass p-5 rounded-2xl font-bold opacity-50"
                                >
                                    تراجع
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Recharge Modal */}
            <AnimatePresence>
                {isRecharging && cardToRecharge && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] flex items-end">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="bg-dark-lighter w-full p-8 rounded-t-[3rem] shadow-2xl border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <h3 className="text-2xl font-black mb-2 text-right">شحن الرصيد</h3>
                            <p className="text-gray-500 text-sm mb-8 text-right">أنت تشحن بطاقة "{cardToRecharge.name}"</p>

                            <form onSubmit={handleRecharge} className="space-y-6">
                                <div className="glass p-5 rounded-[2rem] border border-white/5">
                                    <label className="block text-xs text-gray-500 mb-2 text-right">المبلغ المراد شحنه</label>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent outline-none font-bold text-4xl text-right text-primary"
                                        placeholder="0"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-[2] bg-primary p-5 rounded-3xl font-black shadow-xl shadow-primary/20 text-black">تأكيد الشحن</button>
                                    <button type="button" onClick={() => setIsRecharging(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TopUpSuccess
                isOpen={showRechargeSuccess}
                onClose={() => setShowRechargeSuccess(false)}
                amount={parseFloat(rechargeAmount)}
            />

            <CustomModal
                isOpen={lastCardError}
                onClose={() => setLastCardError(false)}
                title="تنبيه"
                message="لا يمكن حذف آخر محفظة! يجب أن يتوفر على الأقل محفظة واحدة في التطبيق."
                type="error"
            />
        </div>
    );
};

export default Cards;
