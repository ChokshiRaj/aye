import { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';

interface FinanceWidgetProps {
  tickers: string[];
}

interface TickerDetails {
  symbol: string;
  price: number;
  change: number;
  history: { value: number }[];
}

export function FinanceWidget({ tickers }: FinanceWidgetProps) {
  const [data, setData] = useState<TickerDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Generate stable mock data using simple hash functions
  const generateMockTickerData = (symbol: string): TickerDetails => {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Scale base price depending on symbol name hash
    let basePrice = Math.abs(hash % 1500) + 100;
    if (symbol.includes('NIFTY')) basePrice = 23450;
    else if (symbol.includes('RELIANCE')) basePrice = 2950;
    else if (symbol.includes('TCS')) basePrice = 3850;
    else if (symbol.includes('BTC')) basePrice = 61200;

    const isPositive = (hash + refreshTrigger) % 2 === 0;
    const changePercent = ((Math.abs(hash % 80) + 5) / 25) * (isPositive ? 1 : -1);

    const history = [];
    let currentVal = basePrice;
    
    // Create 7 data points (sparkline)
    for (let i = 0; i < 7; i++) {
      // Simulate random walk
      const fluctuation = Math.sin(hash + i + refreshTrigger) * 0.015;
      currentVal = currentVal * (1 + fluctuation);
      history.push({ value: parseFloat(currentVal.toFixed(2)) });
    }

    return {
      symbol,
      price: history[history.length - 1].value,
      change: changePercent,
      history,
    };
  };

  useEffect(() => {
    setLoading(true);
    const resolvedTickers = tickers.length > 0 ? tickers : ['NIFTY', 'RELIANCE', 'TCS'];
    const mockData = resolvedTickers.map((sym) => generateMockTickerData(sym));
    setData(mockData);
    setLoading(false);
  }, [tickers, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-[240px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-red-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Market Rates
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Refresh Data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tickers list */}
      <div className="my-2 flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-slate-400">Loading rates...</span>
          </div>
        ) : (
          data.map((ticker) => {
            const isUp = ticker.change >= 0;
            const strokeColor = isUp ? '#10b981' : '#ef4444'; // Green-500 or Red-500

            return (
              <div
                key={ticker.symbol}
                className="flex items-center justify-between rounded-lg border border-slate-50 bg-slate-50/50 p-2.5 dark:border-[#1f1f1f] dark:bg-slate-800/10"
              >
                {/* Symbol & Price */}
                <div className="w-1/3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    {ticker.symbol}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white mt-0.5 tabular-nums">
                    {ticker.symbol.includes('BTC') ? '$' : ''}
                    {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Sparkline Chart */}
                <div className="h-8 w-1/3 px-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={ticker.history}>
                      <defs>
                        <linearGradient id={`grad-${ticker.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={strokeColor}
                        strokeWidth={1.5}
                        fill={`url(#grad-${ticker.symbol})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Change percentage */}
                <div className="flex w-1/4 flex-col items-end">
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}
                  >
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isUp ? '+' : ''}
                    {ticker.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[9px] text-slate-400 dark:text-slate-650 italic">
        ⚠️ Rates are mock simulations | Tickers are editable in settings
      </div>
    </div>
  );
}

export default FinanceWidget;
