import React, { useState, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { PermissionRequest } from '@/types/rbac';

interface PermissionGateProps {
  /**
   * Permission request to check
   */
  permission: PermissionRequest;
  /**
   * Content to render if permission is granted
   */
  children: React.ReactNode;
  /**
   * Content to render if permission is denied (optional)
   */
  fallback?: React.ReactNode;
  /**
   * Whether to show loading state
   */
  showLoading?: boolean;
  /**
   * Whether to render nothing when denied (instead of fallback)
   */
  renderNothing?: boolean;
}

/**
 * Component that conditionally renders content based on user permissions
 */
export function PermissionGate({
  permission,
  children,
  fallback,
  showLoading = false,
  renderNothing = false
}: PermissionGateProps) {
  const { checkPermission, isLoading } = usePermission();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserPermission = async () => {
      try {
        const result = await checkPermission(permission);
        setHasPermission(result);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      }
    };

    checkUserPermission();
  }, [checkPermission, permission]);

  // Show loading state if requested and still loading
  if ((isLoading || hasPermission === null) && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    );
  }

  // Render children if permission granted
  if (hasPermission) {
    return <>{children}</>;
  }

  // Render fallback if provided, otherwise render nothing
  if (!renderNothing && fallback) {
    return <>{fallback}</>;
  }

  // Render nothing
  return null;
}
