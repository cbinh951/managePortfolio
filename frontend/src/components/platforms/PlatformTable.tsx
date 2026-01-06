'use client';

import React, { useState, useEffect } from 'react';
import { Platform, Asset } from '@/types/models';
import { apiClient } from '@/services/api';

interface PlatformTableProps {
    platforms: Platform[];
    onEdit: (platform: Platform) => void;
    onDelete: (platform: Platform) => void;
    selectedType: string;
}

// Platform type icons and colors
const getPlatformIcon = (type: string | undefined) => {
    if (!type) {
        return {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            ),
            bg: 'bg-slate-500/10',
            text: 'text-slate-400',
        };
    }
    switch (type.toUpperCase()) {
        case 'BROKER':
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                ),
                bg: 'bg-blue-500/10',
                text: 'text-blue-400',
            };
        case 'BANK':
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                ),
                bg: 'bg-green-500/10',
                text: 'text-green-400',
            };
        case 'WALLET':
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                ),
                bg: 'bg-purple-500/10',
                text: 'text-purple-400',
            };
        default:
            return {
                icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                ),
                bg: 'bg-slate-500/10',
                text: 'text-slate-400',
            };
    }
};

export default function PlatformTable({ platforms, onEdit, onDelete, selectedType }: PlatformTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            const data = await apiClient.getAssets();
            setAssets(data);
        } catch (err) {
            console.error('Failed to load assets:', err);
        }
    };

    // Helper to get asset name by ID
    const getAssetName = (assetId: string) => {
        const asset = assets.find(a => a.asset_id === assetId);
        return asset ? asset.asset_name : assetId;
    };

    // Filter platforms based on search and type
    const filteredPlatforms = platforms.filter(platform => {
        const matchesSearch = searchQuery.toLowerCase() === '' ||
            platform.platform_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            platform.platform_id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = selectedType === 'ALL' || platform.platform_name === selectedType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search platforms or institutions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-900/30">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Institution</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Platform ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Asset Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {filteredPlatforms.map((platform) => {
                            const iconConfig = getPlatformIcon(platform.platform_name);
                            return (
                                <tr key={platform.platform_id} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconConfig.bg} ${iconConfig.text}`}>
                                                {iconConfig.icon}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{platform.platform_name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-400">{platform.platform_id}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-300">{getAssetName(platform.asset_id)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(platform)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Edit platform"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onDelete(platform)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Delete platform"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    Showing <span className="font-medium text-white">{filteredPlatforms.length}</span> of{' '}
                    <span className="font-medium text-white">{platforms.length}</span> platforms
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="ml-2 text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                            Clear search
                        </button>
                    )}
                </p>
            </div>
        </div>
    );
}
