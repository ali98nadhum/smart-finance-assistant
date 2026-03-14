import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import { Plus, CheckCircle2, Circle, Trash2, Edit2, X, Tag, Flag, CheckSquare, CalendarDays, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const QUILL_MODULES = {
    toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
    ],
};

const Todos = () => {
    const [todos, setTodos] = useState([]);
    const [task, setTask] = useState('');
    const [category, setCategory] = useState('شخصي');
    const [priority, setPriority] = useState('LOW');
    const [filter, setFilter] = useState('الكل');
    const [editingTodo, setEditingTodo] = useState(null);
    const [isInputExpanded, setIsInputExpanded] = useState(false);

    const CATEGORIES = ['شخصي', 'عمل', 'تسوق', 'عاجل'];
    const FILTERS = ['الكل', ...CATEGORIES, 'المكتملة'];

    const PRIORITY_COLORS = {
        HIGH: 'text-red-500 bg-red-500/10 border-red-500/30',
        MEDIUM: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
        LOW: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
    };

    const PRIORITY_DOT = {
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
            if (editingTodo) {
                await api.updateTodo(editingTodo.id, {
                    task,
                    category,
                    priority
                });
                setEditingTodo(null);
            } else {
                await api.createTodo({
                    task,
                    category,
                    priority
                });
            }
            setTask('');
            setCategory('شخصي');
            setPriority('LOW');
            setIsInputExpanded(false);
            fetchTodos();
        } catch (error) {
            console.error("Error saving todo", error);
        }
    };

    const handleEdit = (todo) => {
        setEditingTodo(todo);
        setTask(todo.task);
        setCategory(todo.category);
        setPriority(todo.priority);
        setIsInputExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingTodo(null);
        setTask('');
        setCategory('شخصي');
        setPriority('LOW');
        setIsInputExpanded(false);
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

    // Grouping for a professional view
    const pendingTodos = filteredTodos.filter(t => !t.isCompleted);
    const completedTodos = filteredTodos.filter(t => t.isCompleted);

    const progress = todos.length === 0 ? 0 : Math.round((todos.filter(t => t.isCompleted).length / todos.length) * 100);

    const TaskItem = ({ todo }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [newSubtask, setNewSubtask] = useState('');

        const completedSubtasks = todo.subtasks?.filter(st => st.isCompleted).length || 0;
        const totalSubtasks = todo.subtasks?.length || 0;

        const handleAddSubtask = async (e) => {
            e.preventDefault();
            if (!newSubtask.trim()) return;
            try {
                await api.addSubtask(todo.id, newSubtask);
                setNewSubtask('');
                fetchTodos();
            } catch (error) {
                console.error("Error adding subtask", error);
            }
        };

        const handleToggleSubtask = async (subtaskId) => {
            try {
                await api.toggleSubtask(todo.id, subtaskId);
                fetchTodos();
            } catch (error) {
                console.error("Error toggling subtask", error);
            }
        };

        const handleDeleteSubtask = async (subtaskId) => {
            try {
                await api.deleteSubtask(todo.id, subtaskId);
                fetchTodos();
            } catch (error) {
                console.error("Error deleting subtask", error);
            }
        };

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group bg-dark/40 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border ${todo.isCompleted ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-white/20'} transition-all`}
            >
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={() => toggleTodo(todo.id)}
                        className="flex-shrink-0 transition-transform active:scale-75 cursor-pointer"
                    >
                        {todo.isCompleted ?
                            <CheckCircle2 className="text-primary" size={24} fill="currentColor" /> :
                            <Circle className="text-gray-500 hover:text-primary transition-colors" size={24} />
                        }
                    </button>
                    <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => !todo.isCompleted && handleEdit(todo)}>
                        <div
                            className={`text-base font-semibold quill-content ${todo.isCompleted ? 'line-through text-gray-500 opacity-60' : 'text-white'}`}
                            dangerouslySetInnerHTML={{ __html: todo.task }}
                        />
                        <div className="flex gap-2 mt-1.5 items-center">
                            <span className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-medium text-gray-400">
                                <Tag size={10} /> {todo.category}
                            </span>
                            {!todo.isCompleted && (
                                <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border ${PRIORITY_COLORS[todo.priority]}`}>
                                    <Flag size={10} /> {PRIORITY_LABELS[todo.priority]}
                                </span>
                            )}
                            {!todo.isCompleted && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsExpanded(!isExpanded);
                                    }}
                                    className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${totalSubtasks > 0 ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} فرعية` : 'مهام فرعية'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(todo.id)} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Expanded Subtasks Section */}
                <AnimatePresence>
                    {isExpanded && !todo.isCompleted && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden w-full mt-4"
                        >
                            <div className="pl-8 pr-12 space-y-2 border-t border-white/5 pt-4">
                                {todo.subtasks?.map(st => (
                                    <div key={st.id} className="flex items-center justify-between group/st bg-white/5 p-2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleToggleSubtask(st.id)} className="text-gray-400 hover:text-primary transition-colors">
                                                {st.isCompleted ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} />}
                                            </button>
                                            <span className={`text-sm font-medium ${st.isCompleted ? 'line-through text-gray-500' : 'text-white/90'}`}>
                                                {st.text}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSubtask(st.id)}
                                            className="text-red-500/0 group-hover/st:text-red-500/50 hover:!text-red-500 transition-all p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                                    <CornerDownLeft size={16} className="text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="مهمة فرعية جديدة..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-600 text-white font-medium py-1"
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newSubtask.trim()}
                                        className="bg-primary/20 text-primary p-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/30 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="px-6 pt-8 pb-32 max-w-2xl mx-auto" dir="rtl">

            {/* Header & Progress */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
                        المهام <CheckSquare className="text-primary" size={28} />
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">نظم وقتك، وحقق أهدافك.</p>
                </div>
                {todos.length > 0 && (
                    <div className="flex flex-col items-center">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={24 * 2 * Math.PI} strokeDashoffset={24 * 2 * Math.PI * (1 - progress / 100)} className="text-primary transition-all duration-1000" />
                            </svg>
                            <span className="absolute text-[10px] font-black">{progress}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Add Input */}
            <form onSubmit={handleAdd} className={`mb-8 bg-dark/60 backdrop-blur-xl rounded-3xl border ${isInputExpanded || editingTodo ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-white/10'} p-2 transition-all duration-300 relative z-20`}>
                <div className="flex items-start gap-2 px-4 py-2">
                    <Plus className={`${isInputExpanded ? 'text-primary mt-3' : 'text-gray-500'} transition-colors`} size={20} />
                    <div className="flex-1 min-h-[44px] cursor-text" onClick={() => setIsInputExpanded(true)}>
                        {isInputExpanded || editingTodo ? (
                            <div className="custom-quill-container pb-2" dir="ltr">
                                <ReactQuill
                                    theme="snow"
                                    value={task}
                                    onChange={setTask}
                                    modules={QUILL_MODULES}
                                    placeholder="إضافة مهمة جديدة..."
                                />
                            </div>
                        ) : (
                            <div className="text-gray-500 text-sm font-semibold py-2">
                                إضافة مهمة جديدة...
                            </div>
                        )}
                    </div>
                    {editingTodo && (
                        <button type="button" onClick={cancelEdit} className="text-gray-500 p-1 bg-white/5 rounded-full hover:bg-white/10">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {(isInputExpanded || editingTodo) && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/5 mt-2 pt-3 px-4 pb-2"
                        >
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="flex gap-2 items-center flex-wrap">
                                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${category === cat ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>
                                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                                        {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setPriority(p)}
                                                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${priority === p ? 'bg-white/10' : 'opacity-50 hover:opacity-100 hover:bg-white/5'}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                                                <span className={priority === p ? 'text-white' : 'text-gray-400'}>{PRIORITY_LABELS[p]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                    <button
                                        type="submit"
                                        disabled={!task || task === '<p><br></p>'}
                                        className="bg-primary text-black font-bold px-6 py-2 rounded-xl text-xs active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 w-full"
                                    >
                                        {editingTodo ? 'حفظ التعديل' : 'إضافة المهمة'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            {/* Overlay to close input */}
            {(isInputExpanded && !editingTodo) && (
                <div className="fixed inset-0 z-10" onClick={() => setIsInputExpanded(false)}></div>
            )}

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide relative z-20">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-full justify-center text-xs font-bold transition-all whitespace-nowrap border ${filter === f ? 'bg-primary text-black border-primary' : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-6 mt-4 relative z-20">
                {pendingTodos.length > 0 && (
                    <div className="space-y-3">
                        {pendingTodos.map(todo => <TaskItem key={todo.id} todo={todo} />)}
                    </div>
                )}

                {completedTodos.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xs font-bold text-gray-500">المكتملة</h2>
                            <div className="h-px bg-white/5 flex-1"></div>
                        </div>
                        {completedTodos.map(todo => <TaskItem key={todo.id} todo={todo} />)}
                    </div>
                )}

                {filteredTodos.length === 0 && (
                    <div className="text-center py-20 opacity-40">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex flex-col items-center justify-center mx-auto mb-4 border border-white/10">
                            <CheckCircle2 size={32} className="text-gray-400" />
                        </div>
                        <p className="font-semibold text-gray-400">لا توجد مهام حالياً</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Todos;
