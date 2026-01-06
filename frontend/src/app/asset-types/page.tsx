'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Asset, Platform } from '@/types/models';
import AssetTypeCard from '@/components/asset-types/AssetTypeCard';
import AssetTypeTable from '@/components/asset-types/AssetTypeTable';
import CreateAssetModal from '@/components/asset-types/CreateAssetModal';
import EditAssetModal from '@/components/asset-types/EditAssetModal';
import DeleteConfirmModal from '@/components/asset-types/DeleteConfirmModal';
import AssetDetailModal from '@/components/asset-types/AssetDetailModal';

// Icons for stat cards
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

const PlugIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export default function AssetTypesPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

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
            console.error('Failed to fetch asset types:', error);
        } finally {
            setLoading(false);
        }
    };

    // CRUD handlers
    const handleCreate = async (data: { asset_name: string; asset_type: string }) => {
        return await apiClient.createAsset(data);
    };

    const handleUpdate = async (id: string, data: { asset_name?: string; asset_type?: string }) => {
        return await apiClient.updateAsset(id, data);
    };

    const handleDelete = async (id: string) => {
        await apiClient.deleteAsset(id);
    };

    const handleCreateSuccess = () => {
        loadData();
    };

    const handleEditSuccess = () => {
        loadData();
    };

    const handleDeleteSuccess = () => {
        loadData();
    };

    const handleEditClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDeleteModalOpen(true);
    };

    const handleViewDetailsClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDetailModalOpen(true);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            Asset Type Management
                        </h1>
                        <p className="text-slate-400">
                            Manage and configure asset classifications, integrations, and display settings.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Asset Type
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
                    <AssetTypeCard
                        title="Total Asset Types"
                        value={loading ? '...' : assets.length}
                        subtitle="+2 this month"
                        icon={<LayersIcon />}
                        iconBg="bg-slate-700/30"
                    />
                </div>

                {/* Asset Types Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <AssetTypeTable
                        assets={assets}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onViewDetails={handleViewDetailsClick}
                    />
                )}
            </div>

            {/* Modals */}
            <CreateAssetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                onCreate={handleCreate}
            />

            <EditAssetModal
                isOpen={isEditModalOpen}
                asset={selectedAsset}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedAsset(null);
                }}
                onSuccess={handleEditSuccess}
                onUpdate={handleUpdate}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                asset={selectedAsset}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedAsset(null);
                }}
                onSuccess={handleDeleteSuccess}
                onDelete={handleDelete}
            />

            <AssetDetailModal
                isOpen={isDetailModalOpen}
                asset={selectedAsset}
                platforms={platforms}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedAsset(null);
                }}
            />
        </main>
    );
}
