import { useWeather } from '../../hooks/useWeather';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Loader,
  Navigation,
  Thermometer,
  ShieldAlert,
} from 'lucide-react';

interface WeatherWidgetProps {
  city: string;
}

export function WeatherWidget({ city }: WeatherWidgetProps) {
  const { data, loading, error } = useWeather(city);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-8 w-8 text-amber-500 animate-pulse" />;
    if (code === 1 || code === 2) return <CloudSun className="h-8 w-8 text-amber-400" />;
    if (code === 3 || code === 45 || code === 48) return <Cloud className="h-8 w-8 text-slate-400" />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return <CloudRain className="h-8 w-8 text-red-400" />;
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return <CloudSnow className="h-8 w-8 text-sky-300" />;
    }
    if (code >= 95 && code <= 99) return <CloudLightning className="h-8 w-8 text-purple-400" />;
    return <CloudSun className="h-8 w-8 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
        <Loader className="h-6 w-6 animate-spin text-red-500" />
        <span className="mt-2 text-xs text-slate-400">Fetching weather...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Weather Forecast
          </span>
          <ShieldAlert className="h-4 w-4 text-red-500" />
        </div>
        <div className="py-2 text-center">
          <p className="text-xs text-red-500 font-semibold">{error || 'Unable to load weather'}</p>
          <p className="mt-1 text-[10px] text-slate-400">Configure city in settings</p>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <Navigation className="h-3 w-3" />
          <span>{city || 'No city set'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
          Weather Forecast
        </span>
        <Navigation className="h-3.5 w-3.5 text-red-500" />
      </div>

      <div className="my-auto flex items-center justify-between py-2">
        <div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
            {data.temp.toFixed(1)}°C
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {data.condition}
          </p>
        </div>
        <div>{getWeatherIcon(data.code)}</div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {data.city}
        </span>
        {data.minTemp !== undefined && data.maxTemp !== undefined && (
          <div className="flex items-center gap-1 text-[11px]">
            <Thermometer className="h-3 w-3 text-slate-400" />
            <span>L: {data.minTemp.toFixed(0)}°</span>
            <span>H: {data.maxTemp.toFixed(0)}°</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeatherWidget;
