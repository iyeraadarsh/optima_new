import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { permissionService } from '@/services/permissionService';
import { PermissionRequest, PermissionResult } from '@/types/rbac';

interface PermissionContextType {
  checkPermission: (request: PermissionRequest) => Promise<boolean>;
  checkPermissionWithResult: (request: PermissionRequest) => Promise<PermissionResult>;
  isLoading: boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType>({
  checkPermission: async () => false,
  checkPermissionWithResult: async () => ({ granted: false }),
  isLoading: true,
  refreshPermissions: () => {},
});

export const usePermission = () => useContext(PermissionContext);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Initialize permissions
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        setIsLoading(true);
        
        // Check if permissions need to be initialized
        const permissions = await permissionService.getAllPermissions();
        
        if (permissions.length === 0) {
          await permissionService.initializeDefaultPermissions();
          await permissionService.initializeDefaultRoles();
        }
      } catch (error) {
        console.error('Error initializing permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, [refreshCounter]);

  const checkPermission = useCallback(
    async (request: PermissionRequest): Promise<boolean> => {
      if (!currentUser || !userProfile) {
        return false;
      }

      // Super admin has access to everything
      if (userProfile.role === 'super_admin') {
        return true;
      }

      try {
        const result = await permissionService.hasPermission(currentUser.uid, request);
        return result.granted;
      } catch (error) {
        console.error('Error checking permission:', error);
        return false;
      }
    },
    [currentUser, userProfile]
  );

  const checkPermissionWithResult = useCallback(
    async (request: PermissionRequest): Promise<PermissionResult> => {
      if (!currentUser || !userProfile) {
        return {
          granted: false,
          reason: 'User not authenticated'
        };
      }

      // Super admin has access to everything
      if (userProfile.role === 'super_admin') {
        return {
          granted: true,
          reason: 'User is super_admin'
        };
      }

      try {
        return await permissionService.hasPermission(currentUser.uid, request);
      } catch (error) {
        console.error('Error checking permission with result:', error);
        return {
          granted: false,
          reason: 'Error checking permission'
        };
      }
    },
    [currentUser, userProfile]
  );

  const refreshPermissions = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return (
    <PermissionContext.Provider
      value={{
        checkPermission,
        checkPermissionWithResult,
        isLoading,
        refreshPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}