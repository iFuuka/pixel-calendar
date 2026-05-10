import { useEffect, useRef } from 'react';
import { format } from 'date-fns';

const STORAGE_KEY = 'pixel-calendar-weather-alerts-notified';
const RAIN_START_THRESHOLD = 50;
const RAIN_END_THRESHOLD = 35;
const TEMP_SHIFT_THRESHOLD = 7;
const WIND_THRESHOLD = 45;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

function loadNotified() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveNotified(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Storage may be unavailable or full.
    }
}

function formatHour(hour) {
    return `${String(hour).padStart(2, '0')}:00`;
}

function notifyWeather(data, onShowToast) {
    if (window.electronNotify) {
        window.electronNotify.showReminder(data);
    } else if (onShowToast) {
        onShowToast(data);
    }
}

function buildAlerts(weather, now, t) {
    if (!weather) return [];

    const tr = t || ((key, fallback) => fallback || key);
    const currentHour = now.getHours();
    const todayHours = (weather.hourly ?? [])
        .filter((h) => h.hour >= currentHour && h.hour <= currentHour + 3)
        .sort((a, b) => a.hour - b.hour);

    const alerts = [];

    for (let i = 0; i < todayHours.length; i++) {
        const current = todayHours[i];
        const previous = i > 0
            ? todayHours[i - 1]
            : (weather.hourly ?? []).find((h) => h.hour === current.hour - 1);
        const prevProb = previous?.precipProb ?? 0;
        const prob = current.precipProb ?? 0;

        if (current.hour > currentHour && prevProb < RAIN_START_THRESHOLD && prob >= RAIN_START_THRESHOLD) {
            alerts.push({
                key: `rain-start-${current.hour}`,
                priority: 20,
                title: tr('weather.alert.rain.start.title', 'Rain soon'),
                noteText: `${tr('weather.alert.rain.start.body', 'Rain may start around')} ${formatHour(current.hour)} (${prob}%).`,
                tags: 'weather, rain',
            });
            break;
        }
    }

    for (let i = 0; i < todayHours.length; i++) {
        const current = todayHours[i];
        const previous = i > 0
            ? todayHours[i - 1]
            : (weather.hourly ?? []).find((h) => h.hour === current.hour - 1);
        const prevProb = previous?.precipProb ?? 0;
        const prob = current.precipProb ?? 0;

        if (previous && previous.hour >= currentHour && prevProb >= RAIN_START_THRESHOLD && prob < RAIN_END_THRESHOLD) {
            alerts.push({
                key: `rain-end-${current.hour}`,
                priority: 18,
                title: tr('weather.alert.rain.end.title', 'Rain ending soon'),
                noteText: `${tr('weather.alert.rain.end.body', 'Rain should ease around')} ${formatHour(current.hour)} (${prob}%).`,
                tags: 'weather, rain',
            });
            break;
        }
    }

    if (todayHours.length >= 2) {
        const first = todayHours[0];
        const last = todayHours[todayHours.length - 1];
        const tempDelta = last.temp - first.temp;

        if (Math.abs(tempDelta) >= TEMP_SHIFT_THRESHOLD) {
            const warming = tempDelta > 0;
            alerts.push({
                key: `temp-shift-${first.hour}-${last.hour}-${warming ? 'up' : 'down'}`,
                priority: 12,
                title: warming
                    ? tr('weather.alert.temp.up.title', 'Temperature rising')
                    : tr('weather.alert.temp.down.title', 'Temperature dropping'),
                noteText: warming
                    ? `${tr('weather.alert.temp.up.body', 'Temperature may rise by')} ${Math.abs(tempDelta)}° ${tr('weather.alert.by', 'by')} ${formatHour(last.hour)}.`
                    : `${tr('weather.alert.temp.down.body', 'Temperature may drop by')} ${Math.abs(tempDelta)}° ${tr('weather.alert.by', 'by')} ${formatHour(last.hour)}.`,
                tags: 'weather, temperature',
            });
        }
    }

    if (weather.windMax >= WIND_THRESHOLD) {
        alerts.push({
            key: `wind-${weather.windMax}`,
            priority: 10,
            title: tr('weather.alert.wind.title', 'Strong wind'),
            noteText: `${tr('weather.alert.wind.body', 'Wind gusts may reach')} ${weather.windMax} ${tr('weather.alert.wind.unit', 'km/h today')}.`,
            tags: 'weather, wind',
        });
    }

    return alerts.sort((a, b) => b.priority - a.priority);
}

export function useWeatherAlerts({ enabled, getWeatherForDate, onShowToast, t }) {
    const notifiedRef = useRef(loadNotified());

    useEffect(() => {
        if (!enabled) return;

        function checkWeatherAlerts() {
            const now = new Date();
            const dateKey = format(now, 'yyyy-MM-dd');
            const weather = getWeatherForDate(dateKey);
            const alerts = buildAlerts(weather, now, t);
            if (alerts.length === 0) return;

            const dayNotified = notifiedRef.current[dateKey] ?? {};
            const alert = alerts.find((candidate) => !dayNotified[candidate.key]);
            if (!alert) return;

            const next = {
                ...notifiedRef.current,
                [dateKey]: {
                    ...dayNotified,
                    [alert.key]: Date.now(),
                },
            };
            notifiedRef.current = next;
            saveNotified(next);

            notifyWeather({
                title: alert.title,
                noteText: alert.noteText,
                dateKey,
                intervalKey: alert.key,
                tags: alert.tags,
            }, onShowToast);
        }

        checkWeatherAlerts();
        const timer = setInterval(checkWeatherAlerts, CHECK_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [enabled, getWeatherForDate, onShowToast, t]);
}
