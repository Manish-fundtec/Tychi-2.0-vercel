'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

/**
 * ProtectedRoute component for Next.js App Router
 * Redirects to 403 page if user doesn't have required permission
 * 
 * @param {Object} props
 * @param {string} props.module - Module key (e.g., 'trade', 'fund', 'pricing')
 * @param {string} props.action - Action type (e.g., 'can_view', 'can_add', 'can_edit', 'can_delete')
 * @param {React.ReactNode} props.children - Child components to render if permission is granted
 * @param {string} props.redirectTo - Optional redirect path (defaults to '/403')
 */
const ProtectedRoute = ({ module, action, children, redirectTo = '/403' }) => {
  const hasPermission = usePermission(module, action);
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission) {
      router.push(redirectTo);
    }
  }, [hasPermission, router, redirectTo]);

  // Don't render children if no permission
  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
