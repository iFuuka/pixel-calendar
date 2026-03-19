import React from 'react';
import { format, addDays, isToday } from 'date-fns';
import { getWeatherInfo } from '../utils/weatherCodes';
import { WeatherIcon } from './PixelIcons';
import './WeekAhead.css';

export default function WeekAhead({ getWeatherForDate, getNotesForDate, getDayMeta, onDayClick, t }) {
    const tr = t || ((k, fb) => fb || k);
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

    return (
        <div className="week-ahead pixel-border">
            <h3 className="week-ahead-title">{tr('week.ahead', 'Week Ahead')}</h3>
            <div className="week-ahead-strip">
                {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const weather = getWeatherForDate(dateKey);
                    const notes = getNotesForDate(dateKey);
                    const meta = getDayMeta ? getDayMeta(dateKey) : null;
                    const weatherInfo = weather ? getWeatherInfo(weather.code) : null;
                    const dayOfWeekKey = 'day.' + ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day.getDay()];
                    const isTodayDay = isToday(day);

                    return (
                        <button
                            key={dateKey}
                            className={`week-day${isTodayDay ? ' week-day--today' : ''}`}
                            onClick={() => onDayClick(day)}
                            title={format(day, 'MMMM d')}
                            style={meta?.color ? { '--day-label-clr': meta.color } : {}}
                        >
                            <span className="week-day-name">
                                {isTodayDay ? tr('week.today', 'Today') : tr(dayOfWeekKey)}
                            </span>
                            <span className="week-day-num">{format(day, 'd')}</span>
                            {weatherInfo && (
                                <div className="week-day-weather">
                                    <WeatherIcon type={weatherInfo.icon} size={18} />
                                    {weather.tempMax !== undefined && (
                                        <span className="week-day-temp">{weather.tempMax}°</span>
                                    )}
                                </div>
                            )}
                            {notes.length > 0 && (
                                <span className="week-day-notes-badge">{notes.length}</span>
                            )}
                            {meta?.stickers?.length > 0 && (
                                <div className="week-day-stickers">
                                    {meta.stickers.slice(0, 2).map((s, i) => (
                                        <span key={i} className="week-sticker-mini">{s}</span>
                                    ))}
                                </div>
                            )}
                            {meta?.color && <span className="week-day-color-dot" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
