import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';

export const api = {
    // Cards
    getCards: () => Promise.resolve({ data: storageService.getCards() }),
    createCard: (data) => Promise.resolve({ data: storageService.createCard(data) }),
    updateCard: (id, data) => Promise.resolve({ data: storageService.updateCard(id, data) }),
    deleteCard: (id) => Promise.resolve({ data: storageService.deleteCard(id) }),
    topUpCard: (id, amount) => Promise.resolve({ data: storageService.topUpCard(id, amount) }),

    // Transactions
    getTransactions: (page, limit) => Promise.resolve({ data: storageService.getTransactions(page, limit) }),
    createTransaction: (data) => Promise.resolve({ data: storageService.createTransaction(data) }),
    deleteTransaction: (id) => Promise.resolve({ data: storageService.deleteTransaction(id) }),

    // Budget
    getBudgetStatus: (date) => Promise.resolve({ data: storageService.getBudgetStatus(date) }),
    upsertBudget: (data) => Promise.resolve({ data: storageService.upsertBudget(data) }),

    // Debts
    getDebts: () => Promise.resolve({ data: storageService.getDebts() }),
    createDebt: (data) => Promise.resolve({ data: storageService.createDebt(data) }),
    updateDebtStatus: (id, status) => Promise.resolve({ data: storageService.updateDebtStatus(id, status) }),
    updateDebt: (id, data) => Promise.resolve({ data: storageService.updateDebt(id, data) }),
    archiveDebt: (id) => Promise.resolve({ data: storageService.archiveDebt(id) }),

    // Todos
    getTodos: () => Promise.resolve({ data: storageService.getTodos() }),
    createTodo: (data) => Promise.resolve({ data: storageService.createTodo(data) }),
    toggleTodo: (id) => Promise.resolve({ data: storageService.toggleTodo(id) }),
    updateTodo: (id, data) => Promise.resolve({ data: storageService.updateTodo(id, data) }),
    deleteTodo: (id) => Promise.resolve({ data: storageService.deleteTodo(id) }),

    // Notifications
    getNotifications: () => Promise.resolve({ data: storageService.getNotifications() }),
    markNotificationRead: (id) => Promise.resolve({ data: storageService.markNotificationRead(id) }),

    // Exchange Rate
    getExchangeRate: () => Promise.resolve({ data: storageService.getExchangeRate() }),
    updateExchangeRate: (rate) => Promise.resolve({ data: storageService.updateExchangeRate(rate) }),

    // Goals
    getGoals: () => Promise.resolve({ data: storageService.getGoals() }),
    createGoal: (data) => Promise.resolve({ data: storageService.createGoal(data) }),
    updateGoal: (id, data) => Promise.resolve({ data: storageService.updateGoal(id, data) }),
    deleteGoal: (id) => Promise.resolve({ data: storageService.deleteGoal(id) }),
    archiveGoal: (id) => Promise.resolve({ data: storageService.archiveGoal(id) }),
    allocateToGoal: (id, amount) => Promise.resolve({ data: storageService.allocateToGoal(id, amount) }),
    toggleGoalCell: (goalId, cellId) => Promise.resolve({ data: storageService.toggleGoalCell(goalId, cellId) }),

    // Security
    getPin: () => Promise.resolve({ data: storageService.getPin() }),
    setPin: (pin) => Promise.resolve({ data: storageService.setPin(pin) }),
    verifyPin: (pin) => Promise.resolve({ data: storageService.verifyPin(pin) }),

    // Categories
    getCategories: () => Promise.resolve({ data: storageService.getCategories() }),
    createCategory: (data) => Promise.resolve({ data: storageService.createCategory(data) }),
    deleteCategory: (id) => Promise.resolve({ data: storageService.deleteCategory(id) }),

    // AI Insights
    getAIInsights: () => Promise.resolve({ data: aiService.getInsights() }),

    // Debt Payments
    getPayments: (debtId) => Promise.resolve({ data: storageService.getPayments(debtId) }),
    addPayment: (data) => Promise.resolve({ data: storageService.addPayment(data) }),
    storeAmount: (id, amount, type) => Promise.resolve({ data: storageService.storeAmount(id, amount, type) }),

    // User Savings
    getSavings: () => Promise.resolve({ data: storageService.getSavings() }),
    updateSavings: (amount, type) => Promise.resolve({ data: storageService.updateSavings(amount, type) }),

    // Stats
    getDailyStats: (date) => Promise.resolve({ data: storageService.getDailyStats(date) }),
    getRangeStats: (range) => Promise.resolve({ data: storageService.getRangeStats(range) }),

    // Challenges
    getChallenges: () => Promise.resolve({ data: storageService.getChallenges() }),
    createChallenge: (data) => Promise.resolve({ data: storageService.createChallenge(data) }),
    deleteChallenge: (id) => Promise.resolve({ data: storageService.deleteChallenge(id) }),
};
