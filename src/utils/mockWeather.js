import { format, addDays, startOfMonth } from 'date-fns';

/**
 * Generates 45 days of mock weather starting from the given date.
 */
export function generateMockWeather(fromDate) {
    const codes = [0, 1, 2, 3, 45, 51, 61, 71, 80, 95];
    const result = {};
    for (let i = 0; i < 45; i++) {
        const d = addDays(fromDate, i);
        const key = format(d, 'yyyy-MM-dd');
        const code = codes[Math.floor(Math.random() * codes.length)];
        result[key] = {
            code,
            tempMax: Math.round(5 + Math.random() * 25),
            tempMin: Math.round(Math.random() * 10),
        };
    }
    return result;
}

export function getMockWeatherForMonth(month) {
    const start = startOfMonth(month);
    return generateMockWeather(addDays(start, -7));
}
