import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, CreditCard, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Cards = () => {
    const [cards, setCards] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [cardToDelete, setCardToDelete] = useState(null);
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
            const res = await api.deleteCard(cardToDelete.id);
            if (res.data === false) {
                alert("لا يمكن حذف آخر محفظة!");
            } else {
                fetchCards();
            }
            setIsDeleting(false);
            setCardToDelete(null);
        } catch (error) {
            console.error("Error deleting card", error);
        }
    };

    return (
        <div className="px-5 pt-8 pb-32" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black">المحافظ</h1>
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
                            className="rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden h-56 flex flex-col justify-between group border border-white/20 active:scale-[0.98] transition-all"
                            style={{ background: card.style || GRADIENTS[0] }}
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <CreditCard size={32} className="text-white" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditForm(card);
                                            setIsEditing(true);
                                        }}
                                        className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-md"
                                    >
                                        <Edit2 size={20} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCardToDelete(card);
                                            setIsDeleting(true);
                                        }}
                                        className="p-3 bg-red-500/20 rounded-2xl hover:bg-red-500/40 transition-colors backdrop-blur-md text-white"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-white/80 text-sm font-bold">{card.name}</h3>
                                    {card.isBudgeted && (
                                        <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                            يؤثر في الميزانية
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter">
                                    {card.balance.toLocaleString()} <span className="text-sm opacity-60">د.ع</span>
                                </h2>
                            </div>

                            {/* Abstract Design Elements */}
                            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                            <div className="absolute top-1/2 left-1/4 w-px h-1/2 bg-gradient-to-b from-white/20 to-transparent rotate-45 transform origin-top"></div>
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
        </div>
    );
};

export default Cards;
