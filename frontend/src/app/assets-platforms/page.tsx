'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Asset, Platform } from '@/types/models';
import AssetSection from '@/components/assets-platforms/AssetSection';
import CreateAssetModal from '@/components/asset-types/CreateAssetModal';
import EditAssetModal from '@/components/asset-types/EditAssetModal';
import DeleteConfirmModal from '@/components/asset-types/DeleteConfirmModal';
import CreatePlatformModal from '@/components/platforms/CreatePlatformModal';
import EditPlatformModal from '@/components/platforms/EditPlatformModal';
import DeletePlatformConfirmModal from '@/components/platforms/DeleteConfirmModal';

const LayersIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const GridIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
    </svg>
);

export default function AssetsPlatformsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

    // Modal states for assets
    const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
    const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
    const [isDeleteAssetModalOpen, setIsDeleteAssetModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // Modal states for platforms
    const [isCreatePlatformModalOpen, setIsCreatePlatformModalOpen] = useState(false);
    const [isEditPlatformModalOpen, setIsEditPlatformModalOpen] = useState(false);
    const [isDeletePlatformModalOpen, setIsDeletePlatformModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
    const [preSelectedAssetId, setPreSelectedAssetId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assetsData, platformsData] = await Promise.all([
                apiClient.getAssets(),
                apiClient.getPlatforms(),
            ]);
            setAssets(assetsData);
            setPlatforms(platformsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssetExpansion = (assetId: string) => {
        setExpandedAssets((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(assetId)) {
                newSet.delete(assetId);
            } else {
                newSet.add(assetId);
            }
            return newSet;
        });
    };

    // Asset CRUD handlers
    const handleCreateAsset = async (data: { asset_name: string; asset_type: string }) => {
        return await apiClient.createAsset(data);
    };

    const handleUpdateAsset = async (id: string, data: { asset_name?: string; asset_type?: string }) => {
        return await apiClient.updateAsset(id, data);
    };

    const handleDeleteAsset = async (id: string) => {
        await apiClient.deleteAsset(id);
    };

    const handleEditAsset = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsEditAssetModalOpen(true);
    };

    const handleDeleteAssetClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDeleteAssetModalOpen(true);
    };

    // Platform CRUD handlers
    const handleCreatePlatform = async (data: { platform_name: string; asset_id: string }) => {
        // @ts-ignore - API client type update pending
        return await apiClient.createPlatform(data);
    };

    const handleUpdatePlatform = async (id: string, data: { platform_name?: string; asset_id?: string }) => {
        // @ts-ignore - API client type update pending
        return await apiClient.updatePlatform(id, data);
    };

    const handleDeletePlatform = async (id: string) => {
        await apiClient.deletePlatform(id);
    };

    const handleAddPlatform = (assetId: string) => {
        setPreSelectedAssetId(assetId);
        setIsCreatePlatformModalOpen(true);
    };

    const handleEditPlatform = (platform: Platform) => {
        setSelectedPlatform(platform);
        setIsEditPlatformModalOpen(true);
    };

    const handleDeletePlatformClick = (platform: Platform) => {
        setSelectedPlatform(platform);
        setIsDeletePlatformModalOpen(true);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Assets & Platforms
                        </h1>
                        <p className="text-slate-400">
                            Manage asset types and their associated platforms in one place
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateAssetModalOpen(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Asset Type
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">Total Asset Types</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? '...' : assets.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-slate-700/30 rounded-lg flex items-center justify-center">
                                <LayersIcon />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">Total Platforms</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? '...' : platforms.length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-slate-700/30 rounded-lg flex items-center justify-center">
                                <GridIcon />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Asset Sections */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/20 border border-slate-700/30 rounded-xl">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-slate-400 text-lg">No asset types yet</p>
                        <p className="text-slate-500 text-sm mt-2">Click "Add Asset Type" to create your first one</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assets.map((asset) => {
                            const assetPlatforms = platforms.filter((p) => p.asset_id === asset.asset_id);
                            return (
                                <AssetSection
                                    key={asset.asset_id}
                                    asset={asset}
                                    platforms={assetPlatforms}
                                    isExpanded={expandedAssets.has(asset.asset_id)}
                                    onToggle={() => toggleAssetExpansion(asset.asset_id)}
                                    onEditAsset={handleEditAsset}
                                    onDeleteAsset={handleDeleteAssetClick}
                                    onAddPlatform={handleAddPlatform}
                                    onEditPlatform={handleEditPlatform}
                                    onDeletePlatform={handleDeletePlatformClick}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Asset Modals */}
            <CreateAssetModal
                isOpen={isCreateAssetModalOpen}
                onClose={() => setIsCreateAssetModalOpen(false)}
                onSuccess={loadData}
                onCreate={handleCreateAsset}
            />

            <EditAssetModal
                isOpen={isEditAssetModalOpen}
                asset={selectedAsset}
                onClose={() => {
                    setIsEditAssetModalOpen(false);
                    setSelectedAsset(null);
                }}
                onSuccess={loadData}
                onUpdate={handleUpdateAsset}
            />

            <DeleteConfirmModal
                isOpen={isDeleteAssetModalOpen}
                asset={selectedAsset}
                onClose={() => {
                    setIsDeleteAssetModalOpen(false);
                    setSelectedAsset(null);
                }}
                onSuccess={loadData}
                onDelete={handleDeleteAsset}
            />

            {/* Platform Modals */}
            <CreatePlatformModal
                isOpen={isCreatePlatformModalOpen}
                onClose={() => {
                    setIsCreatePlatformModalOpen(false);
                    setPreSelectedAssetId('');
                }}
                onSuccess={loadData}
                onCreate={handleCreatePlatform}
                preSelectedAssetId={preSelectedAssetId}
            />

            <EditPlatformModal
                isOpen={isEditPlatformModalOpen}
                platform={selectedPlatform}
                onClose={() => {
                    setIsEditPlatformModalOpen(false);
                    setSelectedPlatform(null);
                }}
                onSuccess={loadData}
                onUpdate={handleUpdatePlatform}
            />

            <DeletePlatformConfirmModal
                isOpen={isDeletePlatformModalOpen}
                platform={selectedPlatform}
                onClose={() => {
                    setIsDeletePlatformModalOpen(false);
                    setSelectedPlatform(null);
                }}
                onSuccess={loadData}
                onDelete={handleDeletePlatform}
            />
        </main>
    );
}
