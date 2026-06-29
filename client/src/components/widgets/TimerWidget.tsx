import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import api from '../../api/axios';

export function TimerWidget() {
  const [preset, setPreset] = useState(25); // Default to 25 mins
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logFocusSession = async (mins: number) => {
    try {
      await api.post('/api/focus/log', { minutes: mins });
    } catch (err) {
      console.error('Failed to log focus session:', err);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            
            // Trigger browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('AYE Focus', {
                body: 'Focus session complete! Time for a break.',
                icon: '/icons/icon-192.png'
              });
            }

            // Log focus session in DB
            logFocusSession(preset);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, preset]);

  const handlePresetSelect = (mins: number) => {
    setIsRunning(false);
    setPreset(mins);
    setSecondsLeft(mins * 60);
  };

  const toggleTimer = () => {
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(preset * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((preset * 60 - secondsLeft) / (preset * 60)) * 100;

  return (
    <div className="flex h-[240px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-red-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Focus Timer
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-550">
          {preset} Min
        </span>
      </div>

      {/* Preset Selectors */}
      <div className="flex gap-1 justify-center mt-1">
        {[5, 10, 25].map((mins) => (
          <button
            key={mins}
            onClick={() => handlePresetSelect(mins)}
            className={`rounded px-2.5 py-0.5 text-[10px] font-bold transition-all ${
              preset === mins
                ? 'bg-red-600 text-white'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            {mins}M
          </button>
        ))}
      </div>

      {/* Timer Value Display */}
      <div className="relative my-auto flex flex-col items-center justify-center py-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-850 dark:text-slate-100 tabular-nums">
          {formatTime(secondsLeft)}
        </h2>
        {/* Simple Progress Bar */}
        <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-slate-150 dark:bg-slate-800">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 justify-center border-t border-slate-100 pt-2 dark:border-[#1f1f1f]">
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95 ${
            isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-850 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 dark:hover:text-slate-100 transition-all active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

export default TimerWidget;
