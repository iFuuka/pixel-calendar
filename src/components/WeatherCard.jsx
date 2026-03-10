import React from 'react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './PixelIcons';
import './WeatherCard.css';

function toF(c) {
    return Math.round(c * 9 / 5 + 32);
}

export default function WeatherCard({ weather, tempUnit = 'C' }) {
    if (!weather) {
        return (
            <div className="weather-card weather-card--empty">
                <span className="weather-card-empty-icon">🌤</span>
                <p>No forecast available</p>
            </div>
        );
    }

    const info = getWeatherInfo(weather.code);
    const displayMax = tempUnit === 'F' ? toF(weather.tempMax) : weather.tempMax;
    const displayMin = tempUnit === 'F' ? toF(weather.tempMin) : weather.tempMin;
    const unit = tempUnit === 'F' ? '°F' : '°C';

    return (
        <div className="weather-card" style={{ '--wc-bg': info.bg }}>
            <div className="weather-card-icon">
                <WeatherIcon type={info.icon} size={48} />
            </div>
            <div className="weather-card-info">
                <p className="weather-label">{info.label}</p>
                <div className="weather-temps">
                    <span className="temp-max">↑ {displayMax}{unit}</span>
                    <span className="temp-min">↓ {displayMin}{unit}</span>
                </div>
            </div>
        </div>
    );
}
