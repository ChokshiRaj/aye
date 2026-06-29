import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Check if user dismissed the banner recently
    const dismissedAt = localStorage.getItem('aye_pwa_dismissed_at');
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (diff < sevenDays) {
        return; // Don't show
      }
    }

    // Check if already installed / standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSDevice(ios);

    if (ios) {
      setShowBanner(true);
      return;
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('aye_pwa_dismissed_at', Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-[#1f1f1f] dark:bg-[#111111] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/10 text-red-600 shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Install AYE Dashboard</h4>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
            {isIOSDevice
              ? 'Tap the Share button then select "Add to Home Screen" for the best experience.'
              : 'Add AYE to your home screen for quick offline access and instant updates.'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!isIOSDevice && deferredPrompt && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-red-700 transition-all"
          >
            <Download className="h-3 w-3" /> Install
          </button>
        </div>
      )}

      {isIOSDevice && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500 font-bold border-t border-slate-100 dark:border-[#1f1f1f] pt-2.5">
          <Share className="h-3.5 w-3.5 text-red-600" />
          <span>iOS Share Instruction</span>
        </div>
      )}
    </div>
  );
}
