import { eventWeather } from '../utils/eventWeather.js';

export default function EventWeather({ note, dateKey, weather, notes, weatherStatus, onAccept, tempUnit, t }) {
    const result = eventWeather({ note, dateKey, weather, notes, ...weatherStatus });
    if (result.status === 'indoor') return null;
    const temperature = value => Number.isFinite(value)
        ? `${Math.round(tempUnit === 'F' ? value * 9 / 5 + 32 : value)}°${tempUnit || 'C'}` : '—';
    const probability = value => Number.isFinite(value) ? `${value}%` : '—';
    return (
        <div className={`event-weather event-weather--${result.status}`} aria-live="polite">
            <strong>{t('event.outdoor')} · {t(`eventWeather.${result.status}`)}</strong>
            {result.sample && <p>
                {String(result.sample.hour).padStart(2, '0')}:00–{String(result.sample.hour + 1).padStart(2, '0')}:00 · {temperature(result.sample.temp)}
                {' · '}{t('eventWeather.rain')}: {probability(result.sample.precipProb)}
            </p>}
            {result.status === 'adverse' && <>
                {result.suggestions.length > 0 ? <>
                    <p>{t('eventWeather.suggest')}</p>
                    <div className="event-weather-options">
                        {result.suggestions.map(item => <button key={item.time} type="button"
                            className="btn btn-ghost btn--sm"
                            onClick={() => onAccept(item.time)}>
                            {t('eventWeather.move')} {item.time} · {temperature(item.temp)} · {probability(item.precipProb)}
                        </button>)}
                    </div>
                    <p className="event-hint">{t('eventWeather.conflicts')}</p>
                    {result.untimed && <p className="event-hint">{t('eventWeather.untimed')}</p>}
                    {note.repeat && note.repeat !== 'none' && <p className="event-hint">{t('eventWeather.occurrence')}</p>}
                </> : <p>{t('eventWeather.noSlots')}</p>}
            </>}
        </div>
    );
}
