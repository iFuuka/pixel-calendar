import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, differenceInDays } from 'date-fns';
import WeatherDetail from './WeatherDetail';
import HourlyTempChart from './HourlyTempChart';
import NotesPanel from './NotesPanel';
import Confetti from './Confetti';
import { MOOD_OPTIONS } from '../hooks/useMoods';
import './DayModal.css';

const COLOR_OPTIONS = [
    { key: 'red', color: '#e57373' },
    { key: 'blue', color: '#64b5f6' },
    { key: 'green', color: '#81c784' },
    { key: 'yellow', color: '#ffd54f' },
    { key: 'purple', color: '#ba68c8' },
];

const STICKER_OPTIONS = ['🎂', '✈️', '❤️', '⭐', '🎁', '🎵', '☕', '🏆', '📌', '🔥'];

export default function DayModal({
    selectedDate,
    weather,
    notes,
    onClose,
    onAddNote,
    onEditNote,
    onDeleteNote,
    onUpdateNoteTags,
    onUpdateNoteReminder,
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

    const currentColor = dayMeta?.color || null;
    const currentStickers = dayMeta?.stickers || [];
    const hasBirthdaySticker = currentStickers.includes('🎂');

    // Countdowns for this day
    const dayCountdowns = (countdowns || []).filter(c => c.dateKey === dateKey);
    const [cdLabel, setCdLabel] = useState('');

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
                    {/* ── Day decorations block ── */}
                    <section className="modal-section meta-block">
                        {/* Mood row */}
                        <div className="meta-line">
                            <span className="meta-line-label">{tr('mood.title', 'Mood')}</span>
                            <div className="meta-line-items">
                                {MOOD_OPTIONS.map(({ emoji, key }) => (
                                    <button
                                        key={key}
                                        className={`meta-btn ${mood === emoji ? 'meta-btn--active' : ''}`}
                                        onClick={() => onSetMood(dateKey, mood === emoji ? null : emoji)}
                                        title={tr(`mood.${key}`, key)}
                                    >{emoji}</button>
                                ))}
                            </div>
                        </div>

                        {/* Color label row */}
                        <div className="meta-line">
                            <span className="meta-line-label">{tr('daymeta.color', 'Label')}</span>
                            <div className="meta-line-items">
                                <button
                                    className={`meta-color-dot meta-color-dot--none ${!currentColor ? 'meta-color-dot--active' : ''}`}
                                    onClick={() => onSetDayColor(null)}
                                    title={tr('daymeta.color.none', 'None')}
                                />
                                {COLOR_OPTIONS.map(({ key, color }) => (
                                    <button
                                        key={key}
                                        className={`meta-color-dot ${currentColor === color ? 'meta-color-dot--active' : ''}`}
                                        style={{ '--dot-clr': color }}
                                        onClick={() => onSetDayColor(currentColor === color ? null : color)}
                                        title={tr(`daymeta.color.${key}`, key)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Stickers row */}
                        <div className="meta-line">
                            <span className="meta-line-label">{tr('daymeta.stickers', 'Stickers')}</span>
                            <div className="meta-line-items">
                                {STICKER_OPTIONS.map((sticker) => (
                                    <button
                                        key={sticker}
                                        className={`meta-btn ${currentStickers.includes(sticker) ? 'meta-btn--active' : ''}`}
                                        onClick={() => onToggleSticker(sticker)}
                                    >{sticker}</button>
                                ))}
                            </div>
                        </div>

                        {/* Countdown row */}
                        <div className="meta-line">
                            <span className="meta-line-label">{tr('countdown.title', 'Countdown')}</span>
                            <div className="meta-line-items meta-line-items--cd">
                                {dayCountdowns.map(cd => (
                                    <span key={cd.id} className="meta-cd-pill">
                                        🎯 {cd.label}
                                        <button className="meta-cd-pill-x" onClick={() => onRemoveCountdown(cd.id)}>✕</button>
                                    </span>
                                ))}
                                <input
                                    className="meta-cd-inline-input"
                                    type="text"
                                    value={cdLabel}
                                    onChange={e => setCdLabel(e.target.value)}
                                    placeholder={dayCountdowns.length === 0 ? tr('countdown.label', 'Event name...') : '+'}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && cdLabel.trim()) {
                                            onAddCountdown(dateKey, cdLabel.trim());
                                            setCdLabel('');
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </section>

                    {weather && (
                        <section className="modal-section">
                            <h3 className="section-title">{tr('modal.weather', '🌤 Weather')}</h3>
                            <WeatherDetail weather={weather} tempUnit={tempUnit} lang={lang} t={tr} />
                            {weather.hourly && weather.hourly.length > 0 && (
                                <HourlyTempChart hourly={weather.hourly} tempUnit={tempUnit} lang={lang} t={tr} />
                            )}
                        </section>
                    )}

                    <section className="modal-section">
                        <NotesPanel
                            dateKey={dateKey}
                            notes={notes}
                            onAdd={onAddNote}
                            onEdit={onEditNote}
                            onDelete={onDeleteNote}
                            onUpdateTags={onUpdateNoteTags}
                            onUpdateReminder={onUpdateNoteReminder}
                            autoEditNoteId={autoEditNoteId}
                            allTags={allTags}
                            t={tr}
                        />
                    </section>
                </div>
            </aside>
        </>
    );
}
