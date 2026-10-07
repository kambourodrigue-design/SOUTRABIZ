import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-xl animate-bounce border border-amber-400">
      <WifiOff className="w-4 h-4 text-white" />
      <span>Mode Hors-Ligne — Vos ventes sont enregistrées localement !</span>
    </div>
  );
};
