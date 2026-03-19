import React, { useState } from 'react';
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
    holiday,
    dayMeta,
    mood,
    onMoveNote,
    lang,
    onClick,
}) {
    const [dragOver, setDragOver] = useState(false);
    const dayNum = format(day, 'd');
    const weatherInfo = weather ? getWeatherInfo(weather.code) : null;
    const holidayNames = holiday
        ? holiday.map(h => lang === 'ru' ? h.ru : h.en)
        : null;
    const holidayTitle = holidayNames ? holidayNames.join(', ') : undefined;
    const color = dayMeta?.color || null;
    const stickers = dayMeta?.stickers || [];

    let cellClass = 'day-cell';
    if (!inMonth) cellClass += ' day-cell--faded';
    if (isToday) cellClass += ' day-cell--today';
    if (isSelected) cellClass += ' day-cell--selected';
    if (hasNote && inMonth) cellClass += ' day-cell--has-note';
    if (holiday && inMonth) cellClass += ' day-cell--holiday';
    if (color && inMonth) cellClass += ' day-cell--labeled';
    if (dragOver) cellClass += ' day-cell--drag-over';

    // Drag & drop handlers
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    }
    function handleDragLeave() { setDragOver(false); }
    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.type === 'note' && data.dateKey && data.noteId && onMoveNote) {
                onMoveNote(data.dateKey, dateKey, data.noteId);
            }
        } catch { /* ignore invalid drops */ }
    }

    return (
        <button
            id={`day-${dateKey}`}
            className={cellClass}
            onClick={onClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            aria-label={`${format(day, 'MMMM d, yyyy')}${holidayTitle ? `, ${holidayTitle}` : ''}${hasNote ? ', has notes' : ''}`}
            style={{
                ...(weatherInfo && inMonth ? { '--weather-bg': weatherInfo.bg } : {}),
                ...(color && inMonth ? { '--day-label-clr': color } : {}),
            }}
            title={holidayTitle}
        >
            <span className="day-number">{dayNum}</span>

            {holidayNames && inMonth && (
                <span className="day-holiday-label">
                    {holidayNames.length <= 2
                        ? holidayNames.join(' / ')
                        : `${holidayNames[0]} +${holidayNames.length - 1}`
                    }
                </span>
            )}

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

            {/* Stickers */}
            {stickers.length > 0 && inMonth && (
                <div className="day-stickers">
                    {stickers.map((s, i) => (
                        <span key={i} className="day-sticker">{s}</span>
                    ))}
                </div>
            )}

            {/* Mood emoji */}
            {mood && inMonth && (
                <span className="day-mood" aria-label="mood">{mood}</span>
            )}

            {hasNote && inMonth && (
                <span className="note-dot" aria-hidden="true" />
            )}

            {/* Color label bar */}
            {color && inMonth && <span className="day-color-bar" />}
        </button>
    );
}
