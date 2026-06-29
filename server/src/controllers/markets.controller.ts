import { Request, Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;

// Simple In-memory cache helper
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();

function getCachedData<T>(key: string, maxAgeMs: number): T | null {
  const entry = cacheMap.get(key);
  if (entry && Date.now() - entry.timestamp < maxAgeMs) {
    return entry.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cacheMap.set(key, { data, timestamp: Date.now() });
}

// -----------------------------------------------------------------------------
// Indian Indices Helper (Yahoo Finance)
// -----------------------------------------------------------------------------
async function fetchYahooFinance(symbol: string): Promise<any> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Yahoo Finance for ${symbol}`);
  }
  const json = await res.json() as any;
  const result = json.chart?.result?.[0];
  if (!result) {
    throw new Error(`Invalid Yahoo Finance response for ${symbol}`);
  }

  const meta = result.meta || {};
  const price = meta.regularMarketPrice || 0;
  const prevClose = meta.chartPreviousClose || price || 1;
  const change = price - prevClose;
  const changePercent = (change / prevClose) * 100;
  const high = meta.regularMarketDayHigh || price;
  const low = meta.regularMarketDayLow || price;

  // Extract closing prices for sparkline
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  const filteredCloses = closes.filter((c: any) => typeof c === 'number');

  // Sample to exactly 30 points
  let sparkline: number[] = [];
  if (filteredCloses.length > 0) {
    if (filteredCloses.length <= 30) {
      sparkline = [...filteredCloses];
      // Pad if less than 30
      while (sparkline.length < 30) {
        sparkline.push(sparkline[sparkline.length - 1]);
      }
    } else {
      const step = filteredCloses.length / 30;
      for (let i = 0; i < 30; i++) {
        sparkline.push(filteredCloses[Math.floor(i * step)]);
      }
    }
  }

  return {
    symbol,
    name: getFriendlyIndexName(symbol),
    price,
    change,
    changePercent,
    high,
    low,
    sparkline,
  };
}

function getFriendlyIndexName(symbol: string): string {
  switch (symbol) {
    case '^NSEI': return 'Nifty 50';
    case '^BSESN': return 'Sensex';
    case '^NSEBANK': return 'Nifty Bank';
    case '^CNXIT': return 'Nifty IT';
    default: return symbol;
  }
}

export async function getIndices(_req: Request, res: Response) {
  const cacheKey = 'markets_indices';
  const cached = getCachedData<any>(cacheKey, 5 * 60 * 1000); // 5 min cache
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  const symbols = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT'];
  try {
    const data = await Promise.all(
      symbols.map(async (sym) => {
        try {
          return await fetchYahooFinance(sym);
        } catch (err) {
          console.error(`Error fetching index ${sym}:`, err);
          // Return simulated/fallback data if fetch fails
          const mockPrices: Record<string, number> = {
            '^NSEI': 24180,
            '^BSESN': 79400,
            '^NSEBANK': 52300,
            '^CNXIT': 38900,
          };
          const basePrice = mockPrices[sym] || 1000;
          return {
            symbol: sym,
            name: getFriendlyIndexName(sym),
            price: basePrice,
            change: basePrice * 0.002,
            changePercent: 0.2,
            high: basePrice * 1.005,
            low: basePrice * 0.998,
            sparkline: Array.from({ length: 30 }, (_, i) => basePrice + Math.sin(i / 3) * 100),
          };
        }
      })
    );

    setCachedData(cacheKey, data);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// -----------------------------------------------------------------------------
// Indian Stock Movers Helper
// -----------------------------------------------------------------------------
const MOVERS_WATCHLIST = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'BHARTIARTL.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS',
  'TATAMOTORS.NS', 'TATACONSUM.NS', 'TITAN.NS', 'ASIANPAINT.NS', 'BAJFINANCE.NS',
  'MARUTI.NS', 'SUNPHARMA.NS', 'ADANIENT.NS', 'NTPC.NS', 'POWERGRID.NS',
  'COALINDIA.NS', 'ONGC.NS', 'JSWSTEEL.NS', 'TATASTEEL.NS', 'HCLTECH.NS',
  'WIPRO.NS', 'TECHM.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'GRASIM.NS',
];

export async function getMovers(_req: Request, res: Response) {
  const cacheKey = 'markets_movers';
  const cached = getCachedData<any>(cacheKey, 5 * 60 * 1000); // 5 min cache
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  try {
    const rawData = await Promise.all(
      MOVERS_WATCHLIST.map(async (ticker) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
          const fetchRes = await fetch(url);
          if (!fetchRes.ok) throw new Error();
          const json = await fetchRes.json() as any;
          const meta = json.chart?.result?.[0]?.meta || {};
          const price = meta.regularMarketPrice || 0;
          const prevClose = meta.chartPreviousClose || price || 1;
          const change = price - prevClose;
          const changePercent = (change / prevClose) * 100;
          return {
            symbol: ticker.replace('.NS', ''),
            name: ticker.replace('.NS', ''),
            price,
            change,
            changePercent,
          };
        } catch {
          // Fallback if Yahoo Finance fails for this ticker
          const randomVal = Math.random() * 4 - 2; // -2% to +2%
          return {
            symbol: ticker.replace('.NS', ''),
            name: ticker.replace('.NS', ''),
            price: 1500 + Math.random() * 500,
            change: randomVal * 15,
            changePercent: randomVal,
          };
        }
      })
    );

    // Sort by changePercent
    const sorted = [...rawData].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sorted.slice(0, 5);
    const losers = sorted.slice(-5).reverse();

    const result = { gainers, losers };
    setCachedData(cacheKey, result);

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// -----------------------------------------------------------------------------
// Metals Handler (GoldAPI)
// -----------------------------------------------------------------------------
export async function getMetals(req: Request, res: Response) {
  const cacheKey = 'markets_metals';
  const cached = getCachedData<any>(cacheKey, 30 * 60 * 1000); // 30 min cache
  
  let currentMetals;
  if (cached) {
    currentMetals = cached;
  } else {
    const userId = (req as any).userId;
    let goldApiKey = process.env.GOLDAPI_KEY;

    if (userId) {
      try {
        const settings = await prisma.settings.findUnique({ where: { userId } });
        if (settings && settings.goldApiKey) {
          goldApiKey = settings.goldApiKey;
        }
      } catch (err) {
        console.error('Failed to load user-specific Gold API Key:', err);
      }
    }

    let goldPriceINR = 0;
    let silverPriceINR = 0;

    if (goldApiKey) {
      try {
        // Fetch Gold
        const goldRes = await fetch('https://www.goldapi.io/api/XAU/INR', {
          headers: { 'x-access-token': goldApiKey },
        });
        const goldJson = await goldRes.json() as any;
        if (goldJson && goldJson.price) {
          // GoldAPI returns per troy oz. Convert to per 10g:
          goldPriceINR = (goldJson.price / 31.1034768) * 10;
        }

        // Fetch Silver
        const silverRes = await fetch('https://www.goldapi.io/api/XAG/INR', {
          headers: { 'x-access-token': goldApiKey },
        });
        const silverJson = await silverRes.json() as any;
        if (silverJson && silverJson.price) {
          // Convert to per kg (1000g):
          silverPriceINR = (silverJson.price / 31.1034768) * 1000;
        }
      } catch (err) {
        console.error('Error calling GoldAPI.io:', err);
      }
    }

    // Fallbacks if GoldAPI failed or credentials unconfigured
    if (!goldPriceINR) {
      goldPriceINR = 72400 + Math.random() * 200; // Simulated Gold per 10g
    }
    if (!silverPriceINR) {
      silverPriceINR = 88500 + Math.random() * 300; // Simulated Silver per kg
    }

    currentMetals = {
      gold24k: goldPriceINR,
      gold22k: goldPriceINR * (22 / 24),
      silver: silverPriceINR,
      updatedAt: new Date().toISOString(),
    };

    setCachedData(cacheKey, currentMetals);
  }

  // Fetch last 7 days of closing prices from DB for charting
  try {
    const history = await prisma.metalPriceHistory.findMany({
      orderBy: { date: 'asc' },
      take: 14, // gold + silver = 7 days * 2
    });

    const goldHistory = history
      .filter((h: any) => h.metal === 'gold')
      .map((h: any) => ({ date: h.date.toISOString().split('T')[0], price: h.priceINR }))
      .slice(-7);

    const silverHistory = history
      .filter((h: any) => h.metal === 'silver')
      .map((h: any) => ({ date: h.date.toISOString().split('T')[0], price: h.priceINR }))
      .slice(-7);

    return res.status(200).json({
      success: true,
      data: {
        ...currentMetals,
        history: {
          gold: goldHistory,
          silver: silverHistory,
        },
      },
    });
  } catch (error: any) {
    return res.status(200).json({
      success: true,
      data: {
        ...currentMetals,
        history: { gold: [], silver: [] },
      },
    });
  }
}

// -----------------------------------------------------------------------------
// Forex Handler (Frankfurter & ExchangeRate API)
// -----------------------------------------------------------------------------
export async function getForex(_req: Request, res: Response) {
  const cacheKey = 'markets_forex';
  const cached = getCachedData<any>(cacheKey, 60 * 60 * 1000); // 1 hour cache
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  try {
    // We get latest rates from Frankfurter
    const latestRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,GBP,JPY,AED,SGD,CAD,CHF');
    const latestJson = await latestRes.json() as any;
    const latestRates = latestJson.rates || {};

    // Get historical rate to compute daily change
    // Frankfurter preceding Friday if weekend, but let's query 1 day ago
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dateStr = oneDayAgo.toISOString().split('T')[0];

    const histRes = await fetch(`https://api.frankfurter.app/${dateStr}?from=USD&to=INR,EUR,GBP,JPY,AED,SGD,CAD,CHF`);
    let histRates: Record<string, number> = {};
    if (histRes.ok) {
      const histJson = await histRes.json() as any;
      histRates = histJson.rates || {};
    }

    const rates = latestRates;
    const rateINR = rates.INR || 83.5;
    const prevRateINR = histRates.INR || rateINR;

    const currencies = [
      { code: 'USD', name: 'US Dollar', rateKey: 'USD', baseRate: 1 },
      { code: 'EUR', name: 'Euro', rateKey: 'EUR' },
      { code: 'GBP', name: 'British Pound', rateKey: 'GBP' },
      { code: 'JPY', name: 'Japanese Yen', rateKey: 'JPY' },
      { code: 'AED', name: 'UAE Dirham', rateKey: 'AED' },
      { code: 'SGD', name: 'Singapore Dollar', rateKey: 'SGD' },
      { code: 'CAD', name: 'Canadian Dollar', rateKey: 'CAD' },
      { code: 'CHF', name: 'Swiss Franc', rateKey: 'CHF' },
    ];

    const data = currencies.map((curr) => {
      // Calculate rate relative to INR:
      // If 1 USD = rateINR INR, and 1 USD = currRate USD-Currs,
      // then 1 USD-Curr = rateINR / currRate INR.
      const currRate = curr.rateKey === 'USD' ? 1 : rates[curr.rateKey] || 1;
      const prevCurrRate = curr.rateKey === 'USD' ? 1 : histRates[curr.rateKey] || currRate;

      const priceINR = rateINR / currRate;
      const prevPriceINR = prevRateINR / prevCurrRate;

      const change = priceINR - prevPriceINR;
      const changePercent = (change / prevPriceINR) * 100;

      return {
        code: curr.code,
        name: curr.name,
        rate: priceINR,
        change: isNaN(change) ? 0.02 : change,
        changePercent: isNaN(changePercent) ? 0.05 : changePercent,
      };
    });

    setCachedData(cacheKey, data);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Forex fetch error, returning mock forex:', error);
    // Forex fallback rates
    const fallbackRates = [
      { code: 'USD', name: 'US Dollar', rate: 83.52, change: 0.05, changePercent: 0.06 },
      { code: 'EUR', name: 'Euro', rate: 89.28, change: -0.12, changePercent: -0.13 },
      { code: 'GBP', name: 'British Pound', rate: 105.74, change: 0.14, changePercent: 0.13 },
      { code: 'JPY', name: 'Japanese Yen', rate: 0.523, change: -0.001, changePercent: -0.19 },
      { code: 'AED', name: 'UAE Dirham', rate: 22.74, change: 0.01, changePercent: 0.04 },
      { code: 'SGD', name: 'Singapore Dollar', rate: 61.64, change: 0.08, changePercent: 0.13 },
      { code: 'CAD', name: 'Canadian Dollar', rate: 61.12, change: -0.05, changePercent: -0.08 },
      { code: 'CHF', name: 'Swiss Franc', rate: 93.42, change: 0.22, changePercent: 0.24 },
    ];
    return res.status(200).json({ success: true, data: fallbackRates });
  }
}

