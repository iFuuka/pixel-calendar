import React, { useMemo } from 'react';
import {
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isToday, isSameDay
} from 'date-fns';
import DayCell from './DayCell';
import './CalendarGrid.css';

export default function CalendarGrid({
    currentMonth,
    viewMode = 'month',
    selectedDate,
    onDayClick,
    getWeatherForDate,
    hasNotes,
    weatherLoading,
    firstDayOfWeek = 0,
    tempUnit = 'C',
    density = 'detailed',
    getHoliday,
    getDayMeta,
    getMood,
    onMoveNote,
    layers = { weather: true, holidays: true, notes: true, meta: true },
    searchActive = false,
    getSearchMatch,
    lang,
    t,
}) {
    const weekStartsOn = firstDayOfWeek === 1 ? 1 : 0;
    const DAY_KEYS_SUN = ['day.sun', 'day.mon', 'day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat'];
    const DAY_KEYS_MON = ['day.mon', 'day.tue', 'day.wed', 'day.thu', 'day.fri', 'day.sat', 'day.sun'];
    const WEEKDAYS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const keys = firstDayOfWeek === 1 ? DAY_KEYS_MON : DAY_KEYS_SUN;
    const labels = firstDayOfWeek === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;
    const WEEKDAYS = t ? keys.map((k, i) => t(k) || labels[i]) : labels;

    const days = useMemo(() => {
        const baseStart = viewMode === 'week' ? currentMonth : startOfMonth(currentMonth);
        const baseEnd = viewMode === 'week' ? currentMonth : endOfMonth(currentMonth);
        const start = startOfWeek(baseStart, { weekStartsOn });
        const end = endOfWeek(baseEnd, { weekStartsOn });
        return eachDayOfInterval({ start, end });
    }, [currentMonth, viewMode, weekStartsOn]);

    return (
        <div className="calendar-container pixel-border">
            <div className="weekday-headers">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="weekday-label">{d}</div>
                ))}
            </div>

            <div className={`calendar-grid ${viewMode === 'week' ? 'calendar-grid--week' : ''}`}>
                {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const inMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const weather = layers.weather ? getWeatherForDate(dateKey) : null;
                    const hasNote = layers.notes ? hasNotes(dateKey) : false;
                    const holiday = layers.holidays && getHoliday ? getHoliday(dateKey) : null;
                    const dayMeta = layers.meta && getDayMeta ? getDayMeta(dateKey) : null;
                    const dayMood = layers.meta && getMood ? getMood(dateKey) : null;
                    const searchMatch = searchActive && getSearchMatch ? getSearchMatch(dateKey) : false;

                    return (
                        <DayCell
                            key={dateKey}
                            day={day}
                            dateKey={dateKey}
                            inMonth={inMonth}
                            isToday={isToday(day)}
                            isSelected={isSelected}
                            weather={weather}
                            hasNote={hasNote}
                            weatherLoading={weatherLoading}
                            tempUnit={tempUnit}
                            density={density}
                            holiday={holiday}
                            dayMeta={dayMeta}
                            mood={dayMood}
                            searchActive={searchActive}
                            searchMatch={searchMatch}
                            onMoveNote={onMoveNote}
                            lang={lang}
                            onClick={() => onDayClick(day)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
