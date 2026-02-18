import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Todos = () => {
    const [todos, setTodos] = useState([]);
    const [task, setTask] = useState('');
    const [category, setCategory] = useState('شخصي');
    const [priority, setPriority] = useState('LOW');
    const [filter, setFilter] = useState('الكل');

    const CATEGORIES = ['شخصي', 'عمل', 'تسوق', 'عاجل'];
    const FILTERS = ['الكل', ...CATEGORIES, 'المكتملة'];

    const PRIORITY_COLORS = {
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-yellow-500',
        LOW: 'bg-blue-500'
    };

    const PRIORITY_LABELS = {
        HIGH: 'عالية',
        MEDIUM: 'متوسطة',
        LOW: 'منخفضة'
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        try {
            const res = await api.getTodos();
            setTodos(res.data);
        } catch (error) {
            console.error("Error fetching todos", error);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!task.trim()) return;
        try {
            await api.createTodo({
                task,
                category,
                priority
            });
            setTask('');
            fetchTodos();
        } catch (error) {
            console.error("Error adding todo", error);
        }
    };

    const toggleTodo = async (id) => {
        try {
            await api.toggleTodo(id);
            fetchTodos();
        } catch (error) {
            console.error("Error toggling todo", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.deleteTodo(id);
            fetchTodos();
        } catch (error) {
            console.error("Error deleting todo", error);
        }
    };

    const filteredTodos = todos.filter(t => {
        if (filter === 'الكل') return true;
        if (filter === 'المكتملة') return t.isCompleted;
        return t.category === filter;
    });

    return (
        <div className="px-6 pt-8 pb-32" dir="rtl">
            <h1 className="text-3xl font-black mb-8">قائمة المهام 📝</h1>

            {/* Add Form */}
            <form onSubmit={handleAdd} className="space-y-4 mb-10">
                <div className="flex gap-3">
                    <input
                        type="text"
                        className="flex-1 glass p-5 rounded-[2rem] outline-none font-bold border border-white/5"
                        placeholder="ماذا تريد أن تنجز اليوم؟"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                    />
                    <button type="submit" className="bg-primary p-5 rounded-[2rem] shadow-lg shadow-primary/20 active:scale-90 transition-transform">
                        <Plus size={24} />
                    </button>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${category === cat ? 'bg-white text-black' : 'glass opacity-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${priority === p ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40'} ${PRIORITY_COLORS[p]}`}
                                title={PRIORITY_LABELS[p]}
                            />
                        ))}
                    </div>
                </div>
            </form>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-6 mb-4 scrollbar-hide">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${filter === f ? 'bg-primary shadow-lg shadow-primary/20' : 'glass opacity-60'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredTodos.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 opacity-20"
                        >
                            <CheckCircle size={48} className="mx-auto mb-4" />
                            <p>لا توجد مهام في هذا التصنيف</p>
                        </motion.div>
                    ) : (
                        filteredTodos.map((todo) => (
                            <motion.div
                                layout
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                key={todo.id}
                                className={`group glass p-5 rounded-[2.5rem] flex items-center justify-between border border-white/5 transition-all duration-500 ${todo.isCompleted ? 'bg-white/5 opacity-40' : 'hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        className="transition-transform active:scale-75"
                                    >
                                        {todo.isCompleted ? <CheckCircle className="text-primary" size={28} /> : <Circle className="text-gray-600" size={28} />}
                                    </button>
                                    <div>
                                        <p className={`text-lg font-bold ${todo.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                            {todo.task}
                                        </p>
                                        <div className="flex gap-3 mt-1 items-center">
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md font-bold text-gray-400">
                                                {todo.category}
                                            </span>
                                            <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[todo.priority]}`} />
                                            <span className="text-[10px] font-bold text-gray-500">{PRIORITY_LABELS[todo.priority]}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(todo.id)}
                                    className="p-3 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Todos;
