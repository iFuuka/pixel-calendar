import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import WeatherDetail from './WeatherDetail';
import { ClockIcon } from './DetailIcons';
import './CurrentDayDashboard.css';

function getTimeString(timeFormat = '24') {
    const now = new Date();
    return timeFormat === '12'
        ? format(now, 'hh:mm aa')   // 12:34 PM
        : format(now, 'HH:mm');     // 22:09
}

export default function CurrentDayDashboard({ getWeatherForDate, getNotesForDate, tempUnit = 'C', timeFormat = '24', lang = 'en', onOpenDay, t }) {
    const tr = t || ((k, fb) => fb || k);
    const [time, setTime] = useState(() => getTimeString(timeFormat));
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');
    const todayWeather = getWeatherForDate(todayKey);
    const todayNotes = getNotesForDate(todayKey) || [];

    // Live clock — tick every 15 seconds (accurate enough for minute display)
    useEffect(() => {
        setTime(getTimeString(timeFormat)); // update immediately when format changes
        const interval = setInterval(() => setTime(getTimeString(timeFormat)), 15_000);
        return () => clearInterval(interval);
    }, [timeFormat]);

    // Month name translation
    const monthKey = 'month.' + ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][today.getMonth()];
    const monthName = tr(monthKey);
    const dayNum = format(today, 'd');
    const dayOfWeek = tr('day.' + ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()]);

    const handleOpenToday = useCallback(() => {
        if (onOpenDay) onOpenDay(today);
    }, [onOpenDay]);

    return (
        <section className="dashboard pixel-border" aria-label={tr('dashboard.today', "Today's overview")}>
            {/* Top bar: date + clock */}
            <div className="dashboard-header">
                <div className="dashboard-date-block">
                    <span className="dashboard-today-badge">{tr('dashboard.today', '✨ Today')}</span>
                    <h2 className="dashboard-date-full">
                        {dayOfWeek}, {monthName} {dayNum}
                    </h2>
                    <p className="dashboard-year">{today.getFullYear()}</p>
                </div>
                <div className="dashboard-clock">
                    <ClockIcon size={22} />
                    <span className="dashboard-time">{time}</span>
                </div>
            </div>

            {/* Content grid */}
            <div className="dashboard-grid">
                {/* Weather panel */}
                <div className="dashboard-panel dashboard-panel--weather">
                    <h3 className="dashboard-panel-title">{tr('dashboard.weather', '🌤 Weather')}</h3>
                    <WeatherDetail weather={todayWeather} tempUnit={tempUnit} compact lang={lang} t={tr} />
                </div>

                {/* Notes panel */}
                <div className="dashboard-panel dashboard-panel--notes">
                    <div className="dashboard-panel-title-row">
                        <h3 className="dashboard-panel-title">{tr('notes.today', "📝 Today's Notes")}</h3>
                        <button
                            id="btn-dashboard-add-note"
                            className="dashboard-add-btn"
                            onClick={handleOpenToday}
                            aria-label={tr('notes.add', 'Add note')}
                        >{tr('dashboard.add', '+ Add')}</button>
                    </div>

                    {todayNotes.length === 0 ? (
                        <div className="dashboard-notes-empty">
                            <span className="dashboard-notes-empty-icon">🌸</span>
                            <p>{tr('notes.none.today', 'No notes for today yet!')}</p>
                            <button className="dashboard-empty-cta" onClick={handleOpenToday}>
                                {tr('notes.add.first', 'Add your first note ✏️')}
                            </button>
                        </div>
                    ) : (
                        <ul className="dashboard-notes-list">
                            {todayNotes.map((note) => (
                                <li key={note.id} className="dashboard-note-item">
                                    <span className="dashboard-note-bullet">✏️</span>
                                    <span className="dashboard-note-text">{note.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
