import { storageService } from './storageService';

export const aiService = {
    getInsights: () => {
        const { transactions: txs } = storageService.getTransactions(1, 1000);
        const budget = storageService.getBudgetStatus();
        const goals = storageService.getGoals();
        const savings = storageService.getSavings().savings;

        const insights = [];

        // 1. Budget Tip
        if (budget.spent > budget.budget) {
            insights.push({
                type: 'WARNING',
                text: "دير بالك! تجاوزت الميزانية اليومية اليوم. حاول تقلل الصرف لبقية اليوم حتى توازن الأمور. 💸"
            });
        } else if (budget.remaining < budget.budget * 0.2) {
            insights.push({
                type: 'INFO',
                text: "باقي لك شوية وتخلص ميزانية اليوم. خليك حذر بآخر صرفياتك. ⚠️"
            });
        }

        // 2. Savings Tip
        if (savings > 500000) {
            insights.push({
                type: 'SUCCESS',
                text: "عاشت إيدك! مدخراتك وصلت لمبلغ حلو. فكر تستثمر جزء منها أو تزيد مبلغ أهدافك. 💰"
            });
        }

        // 3. Goal Tip
        const nearGoal = goals.find(g => (g.current / g.target) > 0.8 && (g.current / g.target) < 1);
        if (nearGoal) {
            insights.push({
                type: 'GOAL',
                text: `باقي لك تكّة وتوصل لهدف "${nearGoal.name}"! شد حيلك، مابقى شي. 🏁`
            });
        }

        // 4. Default High Spending Tip (Mock Analysis)
        const foodSpending = txs.filter(t => t.category?.name === 'طعام' && t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
        if (foodSpending > 200000) {
            insights.push({
                type: 'TIP',
                text: "لاحظت إنك تصرف هواية على الأكل. جرب تطبخ بالبيت أكثر، راح توفر مبلغ محترم بالشهر! 🍳"
            });
        }

        // Fallback
        if (insights.length === 0) {
            insights.push({
                type: 'DEFAULT',
                text: "وضعك المالي مستقر حالياً. استمر بمراقبة مصاريفك وادخارك بانتظام. 👍"
            });
        }

        return insights;
    }
};
