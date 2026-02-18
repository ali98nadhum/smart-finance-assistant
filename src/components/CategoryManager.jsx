import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Plus, Tag, Trash2, X, Hash } from 'lucide-react';

const CategoryManager = ({ isOpen, onClose, onUpdate }) => {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState({ name: '', icon: 'Tag', color: '#3b82f6' });

    useEffect(() => {
        if (isOpen) fetchCategories();
    }, [isOpen]);

    const fetchCategories = async () => {
        try {
            const res = await api.getCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const handleCreate = async (e) => {
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

    const handleDelete = async (id) => {
        try {
            await api.deleteCategory(id);
            fetchCategories();
            onUpdate?.();
        } catch (error) {
            console.error("Error deleting category", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[90] flex items-center justify-center p-6" dir="rtl">
            <div className="bg-dark-lighter w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-fade-in">
                <div className="p-8 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-2xl font-black">إدارة الأقسام</h3>
                    <button onClick={onClose} className="p-3 glass rounded-2xl opacity-50"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-8">
                    {/* New Category Form */}
                    <form onSubmit={handleCreate} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="اسم القسم الجديد"
                            className="flex-1 glass p-4 rounded-2xl outline-none border border-white/5 font-bold"
                            value={newCat.name}
                            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                            required
                        />
                        <button className="bg-primary p-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95">
                            إضافة
                        </button>
                    </form>

                    {/* Categories List */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                        {categories.length === 0 ? (
                            <p className="text-center py-10 opacity-30">لا توجد أقسام مخصصة</p>
                        ) : (
                            categories.map((cat) => (
                                <div key={cat.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Tag size={18} />
                                        </div>
                                        <span className="font-bold">{cat.name}</span>
                                    </div>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManager;
