import { localDate } from './events.js';
import { WEATHER_STALE_MS } from './weather.js';

const complete = h => Number.isFinite(h?.temp) && Number.isFinite(h?.precipProb);
const adverse = h => h.precipProb >= 50 || h.temp < 5 || h.temp > 30;
const score = h => h.precipProb + Math.max(0, 5 - h.temp, h.temp - 30) * 5;
const minutes = time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function eventWeather({ note, dateKey, weather, notes = [], lastUpdated, now = Date.now() }) {
    if (!note.outdoor) return { status: 'indoor', suggestions: [] };
    if (!note.time) return { status: 'needsTime', suggestions: [] };
    if (localDate(dateKey, note.time).getTime() <= now) return { status: 'past', suggestions: [] };
    if (!weather) return { status: lastUpdated ? 'outsideRange' : 'missing', suggestions: [] };
    // The API has hourly samples, not minute-level predictions. Expose the sample time in the UI.
    const hour = Number(note.time.slice(0, 2));
    const hourly = (weather.hourly || []).map(item => ({ ...item,
        // Open-Meteo probability describes the preceding hour. Use the NEXT sample
        // for the event's starting hour, including 23:00–24:00 when available.
        precipProb: Object.hasOwn(item, 'intervalPrecipProb') ? item.intervalPrecipProb
            : weather.hourly.find(next => next.hour === item.hour + 1)?.precipProb ?? null,
    }));
    const sample = hourly.find(item => item.hour === hour);
    const stale = !lastUpdated || now - lastUpdated > WEATHER_STALE_MS || lastUpdated > now;
    if (stale) return { status: 'stale', sample, suggestions: [] };
    if (!complete(sample)) return { status: 'incomplete', sample, suggestions: [] };
    const others = notes.filter(item => item.id !== note.id);
    const suggestions = adverse(sample) ? hourly
        .filter(item => {
            // Offer practical daytime starts; unknown durations cannot prove a free interval.
            if (!complete(item) || adverse(item) || item.hour < 7 || item.hour > 21 || item.hour === hour) return false;
            const time = `${String(item.hour).padStart(2, '0')}:00`;
            return localDate(dateKey, time).getTime() > now && score(item) < score(sample)
                && !others.some(other => other.time && Math.abs(minutes(other.time) - item.hour * 60) < 60);
        })
        .sort((a, b) => score(a) - score(b) || Math.abs(a.hour - hour) - Math.abs(b.hour - hour))
        .slice(0, 3).map(item => ({ ...item, time: `${String(item.hour).padStart(2, '0')}:00` })) : [];
    return { status: adverse(sample) ? 'adverse' : 'fair', sample, suggestions,
        untimed: others.some(item => !item.time) };
}
