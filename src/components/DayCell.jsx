import React, { useState } from 'react';
import { format } from 'date-fns';
import { getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './PixelIcons';
import DayMarkIcon from './DayMarkIcon';
import './DayCell.css';

export default function DayCell({
    day,
    dateKey,
    inMonth,
    isToday,
    isSelected,
    weather,
    hasNote,
    notes = [],
    previewLimit = 2,
    t,
    weatherLoading,
    tempUnit = 'C',
    density = 'detailed',
    holiday,
    dayMeta,
    mood,
    searchActive = false,
    searchMatch = false,
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
    const isCompact = density === 'compact';
    const isDetailed = density === 'detailed';
    const showHolidayText = !isCompact && holidayNames;
    const showStickers = !isCompact && stickers.length > 0;
    const showMood = !isCompact && mood;
    const visibleStickers = isDetailed ? stickers : stickers.slice(0, 2);
    const tempMax = weather?.tempMax;
    const tempMin = weather?.tempMin;
    const displayMax = tempUnit === 'F' && tempMax !== undefined
        ? Math.round(tempMax * 9 / 5 + 32)
        : tempMax;
    const displayMin = tempUnit === 'F' && tempMin !== undefined
        ? Math.round(tempMin * 9 / 5 + 32)
        : tempMin;

    let cellClass = 'day-cell';
    cellClass += ` day-cell--${density}`;
    if (!inMonth) cellClass += ' day-cell--faded';
    if (isToday) cellClass += ' day-cell--today';
    if (isSelected) cellClass += ' day-cell--selected';
    if (hasNote && inMonth) cellClass += ' day-cell--has-note';
    if (holiday && inMonth) cellClass += ' day-cell--holiday';
    if (color && inMonth) cellClass += ' day-cell--labeled';
    if (dragOver) cellClass += ' day-cell--drag-over';
    if (searchActive && inMonth) cellClass += searchMatch ? ' day-cell--search-match' : ' day-cell--search-dim';

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
            aria-label={`${format(day, 'yyyy-MM-dd')}${holidayTitle ? `, ${holidayTitle}` : ''}${hasNote ? `, ${notes.length} ${t('calendar.entries')}: ${notes.slice(0, previewLimit).map(note => `${note.time || ''} ${note.text}`).join('; ')}` : ''}`}
            style={{
                ...(weatherInfo && inMonth ? { '--weather-bg': weatherInfo.bg } : {}),
                ...(color && inMonth ? { '--day-label-clr': color } : {}),
            }}
            title={holidayTitle}
        >
            <div className="day-cell-top">
                <span className="day-number">{dayNum}</span>
                {!showHolidayText && holidayNames && inMonth && <span className="day-holiday-dot" title={holidayTitle}>•</span>}
            </div>

            {showHolidayText && inMonth && (
                <span className="day-holiday-label">
                    {isDetailed && holidayNames.length <= 2
                        ? holidayNames.join(' / ')
                        : `${holidayNames[0]} +${holidayNames.length - 1}`
                    }
                </span>
            )}

            {inMonth && (showMood || showStickers) && <div className="day-cell-marks">
                {showMood && <span className="day-mood" aria-label={`${t('mood.title')}: ${mood}`}>
                    <DayMarkIcon value={mood} size={16} />
                </span>}
                {showStickers && <span className="day-stickers">
                    {visibleStickers.map((sticker, index) => <span key={index} className="day-sticker"><DayMarkIcon value={sticker} size={16} /></span>)}
                    {!isDetailed && stickers.length > visibleStickers.length && <span className="day-sticker day-sticker--more">+{stickers.length - visibleStickers.length}</span>}
                </span>}
            </div>}

            {inMonth && !weatherLoading && weatherInfo && (
                <div className="day-weather">
                    <WeatherIcon type={weatherInfo.icon} size={24} />
                    {displayMax !== undefined && (
                        <span className="day-temp">
                            {displayMax}°
                            {displayMin !== undefined && <span className="day-temp-min">/{displayMin}°</span>}
                        </span>
                    )}
                </div>
            )}

            {inMonth && weatherLoading && (
                <div className="day-loading">···</div>
            )}

            {notes.length > 0 && inMonth && (
                <span className="day-event-list">
                    {notes.slice(0, previewLimit).map(note => (
                        <span key={note.id} className="day-event" title={`${note.time || t('event.allDay')} · ${note.text}`}>
                            {note.time && <span className="day-event-time">{note.time}</span>}
                            <span className="day-event-text">{note.repeat && note.repeat !== 'none' ? '↻ ' : ''}{note.text.split('\n')[0]}</span>
                        </span>
                    ))}
                    {notes.length > previewLimit && <span className="day-event-more">{t('calendar.more').replace('{count}', notes.length - previewLimit)}</span>}
                </span>
            )}

            {/* Color label bar */}
            {color && inMonth && <span className="day-color-bar" />}
        </button>
    );
}
