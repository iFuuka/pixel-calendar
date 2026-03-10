/**
 * WMO Weather Interpretation Code mapping
 * https://open-meteo.com/en/docs#weathervariables
 * label is now an i18n key — resolved by the component via translator
 */
export const weatherCodes = {
    0: { label: 'weather.code.0', icon: 'sun', bg: '#fff4b0' },
    1: { label: 'weather.code.1', icon: 'sun', bg: '#fff4b0' },
    2: { label: 'weather.code.2', icon: 'cloud-sun', bg: '#e8f4ff' },
    3: { label: 'weather.code.3', icon: 'cloud', bg: '#dce8f8' },
    45: { label: 'weather.code.45', icon: 'fog', bg: '#e0e8e8' },
    48: { label: 'weather.code.48', icon: 'fog', bg: '#dce8f4' },
    51: { label: 'weather.code.51', icon: 'rain', bg: '#d4ebff' },
    53: { label: 'weather.code.53', icon: 'rain', bg: '#c8e4ff' },
    55: { label: 'weather.code.55', icon: 'rain', bg: '#bcdeff' },
    61: { label: 'weather.code.61', icon: 'rain', bg: '#c8e4ff' },
    63: { label: 'weather.code.63', icon: 'rain', bg: '#b8d8ff' },
    65: { label: 'weather.code.65', icon: 'rain', bg: '#a8ccff' },
    71: { label: 'weather.code.71', icon: 'snow', bg: '#e8f4ff' },
    73: { label: 'weather.code.73', icon: 'snow', bg: '#dceeff' },
    75: { label: 'weather.code.75', icon: 'snow', bg: '#d0e8ff' },
    77: { label: 'weather.code.77', icon: 'snow', bg: '#d8eeff' },
    80: { label: 'weather.code.80', icon: 'rain', bg: '#c8e4ff' },
    81: { label: 'weather.code.81', icon: 'rain', bg: '#b8daff' },
    82: { label: 'weather.code.82', icon: 'rain', bg: '#a8d0ff' },
    85: { label: 'weather.code.85', icon: 'snow', bg: '#dceeff' },
    86: { label: 'weather.code.86', icon: 'snow', bg: '#d0e8ff' },
    95: { label: 'weather.code.95', icon: 'thunder', bg: '#e0d8f4' },
    96: { label: 'weather.code.96', icon: 'thunder', bg: '#d8ccee' },
    99: { label: 'weather.code.99', icon: 'thunder', bg: '#d0c4e8' },
};

export function getWeatherInfo(code) {
    return weatherCodes[code] ?? { label: 'weather.code.unknown', icon: 'cloud', bg: '#e8f0f8' };
}
