'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Platform } from '@/types/models';
import PlatformCard from '@/components/platforms/PlatformCard';
import PlatformTable from '@/components/platforms/PlatformTable';
import CreatePlatformModal from '@/components/platforms/CreatePlatformModal';
import EditPlatformModal from '@/components/platforms/EditPlatformModal';
import DeleteConfirmModal from '@/components/platforms/DeleteConfirmModal';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrencySymbol } from '@/utils/currencyUtils';

const LayersIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const ClockIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DollarIcon = () => (
    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

type FilterType = 'ALL' | 'BROKER' | 'BANK' | 'WALLET';

export default function PlatformsPage() {
    const { settings } = useSettings();
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<FilterType>('ALL');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const platformsData = await apiClient.getPlatforms();
            setPlatforms(platformsData);
        } catch (error) {
            console.error('Failed to fetch platforms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: { platform_name: string; platform_type: string; asset_id: string }) => {
        return await apiClient.createPlatform(data);
    };

    const handleUpdate = async (id: string, data: { platform_name?: string; platform_type?: string; asset_id?: string }) => {
        return await apiClient.updatePlatform(id, data);
    };

    const handleDelete = async (id: string) => {
        await apiClient.deletePlatform(id);
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

    const handleEditClick = (platform: Platform) => {
        setSelectedPlatform(platform);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (platform: Platform) => {
        setSelectedPlatform(platform);
        setIsDeleteModalOpen(true);
    };

    const filterButtons: { label: string; value: FilterType }[] = [
        { label: 'All Types', value: 'ALL' },
        { label: 'Brokerage', value: 'BROKER' },
        { label: 'Banking', value: 'BANK' },
        { label: 'Wallet', value: 'WALLET' },
    ];

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Platforms & Brokers</h1>
                        <p className="text-slate-400">Manage your connected banks, brokerages, and wallets</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Platform
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
                    <PlatformCard
                        title="Total Connected"
                        value={loading ? '...' : platforms.length}
                        subtitle="Active platforms"
                        icon={<LayersIcon />}
                        iconBg="bg-slate-700/30"
                    />
                </div>

                {/* Type Filter Tabs */}
                <div className="flex items-center gap-3 mb-6">
                    {filterButtons.map(({ label, value }) => (
                        <button
                            key={value}
                            onClick={() => setSelectedType(value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedType === value
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Platforms Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <PlatformTable
                        platforms={platforms}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        selectedType={selectedType}
                    />
                )}
            </div>

            {/* Modals */}
            <CreatePlatformModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                onCreate={handleCreate}
            />

            <EditPlatformModal
                isOpen={isEditModalOpen}
                platform={selectedPlatform}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPlatform(null);
                }}
                onSuccess={handleEditSuccess}
                onUpdate={handleUpdate}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                platform={selectedPlatform}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedPlatform(null);
                }}
                onSuccess={handleDeleteSuccess}
                onDelete={handleDelete}
            />
        </main>
    );
}
