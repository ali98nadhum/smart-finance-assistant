
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
    GOALS: 'finance_goals',
    CHALLENGES: 'finance_challenges',
    SECURITY_PIN: 'finance_security_pin',
    BUDGET_SETTINGS: 'finance_budget_settings'
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
    getTransactions: (page = 1, limit = 10) => {
        const txs = storage.get(STORAGE_KEYS.TRANSACTIONS);
        const cats = storage.get(STORAGE_KEYS.CATEGORIES);
        const cards = storage.get(STORAGE_KEYS.CARDS);

        const sorted = txs.map(tx => ({
            ...tx,
            category: cats.find(c => c.id === tx.categoryId) || null,
            card: cards.find(c => c.id === tx.cardId) || null
        })).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        const start = (page - 1) * limit;
        const paged = sorted.slice(start, start + limit);

        return {
            transactions: paged,
            hasMore: sorted.length > start + limit,
            total: sorted.length
        };
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

        // Check Challenges - if transaction is an expense in a category being "blocked"
        if (data.type === 'EXPENSE') {
            const challenges = storage.get(STORAGE_KEYS.CHALLENGES);
            const activeChallenges = challenges.filter(c => c.status === 'ACTIVE');
            let updated = false;

            activeChallenges.forEach(c => {
                if (c.type === 'NO_SPENDING' && c.categoryId === data.categoryId) {
                    c.status = 'FAILED';
                    updated = true;
                    // Add notification
                    storageService.save(STORAGE_KEYS.NOTIFICATIONS, {
                        title: 'تحدي فشل!',
                        message: `لقد صرفت على "${c.categoryName}"، مما أدى لفشل تحدي "${c.name}". حاول مرة أخرى!`,
                        type: 'CHALLENGE_FAILED',
                        isRead: false
                    });
                }
            });

            if (updated) storage.set(STORAGE_KEYS.CHALLENGES, challenges);
        }

        return tx;
    },

    // Budgets
    getBudgetStatus: (dateStr) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const dailyId = date.toISOString().split('T')[0];

        // 0: Sunday, 1: Monday, ... 6: Saturday
        const currentDay = date.getDay();
        const storedSettings = storage.get(STORAGE_KEYS.BUDGET_SETTINGS);
        const budgetSettings = (storedSettings && Array.isArray(storedSettings.activeDays))
            ? storedSettings
            : { activeDays: [0, 1, 2, 3, 4, 5, 6] };

        // Check if today is an active budget day
        const isActiveDay = budgetSettings.activeDays.includes(currentDay);

        // Helper to get remaining active days in the current month
        const getRemainingActiveDaysInMonth = (currentDate, activeDays) => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            let count = 0;

            for (let d = currentDate.getDate(); d <= lastDay; d++) {
                const checkDate = new Date(year, month, d);
                if (activeDays.includes(checkDate.getDay())) {
                    count++;
                }
            }
            return count;
        };

        const remainingActiveDays = getRemainingActiveDaysInMonth(date, budgetSettings.activeDays);

        const txs = storage.get(STORAGE_KEYS.TRANSACTIONS);
        const cards = storage.get(STORAGE_KEYS.CARDS);
        const budgetedCards = cards.filter(c => c.isBudgeted);
        const budgetedCardIds = budgetedCards.map(c => c.id);

        const spent = txs
            .filter(tx =>
                tx.type === 'EXPENSE' &&
                tx.date &&
                tx.date.startsWith(dailyId) &&
                budgetedCardIds.includes(tx.cardId)
            )
            .reduce((acc, tx) => acc + parseFloat(tx.amount || 0), 0);

        // Limit defaults to 0 if today is not an active spend day
        let limit = 0;

        if (isActiveDay) {
            limit = budgetedCards.reduce((acc, card) => {
                const cardBalance = parseFloat(card.balance || 0);
                // If there are remaining active days, divide balance by them.
                // Otherwise fallback to 1 to avoid division by zero.
                const dailyShare = remainingActiveDays > 0 ? (cardBalance / remainingActiveDays) : cardBalance;
                return acc + dailyShare;
            }, 0);
        }

        return {
            budget: limit,
            spent,
            remaining: limit > 0 ? limit - spent : 0,
            isActiveDay
        };
    },

    getBudgetSettings: () => {
        const storedSettings = storage.get(STORAGE_KEYS.BUDGET_SETTINGS);
        return (storedSettings && Array.isArray(storedSettings.activeDays))
            ? storedSettings
            : { activeDays: [0, 1, 2, 3, 4, 5, 6] };
    },
    updateBudgetSettings: (data) => {
        storage.set(STORAGE_KEYS.BUDGET_SETTINGS, data);
        return data;
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
        const { transactions: txs } = storageService.getTransactions(1, 1000);
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
        const { transactions: txs } = storageService.getTransactions(1, 1000);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let startDate;
        let days;

        if (range === 'weekly') {
            days = 7;
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - days + 1);
        } else {
            // Calendar month view: start from the 1st of the current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            // Show the full month on the timeline
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            days = endDate.getDate();
        }

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
    deleteTransaction: (id) => {
        const transactions = storage.get(STORAGE_KEYS.TRANSACTIONS);
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions.splice(index, 1);
            storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
            return true;
        }
        return false;
    },
    updateCard: (id, updates) => storageService.update(STORAGE_KEYS.CARDS, id, updates),
    deleteCard: (id) => {
        const cards = storage.get(STORAGE_KEYS.CARDS);
        if (cards.length <= 1) return false; // Prevent deleting the last card
        storageService.delete(STORAGE_KEYS.CARDS, id);
        return true;
    },
    topUpCard: (id, amount) => {
        const cards = storage.get(STORAGE_KEYS.CARDS);
        const index = cards.findIndex(c => c.id === id);
        if (index !== -1) {
            cards[index].balance += parseFloat(amount || 0);
            storage.set(STORAGE_KEYS.CARDS, cards);
            return cards[index];
        }
        return null;
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
    deleteDebt: (id) => storageService.delete(STORAGE_KEYS.DEBTS, id),
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
    addDebtPayment: (paymentObj) => {
        const { debtId, amount, cardId } = paymentObj;

        const debts = storage.get(STORAGE_KEYS.DEBTS) || [];
        const debtIndex = debts.findIndex(d => d.id === debtId);
        if (debtIndex === -1) throw new Error("Debt not found");

        const debt = debts[debtIndex];
        const payment = {
            id: generateId(),
            amount: parseFloat(amount),
            createdAt: new Date().toISOString(),
            debtId: debtId
        };

        const payments = storage.get(STORAGE_KEYS.DEBT_PAYMENTS) || [];
        payments.push(payment);
        storage.set(STORAGE_KEYS.DEBT_PAYMENTS, payments);

        const totalPaid = payments.filter(p => p.debtId === debtId).reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid >= debt.amount) {
            debt.status = 'PAID';
        }

        debts[debtIndex] = debt;
        storage.set(STORAGE_KEYS.DEBTS, debts);

        // If a specific card was selected, deduct the balance from that card
        if (cardId) {
            const cards = storage.get(STORAGE_KEYS.CARDS) || [];
            const cardIndex = cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                const card = cards[cardIndex];
                if (card.balance >= parseFloat(amount)) {
                    card.balance -= parseFloat(amount);
                    storage.set(STORAGE_KEYS.CARDS, cards);

                    // Also add a system transaction reflecting this payment
                    const transactions = storage.get(STORAGE_KEYS.TRANSACTIONS) || [];
                    const tx = {
                        id: generateId(),
                        amount: parseFloat(amount),
                        type: 'EXPENSE',
                        category: 'تسديد ديون',
                        date: new Date().toISOString(),
                        notes: `تسديد دفعة للدين: ${debt.personName || debt.borrower}`,
                        cardId: card.id,
                        isSystem: true
                    };
                    transactions.unshift(tx);
                    storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
                } else {
                    throw new Error("رصيد البطاقة غير كافٍ");
                }
            }
        }

        return debt;
    },
    updateDebtPayment: (debtId, paymentId, newAmount, cardId) => {
        const debts = storage.get(STORAGE_KEYS.DEBTS) || [];
        const debtIndex = debts.findIndex(d => d.id === debtId);
        if (debtIndex === -1) throw new Error("Debt not found");

        const payments = storage.get(STORAGE_KEYS.DEBT_PAYMENTS) || [];
        const paymentIndex = payments.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) throw new Error("Payment not found");

        const oldPayment = payments[paymentIndex];
        const oldAmountFloat = parseFloat(oldPayment.amount);
        const newAmountFloat = parseFloat(newAmount);

        // Calculate diff: Positive means user needs to pay more now. 
        const amountDiff = newAmountFloat - oldAmountFloat;

        // If card is specified, deduct/refund the diff 
        if (cardId) {
            const cards = storage.get(STORAGE_KEYS.CARDS) || [];
            const cardIndex = cards.findIndex(c => c.id === cardId);

            if (cardIndex !== -1) {
                const card = cards[cardIndex];

                // If diff is positive, user is paying MORE, so deduct from card
                if (amountDiff > 0) {
                    if (card.balance >= amountDiff) {
                        card.balance -= amountDiff;
                    } else {
                        throw new Error("رصيد البطاقة غير كافٍ لتغطية التعديل الإضافي");
                    }
                } else if (amountDiff < 0) {
                    // diff is negative, user is paying LESS, so REFUND the card
                    card.balance += Math.abs(amountDiff);
                }

                storage.set(STORAGE_KEYS.CARDS, cards);

                // Add or update system transaction reflecting the modification
                const transactions = storage.get(STORAGE_KEYS.TRANSACTIONS) || [];
                const tx = {
                    id: generateId(),
                    amount: Math.abs(amountDiff),
                    type: amountDiff > 0 ? 'EXPENSE' : 'INCOME',
                    category: 'تسديد ديون (تعديل)',
                    date: new Date().toISOString(),
                    notes: `تعديل دفعة سابقة لدين: ${debts[debtIndex].personName || debts[debtIndex].borrower} ${amountDiff > 0 ? '(خصم إضافي)' : '(استرداد جزء)'}`,
                    cardId: card.id,
                    isSystem: true
                };
                if (amountDiff !== 0) {
                    transactions.unshift(tx);
                    storage.set(STORAGE_KEYS.TRANSACTIONS, transactions);
                }
            }
        }

        // Apply new values to the payment record itself
        payments[paymentIndex].amount = newAmountFloat;
        storage.set(STORAGE_KEYS.DEBT_PAYMENTS, payments);

        // Re-calculate Total Paid for Debt
        const debt = debts[debtIndex];
        const totalPaid = payments.filter(p => p.debtId === debtId).reduce((sum, p) => sum + p.amount, 0);

        // Fix Status
        if (totalPaid >= debt.amount) {
            debt.status = 'PAID';
        } else {
            debt.status = 'PENDING';
        }

        debts[debtIndex] = debt;
        storage.set(STORAGE_KEYS.DEBTS, debts);

        return debt;
    },

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
        isCompleted: false,
        subtasks: []
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

    addSubtask: (todoId, text) => {
        const todos = storage.get(STORAGE_KEYS.TODOS);
        const index = todos.findIndex(t => t.id === todoId);
        if (index !== -1) {
            if (!todos[index].subtasks) todos[index].subtasks = [];
            const newSubtask = {
                id: generateId(),
                text,
                isCompleted: false,
                createdAt: new Date().toISOString()
            };
            todos[index].subtasks.push(newSubtask);
            storage.set(STORAGE_KEYS.TODOS, todos);
            return todos[index];
        }
        return null;
    },

    toggleSubtask: (todoId, subtaskId) => {
        const todos = storage.get(STORAGE_KEYS.TODOS);
        const index = todos.findIndex(t => t.id === todoId);
        if (index !== -1 && todos[index].subtasks) {
            const subIndex = todos[index].subtasks.findIndex(st => st.id === subtaskId);
            if (subIndex !== -1) {
                todos[index].subtasks[subIndex].isCompleted = !todos[index].subtasks[subIndex].isCompleted;
                storage.set(STORAGE_KEYS.TODOS, todos);
                return todos[index];
            }
        }
        return null;
    },

    deleteSubtask: (todoId, subtaskId) => {
        const todos = storage.get(STORAGE_KEYS.TODOS);
        const index = todos.findIndex(t => t.id === todoId);
        if (index !== -1 && todos[index].subtasks) {
            todos[index].subtasks = todos[index].subtasks.filter(st => st.id !== subtaskId);
            storage.set(STORAGE_KEYS.TODOS, todos);
            return todos[index];
        }
        return null;
    },

    // Notifications
    getNotifications: () => storage.get(STORAGE_KEYS.NOTIFICATIONS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    markNotificationRead: (id) => storageService.update(STORAGE_KEYS.NOTIFICATIONS, id, { isRead: true }),

    // Goals
    getGoals: () => storage.get(STORAGE_KEYS.GOALS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    createGoal: (data) => {
        const target = parseFloat(data.target || 0);
        let grid = null;

        if (data.useGrid) {
            grid = [];
            if (data.type === 'COUNTDOWN') {
                const startDate = new Date();
                const endDate = new Date(data.deadline);
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                for (let i = 1; i <= diffDays; i++) {
                    grid.push({ id: generateId(), day: i, completed: false, amount: 0 });
                }
            } else {
                let remaining = target;

                // Adjust block denominations so smaller targets map to smaller chunks
                let denoms = [25000, 15000, 10000, 5000, 2000, 1000];
                if (target <= 25000) {
                    denoms = [2000, 1000, 500, 250];
                } else if (target <= 50000) {
                    denoms = [5000, 2000, 1000, 500];
                } else if (target <= 100000) {
                    denoms = [10000, 5000, 2000, 1000];
                }

                while (remaining > 0) {
                    const possible = denoms.filter(d => d <= remaining);
                    let amount;
                    if (possible.length > 0) {
                        amount = possible[Math.floor(Math.random() * possible.length)];
                    } else {
                        amount = remaining;
                    }
                    grid.push({ id: generateId(), amount, completed: false });
                    remaining -= amount;
                }
                grid = grid.sort(() => Math.random() - 0.5);
            }
        }

        return storageService.save(STORAGE_KEYS.GOALS, {
            ...data,
            target: data.type === 'COUNTDOWN' ? 0 : target,
            current: data.type === 'COUNTDOWN' ? 0 : parseFloat(data.current || 0),
            startDate: data.type === 'COUNTDOWN' ? new Date().toISOString() : null,
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
                if (goals[index].type === 'COUNTDOWN') {
                    // For countdown, current could represent number of completed days
                    goals[index].current = goals[index].grid.filter(c => c.completed).length;
                } else {
                    if (cell.completed) {
                        goals[index].current += cell.amount;
                    } else {
                        goals[index].current -= cell.amount;
                    }
                }

                storage.set(STORAGE_KEYS.GOALS, goals);
                return goals[index];
            }
        }
        return null;
    },

    // Challenges
    getChallenges: () => {
        const challenges = storage.get(STORAGE_KEYS.CHALLENGES);
        const now = new Date();
        let updated = false;

        challenges.forEach(c => {
            if (c.status === 'ACTIVE') {
                const endDate = new Date(c.endDate);
                if (now > endDate) {
                    c.status = 'COMPLETED';
                    updated = true;
                    // Add notification
                    storageService.save(STORAGE_KEYS.NOTIFICATIONS, {
                        title: 'تهانينا! اكتمل التحدي',
                        message: `مبروك! لقد أكملت تحدي "${c.name}" بنجاح. استمر بطل! 🏆`,
                        type: 'CHALLENGE_SUCCESS',
                        isRead: false
                    });
                } else {
                    // Update current progress based on unit
                    const start = new Date(c.startDate);
                    const diffTime = Math.abs(now - start);
                    const unitFactor = c.durationUnit === 'HOURS' ? (1000 * 60 * 60) : (1000 * 60 * 60 * 24);
                    const unitsPassed = Math.floor(diffTime / unitFactor);
                    if (c.daysCompleted !== unitsPassed) {
                        c.daysCompleted = unitsPassed;
                        updated = true;
                    }
                }
            }
        });

        if (updated) storage.set(STORAGE_KEYS.CHALLENGES, challenges);
        return challenges;
    },

    createChallenge: (data) => {
        const startDate = new Date();
        const duration = parseInt(data.duration || 7);
        const unit = data.durationUnit || 'DAYS';
        const endDate = new Date(startDate);

        if (unit === 'HOURS') {
            endDate.setHours(endDate.getHours() + duration);
        } else {
            endDate.setDate(endDate.getDate() + duration);
        }

        return storageService.save(STORAGE_KEYS.CHALLENGES, {
            ...data,
            durationUnit: unit,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'ACTIVE',
            daysCompleted: 0
        });
    },

    deleteChallenge: (id) => storageService.delete(STORAGE_KEYS.CHALLENGES, id),

    // Security
    getPin: () => storage.get(STORAGE_KEYS.SECURITY_PIN, null),
    setPin: (pin) => storage.set(STORAGE_KEYS.SECURITY_PIN, pin),
    verifyPin: (pin) => storage.get(STORAGE_KEYS.SECURITY_PIN, null) === pin
};
