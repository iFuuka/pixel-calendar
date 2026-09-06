export const SCENE_DEMO_INTERVAL_MS = 8000;

export const SCENE_PRESETS = [
    { id: 'spring-day', label: { ru: 'Весенний день', en: 'Spring day' }, scene: { season: 'spring', weather: 'clear', phase: 'day' } },
    { id: 'summer-day', label: { ru: 'Летнее солнце', en: 'Summer sunshine' }, scene: { season: 'summer', weather: 'clear', phase: 'day' } },
    { id: 'autumn-rain', label: { ru: 'Осенний дождь', en: 'Autumn rain' }, scene: { season: 'autumn', weather: 'rain', phase: 'day' } },
    { id: 'winter-snow', label: { ru: 'Зимний снег', en: 'Winter snow' }, scene: { season: 'winter', weather: 'snow', phase: 'day' } },
    { id: 'summer-night', label: { ru: 'Летняя ночь', en: 'Summer night' }, scene: { season: 'summer', weather: 'clear', phase: 'night' } },
    { id: 'autumn-dusk', label: { ru: 'Осенний закат', en: 'Autumn sunset' }, scene: { season: 'autumn', weather: 'clear', phase: 'dusk' } },
    { id: 'spring-fog', label: { ru: 'Весенний туман', en: 'Spring mist' }, scene: { season: 'spring', weather: 'fog', phase: 'day' } },
    { id: 'summer-storm', label: { ru: 'Летняя гроза', en: 'Summer storm' }, scene: { season: 'summer', weather: 'storm', phase: 'dusk' } },
];
