import { useState, useEffect, useCallback, useRef } from 'react';

const SETTINGS_KEY = 'pixel-calendar-settings';

const DEFAULT_SETTINGS = {
    city: '',
    lat: 51.5074,
    lon: -0.1278,
    locationName: 'London',
    tempUnit: 'C',           // 'C' | 'F'
    firstDayOfWeek: 0,       // 0 = Sunday, 1 = Monday
    theme: 'vanilla-sky',    // one of the 5 theme keys
    language: 'en',          // 'en' | 'ru'
    timeFormat: '24',        // '12' | '24'
    autoStart: false,        // Launch on Windows login
    startMinimized: false,   // Start hidden in tray (silent start)
};

const THEME_KEYS = [
    'vanilla-sky',
    'lavender-night',
    'matcha-box',
    'autumn-sunset',
    'terraria-forest',
];

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(data) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch { /* storage unavailable */ }
}

/** Apply data-theme to <html> for CSS variable switching */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

export function useSettings() {
    // Flag to check if we are on a fresh start (empty storage)
    const isFirstLaunchRef = useRef(false);

    const [settings, setSettings] = useState(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const s = { ...DEFAULT_SETTINGS, ...parsed };
                applyTheme(s.theme);
                return s;
            } else {
                // VERY FIRST LAUNCH: completely empty storage
                isFirstLaunchRef.current = true;
                applyTheme(DEFAULT_SETTINGS.theme);
                return { ...DEFAULT_SETTINGS };
            }
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    });

    useEffect(() => {
        saveSettings(settings);
        applyTheme(settings.theme);
    }, [settings]);

    // ── Auto-Geolocate ONLY on very first launch ──────────
    useEffect(() => {
        if (!isFirstLaunchRef.current) return;
        isFirstLaunchRef.current = false; // Mark handled

        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    // Quick reverse geocode to get a nice name
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const data = await res.json();
                    const addr = data.address || {};
                    const name = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'My Location';
                    const country = addr.country_code ? addr.country_code.toUpperCase() : '';
                    const locationName = country ? `${name}, ${country}` : name;

                    setSettings((prev) => {
                        // Protect: ONLY update if location is still the default London
                        // just in case they typed a city extremely fast
                        if (prev.lat === DEFAULT_SETTINGS.lat && prev.lon === DEFAULT_SETTINGS.lon) {
                            return { ...prev, lat: latitude, lon: longitude, locationName, city: '' };
                        }
                        return prev;
                    });
                } catch {
                    // Silently fall back to default if reverse geocode fails
                }
            },
            () => { /* Silently fall back to default if denied */ },
            { timeout: 5000 }
        );
    }, []);

    // ── Location via city name geocoding ──────────
    const updateCity = useCallback(async (cityName) => {
        if (!cityName.trim()) return { ok: false, error: 'City name is empty' };
        try {
            const res = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=en&format=json`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.results || data.results.length === 0) {
                return { ok: false, error: 'City not found' };
            }
            const { latitude, longitude, name, country } = data.results[0];
            const locationName = country ? `${name}, ${country}` : name;
            setSettings((prev) => ({ ...prev, city: cityName.trim(), lat: latitude, lon: longitude, locationName }));
            return { ok: true, locationName };
        } catch {
            return { ok: false, error: 'Geocoding API error' };
        }
    }, []);

    // ── Location via map click ────────────────────
    const updateLatLon = useCallback((lat, lon, locationName) => {
        setSettings((prev) => ({ ...prev, lat, lon, locationName, city: '' }));
    }, []);

    // ── Simple scalar setters ─────────────────────
    const setTempUnit = useCallback((unit) => setSettings((p) => ({ ...p, tempUnit: unit })), []);
    const setFirstDayOfWeek = useCallback((day) => setSettings((p) => ({ ...p, firstDayOfWeek: day })), []);
    const setTheme = useCallback((theme) => {
        if (!THEME_KEYS.includes(theme)) return;
        setSettings((p) => ({ ...p, theme }));
    }, []);
    const setLanguage = useCallback((lang) => setSettings((p) => ({ ...p, language: lang })), []);
    const setTimeFormat = useCallback((fmt) => setSettings((p) => ({ ...p, timeFormat: fmt })), []);

    // ── Auto-start (Electron only) ──────────────────
    const setAutoStart = useCallback(async (enabled) => {
        const minimized = enabled ? (settings.startMinimized ?? false) : false;
        setSettings((p) => ({ ...p, autoStart: enabled, startMinimized: enabled ? p.startMinimized : false }));
        if (window.electronSettings) {
            await window.electronSettings.setAutoStart(enabled, minimized);
        }
    }, [settings.startMinimized]);

    const setStartMinimized = useCallback(async (minimized) => {
        setSettings((p) => ({ ...p, startMinimized: minimized }));
        if (window.electronSettings) {
            await window.electronSettings.setAutoStart(true, minimized);
        }
    }, []);

    return {
        settings,
        updateCity,
        updateLatLon,
        setTempUnit,
        setFirstDayOfWeek,
        setTheme,
        setLanguage,
        setTimeFormat,
        setAutoStart,
        setStartMinimized,
        THEME_KEYS,
    };
}
