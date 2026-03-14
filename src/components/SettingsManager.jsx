import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Plus, Tag, Trash2, X, CalendarDays, Wallet } from 'lucide-react';

const SettingsManager = ({ isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('CATEGORIES'); // 'CATEGORIES' | 'BUDGET'
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState({ name: '', icon: 'Tag', color: '#3b82f6' });

    // Budget Settings
    const [budgetSettings, setBudgetSettings] = useState({ activeDays: [0, 1, 2, 3, 4, 5, 6] });
    const WEEK_DAYS = [
        { id: 0, name: 'الأحد' },
        { id: 1, name: 'الإثنين' },
        { id: 2, name: 'الثلاثاء' },
        { id: 3, name: 'الأربعاء' },
        { id: 4, name: 'الخميس' },
        { id: 5, name: 'الجمعة' },
        { id: 6, name: 'السبت' },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchBudgetSettings();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await api.getCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const fetchBudgetSettings = async () => {
        try {
            const res = await api.getBudgetSettings();
            if (res.data) setBudgetSettings(res.data);
        } catch (error) {
            console.error("Error fetching budget settings", error);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await api.createCategory(newCat);
            setNewCat({ name: '', icon: 'Tag', color: '#3b82f6' });
            fetchCategories();
            onUpdate?.();
        } catch (error) {
            console.error("Error creating category", error);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.deleteCategory(id);
            fetchCategories();
            onUpdate?.();
        } catch (error) {
            console.error("Error deleting category", error);
        }
    };

    const toggleBudgetDay = async (dayId) => {
        const currentDays = Array.isArray(budgetSettings.activeDays) ? [...budgetSettings.activeDays] : [0, 1, 2, 3, 4, 5, 6];
        let newDays = [];
        if (currentDays.includes(dayId)) {
            newDays = currentDays.filter(d => d !== dayId);
        } else {
            newDays = [...currentDays, dayId].sort((a, b) => a - b);
        }

        try {
            const newSettings = { ...budgetSettings, activeDays: newDays };
            await api.updateBudgetSettings(newSettings);
            setBudgetSettings(newSettings);
            onUpdate?.(); // Tell dashboard to refresh
        } catch (error) {
            console.error("Error updating budget settings", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] flex items-center justify-center p-6" dir="rtl">
            <div className="bg-dark-lighter w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-fade-in flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center shrink-0">
                    <h3 className="text-2xl font-black">الإعدادات المتقدمة</h3>
                    <button onClick={onClose} className="p-3 glass rounded-2xl opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 pt-4 gap-4 shrink-0">
                    <button
                        onClick={() => setActiveTab('CATEGORIES')}
                        className={`flex items-center gap-2 pb-4 px-2 border-b-2 font-bold transition-all ${activeTab === 'CATEGORIES' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        <Tag size={18} /> الأقسام
                    </button>
                    <button
                        onClick={() => setActiveTab('BUDGET')}
                        className={`flex items-center gap-2 pb-4 px-2 border-b-2 font-bold transition-all ${activeTab === 'BUDGET' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-white'}`}
                    >
                        <Wallet size={18} /> الميزانية
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto">
                    {activeTab === 'CATEGORIES' && (
                        <div className="space-y-8 animate-fade-in">
                            <form onSubmit={handleCreateCategory} className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="اسم القسم الجديد"
                                    className="flex-1 glass p-4 rounded-2xl outline-none border border-white/5 font-bold"
                                    value={newCat.name}
                                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                                    required
                                />
                                <button className="bg-primary p-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95 text-black">
                                    إضافة
                                </button>
                            </form>

                            <div className="space-y-3">
                                {categories.length === 0 ? (
                                    <p className="text-center py-10 opacity-30">لا توجد أقسام مخصصة</p>
                                ) : (
                                    categories.map((cat) => (
                                        <div key={cat.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <Tag size={18} />
                                                </div>
                                                <span className="font-bold">{cat.name}</span>
                                            </div>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'BUDGET' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                                    <CalendarDays size={20} /> أيام الصرف النشطة
                                </h4>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                    حدد الأيام التي ترغب بتخصيص ميزانية للإنفاق فيها. الأيام الغير محددة لن يُحتسب لها ميزانية ولن يؤثر صرفك فيها على التقييم اليومي كمخالفة للميزانية، بل سيعرض الميزانية كـ 0 فقط مع تسجيل صرفك.
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    {WEEK_DAYS.map(day => {
                                        const isActive = budgetSettings.activeDays?.includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                onClick={() => toggleBudgetDay(day.id)}
                                                className={`p-4 rounded-2xl font-bold flex items-center justify-between border transition-all active:scale-95 ${isActive
                                                    ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {day.name}
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-primary bg-primary' : 'border-gray-500'
                                                    }`}>
                                                    {isActive && <div className="w-1.5 h-1.5 bg-dark rounded-full" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SettingsManager;
