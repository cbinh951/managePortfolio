'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Don't redirect if already on login page
        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        }
    }, [isAuthenticated, pathname, router]);

    // Show loading state while checking authentication
    if (!isAuthenticated && pathname !== '/login') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
