import React, { useState, useEffect } from 'react';

const AmountInput = ({ value, onChange, placeholder, className, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');

    // Format number with commas: 1000 -> 1,000
    const formatNumber = (num) => {
        if (!num && num !== 0) return '';
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    // Remove commas to get raw number: 1,000 -> 1000
    const stripCommas = (str) => {
        return str.replace(/,/g, '');
    };

    useEffect(() => {
        setDisplayValue(formatNumber(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = stripCommas(e.target.value);
        // Allow only numbers and one decimal point
        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
            setDisplayValue(formatNumber(raw));
            onChange({ target: { value: raw } });
        }
    };

    return (
        <input
            {...props}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};

export default AmountInput;
