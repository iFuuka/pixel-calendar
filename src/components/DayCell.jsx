import React from 'react';
import { format } from 'date-fns';
import { getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './PixelIcons';
import './DayCell.css';

export default function DayCell({
    day,
    dateKey,
    inMonth,
    isToday,
    isSelected,
    weather,
    hasNote,
    weatherLoading,
    onClick,
}) {
    const dayNum = format(day, 'd');
    const weatherInfo = weather ? getWeatherInfo(weather.code) : null;

    let cellClass = 'day-cell';
    if (!inMonth) cellClass += ' day-cell--faded';
    if (isToday) cellClass += ' day-cell--today';
    if (isSelected) cellClass += ' day-cell--selected';

    return (
        <button
            id={`day-${dateKey}`}
            className={cellClass}
            onClick={onClick}
            aria-label={`${format(day, 'MMMM d, yyyy')}${hasNote ? ', has notes' : ''}`}
            style={weatherInfo && inMonth ? { '--weather-bg': weatherInfo.bg } : {}}
        >
            <span className="day-number">{dayNum}</span>

            {inMonth && !weatherLoading && weatherInfo && (
                <div className="day-weather">
                    <WeatherIcon type={weatherInfo.icon} size={22} />
                    {weather.tempMax !== undefined && (
                        <span className="day-temp">{weather.tempMax}°</span>
                    )}
                </div>
            )}

            {inMonth && weatherLoading && (
                <div className="day-loading">···</div>
            )}

            {hasNote && inMonth && (
                <span className="note-dot" aria-hidden="true" />
            )}
        </button>
    );
}
