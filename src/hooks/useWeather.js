import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay } from 'date-fns';

const WEATHER_CACHE_KEY = 'pixel-calendar-weather-cache';
const WEATHER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function getCacheKey(lat, lon) {
    const safeLat = Number(lat).toFixed(4);
    const safeLon = Number(lon).toFixed(4);
    return `${safeLat},${safeLon}`;
}

function loadCachedWeather(cacheKey) {
    try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        const entry = cache?.[cacheKey];
        if (!entry?.weatherMap || !entry.savedAt) return null;
        if (Date.now() - entry.savedAt > WEATHER_CACHE_TTL_MS) return null;
        return entry;
    } catch {
        return null;
    }
}

function saveCachedWeather(cacheKey, weatherMap) {
    try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        const cache = raw ? JSON.parse(raw) : {};
        cache[cacheKey] = { savedAt: Date.now(), weatherMap };
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Ignore unavailable storage; live weather still works.
    }
}

/**
 * useWeather — fetches Open-Meteo forecast (exact window: 3 past days, today, 15 future days).
 * Completely removes dummy/mock data; invalid dates remain empty.
 * weatherMap: { 'yyyy-MM-dd': { code, tempMax, tempMin, etc. } }
 * @param {{ lat: number, lon: number, locationName: string }} location
 */
export function useWeather(location) {
    const [weatherMap, setWeatherMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [usingCache, setUsingCache] = useState(false);

    // Always false now since we removed mock data logic, kept for App.jsx prop compatibility
    const usingMock = false;

    const { lat, lon, locationName } = location;

    const fetchWeather = useCallback(async ({ silent = false } = {}) => {
        const cacheKey = getCacheKey(lat, lon);
        const cached = loadCachedWeather(cacheKey);

        if (cached) {
            setWeatherMap(cached.weatherMap);
            setLastUpdated(cached.savedAt);
            setUsingCache(true);
        }

        setLoading(true);
        if (!silent) setError(null);

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}&longitude=${lon}` +
            `&current=wind_speed_10m` +
            `&hourly=temperature_2m,precipitation_probability` +
            `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
            `,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
            `&timezone=auto&past_days=3&forecast_days=16`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const todayKey = format(startOfDay(new Date()), 'yyyy-MM-dd');
            const currentWindKmh = data.current?.wind_speed_10m ?? null;

            // Group hourly temperatures by date
            const hourlyByDate = {};
            const h = data.hourly;
            if (h && h.time) {
                h.time.forEach((isoStr, i) => {
                    const dateStr = isoStr.slice(0, 10); // 'yyyy-MM-dd'
                    const hour = parseInt(isoStr.slice(11, 13), 10);
                    if (!hourlyByDate[dateStr]) hourlyByDate[dateStr] = [];
                    hourlyByDate[dateStr].push({
                        hour,
                        temp: Math.round(h.temperature_2m[i]),
                        precipProb: h.precipitation_probability?.[i] ?? 0,
                    });
                });
            }

            const d = data.daily;
            const liveMap = {};
            if (d && d.time) {
                d.time.forEach((dateStr, i) => {
                    liveMap[dateStr] = {
                        code: d.weathercode[i],
                        tempMax: Math.round(d.temperature_2m_max[i]),
                        tempMin: Math.round(d.temperature_2m_min[i]),
                        precipProb: d.precipitation_probability_max?.[i] ?? null,
                        windMax: d.wind_speed_10m_max?.[i] != null
                            ? Math.round(d.wind_speed_10m_max[i])
                            : null,
                        sunrise: d.sunrise?.[i] ?? null,
                        sunset: d.sunset?.[i] ?? null,
                        hourly: hourlyByDate[dateStr] ?? [],
                        // Only today gets real-time wind speed
                        ...(dateStr === todayKey && currentWindKmh != null
                            ? { currentWindSpeed: Math.round(currentWindKmh) }
                            : {}),
                    };
                });
            }
            // Overwrites the entire map with the valid 19-day window
            setWeatherMap(liveMap);
            setLastUpdated(Date.now());
            setUsingCache(false);
            setError(null);
            saveCachedWeather(cacheKey, liveMap);
        } catch (err) {
            if (cached) {
                setWeatherMap(cached.weatherMap);
                setLastUpdated(cached.savedAt);
                setUsingCache(true);
            } else {
                setWeatherMap({}); // on error, empty calendar (no dummy data)
                setLastUpdated(null);
                setUsingCache(false);
            }
            setError(err instanceof Error ? err.message : 'Weather unavailable');
        } finally {
            setLoading(false);
        }
    }, [lat, lon]);

    useEffect(() => {
        // Clear old weather and fetch new when location (lat/lon) changes
        setWeatherMap({});
        setError(null);
        setUsingCache(false);
        setLastUpdated(null);
        fetchWeather({ silent: true });
    }, [lat, lon, fetchWeather]);

    const getWeatherForDate = useCallback(
        (dateKey) => weatherMap[dateKey] ?? null,
        [weatherMap]
    );

    const refreshWeather = useCallback(() => fetchWeather(), [fetchWeather]);

    return {
        getWeatherForDate,
        loading,
        usingMock,
        locationName,
        error,
        usingCache,
        lastUpdated,
        refreshWeather,
    };
}
