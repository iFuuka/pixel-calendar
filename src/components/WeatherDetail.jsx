import React from 'react';
import { format, parseISO } from 'date-fns';
import { getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './PixelIcons';
import { UmbrellaIcon, WindIcon, SunriseIcon, SunsetIcon, ThermometerIcon } from './DetailIcons';
import './WeatherDetail.css';

function toF(c) { return Math.round(c * 9 / 5 + 32); }

function formatSunTime(isoStr) {
    if (!isoStr) return '—';
    try {
        const d = parseISO(isoStr);
        return format(d, 'HH:mm');
    } catch { return '—'; }
}

/**
 * Format wind speed with unit conversion:
 *  - lang 'ru'       → m/s  (km/h ÷ 3.6, rounded to 1 dp)
 *  - tempUnit 'F'    → mph  (km/h × 0.621)
 *  - default         → km/h
 */
function formatWind(kmh, lang = 'en', tempUnit = 'C') {
    if (kmh == null) return null;
    if (lang === 'ru') {
        const ms = (kmh / 3.6).toFixed(1);
        return `${ms} м/с`;
    }
    if (tempUnit === 'F') {
        return `${Math.round(kmh * 0.621)} mph`;
    }
    return `${kmh} km/h`;
}

function StatPill({ icon, label, value, color }) {
    return (
        <div className="wd-stat-pill" style={{ '--pill-color': color }}>
            <span className="wd-stat-icon">{icon}</span>
            <div className="wd-stat-body">
                <span className="wd-stat-label">{label}</span>
                <span className="wd-stat-value">{value}</span>
            </div>
        </div>
    );
}

/**
 * WeatherDetail — expanded weather card showing all enriched metrics.
 * Props:
 *   weather: { code, tempMax, tempMin, precipProb, windMax, currentWindSpeed?, sunrise, sunset }
 *   tempUnit: 'C' | 'F'
 *   compact: boolean — dashboard mode (shows currentWindSpeed if available)
 *   lang: 'en' | 'ru' — for wind unit display
 *   t: translator fn
 */
export default function WeatherDetail({ weather, tempUnit = 'C', compact = false, lang = 'en', t }) {
    const tr = t || ((k, fb) => fb || k);

    if (!weather) {
        return (
            <div className="wd-empty">
                <span>🌤</span>
                <p>{tr('weather.nodata', 'No weather data available')}</p>
            </div>
        );
    }

    const info = getWeatherInfo(weather.code);
    const max = tempUnit === 'F' ? toF(weather.tempMax) : weather.tempMax;
    const min = tempUnit === 'F' ? toF(weather.tempMin) : weather.tempMin;
    const unit = tempUnit === 'F' ? '°F' : '°C';

    // Dashboard (compact) uses real-time current wind; DayModal uses daily max wind gusts
    const windKmh = compact && weather.currentWindSpeed != null
        ? weather.currentWindSpeed
        : weather.windMax;
    const windLabel = compact && weather.currentWindSpeed != null
        ? tr('weather.wind.current', 'Wind now')
        : tr('weather.wind.max', 'Max Wind Gusts');
    const windValue = formatWind(windKmh, lang, tempUnit);

    return (
        <div className={`weather-detail ${compact ? 'weather-detail--compact' : ''}`}
            style={{ '--wd-bg': info.bg }}>

            {/* Top row: icon + condition + temp range */}
            <div className="wd-top">
                <div className="wd-icon-wrap">
                    <WeatherIcon type={info.icon} size={compact ? 48 : 56} />
                </div>
                <div className="wd-condition">
                    <p className="wd-label">{tr(info.label, info.label)}</p>
                    <div className="wd-temps">
                        <span className="wd-temp-max">
                            <ThermometerIcon size={14} />
                            {max}{unit}
                        </span>
                        <span className="wd-temp-min">↓ {min}{unit}</span>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="wd-stats">
                {weather.precipProb != null && (
                    <StatPill icon={<UmbrellaIcon size={16} />} label={tr('weather.rain', 'Rain chance')} value={`${weather.precipProb}%`} color="var(--clr-sky)" />
                )}
                {windValue != null && (
                    <StatPill icon={<WindIcon size={16} />} label={windLabel} value={windValue} color="var(--clr-mint)" />
                )}
                {weather.sunrise && (
                    <StatPill icon={<SunriseIcon size={16} />} label={tr('weather.sunrise', 'Sunrise')} value={formatSunTime(weather.sunrise)} color="var(--clr-peach)" />
                )}
                {weather.sunset && (
                    <StatPill icon={<SunsetIcon size={16} />} label={tr('weather.sunset', 'Sunset')} value={formatSunTime(weather.sunset)} color="var(--clr-rose)" />
                )}
            </div>
        </div>
    );
}
