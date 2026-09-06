import { WEATHER_STALE_MS } from './weather.js';

const CURRENT_MAX_AGE_MS = 90 * 60 * 1000;
const TWILIGHT_MS = 30 * 60 * 1000;
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// The forecast client requests the device timezone. Reject dates that JavaScript
// would silently roll into another day (and values from a different forecast day).
function localForecastTime(value, day) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)
        || value.slice(0, 10) !== day) return null;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || dateKey(date) !== day
        || date.getHours() !== Number(value.slice(11, 13))
        || date.getMinutes() !== Number(value.slice(14, 16))) return null;
    return date.getTime();
}

export function sceneWeather(code) {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if ([95, 96, 99].includes(code)) return 'storm';
    return 'unknown';
}

function scenePhase(date, weather, currentFresh) {
    const day = dateKey(date), timestamp = date.getTime();
    const sunrise = localForecastTime(weather?.sunrise, day);
    const sunset = localForecastTime(weather?.sunset, day);
    if (sunrise !== null && sunset !== null && sunrise < sunset) {
        if ([sunrise, sunset].some(time => timestamp >= time - TWILIGHT_MS && timestamp < time + TWILIGHT_MS)) return 'dusk';
        return timestamp >= sunrise && timestamp < sunset ? 'day' : 'night';
    }
    // Polar day/night may have no usable sunrise or sunset. The API's daylight
    // flag is more reliable than the clock there, but must not outlive its sample.
    if (currentFresh && [0, 1].includes(weather?.currentIsDay)) return weather.currentIsDay === 1 ? 'day' : 'night';
    const hour = date.getHours() + date.getMinutes() / 60;
    if (hour >= 7 && hour < 18) return 'day';
    if ((hour >= 6 && hour < 7) || (hour >= 18 && hour < 19)) return 'dusk';
    return 'night';
}

export function getWindowScene({ date, weather, lat, lastUpdated, now = Date.now() } = {}) {
    const sceneDate = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date(now);
    const month = (sceneDate.getMonth() + (Number.isFinite(lat) && lat < 0 ? 6 : 0)) % 12;
    const season = ['winter', 'spring', 'summer', 'autumn'][Math.floor(((month + 1) % 12) / 3)];
    const fresh = Number.isFinite(lastUpdated) && lastUpdated <= now && now - lastUpdated <= WEATHER_STALE_MS;
    const currentTime = localForecastTime(weather?.currentTime, dateKey(sceneDate));
    const currentFresh = fresh && currentTime !== null && currentTime <= now && now - currentTime <= CURRENT_MAX_AGE_MS;
    const currentCondition = currentFresh ? sceneWeather(weather?.currentCode) : 'unknown';
    const forecastCondition = fresh ? sceneWeather(weather?.code) : 'unknown';
    const condition = currentCondition !== 'unknown' ? currentCondition : forecastCondition;
    return {
        season, weather: condition, phase: scenePhase(sceneDate, weather, currentFresh),
        weatherSource: currentCondition !== 'unknown' ? 'current' : forecastCondition !== 'unknown' ? 'forecast' : 'unknown',
    };
}
