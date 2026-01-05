'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    return (
        <ProtectedRoute>
            {isLoginPage ? (
                // Login page doesn't need sidebar
                <>{children}</>
            ) : (
                // Regular pages with sidebar
                <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <Sidebar />
                    <div className="flex-1 ml-64">
                        {children}
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
