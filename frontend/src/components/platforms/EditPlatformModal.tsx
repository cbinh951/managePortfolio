'use client';

import React, { useState, useEffect } from 'react';
import { Platform, Asset } from '@/types/models';
import { apiClient } from '@/services/api';

interface EditPlatformModalProps {
    isOpen: boolean;
    platform: Platform | null;
    onClose: () => void;
    onSuccess: (platform: Platform) => void;
    onUpdate: (id: string, data: { platform_name?: string; asset_id?: string }) => Promise<Platform>;
}

export default function EditPlatformModal({
    isOpen,
    platform,
    onClose,
    onSuccess,
    onUpdate,
}: EditPlatformModalProps) {
    const [platformName, setPlatformName] = useState('');
    // const [platformType, setPlatformType] = useState('BROKER'); // Removed
    const [assetId, setAssetId] = useState('');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (platform) {
            setPlatformName(platform.platform_name);
            // setPlatformType(platform.platform_type);
            setAssetId(platform.asset_id);
        }
    }, [platform]);

    useEffect(() => {
        if (isOpen) {
            loadAssets();
        }
    }, [isOpen]);

    const loadAssets = async () => {
        try {
            const data = await apiClient.getAssets();
            setAssets(data);
        } catch (err) {
            console.error('Failed to load assets:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!platform) return;

        setError('');

        if (!platformName.trim()) {
            setError('Platform name is required');
            return;
        }

        try {
            setLoading(true);
            const updatedPlatform = await onUpdate(platform.platform_id, {
                platform_name: platformName,
                asset_id: assetId,
            });
            onSuccess(updatedPlatform);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update Platform');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    if (!isOpen || !platform) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Edit Platform</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            Platform ID
                        </label>
                        <input
                            type="text"
                            value={platform.platform_id}
                            disabled
                            className="w-full px-4 py-2.5 bg-slate-900/30 border border-slate-700/50 rounded-lg text-slate-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Platform Name *
                        </label>
                        <input
                            type="text"
                            value={platformName}
                            onChange={(e) => setPlatformName(e.target.value)}
                            placeholder="e.g., Fidelity, TD Ameritrade"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Removed Platform Type Input */}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Asset Type *
                        </label>
                        <select
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            disabled={loading}
                        >
                            {assets.map(asset => (
                                <option key={asset.asset_id} value={asset.asset_id}>
                                    {asset.asset_name}
                                </option>
                            ))}
                        </select>
                        {assets.length === 0 && (
                            <p className="text-sm text-slate-400 mt-1">Loading assets...</p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Platform'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
