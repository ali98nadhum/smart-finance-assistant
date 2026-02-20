import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, Repeat, Calendar, Tag, ChevronDown, Download, Trash2, Smartphone, CreditCard, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomModal from '../components/CustomModal';
import { PaymentFailed } from '../components/PaymentFeedback';


const PaymentSuccess = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                >
                    <div className="text-center relative">
                        {/* POS Terminal */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-32 h-44 bg-gray-800 rounded-2xl mx-auto border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="h-2 w-16 bg-black rounded-full mx-auto mt-4 mb-8"></div>
                            <div className="w-24 h-16 bg-primary/20 rounded-lg mx-auto flex items-center justify-center border border-primary/20">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.2, 1] }}
                                    transition={{ delay: 1 }}
                                >
                                    <CheckCircle2 size={32} className="text-primary" />
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Credit Card Animation */}
                        <motion.div
                            initial={{ x: -150, y: -20, rotate: -30, opacity: 0 }}
                            animate={{ x: 0, y: -100, rotate: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute left-1/2 -translate-x-1/2 top-4 w-24 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-xl z-20"
                        >
                            <div className="w-6 h-4 bg-yellow-400/50 rounded-[2px] mt-4 ml-4"></div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="mt-8"
                        >
                            <h3 className="text-2xl font-black mb-2">تم الدفع بنجاح!</h3>
                            <p className="text-gray-400 text-sm">تم خصم المبلغ من بطاقتك</p>
                            <button
                                onClick={onClose}
                                className="mt-8 px-8 py-3 bg-primary text-black font-black rounded-2xl shadow-lg shadow-primary/20"
                            >
                                ممتاز
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [cards, setCards] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showFailed, setShowFailed] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, id: null });
    const [newTx, setNewTx] = useState({
        amount: '',
        description: '',
        type: 'EXPENSE',
        categoryId: '',
        cardId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isLoadMore = false) => {
        try {
            const currentPage = isLoadMore ? page + 1 : 1;
            const [txRes, cardRes, catRes] = await Promise.all([
                api.getTransactions(currentPage, 10),
                api.getCards(),
                api.getCategories()
            ]);

            if (isLoadMore) {
                setTransactions(prev => [...prev, ...txRes.data.transactions]);
                setPage(currentPage);
            } else {
                setTransactions(txRes.data.transactions);
                setPage(1);
            }

            setHasMore(txRes.data.hasMore);
            setCards(cardRes.data);
            setCategories(catRes.data);

            if (cardRes.data.length > 0 && !newTx.cardId) {
                setNewTx(prev => ({ ...prev, cardId: cardRes.data[0].id }));
            }
            if (catRes.data.length > 0 && !newTx.categoryId) {
                setNewTx(prev => ({ ...prev, categoryId: catRes.data[0].id }));
            }
        } catch (error) {
            console.error("Error fetching transactions", error);
        }
    };

    const handleAddTx = async (e) => {
        e.preventDefault();
        const amount = parseFloat(newTx.amount);
        const selectedCard = cards.find(c => c.id === newTx.cardId);

        // Balance Check for Expenses
        if (newTx.type === 'EXPENSE' && selectedCard && amount > selectedCard.balance) {
            setShowFailed(true);
            return;
        }

        try {
            await api.createTransaction({
                ...newTx,
                amount
            });
            setIsAdding(false);
            if (newTx.type === 'EXPENSE') {
                setShowSuccess(true);
            }
            setNewTx({
                amount: '',
                description: '',
                type: 'EXPENSE',
                categoryId: categories[0]?.id || '',
                cardId: cards[0]?.id || ''
            });
            fetchData();
        } catch (error) {
            console.error("Error adding transaction", error);
        }
    };

    const handleDeleteTx = (id) => {
        if (!id) return;
        setModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!modal.id) return;
        try {
            const success = await api.deleteTransaction(modal.id);
            if (success) {
                setModal({ isOpen: false, id: null });
                // Reset to first page and refresh list
                setPage(1);
                fetchData(false);
            }
        } catch (error) {
            console.error("Error deleting transaction", error);
        }
    };

    const exportToCSV = () => {
        const headers = ["التاريخ", "الوصف", "المبلغ", "القسم", "البطاقة", "النوع"];
        const rows = transactions.map(tx => [
            new Date(tx.date).toLocaleDateString('en-US'),
            tx.description,
            tx.amount,
            tx.category?.name || 'عام',
            tx.card?.name || 'غير معروف',
            tx.type === 'EXPENSE' ? 'صرفية' : 'دخل'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="pb-32 pt-8 px-6 animate-fade-in" dir="rtl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">المعاملات</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="p-3 glass rounded-2xl transition-all opacity-50 hover:opacity-100"
                            title="تصدير بيانات"
                        >
                            <Download size={20} />
                        </button>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="text-center py-20 opacity-30">
                            <Repeat size={48} className="mx-auto mb-4" />
                            <p>لا توجد معاملات بعد</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl ${tx.type === 'EXPENSE' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {tx.type === 'EXPENSE' ? <Calendar size={20} /> : <Plus size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{tx.description}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {tx.category && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 flex items-center gap-1">
                                                    <Tag size={10} />
                                                    {tx.category.name}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-left">
                                    <div className="text-left">
                                        <p className={`font-black text-xl ${tx.type === 'EXPENSE' ? 'text-white' : 'text-green-500'}`}>
                                            {tx.type === 'EXPENSE' ? '-' : '+'}{tx.amount.toLocaleString('en-US')} د.ع
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">{tx.card?.name || 'بطاقة محذوفة'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteTx(tx.id)}
                                        className="p-3 glass rounded-2xl text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {hasMore && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => fetchData(true)}
                            className="px-10 py-4 glass rounded-3xl font-black text-primary border border-primary/20 hover:bg-primary/5 transition-all active:scale-95"
                        >
                            تحميل المزيد
                        </button>
                    </div>
                )}

                {isAdding && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-end">
                        <div className="bg-dark-lighter w-full p-8 rounded-t-[3rem] animate-slide-up shadow-2xl border-t border-white/10">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
                            <h3 className="text-2xl font-black mb-8">تسجيل معاملة</h3>
                            <form onSubmit={handleAddTx} className="space-y-6">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewTx({ ...newTx, type: 'EXPENSE' })}
                                        className={`flex-1 p-4 rounded-2xl font-bold transition-all ${newTx.type === 'EXPENSE' ? 'bg-red-500 shadow-lg shadow-red-500/20' : 'glass border border-white/5 opacity-50'}`}
                                    >
                                        صرفية
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTx({ ...newTx, type: 'INCOME' })}
                                        className={`flex-1 p-4 rounded-2xl font-bold transition-all ${newTx.type === 'INCOME' ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'glass border border-white/5 opacity-50'}`}
                                    >
                                        دخل
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="glass p-4 rounded-2xl border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2">المبلغ (د.ع)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent text-2xl font-bold outline-none"
                                            placeholder="0"
                                            value={newTx.amount}
                                            onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="glass p-4 rounded-2xl border border-white/5">
                                        <label className="block text-xs text-gray-500 mb-2">الوصف</label>
                                        <input
                                            type="text"
                                            className="w-full bg-transparent outline-none"
                                            placeholder="مثال: غداء عمل، وقود..."
                                            value={newTx.description}
                                            onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1 glass p-4 rounded-2xl border border-white/5 relative">
                                            <label className="block text-xs text-gray-500 mb-2">القسم</label>
                                            <select
                                                className="w-full bg-transparent outline-none appearance-none font-medium"
                                                value={newTx.categoryId}
                                                onChange={(e) => setNewTx({ ...newTx, categoryId: e.target.value })}
                                                required
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id} className="bg-dark">{cat.name}</option>
                                                ))}
                                                {categories.length === 0 && <option value="" className="bg-dark">عام</option>}
                                            </select>
                                            <ChevronDown size={14} className="absolute left-4 bottom-5 text-gray-500" />
                                        </div>

                                        <div className="flex-1 glass p-4 rounded-2xl border border-white/5 relative">
                                            <label className="block text-xs text-gray-500 mb-2">البطاقة</label>
                                            <select
                                                className="w-full bg-transparent outline-none appearance-none font-medium"
                                                value={newTx.cardId}
                                                onChange={(e) => setNewTx({ ...newTx, cardId: e.target.value })}
                                                required
                                            >
                                                {cards.map(card => (
                                                    <option key={card.id} value={card.id} className="bg-dark">{card.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute left-4 bottom-5 text-gray-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="submit" className="flex-[2] bg-primary p-5 rounded-3xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-transform">تأكيد المعاملة</button>
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 glass p-5 rounded-3xl font-bold opacity-50">إلغاء</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <PaymentSuccess isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
            <CustomModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="حذف المعاملة"
                message="هل أنت متأكد من مسح هذه المعاملة؟ لن يتم تعديل رصيد البطاقة."
                type="confirm"
            />
            <PaymentFailed
                isOpen={showFailed}
                onClose={() => setShowFailed(false)}
                onSwitchCard={() => {
                    setShowFailed(false);
                    // The "Add Transaction" modal is already open, just let the user change the selection
                }}
            />
        </>
    );
};

export default Transactions;
