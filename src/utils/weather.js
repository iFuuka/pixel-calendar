export const WEATHER_REFRESH_MS = 30 * 60 * 1000;
export const WEATHER_STALE_MS = 6 * 60 * 60 * 1000;
const CACHE_KEY = 'pixel-calendar-weather-cache';
const rounded = value => Number.isFinite(value) ? Math.round(value) : null;

export function parseWeather(data) {
    if (!data.daily?.time?.length || !data.hourly?.time?.length) throw new Error('Incomplete forecast');
    const hourly = {};
    data.hourly.time.forEach((time, i) => {
        (hourly[time.slice(0, 10)] ??= []).push({
            hour: Number(time.slice(11, 13)), temp: rounded(data.hourly.temperature_2m?.[i]),
            precipProb: rounded(data.hourly.precipitation_probability?.[i]),
            intervalPrecipProb: rounded(data.hourly.precipitation_probability?.[i + 1]),
        });
    });
    const d = data.daily;
    const currentTime = typeof data.current?.time === 'string' ? data.current.time : null;
    return Object.fromEntries(d.time.map((day, i) => [day, {
        code: d.weather_code?.[i] ?? d.weathercode?.[i] ?? null,
        tempMax: rounded(d.temperature_2m_max?.[i]), tempMin: rounded(d.temperature_2m_min?.[i]),
        precipProb: rounded(d.precipitation_probability_max?.[i]), windMax: rounded(d.wind_speed_10m_max?.[i]),
        sunrise: d.sunrise?.[i] ?? null, sunset: d.sunset?.[i] ?? null,
        hourly: hourly[day] ?? [],
        ...(day === currentTime?.slice(0, 10) ? {
            currentWindSpeed: rounded(data.current.wind_speed_10m),
            currentCode: Number.isInteger(data.current.weather_code) ? data.current.weather_code : null,
            currentIsDay: [0, 1].includes(data.current.is_day) ? data.current.is_day : null,
            currentTime,
        } : {}),
    }]));
}

// A generation guard also rejects late responses after abort, location changes or unmount.
export function createWeatherClient({ request = (...args) => fetch(...args), storage = globalThis.localStorage,
    now = Date.now, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } = {}) {
    let state = { weatherMap: {}, loading: false, error: null, lastUpdated: null, usingCache: false, timezone, now: now() };
    let location, generation = 0, pending = null, lastAttempt = -Infinity;
    const listeners = new Set();
    const publish = patch => { state = { ...state, ...patch, now: now() }; listeners.forEach(fn => fn(state)); };
    const cancel = () => { generation++; pending?.controller.abort(); pending = null; };
    const refresh = (force = false) => {
        publish({});
        // Timers may not have fired while the OS was asleep. Retire that request
        // before a resume/reconnect tries to reuse it.
        if (pending && now() - lastAttempt >= 20000) cancel();
        if (!location || pending || (!force && now() - lastAttempt < (state.error ? 5 * 60000 : WEATHER_REFRESH_MS))) return pending?.promise;
        lastAttempt = now();
        const token = ++generation;
        const controller = new AbortController();
        const active = { controller };
        pending = active;
        publish({ loading: true });
        const timeout = setTimeout(() => controller.abort(), 20000);
        const params = new URLSearchParams({ latitude: location.lat, longitude: location.lon,
            current: 'wind_speed_10m,weather_code,is_day', hourly: 'temperature_2m,precipitation_probability',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset',
            timezone, past_days: '3', forecast_days: '16' });
        active.promise = (async () => {
            try {
                const response = await request(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const weatherMap = parseWeather(await response.json());
                if (token !== generation) return;
                const savedAt = now();
                publish({ weatherMap, lastUpdated: savedAt, usingCache: false, error: null });
                try {
                    const cache = JSON.parse(storage.getItem(CACHE_KEY) || '{}');
                    cache[location.key] = { weatherMap, savedAt, timezone };
                    const entries = Object.entries(cache).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 8);
                    storage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
                } catch { /* Storage failure must not discard live weather. */ }
            } catch (error) {
                if (token === generation) publish({ error: error.message || 'Weather unavailable', usingCache: !!state.lastUpdated });
            } finally {
                clearTimeout(timeout);
                if (token === generation) { pending = null; publish({ loading: false }); }
            }
        })();
        return active.promise;
    };
    return {
        snapshot: () => state,
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, cancel, refresh,
        select(lat, lon) {
            cancel();
            location = { lat, lon, key: `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}` };
            let cached;
            try { cached = JSON.parse(storage.getItem(CACHE_KEY) || '{}')[location.key]; } catch { /* no cache */ }
            // Old cache used city-local hours; do not assign those to device-local events.
            if (cached?.timezone !== timezone || !cached?.weatherMap || !Number.isFinite(cached.savedAt)) cached = null;
            publish({ weatherMap: cached?.weatherMap || {}, lastUpdated: cached?.savedAt || null,
                usingCache: !!cached, error: null, loading: false });
            return refresh(true);
        },
    };
}
