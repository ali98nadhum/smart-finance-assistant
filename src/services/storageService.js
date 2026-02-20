
const STORAGE_KEYS = {
    TRANSACTIONS: 'finance_transactions',
    CARDS: 'finance_cards',
    BUDGETS: 'finance_budgets',
    DEBTS: 'finance_debts',
    DEBT_PAYMENTS: 'finance_debt_payments',
    CATEGORIES: 'finance_categories',
    SAVINGS: 'finance_savings',
    TODOS: 'finance_todos',
    NOTIFICATIONS: 'finance_notifications',
    EXCHANGE_RATE: 'finance_exchange_rate',
    GOALS: 'finance_goals',
    SECURITY_PIN: 'finance_security_pin'
};

const DEFAULT_CATEGORIES = [
    { id: '1', name: 'تسوق', icon: 'ShoppingBag', color: '#ec4899' },
    { id: '2', name: 'نقل', icon: 'Car', color: '#3b82f6' },
    { id: '3', name: 'طعام', icon: 'Utensils', color: '#f59e0b' },
    { id: '4', name: 'سكن', icon: 'Home', color: '#10b981' },
    { id: '5', name: 'صحة', icon: 'Heart', color: '#ef4444' },
    { id: '6', name: 'ترفيه', icon: 'Gamepad', color: '#8b5cf6' }
];

const DEFAULT_CARDS = [
    { id: '1', name: 'المحفظة الأساسية', balance: 0, color: '#3b82f6', isBudgeted: true }
];

const storage = {
    get: (key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error("Storage Error:", e);
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Storage Save Error:", e);
        }
    }
};

// Fallback UUID generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Initialize defaults
if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) storage.set(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
if (!localStorage.getItem(STORAGE_KEYS.CARDS)) storage.set(STORAGE_KEYS.CARDS, DEFAULT_CARDS);
if (localStorage.getItem(STORAGE_KEYS.SAVINGS) === null) storage.set(STORAGE_KEYS.SAVINGS, 0);
if (!localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATE)) storage.set(STORAGE_KEYS.EXCHANGE_RATE, { rate: 1530, lastUpdated: new Date().toISOString() });

