'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';

interface AssetTypeFilterProps {
    selectedAssetType: string;
    onFilterChange: (assetType: string) => void;
}

export default function AssetTypeFilter({ selectedAssetType, onFilterChange }: AssetTypeFilterProps) {
    const [assetTypes, setAssetTypes] = useState<{ value: string; label: string; icon: string }[]>([
        { value: 'ALL', label: 'All Asset Types', icon: '🌐' },
        { value: 'CASH', label: 'Cash', icon: '💵' },
    ]);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const assets = await apiClient.getAssets();
            const assetOptions = assets.map(asset => ({
                value: asset.asset_name,
                label: asset.asset_name,
                icon: getAssetIcon(asset.asset_name),
            }));

            setAssetTypes([
                { value: 'ALL', label: 'All Asset Types', icon: '🌐' },
                ...assetOptions,
                { value: 'CASH', label: 'Cash', icon: '💵' },
            ]);
        } catch (error) {
            console.error('Failed to load assets:', error);
        }
    };

    const getAssetIcon = (assetName: string) => {
        const name = assetName.toUpperCase();
        if (name.includes('STOCK') || name.includes('EQUITY')) return '📈';
        if (name.includes('FOREX') || name.includes('FX')) return '💱';
        if (name.includes('GOLD') || name.includes('METAL')) return '🪙';
        if (name.includes('BOND')) return '📊';
        if (name.includes('CRYPTO')) return '₿';
        return '📌';
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-300 mb-3">
                Filter by Asset Type
            </label>
            <div className="relative">
                <select
                    value={selectedAssetType}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 appearance-none cursor-pointer hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                    {assetTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
