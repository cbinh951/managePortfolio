'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'VND' | 'USD';

export interface Settings {
    displayCurrency: Currency;
    exchangeRate: number; // VND to USD rate
    theme?: 'dark' | 'light';
    dateFormat?: string;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    setDisplayCurrency: (currency: Currency) => void;
    setExchangeRate: (rate: number) => void;
}

const defaultSettings: Settings = {
    displayCurrency: 'VND',
    exchangeRate: 25000, // Default: 25,000 VND = 1 USD
    theme: 'dark',
    dateFormat: 'DD/MM/YYYY',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'portfolio-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setSettings({ ...defaultSettings, ...parsed });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        }
    }, [settings, isLoaded]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const setDisplayCurrency = (currency: Currency) => {
        updateSettings({ displayCurrency: currency });
    };

    const setExchangeRate = (rate: number) => {
        updateSettings({ exchangeRate: rate });
    };

    const value: SettingsContextType = {
        settings,
        updateSettings,
        setDisplayCurrency,
        setExchangeRate,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
