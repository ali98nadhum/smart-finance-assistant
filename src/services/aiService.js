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
    },

    getStatsInsights: (range, total, categories, timeline) => {
        const insights = [];
        const topCat = [...categories].sort((a, b) => b.amount - a.amount)[0];
        const monthName = new Intl.DateTimeFormat('ar-IQ', { month: 'long' }).format(new Date());

        if (range === 'weekly') {
            if (total > 350000) {
                insights.push({
                    title: "تنبيه مصاريف",
                    text: `صرفك هذا الأسبوع مرتفع جداً (${total.toLocaleString()} د.ع). تحتاج مراجعة ضرورية لمصاريفك. ⚠️`,
                    type: 'WARNING'
                });
            } else if (total > 200000) {
                insights.push({
                    title: "ملاحظة أسبوعية",
                    text: `صرفك متوسط إلى مرتفع هذا الأسبوع. حاول توازن الأمور بالأيام الجاية. 📉`,
                    type: 'INFO'
                });
            } else {
                insights.push({
                    title: "إنجاز أسبوعي",
                    text: "عاشت إيدك! صرفك متوازن ومثالي هذا الأسبوع. استمر! ✨",
                    type: 'SUCCESS'
                });
            }

            if (topCat && topCat.amount > total * 0.45) {
                insights.push({
                    title: "تحليل الفئات",
                    text: `بد تصرف مبالغ كبيرة على "${topCat.name}". جرب تراقب هذا الجزء لتقليل الهدر. 🧐`,
                    type: 'TIP'
                });
            }
        } else {
            // Monthly Insights - More nuanced thresholds
            if (total > 1200000) {
                insights.push({
                    title: `تحذير شهر ${monthName}`,
                    text: `مصاريفك وصلت لمستوى حرج جداً (${total.toLocaleString()} د.ع). لازم تعدل ميزانيتك فوراً! 🚨`,
                    type: 'WARNING'
                });
            } else if (total > 850000) {
                insights.push({
                    title: `تقرير شهر ${monthName}`,
                    text: `صرفك لهذا الشهر مرتفع (${total.toLocaleString()} د.ع). راجع قائمة المصاريف لتشوف وين تقدر توفر. 📊`,
                    type: 'WARNING'
                });
            } else if (total > 500000) {
                insights.push({
                    title: `إحصائيات ${monthName}`,
                    text: `صرفك في المسار المتوسط. ببعض الجهد تقدر تزيد من ادخارك لنهاية الشهر. 👍`,
                    type: 'INFO'
                });
            } else {
                insights.push({
                    title: `نجاح في ${monthName}`,
                    text: `أداء مالي ممتاز لهذا الشهر! استمر بهذا الانضباط لخدمة أهدافك. 🏆`,
                    type: 'SUCCESS'
                });
            }

            // Category focus for monthly
            const foodCat = categories.find(c => c.name === 'طعام');
            if (foodCat && foodCat.amount > 250000) {
                insights.push({
                    title: "نصيحة توفير",
                    text: "مبلغ الأكل والمطاعم مرتفع هذا الشهر. الطبخ بالبيت هو الحل الأسرع لزيادة ادخارك. 🍳",
                    type: 'TIP'
                });
            }
        }

        // Comparison Logic (Simple comparison with average day)
        const avgDay = total / (timeline.length || 1);
        if (range === 'weekly') {
            insights.push({
                title: "مقارنة سريعة",
                text: `معدل صرفك اليومي هذا الأسبوع هو ${Math.round(avgDay).toLocaleString()} د.ع.`,
                type: 'INFO'
            });
        }

        return insights;
    }
};
