
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkStatus() {
  const isOnline = useNetworkStatus();
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      const timer = setTimeout(() => setShowOffline(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showOffline) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-lg ${
      isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Some features may be limited.</span>
        </>
      )}
    </div>
  );
}
