'use client';

import React from 'react';
import { Asset, Platform } from '@/types/models';

interface AssetDetailModalProps {
    isOpen: boolean;
    asset: Asset | null;
    platforms: Platform[];
    onClose: () => void;
}

// Platform type icons and colors
const getPlatformIcon = (type: string) => {
    switch (type.toUpperCase()) {
        case 'BROKER':
            return {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                ),
                bg: 'bg-blue-500/10',
                text: 'text-blue-400',
            };
        case 'BANK':
            return {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                ),
                bg: 'bg-green-500/10',
                text: 'text-green-400',
            };
        case 'WALLET':
            return {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                ),
                bg: 'bg-purple-500/10',
                text: 'text-purple-400',
            };
        default:
            return {
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                ),
                bg: 'bg-slate-500/10',
                text: 'text-slate-400',
            };
    }
};

export default function AssetDetailModal({ isOpen, asset, platforms, onClose }: AssetDetailModalProps) {
    if (!isOpen || !asset) return null;

    // Filter platforms that belong to this asset
    const associatedPlatforms = platforms.filter(p => p.asset_id === asset.asset_id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{asset.asset_name}</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            ID: <span className="text-slate-300">{asset.asset_id}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="text-lg font-semibold text-white">{associatedPlatforms.length}</span>
                        <span className="text-slate-400">Associated Platform{associatedPlatforms.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* Platforms List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {associatedPlatforms.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-slate-400 text-lg">No platforms associated with this asset type</p>
                            <p className="text-slate-500 text-sm mt-2">Create a platform and associate it with {asset.asset_name}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {associatedPlatforms.map((platform) => {
                                const iconConfig = getPlatformIcon(platform.platform_name || 'UNKNOWN');
                                return (
                                    <div
                                        key={platform.platform_id}
                                        className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconConfig.bg} ${iconConfig.text}`}>
                                                {iconConfig.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-white">{platform.platform_name}</h3>
                                                <p className="text-xs text-slate-400">{platform.platform_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${iconConfig.bg} ${iconConfig.text} border-current`}>
                                                {platform.platform_name}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/20">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
