'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrency } from '@/utils/currencyUtils';

export default function SettingsPage() {
    const { settings, setDisplayCurrency, setExchangeRate } = useSettings();
    const [exchangeRateInput, setExchangeRateInput] = useState(settings.exchangeRate.toString());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setExchangeRateInput(settings.exchangeRate.toString());
    }, [settings.exchangeRate]);

    const handleSave = () => {
        const rate = parseFloat(exchangeRateInput);
        if (!isNaN(rate) && rate > 0) {
            setExchangeRate(rate);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const previewAmount = 1000000; // 1 million VND for preview

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your application preferences</p>
                </div>

                {/* Display Preferences */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Display Preferences
                    </h2>

                    {/* Currency Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Currency Display
                        </label>
                        <div className="space-y-3">
                            <label className="flex items-center p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                                <input
                                    type="radio"
                                    name="currency"
                                    value="VND"
                                    checked={settings.displayCurrency === 'VND'}
                                    onChange={() => setDisplayCurrency('VND')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="text-white font-medium">VND - Vietnamese Dong</div>
                                    <div className="text-slate-400 text-sm">Display all amounts in Vietnamese Dong (₫)</div>
                                </div>
                                {settings.displayCurrency === 'VND' && (
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </label>

                            <label className="flex items-center p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                                <input
                                    type="radio"
                                    name="currency"
                                    value="USD"
                                    checked={settings.displayCurrency === 'USD'}
                                    onChange={() => setDisplayCurrency('USD')}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="text-white font-medium">USD - US Dollar</div>
                                    <div className="text-slate-400 text-sm">Display all amounts in US Dollars ($)</div>
                                </div>
                                {settings.displayCurrency === 'USD' && (
                                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Exchange Rate */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Exchange Rate (VND to USD)
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    value={exchangeRateInput}
                                    onChange={(e) => setExchangeRateInput(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="25000"
                                    min="1"
                                    step="100"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Update
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm mt-2">
                            1 USD = {settings.exchangeRate.toLocaleString()} VND
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                        <div className="text-sm font-medium text-slate-300 mb-2">Preview</div>
                        <div className="flex items-center justify-between">
                            <div className="text-white">
                                {formatCurrency(previewAmount, 'VND', 'VND', settings.exchangeRate)}
                            </div>
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <div className="text-white">
                                {formatCurrency(previewAmount, 'VND', settings.displayCurrency, settings.exchangeRate)}
                            </div>
                        </div>
                    </div>

                    {/* Save Confirmation */}
                    {saved && (
                        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Settings saved successfully!
                        </div>
                    )}
                </div>

                {/* General Settings */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        General
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Theme
                            </label>
                            <select
                                value={settings.theme || 'dark'}
                                disabled
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                            <p className="text-slate-500 text-sm mt-1">Theme customization coming soon</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Date Format
                            </label>
                            <select
                                value={settings.dateFormat || 'DD/MM/YYYY'}
                                disabled
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                            <p className="text-slate-500 text-sm mt-1">Date format customization coming soon</p>
                        </div>
                    </div>
                </div>

                {/* About */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        About
                    </h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Application</span>
                            <span className="text-white font-medium">Portfolio Management - FinDash</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Version</span>
                            <span className="text-white font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Data Storage</span>
                            <span className="text-white font-medium">All amounts stored in VND</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