export const storageService = {
    // Basic Persistence
    save: (key, item) => {
        const items = storage.get(key);
        const timestamp = new Date().toISOString();
        const newItem = {
            ...item,
            id: generateId(),
            createdAt: timestamp,
            date: item.date || timestamp // Ensure date field exists for sorting/filtering
        };
        items.push(newItem);
        storage.set(key, items);
        return newItem;
    },

    update: (key, id, updates) => {
        const items = storage.get(key);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            storage.set(key, items);
            return items[index];
        }
        return null;
    },

    delete: (key, id) => {
        const items = storage.get(key);
        const filtered = items.filter(i => i.id !== id);
        storage.set(key, filtered);
    },

    // Transactions with relational logic
    getTransactions: () => {
        const txs = storage.get(STORAGE_KEYS.TRANSACTIONS);
        const cats = storage.get(STORAGE_KEYS.CATEGORIES);
        const cards = storage.get(STORAGE_KEYS.CARDS);
        return txs.map(tx => ({
            ...tx,
            category: cats.find(c => c.id === tx.categoryId) || null,
            card: cards.find(c => c.id === tx.cardId) || null
        })).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    },

    createTransaction: (data) => {
        const amount = parseFloat(data.amount || 0);
        const tx = storageService.save(STORAGE_KEYS.TRANSACTIONS, { ...data, amount });

        // Update Card Balance
        const cards = storage.get(STORAGE_KEYS.CARDS);
        const cardIndex = cards.findIndex(c => c.id === data.cardId);
        if (cardIndex !== -1) {
            cards[cardIndex].balance += (data.type === 'INCOME' ? amount : -amount);
            storage.set(STORAGE_KEYS.CARDS, cards);
        }
        return tx;
    },

    // Budgets
    getBudgetStatus: (dateStr) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const dailyId = date.toISOString().split('T')[0];
        const budgets = storage.get(STORAGE_KEYS.BUDGETS);
        const budgetObj = budgets.find(b => b.date && b.date.startsWith(dailyId)) || { dailyLimit: 50000 };

        const txs = storage.get(STORAGE_KEYS.TRANSACTIONS);
        const cards = storage.get(STORAGE_KEYS.CARDS);
        const budgetedCardIds = cards.filter(c => c.isBudgeted).map(c => c.id);

        const spent = txs
            .filter(tx =>
                tx.type === 'EXPENSE' &&
                tx.date &&
                tx.date.startsWith(dailyId) &&
                budgetedCardIds.includes(tx.cardId)
            )
            .reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);

        const limit = parseFloat(budgetObj.dailyLimit || 50000);
        return {
            budget: limit,
            spent,
            remaining: limit - spent
        };
    },

    upsertBudget: (data) => {
        const budgets = storage.get(STORAGE_KEYS.BUDGETS);
        const dateValue = data.date ? new Date(data.date) : new Date();
        const dateStr = dateValue.toISOString().split('T')[0];
        const index = budgets.findIndex(b => b.date && b.date.startsWith(dateStr));

        const dailyLimit = parseFloat(data.dailyLimit || 0);

        if (index !== -1) {
            budgets[index] = { ...budgets[index], dailyLimit, date: dateValue.toISOString() };
            storage.set(STORAGE_KEYS.BUDGETS, budgets);
            return budgets[index];
        } else {
            const newBudget = {
                id: generateId(),
                dailyLimit,
                date: dateValue.toISOString()
            };
            budgets.push(newBudget);
            storage.set(STORAGE_KEYS.BUDGETS, budgets);
            return newBudget;
        }
    },

    // Stats
    getDailyStats: (dateStr) => {
        const txs = storageService.getTransactions();
        const date = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
        const dayTxs = txs.filter(tx => tx.date && tx.date.startsWith(date) && tx.type === 'EXPENSE');

        const byCat = dayTxs.reduce((acc, tx) => {
            const catName = tx.category?.name || 'غير مصنف';
            acc[catName] = (acc[catName] || 0) + (tx.amount || 0);
            return acc;
        }, {});

        return {
            byCategory: Object.entries(byCat).map(([name, amount]) => ({ name, amount })),
            hourly: []
        };
    },

    getRangeStats: (range) => {
        const txs = storageService.getTransactions();
        let days = range === 'weekly' ? 7 : 30;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days + 1);

        const rangeTxs = txs.filter(tx => tx.type === 'EXPENSE' && new Date(tx.date) >= startDate);

        const byCat = rangeTxs.reduce((acc, tx) => {
            const catName = tx.category?.name || 'غير مصنف';
            acc[catName] = (acc[catName] || 0) + (tx.amount || 0);
            return acc;
        }, {});

        const timeline = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const amount = rangeTxs
                .filter(tx => tx.date && tx.date.startsWith(dateStr))
                .reduce((acc, tx) => acc + (tx.amount || 0), 0);
            timeline.push({ date: dateStr, amount });
        }

        return {
            byCategory: Object.entries(byCat).map(([name, amount]) => ({ name, amount })),
            timeline
        };
    },

    // Cards
    getCards: () => storage.get(STORAGE_KEYS.CARDS),
    createCard: (data) => storageService.save(STORAGE_KEYS.CARDS, { ...data, balance: parseFloat(data.balance || 0) }),
    updateCard: (id, updates) => storageService.update(STORAGE_KEYS.CARDS, id, updates),
    deleteCard: (id) => {
        const cards = storage.get(STORAGE_KEYS.CARDS);
        if (cards.length <= 1) return false; // Prevent deleting the last card
        storageService.delete(STORAGE_KEYS.CARDS, id);
        return true;
    },

    // Debts
    getDebts: () => {
        const debts = storage.get(STORAGE_KEYS.DEBTS);
        const payments = storage.get(STORAGE_KEYS.DEBT_PAYMENTS);
        return debts.map(d => ({
            ...d,
            payments: payments.filter(p => p.debtId === d.id)
        })).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    },
    createDebt: (data) => storageService.save(STORAGE_KEYS.DEBTS, {
        ...data,
        amount: parseFloat(data.amount || 0),
        status: 'PENDING',
        storedAmount: 0,
        notes: data.notes || '',
        isArchived: false
    }),
    updateDebtStatus: (id, status) => storageService.update(STORAGE_KEYS.DEBTS, id, { status }),
    updateDebt: (id, updates) => storageService.update(STORAGE_KEYS.DEBTS, id, updates),
    archiveDebt: (id) => {
        const debts = storage.get(STORAGE_KEYS.DEBTS);
        const index = debts.findIndex(d => d.id === id);
        if (index !== -1) {
            debts[index].isArchived = !debts[index].isArchived;
            storage.set(STORAGE_KEYS.DEBTS, debts);
            return debts[index];
        }
        return null;
    },
    storeAmount: (id, amount, type) => {
        const debts = storage.get(STORAGE_KEYS.DEBTS);
        const index = debts.findIndex(d => d.id === id);
        if (index !== -1) {
            let current = parseFloat(debts[index].storedAmount || 0);
            const val = parseFloat(amount || 0);
            if (type === 'SET') current = val;
            else if (type === 'INCREMENT') current += val;
            else if (type === 'DECREMENT') current -= val;
            debts[index].storedAmount = current;
            storage.set(STORAGE_KEYS.DEBTS, debts);
            return debts[index];
        }
        return null;
    },

    // Debt Payments
    getPayments: (debtId) => storage.get(STORAGE_KEYS.DEBT_PAYMENTS).filter(p => p.debtId === debtId),
    addPayment: (data) => storageService.save(STORAGE_KEYS.DEBT_PAYMENTS, { ...data, amount: parseFloat(data.amount || 0) }),

    // Categories
    getCategories: () => storage.get(STORAGE_KEYS.CATEGORIES),
    createCategory: (data) => storageService.save(STORAGE_KEYS.CATEGORIES, data),
    deleteCategory: (id) => storageService.delete(STORAGE_KEYS.CATEGORIES, id),

    // Savings
    getSavings: () => ({ savings: parseFloat(storage.get(STORAGE_KEYS.SAVINGS, 0)) }),
    updateSavings: (amount, type) => {
        let current = parseFloat(storage.get(STORAGE_KEYS.SAVINGS, 0));
        const val = parseFloat(amount || 0);
        if (type === 'SET') current = val;
        else if (type === 'INCREMENT') current += val;
        else if (type === 'DECREMENT') current -= val;
        storage.set(STORAGE_KEYS.SAVINGS, current);
        return { savings: current };
    },

    // Todos
    getTodos: () => storage.get(STORAGE_KEYS.TODOS).sort((a, b) => {
        const priorityScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
    }),
    createTodo: (data) => storageService.save(STORAGE_KEYS.TODOS, {
        task: data.task,
        category: data.category || 'عام',
        priority: data.priority || 'LOW',
        isCompleted: false
    }),
    toggleTodo: (id) => {
        const todos = storage.get(STORAGE_KEYS.TODOS);
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index].isCompleted = !todos[index].isCompleted;
            storage.set(STORAGE_KEYS.TODOS, todos);
            return todos[index];
        }
        return null;
    },
    updateTodo: (id, updates) => storageService.update(STORAGE_KEYS.TODOS, id, updates),
    deleteTodo: (id) => storageService.delete(STORAGE_KEYS.TODOS, id),

    // Notifications
    getNotifications: () => storage.get(STORAGE_KEYS.NOTIFICATIONS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    markNotificationRead: (id) => storageService.update(STORAGE_KEYS.NOTIFICATIONS, id, { isRead: true }),

    // Exchange Rate
    getExchangeRate: () => storage.get(STORAGE_KEYS.EXCHANGE_RATE, { rate: 1530 }),
    updateExchangeRate: (rate) => {
        const data = { rate, lastUpdated: new Date().toISOString() };
        storage.set(STORAGE_KEYS.EXCHANGE_RATE, data);
        return data;
    },

    // Goals
    getGoals: () => storage.get(STORAGE_KEYS.GOALS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    createGoal: (data) => {
        const target = parseFloat(data.target || 0);
        let grid = null;

        if (data.useGrid) {
            grid = [];
            let remaining = target;

            // Always use a mix of denominations for a "Challenge Box" feel
            const denoms = [15000, 10000, 5000, 2000, 1000];

            while (remaining > 0) {
                // Filter denominations that fit in the remaining amount
                const possible = denoms.filter(d => d <= remaining);

                let amount;
                if (possible.length > 0) {
                    // Randomly pick from all possible denominations for maximum variety
                    amount = possible[Math.floor(Math.random() * possible.length)];
                } else {
                    amount = remaining;
                }

                grid.push({ id: generateId(), amount, completed: false });
                remaining -= amount;
            }

            // Shuffle grid for better psychological distribution
            grid = grid.sort(() => Math.random() - 0.5);
        }

        return storageService.save(STORAGE_KEYS.GOALS, {
            ...data,
            target,
            current: parseFloat(data.current || 0),
            deadline: data.deadline || null,
            useGrid: !!data.useGrid,
            isArchived: false,
            grid
        });
    },
    updateGoal: (id, updates) => storageService.update(STORAGE_KEYS.GOALS, id, updates),
    deleteGoal: (id) => storageService.delete(STORAGE_KEYS.GOALS, id),
    archiveGoal: (id) => {
        const goals = storage.get(STORAGE_KEYS.GOALS);
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index].isArchived = !goals[index].isArchived;
            storage.set(STORAGE_KEYS.GOALS, goals);
            return goals[index];
        }
        return null;
    },
    allocateToGoal: (id, amount) => {
        const goals = storage.get(STORAGE_KEYS.GOALS);
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index].current += parseFloat(amount || 0);
            storage.set(STORAGE_KEYS.GOALS, goals);
            return goals[index];
        }
        return null;
    },
    toggleGoalCell: (goalId, cellId) => {
        const goals = storage.get(STORAGE_KEYS.GOALS);
        const index = goals.findIndex(g => g.id === goalId);
        if (index !== -1 && goals[index].grid) {
            const cellIndex = goals[index].grid.findIndex(c => c.id === cellId);
            if (cellIndex !== -1) {
                const cell = goals[index].grid[cellIndex];
                cell.completed = !cell.completed;

                // Update total current amount
                if (cell.completed) {
                    goals[index].current += cell.amount;
                } else {
                    goals[index].current -= cell.amount;
                }

                storage.set(STORAGE_KEYS.GOALS, goals);
                return goals[index];
            }
        }
        return null;
    },

    // Security
    getPin: () => storage.get(STORAGE_KEYS.SECURITY_PIN, null),
    setPin: (pin) => storage.set(STORAGE_KEYS.SECURITY_PIN, pin),
    verifyPin: (pin) => storage.get(STORAGE_KEYS.SECURITY_PIN, null) === pin
};
