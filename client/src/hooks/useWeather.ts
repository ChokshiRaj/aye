import { useState, useEffect } from 'react';
import axios from 'axios';

interface WeatherData {
  temp: number;
  condition: string;
  code: number;
  city: string;
  minTemp?: number;
  maxTemp?: number;
}

export function useWeather(city: string) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Geocode city name to latitude and longitude
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`;
        
        const geoRes = await axios.get(geoUrl);

        if (!geoRes.data.results || geoRes.data.results.length === 0) {
          throw new Error(`City "${city}" not found`);
        }

        const { latitude, longitude, name: resolvedCity } = geoRes.data.results[0];

        // 2. Fetch weather forecast for coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const weatherRes = await axios.get(weatherUrl);

        const current = weatherRes.data.current_weather;
        const daily = weatherRes.data.daily;

        if (!current) {
          throw new Error('Weather data unavailable');
        }

        setData({
          temp: current.temperature,
          condition: getWeatherCondition(current.weathercode),
          code: current.weathercode,
          city: resolvedCity,
          minTemp: daily?.temperature_2m_min?.[0],
          maxTemp: daily?.temperature_2m_max?.[0],
        });
      } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('useWeather error:', err);
        }
        setError(err.message || 'Failed to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  return { data, loading, error };
}

// Convert WMO Weather Interpretation Codes (WW) to readable conditions
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code === 61) return 'Light Rain';
  if (code === 63) return 'Moderate Rain';
  if (code === 65) return 'Heavy Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code === 71) return 'Light Snow';
  if (code === 73) return 'Moderate Snow';
  if (code === 75) return 'Heavy Snow';
  if (code === 77) return 'Snow Grains';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96 && code <= 99) return 'Thunderstorm with Hail';
  return 'Cloudy';
}

export default useWeather;
