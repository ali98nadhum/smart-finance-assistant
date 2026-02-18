import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { Lock, Unlock, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SecurityLock = ({ children }) => {
    const [pin, setPin] = useState('');
    const [savedPin, setSavedPin] = useState(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [error, setError] = useState(false);
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [newPin, setNewPin] = useState('');

    useEffect(() => {
        checkPin();
    }, []);

    const checkPin = async () => {
        const res = await api.getPin();
        if (res.data) {
            setSavedPin(res.data);
            setIsUnlocked(false);
        } else {
            setIsUnlocked(true);
        }
    };

    const handlePinEntry = (num) => {
        if (pin.length < 4) {
            const nextPin = pin + num;
            setPin(nextPin);
            if (nextPin.length === 4) {
                if (nextPin === savedPin) {
                    setIsUnlocked(true);
                    setError(false);
                } else {
                    setError(true);
                    setTimeout(() => {
                        setPin('');
                        setError(false);
                    }, 500);
                }
            }
        }
    };

    const handleSetPin = async () => {
        if (newPin.length === 4) {
            await api.setPin(newPin);
            setSavedPin(newPin);
            setIsSettingPin(false);
            setNewPin('');
            alert("تم تعيين رمز القفل بنجاح");
        }
    };

    if (isUnlocked) {
        return (
            <>
                {children}
                {/* Float Settings Button for Pin */}
                {!isUnlocked && (
                    <button
                        onClick={() => setIsSettingPin(true)}
                        className="fixed top-4 left-4 p-2 glass rounded-full opacity-20 hover:opacity-100 z-[60]"
                    >
                        <Lock size={16} />
                    </button>
                )}
            </>
        );
    }

    return (
        <div className="fixed inset-0 bg-dark z-[200] flex flex-col items-center justify-center p-8 font-cairo" dir="rtl">
            <motion.div
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                className="text-center mb-12"
            >
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-colors ${error ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                    <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black mb-2">أدخل رمز الدخول</h2>
                <p className="text-gray-500 text-sm">التطبيق محمي، يرجى إدخال الرمز المكون من 4 أرقام</p>
            </motion.div>

            <div className="flex gap-4 mb-12">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i
                                ? (error ? 'bg-red-500 border-red-500 scale-125' : 'bg-primary border-primary scale-125')
                                : 'border-white/10'
                            }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handlePinEntry(num.toString())}
                        className="w-20 h-20 rounded-full glass border border-white/5 text-2xl font-bold active:scale-90 active:bg-white/10 transition-all flex items-center justify-center"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handlePinEntry('0')}
                    className="w-20 h-20 rounded-full glass border border-white/5 text-2xl font-bold active:scale-90 active:bg-white/10 transition-all flex items-center justify-center"
                >
                    0
                </button>
                <button
                    onClick={() => setPin('')}
                    className="w-20 h-20 rounded-full text-gray-500 flex items-center justify-center"
                >
                    مسح
                </button>
            </div>
        </div>
    );
};

export default SecurityLock;