// -----------------------------------------------------------------------------
// Crypto Handler (CoinGecko)
// -----------------------------------------------------------------------------
export async function getCrypto(_req: Request, res: Response) {
  const cacheKey = 'markets_crypto';
  const cached = getCachedData<any>(cacheKey, 5 * 60 * 1000); // 5 min cache
  if (cached) {
    return res.status(200).json({ success: true, data: cached });
  }

  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=bitcoin,ethereum,solana,binancecoin,ripple&order=market_cap_desc&sparkline=true';
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) throw new Error('CoinGecko request failed');
    const json = (await fetchRes.json() as any[]);

    const data = json.map((coin: any) => {
      const closes = coin.sparkline_in_7d?.price || [];
      // Sample 168 points down to 30 points
      let sparkline: number[] = [];
      if (closes.length > 0) {
        const step = closes.length / 30;
        for (let i = 0; i < 30; i++) {
          sparkline.push(closes[Math.floor(i * step)]);
        }
      }
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        price: coin.current_price,
        change: coin.price_change_24h || 0,
        changePercent: coin.price_change_percentage_24h || 0,
        high: coin.high_24h || coin.current_price,
        low: coin.low_24h || coin.current_price,
        sparkline,
      };
    });

    setCachedData(cacheKey, data);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Crypto fetch error, returning mock crypto:', error);
    // Crypto fallback
    const fallbackCrypto = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 5420000, change: 12000, changePercent: 0.22, sparkline: Array.from({ length: 30 }, () => 5420000 + Math.random() * 5000) },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 292000, change: -4500, changePercent: -1.52, sparkline: Array.from({ length: 30 }, () => 292000 + Math.random() * 2000) },
      { id: 'solana', symbol: 'SOL', name: 'Solana', price: 12400, change: 480, changePercent: 4.02, sparkline: Array.from({ length: 30 }, () => 12400 + Math.random() * 150) },
      { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 48200, change: -120, changePercent: -0.25, sparkline: Array.from({ length: 30 }, () => 48200 + Math.random() * 300) },
      { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: 42.4, change: 0.8, changePercent: 1.92, sparkline: Array.from({ length: 30 }, () => 42.4 + Math.random() * 0.5) },
    ];
    return res.status(200).json({ success: true, data: fallbackCrypto });
  }
}
