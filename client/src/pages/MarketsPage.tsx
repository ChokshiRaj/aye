import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import api from '../api/axios';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export function MarketsPage() {
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'indices' | 'metals' | 'forex' | 'crypto'>('indices');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [indices, setIndices] = useState<any[]>([]);
  const [movers, setMovers] = useState<{ gainers: any[]; losers: any[] }>({ gainers: [], losers: [] });
  const [metals, setMetals] = useState<any>(null);
  const [forex, setForex] = useState<any[]>([]);
  const [crypto, setCrypto] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Converter states
  const [convertAmount, setConvertAmount] = useState<number>(1);
  const [convertFrom, setConvertFrom] = useState<string>('USD');
  const [convertTo, setConvertTo] = useState<string>('INR');
  const [convertResult, setConvertResult] = useState<number | null>(null);

  // Gold carat selector (true for 24K, false for 22K)
  const [gold24kSelect, setGold24kSelect] = useState<boolean>(true);

  // Fetch all market data
  const fetchMarketData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // Fetch settings first to check showCrypto
      const settingsRes = await api.get('/api/settings');
      if (settingsRes.data?.success) {
        setSettings(settingsRes.data.data);
      }

      // Fetch active tab data
      if (activeTab === 'indices') {
        const [indRes, movRes] = await Promise.all([
          api.get('/api/markets/indices'),
          api.get('/api/markets/movers'),
        ]);
        if (indRes.data?.success) setIndices(indRes.data.data);
        if (movRes.data?.success) setMovers(movRes.data.data);
      } else if (activeTab === 'metals') {
        const metRes = await api.get('/api/markets/metals');
        if (metRes.data?.success) setMetals(metRes.data.data);
      } else if (activeTab === 'forex') {
        const forRes = await api.get('/api/markets/forex');
        if (forRes.data?.success) {
          setForex(forRes.data.data);
          // Run initial conversion calculation
          calculateConversion(1, 'USD', 'INR', forRes.data.data);
        }
      } else if (activeTab === 'crypto') {
        const cryRes = await api.get('/api/markets/crypto');
        if (cryRes.data?.success) setCrypto(cryRes.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch market data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger fetch when tab changes
  useEffect(() => {
    fetchMarketData();
  }, [activeTab]);

  // Dynamic Auto-Refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Recalculate converter values
  const calculateConversion = (amt: number, from: string, to: string, forexRates: any[] = forex) => {
    if (!forexRates || forexRates.length === 0) return;
    
    // Find rates relative to INR
    const getRate = (code: string) => {
      if (code === 'INR') return 1;
      const found = forexRates.find((f) => f.code === code);
      return found ? found.rate : 1;
    };

    const fromRateInINR = getRate(from);
    const toRateInINR = getRate(to);

    // If 1 fromCode = fromRateInINR INR, and 1 toCode = toRateInINR INR,
    // then 1 fromCode = fromRateInINR / toRateInINR toCode.
    const finalAmount = amt * (fromRateInINR / toRateInINR);
    setConvertResult(finalAmount);
  };

  useEffect(() => {
    calculateConversion(convertAmount, convertFrom, convertTo);
  }, [convertAmount, convertFrom, convertTo, forex]);

  // Format currency values
  const formatCurrency = (val: number, options: { decimals?: number; currency?: string } = {}) => {
    const decimals = options.decimals !== undefined ? options.decimals : 2;
    const formatted = val.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return options.currency ? `${options.currency} ${formatted}` : formatted;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-250 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Navigation Layout */}
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        
        {/* Desktop Header */}
        <header className="sticky top-0 z-40 hidden w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#0a0a0a]/80 md:block">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-650 hover:bg-slate-100 hover:text-slate-800 dark:border-[#1f1f1f] dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 dark:hover:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-950 dark:text-white">Markets & Finance</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-widest font-semibold">
                  Real-time indices, metals, forex & crypto
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchMarketData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#0a0a0a]/90 md:hidden">
          <span className="text-base font-black text-slate-900 dark:text-white">Markets</span>
          <button
            onClick={() => fetchMarketData(true)}
            disabled={refreshing}
            className="rounded-lg p-1.5 text-slate-550 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Content Wrapper */}
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          
          {/* Tabs Container */}
          <div className="flex border-b border-slate-200 dark:border-[#1f1f1f] mb-6 overflow-x-auto scrollbar-none whitespace-nowrap">
            {(['indices', 'metals', 'forex', 'crypto'] as const).map((tab) => {
              const label = tab.charAt(0).toUpperCase() + tab.slice(1);
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 flex-1 sm:flex-none text-center px-4 sm:px-6 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
                      : 'border-transparent text-slate-450 hover:text-slate-850 dark:text-slate-500 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Loader or Content */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-600" />
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                Fetching real-time quotes...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-950/20 dark:bg-red-950/10">
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">{error}</p>
              <button
                onClick={() => fetchMarketData()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try Again
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">
              
              {/* TAB 1: INDICES */}
              {activeTab === 'indices' && (
                <div className="space-y-8">
                  {/* Indices Cards Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {indices.map((ind) => {
                      const isPositive = ind.change >= 0;
                      return (
                        <div
                          key={ind.symbol}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-semibold text-slate-400">{ind.name}</p>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                                {formatCurrency(ind.price)}
                              </h3>
                            </div>
                            <span
                              className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-bold ${
                                isPositive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                              }`}
                            >
                              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isPositive ? '+' : ''}
                              {formatCurrency(ind.changePercent)}%
                            </span>
                          </div>

                          {/* Sparkline Chart */}
                          {ind.sparkline && ind.sparkline.length > 0 && (
                            <div className="mt-4 h-12 w-full">
                              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <LineChart data={ind.sparkline.map((price: number, idx: number) => ({ idx, price }))}>
                                  <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke={isPositive ? '#10b981' : '#ef4444'}
                                    strokeWidth={1.5}
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
                            <span>H: {formatCurrency(ind.high)}</span>
                            <span>L: {formatCurrency(ind.low)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stock Movers Section */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
                      Indian Stock Movers (Nifty 50 Watchlist)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Gainers */}
                      <div>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-4">
                          <TrendingUp className="h-4.5 w-4.5" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Top 5 Gainers</h4>
                        </div>
                        <div className="rounded-lg border border-slate-100 dark:border-slate-800/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                          {movers.gainers.map((stock) => (
                            <div key={stock.symbol} className="flex justify-between items-center p-3 hover:bg-slate-50/50 dark:hover:bg-[#151515]">
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{stock.symbol}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                  ₹{formatCurrency(stock.price)}
                                </p>
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  +{formatCurrency(stock.changePercent)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Losers */}
                      <div>
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mb-4">
                          <TrendingDown className="h-4.5 w-4.5" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Top 5 Losers</h4>
                        </div>
                        <div className="rounded-lg border border-slate-100 dark:border-slate-800/60 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                          {movers.losers.map((stock) => (
                            <div key={stock.symbol} className="flex justify-between items-center p-3 hover:bg-slate-50/50 dark:hover:bg-[#151515]">
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{stock.symbol}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                  ₹{formatCurrency(stock.price)}
                                </p>
                                <p className="text-[10px] font-bold text-red-650 dark:text-red-400 mt-0.5">
                                  {formatCurrency(stock.changePercent)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: METALS */}
              {activeTab === 'metals' && metals && (
                <div className="space-y-8">
                  {/* Metal Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gold Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <span className="text-lg">⭐</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Gold Price (Vadodara/India)</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-905 dark:text-white mt-2">
                            ₹{formatCurrency(gold24kSelect ? metals.gold24k : metals.gold22k)}
                            <span className="text-xs font-semibold text-slate-400 ml-1.5">per 10g</span>
                          </h3>
                        </div>

                        {/* Carat Selector */}
                        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 self-start sm:self-auto">
                          <button
                            onClick={() => setGold24kSelect(true)}
                            className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
                              gold24kSelect
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            24K
                          </button>
                          <button
                            onClick={() => setGold24kSelect(false)}
                            className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
                              !gold24kSelect
                                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            22K
                          </button>
                        </div>
                      </div>

                      {/* Gold 7-Day Area Chart */}
                      <div className="mt-6 h-56 w-full">
                        {metals.history?.gold && metals.history.gold.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={metals.history.gold}>
                              <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1e293b',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  color: '#fff',
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#goldGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400">Saving historical closing quotes... snapshot updates at 6 PM IST daily</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Silver Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1 text-slate-400">
                            <span className="text-lg">💿</span>
                            <span className="text-xs font-bold uppercase tracking-wider">Silver Price (Vadodara/India)</span>
                          </div>
                          <h3 className="text-2xl font-black text-slate-905 dark:text-white mt-2">
                            ₹{formatCurrency(metals.silver)}
                            <span className="text-xs font-semibold text-slate-400 ml-1.5">per kg</span>
                          </h3>
                        </div>
                      </div>

                      {/* Silver 7-Day Area Chart */}
                      <div className="mt-6 h-56 w-full">
                        {metals.history?.silver && metals.history.silver.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={metals.history.silver}>
                              <defs>
                                <linearGradient id="silverGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#1e293b',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  color: '#fff',
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#94a3b8"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#silverGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            <span className="text-[10px] text-slate-400">Saving historical closing quotes... snapshot updates at 6 PM IST daily</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FOREX */}
              {activeTab === 'forex' && forex.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Currency converter panel */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] h-fit">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                      <ArrowUpDown className="h-4.5 w-4.5 text-red-650" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Currency Converter
                      </h3>
                    </div>

                    <div className="mt-6 space-y-4">
                      {/* Amount */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</label>
                        <input
                          type="number"
                          value={convertAmount}
                          onChange={(e) => setConvertAmount(Number(e.target.value))}
                          className="mt-1 w-full rounded-lg border border-slate-350 bg-white/50 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      {/* Convert Options */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">From</label>
                          <select
                            value={convertFrom}
                            onChange={(e) => setConvertFrom(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-350 bg-white/50 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="INR">INR - Rupee</option>
                            {forex.map((f) => (
                              <option key={`from-${f.code}`} value={f.code}>{f.code} - {f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">To</label>
                          <select
                            value={convertTo}
                            onChange={(e) => setConvertTo(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-350 bg-white/50 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          >
                            <option value="INR">INR - Rupee</option>
                            {forex.map((f) => (
                              <option key={`to-${f.code}`} value={f.code}>{f.code} - {f.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Converter Result */}
                      {convertResult !== null && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-[#151515]/30 text-center mt-6">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Conversion Result</p>
                          <h4 className="text-xl font-black text-red-650 dark:text-red-500 mt-1">
                            {formatCurrency(convertAmount, { decimals: 2 })} {convertFrom} =
                          </h4>
                          <h3 className="text-2xl font-black text-slate-905 dark:text-white mt-1">
                            {formatCurrency(convertResult, { decimals: 4 })} {convertTo}
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rates Grids */}
                  <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider">
                      Currency Exchange Rates (Relative to INR)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {forex.map((curr) => {
                        const isPositive = curr.change >= 0;
                        return (
                          <div
                            key={curr.code}
                            className="flex justify-between items-center rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-[#151515]/20"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {curr.code} / INR
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{curr.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900 dark:text-white">
                                ₹{formatCurrency(curr.rate, { decimals: 4 })}
                              </p>
                              <span
                                className={`inline-flex items-center gap-0.5 text-[10px] font-bold mt-1 ${
                                  isPositive ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {isPositive ? '+' : ''}
                                {formatCurrency(curr.changePercent)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CRYPTO */}
              {activeTab === 'crypto' && (
                <div>
                  {settings?.showCrypto ? (
                    <div className="space-y-4">
                      {crypto.map((coin) => {
                        const isPositive = coin.change >= 0;
                        return (
                          <div
                            key={coin.id}
                            className="flex justify-between items-center rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] gap-2 hover:border-slate-350 dark:hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {coin.image && <img src={coin.image} alt={coin.name} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0" />}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                                  {coin.name}
                                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase shrink-0">{coin.symbol}</span>
                                </h4>
                                <p className="text-[9px] sm:text-[10px] text-slate-450 mt-0.5 truncate">Ranked Coin Data</p>
                              </div>
                            </div>

                            {/* Sparkline Chart */}
                            {coin.sparkline && coin.sparkline.length > 0 && (
                              <div className="h-8 w-16 sm:w-28 shrink-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                  <LineChart data={coin.sparkline.map((price: number, idx: number) => ({ idx, price }))}>
                                    <Line
                                      type="monotone"
                                      dataKey="price"
                                      stroke={isPositive ? '#10b981' : '#ef4444'}
                                      strokeWidth={1.5}
                                      dot={false}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            <div className="flex gap-4 sm:gap-8 items-center justify-end shrink-0 text-right">
                              <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white">
                                  ₹{formatCurrency(coin.price, { decimals: coin.price < 100 ? 4 : 2 })}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold mt-0.5 ${
                                    isPositive ? 'text-emerald-600' : 'text-red-655'
                                  }`}
                                >
                                  {isPositive ? '+' : ''}
                                  {formatCurrency(coin.changePercent)}%
                                </span>
                              </div>
                              
                              <div className="hidden lg:block text-right text-[10px] text-slate-400">
                                <p>High: ₹{formatCurrency(coin.high, { decimals: coin.price < 100 ? 4 : 2 })}</p>
                                <p className="mt-0.5">Low: ₹{formatCurrency(coin.low, { decimals: coin.price < 100 ? 4 : 2 })}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-105 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-905 dark:text-white mt-4">
                        Crypto Tracking is Disabled
                      </h3>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mt-2 max-w-sm mx-auto leading-normal">
                        Crypto tab index data is hidden. Turn on the crypto widget visibility setting in Settings &gt; Widget Configurations to view real-time coin stats.
                      </p>
                      <button
                        onClick={() => navigate('/settings')}
                        className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                      >
                        Configure Settings
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Mobile navigation bar */}
      <BottomNav activeTab="more" />

    </div>
  );
}

export default MarketsPage;
