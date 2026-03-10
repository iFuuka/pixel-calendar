import React, { useEffect, useRef } from 'react';
import { format, isToday } from 'date-fns';
import WeatherDetail from './WeatherDetail';
import HourlyTempChart from './HourlyTempChart';
import NotesPanel from './NotesPanel';
import './DayModal.css';

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
    tempUnit = 'C',
    lang = 'en',
    t,
    autoEditNoteId,
    allTags = [],
}) {
    const tr = t || ((k, fb) => fb || k);
    const panelRef = useRef(null);
    // Close on Escape key
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Trap focus within panel
    useEffect(() => {
        panelRef.current?.focus();
    }, [selectedDate]);

    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeekKey = 'day.' + ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][selectedDate.getDay()];
    const monthKey = 'month.' + ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][selectedDate.getMonth()];
    const dayName = tr(dayOfWeekKey, format(selectedDate, 'EEEE'));
    const dayDate = `${tr(monthKey, format(selectedDate, 'MMMM'))} ${format(selectedDate, 'd, yyyy')}`;
    const todayLabel = isToday(selectedDate) ? tr('modal.today', '✨ Today') : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Side panel */}
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

                {/* Scrollable content */}
                <div className="modal-content">
                    {weather && (
                        <section className="modal-section">
                            <h3 className="section-title">{tr('modal.weather', '🌤 Weather')}</h3>
                            <WeatherDetail weather={weather} tempUnit={tempUnit} lang={lang} t={tr} />
                            {weather.hourly && weather.hourly.length > 0 && (
                                <HourlyTempChart
                                    hourly={weather.hourly}
                                    tempUnit={tempUnit}
                                    lang={lang}
                                    t={tr}
                                />
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
