import { useState, useEffect, useCallback } from 'react';
import { createWeatherClient } from '../utils/weather.js';

export function useWeather({ lat, lon, locationName }) {
    const [client] = useState(() => createWeatherClient());
    const [state, setState] = useState(client.snapshot);
    useEffect(() => {
        const unsubscribe = client.subscribe(setState);
        client.select(lat, lon);
        const check = () => client.refresh();
        const resume = () => client.refresh(true);
        const visible = () => { if (document.visibilityState === 'visible') check(); };
        const timer = setInterval(check, 60000);
        window.addEventListener('online', resume);
        window.addEventListener('focus', check);
        document.addEventListener('visibilitychange', visible);
        const offResume = window.electronWeather?.onResume(resume);
        return () => {
            unsubscribe(); client.cancel(); clearInterval(timer);
            window.removeEventListener('online', resume);
            window.removeEventListener('focus', check);
            document.removeEventListener('visibilitychange', visible);
            offResume?.();
        };
    }, [client, lat, lon]);
    const getWeatherForDate = useCallback(key => state.weatherMap[key] ?? null, [state.weatherMap]);
    const refreshWeather = useCallback(() => client.refresh(true), [client]);
    return { ...state, getWeatherForDate, refreshWeather, locationName, usingMock: false };
}
