import React from 'react';
import { AssetType } from '@/types/models';

interface AssetTypeBadgeProps {
    assetType: AssetType | string;
}

const assetConfig = {
    STOCK: {
        label: 'Stock',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        icon: '📈',
    },
    CASH: {
        label: 'Cash',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: '💵',
    },
    FOREX: {
        label: 'Forex/Crypto',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        icon: '₿',
    },
    GOLD: {
        label: 'Gold',
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        icon: '🪙',
    },
};

export default function AssetTypeBadge({ assetType }: AssetTypeBadgeProps) {
    const config = assetConfig[assetType as keyof typeof assetConfig] || {
        label: assetType,
        color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        icon: '📊',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}
