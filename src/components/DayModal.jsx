import React, { useEffect, useRef } from 'react';
import { format, isToday } from 'date-fns';
import WeatherDetail from './WeatherDetail';
import HourlyTempChart from './HourlyTempChart';
import NotesPanel from './NotesPanel';
import Confetti from './Confetti';
import DayDecorations from './DayDecorations';
import './DayModal.css';

export default function DayModal({
    selectedDate,
    weather,
    weatherStatus,
    onAcceptWeather,
    notes,
    onClose,
    onAddNote,
    onEditNote,
    onDeleteNote,
    onUpdateNoteTags,
    onUpdateNoteReminder,
    onUpdateNoteSchedule,
    holiday,
    dayMeta,
    onSetDayColor,
    onToggleSticker,
    mood,
    onSetMood,
    countdowns,
    onAddCountdown,
    onRemoveCountdown,
    tempUnit = 'C',
    lang = 'en',
    t,
    autoEditNoteId,
    allTags = [],
}) {
    const tr = t || ((k, fb) => fb || k);
    const panelRef = useRef(null);

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => { panelRef.current?.focus(); }, [selectedDate]);

    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeekKey = 'day.' + ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][selectedDate.getDay()];
    const monthKey = 'month.' + ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][selectedDate.getMonth()];
    const dayName = tr(dayOfWeekKey, format(selectedDate, 'EEEE'));
    const dayDate = `${tr(monthKey, format(selectedDate, 'MMMM'))} ${format(selectedDate, 'd, yyyy')}`;
    const todayLabel = isToday(selectedDate) ? tr('modal.today', '✨ Today') : null;
    const holidayNames = holiday ? holiday.map(h => lang === 'ru' ? h.ru : h.en) : null;

    const currentStickers = dayMeta?.stickers || [];
    const hasBirthdaySticker = currentStickers.includes('🎂');


    return (
        <>
            {hasBirthdaySticker && <Confetti />}
            <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />

            <aside
                ref={panelRef}
                id="day-modal"
                className="day-modal pixel-border"
                aria-label={`Details for ${dayDate}`}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-date-info">
                        {todayLabel && <span className="today-badge">{todayLabel}</span>}
                        {holidayNames && holidayNames.map((name, i) => (
                            <span key={i} className="holiday-badge">🎉 {name}</span>
                        ))}
                        <h2 className="modal-day-name">{dayName}</h2>
                        <p className="modal-full-date">{dayDate}</p>
                    </div>
                    <button
                        id="btn-close-modal"
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close panel"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-content">
                    <section className="modal-section">
                        <NotesPanel
                            dateKey={dateKey}
                            notes={notes}
                            weather={weather} weatherStatus={weatherStatus} onAcceptWeather={onAcceptWeather} tempUnit={tempUnit}
                            onAdd={onAddNote}
                            onEdit={onEditNote}
                            onDelete={onDeleteNote}
                            onUpdateTags={onUpdateNoteTags}
                            onUpdateReminder={onUpdateNoteReminder}
                            onUpdateSchedule={onUpdateNoteSchedule}
                            autoEditNoteId={autoEditNoteId}
                            allTags={allTags}
                            t={tr}
                        />
                    </section>

                    <DayDecorations key={dateKey} dateKey={dateKey} dayMeta={dayMeta} mood={mood}
                        onSetMood={onSetMood} onSetDayColor={onSetDayColor} onToggleSticker={onToggleSticker}
                        countdowns={countdowns} onAddCountdown={onAddCountdown} onRemoveCountdown={onRemoveCountdown} t={tr} />

                        <section className="modal-section weather-section">
                            <h3 className="section-title">{tr('modal.weather', '🌤 Weather')}</h3>
                            {weather && (weatherStatus.error || weatherStatus.usingCache
                                || (weatherStatus.lastUpdated && weatherStatus.now - weatherStatus.lastUpdated > 6 * 3600000)) && (
                                <p className="event-hint" role="status">{tr(
                                    weatherStatus.lastUpdated && weatherStatus.now - weatherStatus.lastUpdated > 6 * 3600000
                                        ? 'eventWeather.stale'
                                        : weatherStatus.usingCache ? 'weather.status.cached' : 'weather.status.offline'
                                )}</p>
                            )}
                            {weather ? <>
                            <WeatherDetail weather={weather} tempUnit={tempUnit} lang={lang} t={tr} />
                            {weather.hourly && weather.hourly.length > 0 && (
                                <HourlyTempChart hourly={weather.hourly} tempUnit={tempUnit} lang={lang} t={tr} />
                            )}
                            </> : <p>{tr(weatherStatus.lastUpdated ? 'eventWeather.outsideRange' : 'eventWeather.missing')}</p>}
                        </section>


                </div>
            </aside>
        </>
    );
}
