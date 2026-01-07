'use client';

import React from 'react';
import { Asset, Platform } from '@/types/models';

interface AssetSectionProps {
    asset: Asset;
    platforms: Platform[];
    isExpanded: boolean;
    onToggle: () => void;
    onEditAsset: (asset: Asset) => void;
    onDeleteAsset: (asset: Asset) => void;
    onAddPlatform: (assetId: string) => void;
    onEditPlatform: (platform: Platform) => void;
    onDeletePlatform: (platform: Platform) => void;
}

const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg
        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const getPlatformIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bank')) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
        );
    } else if (nameLower.includes('wallet')) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
    );
};

export default function AssetSection({
    asset,
    platforms,
    isExpanded,
    onToggle,
    onEditAsset,
    onDeleteAsset,
    onAddPlatform,
    onEditPlatform,
    onDeletePlatform,
}: AssetSectionProps) {
    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors">
            {/* Header */}
            <div
                className="flex items-center justify-between p-5 cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    <ChevronIcon isExpanded={isExpanded} />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{asset.asset_name}</h3>
                        <p className="text-xs text-slate-400 mt-1">ID: {asset.asset_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span className="text-blue-400 font-medium">{platforms.length}</span>
                            <span className="text-slate-400">Platform{platforms.length !== 1 ? 's' : ''}</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onEditAsset(asset)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Edit Asset Type"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onDeleteAsset(asset)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Asset Type"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded Content - Platforms */}
            {isExpanded && (
                <div className="border-t border-slate-700/50 bg-slate-900/30 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-300">Associated Platforms</h4>
                        <button
                            onClick={() => onAddPlatform(asset.asset_id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Platform
                        </button>
                    </div>

                    {platforms.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm">No platforms yet</p>
                            <p className="text-xs text-slate-500 mt-1">Click "Add Platform" to create one</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {platforms.map((platform) => (
                                <div
                                    key={platform.platform_id}
                                    className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            {getPlatformIcon(platform.platform_name)}
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-white">{platform.platform_name}</h5>
                                            <p className="text-xs text-slate-500">{platform.platform_id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                            Active
                                        </span>
                                        <button
                                            onClick={() => onEditPlatform(platform)}
                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                            title="Edit Platform"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDeletePlatform(platform)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Delete Platform"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
