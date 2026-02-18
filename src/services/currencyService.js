import { api } from '../api/api';

export const currencyService = {
    getRate: async () => {
        try {
            const res = await api.getExchangeRate();
            return res.data;
        } catch (error) {
            console.error("Error fetching rate", error);
            return { rate: 1530 }; // Fallback
        }
    },

    updateRate: async (rate) => {
        try {
            return await api.updateExchangeRate(rate);
        } catch (error) {
            console.error("Error updating rate", error);
        }
    },

    convert: (amount, rate, toUSD = true) => {
        if (!amount || !rate) return 0;
        return toUSD ? amount / rate : amount * rate;
    }
};
