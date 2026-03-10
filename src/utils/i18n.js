/**
 * i18n.js — Translation strings for EN (English) and RU (Russian)
 * Usage: const t = useTranslation();  then t('key')
 */

export const translations = {
    en: {
        // Header
        'app.title': 'Pixel Calendar',

        // Calendar days
        'day.sun': 'Sun', 'day.mon': 'Mon', 'day.tue': 'Tue',
        'day.wed': 'Wed', 'day.thu': 'Thu', 'day.fri': 'Fri', 'day.sat': 'Sat',

        // Months
        'month.jan': 'January', 'month.feb': 'February', 'month.mar': 'March',
        'month.apr': 'April', 'month.may': 'May', 'month.jun': 'June',
        'month.jul': 'July', 'month.aug': 'August', 'month.sep': 'September',
        'month.oct': 'October', 'month.nov': 'November', 'month.dec': 'December',

        // Notes
        'notes.title': 'Notes',
        'notes.add': '✏ Add Note',
        'notes.placeholder': 'Write a note for this day…',
        'notes.empty': 'No notes yet. Add one above!',
        'notes.today': "Today's Notes",
        'notes.none.today': 'No notes for today yet!',
        'notes.add.first': 'Add your first note ✏️',
        'notes.all': 'All Notes',
        'notes.none.all': 'No notes saved yet.',
        'notes.search': 'Search notes…',

        // Weather
        'weather.title': '🌤 Weather',
        'weather.nodata': 'No weather data available',
        'weather.rain': 'Rain chance',
        'weather.wind': 'Wind',
        'weather.wind.current': 'Wind now',
        'weather.wind.max': 'Max Wind Gusts',
        'weather.sunrise': 'Sunrise',
        'weather.sunset': 'Sunset',
        'weather.hourly': 'Temperature by hour',

        // Dashboard
        'dashboard.today': '✨ Today',
        'dashboard.add': '+ Add',
        'dashboard.weather': '🌤 Weather',

        // Modal
        'modal.close': 'Close',
        'modal.weather': '🌤 Weather',
        'modal.notes': '📝 Notes',
        'modal.today': 'Today',
        'modal.edit': '✎',
        'modal.delete': '✕',
        'modal.save': '✓ Save',
        'modal.cancel': '✗ Cancel',

        // Settings
        'settings.title': 'Settings',
        'settings.location': '📍 Location',
        'settings.location.desc': 'Current:',
        'settings.location.hint': 'Type a city name…',
        'settings.location.map': 'Click anywhere on the map to set your weather location',
        'settings.search': '🔍 Search',
        'settings.temp': '🌡 Temperature Unit',
        'settings.week': '📅 First Day of Week',
        'settings.sunday': 'Sunday',
        'settings.monday': 'Monday',
        'settings.data': '💾 Data Management',
        'settings.export': '⬇ Export Notes',
        'settings.import': '⬆ Import Notes',
        'settings.import.success': 'Imported',
        'settings.import.notes': 'notes',
        'settings.import.error.format': 'Invalid file format',
        'settings.import.error.parse': 'Failed to parse JSON file',
        'settings.clear': '🗑 Clear All Data',
        'settings.confirm': '⚠ Confirm Clear!',
        'settings.confirm.msg': 'Click again to permanently delete all notes.',
        'settings.theme': '🎨 Theme',
        'settings.lang': '🌐 Language',
        'settings.timeformat': '🕐 Clock Format',
        'settings.12h': '12h (AM/PM)',
        'settings.24h': '24h',
        'settings.startup': '🚀 Startup',
        'settings.autostart': 'Launch on system startup',
        'settings.startminimized': 'Start minimized to tray',

        // Theme names
        'theme.vanilla-sky': 'Vanilla Sky',
        'theme.lavender-night': 'Lavender Night',
        'theme.matcha-box': 'Matcha Box',
        'theme.autumn-sunset': 'Autumn Sunset',
        'theme.terraria-forest': 'Terraria Forest',

        // Sidebar
        'sidebar.notes': 'Notes',
        'sidebar.empty': 'No notes yet!',
        'sidebar.hint': 'Notes you save on any day will appear here.',

        // Tags
        'tags.add': 'Add tags...',
        'tags.label': 'Tags',
        'tags.all': 'All',

        // Reminders
        'reminder.label': 'Reminder',
        'reminder.same-day': 'On the day (9:00)',
        'reminder.1-day': '1 day before',
        'reminder.2-days': '2 days before',
        'reminder.3-days': '3 days before',
        'reminder.1-week': '1 week before',
        'reminder.count': 'reminders',

        // Weather codes
        'weather.code.0': 'Clear Sky',
        'weather.code.1': 'Mainly Clear',
        'weather.code.2': 'Partly Cloudy',
        'weather.code.3': 'Overcast',
        'weather.code.45': 'Foggy',
        'weather.code.48': 'Icy Fog',
        'weather.code.51': 'Light Drizzle',
        'weather.code.53': 'Drizzle',
        'weather.code.55': 'Heavy Drizzle',
        'weather.code.61': 'Light Rain',
        'weather.code.63': 'Moderate Rain',
        'weather.code.65': 'Heavy Rain',
        'weather.code.71': 'Light Snow',
        'weather.code.73': 'Moderate Snow',
        'weather.code.75': 'Heavy Snow',
        'weather.code.77': 'Snow Grains',
        'weather.code.80': 'Light Showers',
        'weather.code.81': 'Showers',
        'weather.code.82': 'Heavy Showers',
        'weather.code.85': 'Snow Showers',
        'weather.code.86': 'Heavy Snow Showers',
        'weather.code.95': 'Thunderstorm',
        'weather.code.96': 'Thunder + Hail',
        'weather.code.99': 'Thunder + Hail',
        'weather.code.unknown': 'Unknown',

        // Notes UI
        'notes.save': 'Save',
        'notes.cancel': 'Cancel',
        'notes.tags.reminder': 'Tags & Reminder',
        'notes.addnote': '✨ Add Note',
        'notes.write': 'Write a note for this day...',
        'notes.noyet': 'No notes yet. Add one above!',

        // Sidebar
        'sidebar.allnotes': 'All Notes',
        'sidebar.search': '🔍 Search notes & tags...',
        'sidebar.noyet': 'No notes yet!',
        'sidebar.noyet.sub': 'Click any day to add one.',
        'sidebar.nomatch': 'No notes match.',
        'sidebar.hasreminder': 'Has reminder',
        'sidebar.edit': 'Edit note',
        'sidebar.delete': 'Delete note',
        'sidebar.close': 'Close sidebar',
        'sidebar.open': 'Open notes sidebar',

        // Header
        'header.prev': 'Previous month',
        'header.next': 'Next month',

        // Modal
        'modal.confirm.title': 'Confirm Deletion',
        'modal.confirm.desc': 'Are you sure you want to permanently delete this note?',

        // Misc
        'mock.warning': '⚠ Mock data',
        'loading': '···',
    },

    ru: {
        // Header
        'app.title': 'Пиксель Календарь',

        // Calendar days
        'day.sun': 'Вс', 'day.mon': 'Пн', 'day.tue': 'Вт',
        'day.wed': 'Ср', 'day.thu': 'Чт', 'day.fri': 'Пт', 'day.sat': 'Сб',

        // Months
        'month.jan': 'Январь', 'month.feb': 'Февраль', 'month.mar': 'Март',
        'month.apr': 'Апрель', 'month.may': 'Май', 'month.jun': 'Июнь',
        'month.jul': 'Июль', 'month.aug': 'Август', 'month.sep': 'Сентябрь',
        'month.oct': 'Октябрь', 'month.nov': 'Ноябрь', 'month.dec': 'Декабрь',

        // Notes
        'notes.title': 'Заметки',
        'notes.add': '✏ Добавить',
        'notes.placeholder': 'Напишите заметку на этот день…',
        'notes.empty': 'Нет заметок. Добавьте выше!',
        'notes.today': 'Заметки на сегодня',
        'notes.none.today': 'Заметок на сегодня нет!',
        'notes.add.first': 'Добавьте первую заметку ✏️',
        'notes.all': 'Все заметки',
        'notes.none.all': 'Заметки ещё не сохранены.',
        'notes.search': 'Поиск заметок…',

        // Weather
        'weather.title': '🌤 Погода',
        'weather.nodata': 'Данные о погоде недоступны',
        'weather.rain': 'Дождь',
        'weather.wind': 'Ветер',
        'weather.wind.current': 'Ветер сейчас',
        'weather.wind.max': 'Порывы ветра до',
        'weather.sunrise': 'Восход',
        'weather.sunset': 'Закат',
        'weather.hourly': 'Температура по часам',

        // Dashboard
        'dashboard.today': '✨ Сегодня',
        'dashboard.add': '+ Добавить',
        'dashboard.weather': '🌤 Погода',

        // Modal
        'modal.close': 'Закрыть',
        'modal.weather': '🌤 Погода',
        'modal.notes': '📝 Заметки',
        'modal.today': 'Сегодня',
        'modal.edit': '✎',
        'modal.delete': '✕',
        'modal.save': '✓ Сохранить',
        'modal.cancel': '✗ Отмена',

        // Settings
        'settings.title': 'Настройки',
        'settings.location': '📍 Местоположение',
        'settings.location.desc': 'Текущее:',
        'settings.location.hint': 'Введите город…',
        'settings.location.map': 'Нажмите на карту, чтобы выбрать местоположение',
        'settings.search': '🔍 Найти',
        'settings.temp': '🌡 Единица температуры',
        'settings.week': '📅 Первый день недели',
        'settings.sunday': 'Воскресенье',
        'settings.monday': 'Понедельник',
        'settings.data': '💾 Управление данными',
        'settings.export': '⬇ Экспорт заметок',
        'settings.import': '⬆ Импорт заметок',
        'settings.import.success': 'Импортировано',
        'settings.import.notes': 'заметок',
        'settings.import.error.format': 'Неверный формат файла',
        'settings.import.error.parse': 'Не удалось прочитать JSON файл',
        'settings.clear': '🗑 Очистить данные',
        'settings.confirm': '⚠ Подтвердить!',
        'settings.confirm.msg': 'Нажмите ещё раз для удаления всех заметок.',
        'settings.theme': '🎨 Тема',
        'settings.lang': '🌐 Язык',
        'settings.timeformat': '🕐 Формат времени',
        'settings.12h': '12ч (AM/PM)',
        'settings.24h': '24ч',
        'settings.startup': '🚀 Запуск',
        'settings.autostart': 'Запускать при старте системы',
        'settings.startminimized': 'Запуск свёрнутым в трей',

        // Theme names
        'theme.vanilla-sky': 'Ванильное небо',
        'theme.lavender-night': 'Лавандовая ночь',
        'theme.matcha-box': 'Матча',
        'theme.autumn-sunset': 'Закат осени',
        'theme.terraria-forest': 'Лес Террарии',

        // Sidebar
        'sidebar.notes': 'Заметки',
        'sidebar.empty': 'Заметок нет!',
        'sidebar.hint': 'Здесь появятся ваши заметки.',

        // Tags
        'tags.add': 'Добавить теги...',
        'tags.label': 'Теги',
        'tags.all': 'Все',

        // Reminders
        'reminder.label': 'Напоминание',
        'reminder.same-day': 'В этот день (9:00)',
        'reminder.1-day': 'За 1 день',
        'reminder.2-days': 'За 2 дня',
        'reminder.3-days': 'За 3 дня',
        'reminder.1-week': 'За неделю',
        'reminder.count': 'напоминаний',

        // Weather codes
        'weather.code.0': 'Ясно',
        'weather.code.1': 'Преим. ясно',
        'weather.code.2': 'Переменная облачность',
        'weather.code.3': 'Пасмурно',
        'weather.code.45': 'Туман',
        'weather.code.48': 'Изморозь',
        'weather.code.51': 'Лёгкая морось',
        'weather.code.53': 'Морось',
        'weather.code.55': 'Сильная морось',
        'weather.code.61': 'Небольшой дождь',
        'weather.code.63': 'Дождь',
        'weather.code.65': 'Сильный дождь',
        'weather.code.71': 'Небольшой снег',
        'weather.code.73': 'Снег',
        'weather.code.75': 'Сильный снег',
        'weather.code.77': 'Снежная крупа',
        'weather.code.80': 'Небольшие ливни',
        'weather.code.81': 'Ливень',
        'weather.code.82': 'Сильный ливень',
        'weather.code.85': 'Снежный ливень',
        'weather.code.86': 'Сильный снежный ливень',
        'weather.code.95': 'Гроза',
        'weather.code.96': 'Гроза с градом',
        'weather.code.99': 'Гроза с градом',
        'weather.code.unknown': 'Неизвестно',

        // Notes UI
        'notes.save': 'Сохранить',
        'notes.cancel': 'Отмена',
        'notes.tags.reminder': 'Теги и напоминание',
        'notes.addnote': '✨ Добавить',
        'notes.write': 'Напишите заметку на этот день...',
        'notes.noyet': 'Заметок нет. Добавьте выше!',

        // Sidebar
        'sidebar.allnotes': 'Все заметки',
        'sidebar.search': '🔍 Поиск заметок и тегов...',
        'sidebar.noyet': 'Заметок пока нет!',
        'sidebar.noyet.sub': 'Нажмите на любой день.',
        'sidebar.nomatch': 'Ничего не найдено.',
        'sidebar.hasreminder': 'Есть напоминание',
        'sidebar.edit': 'Редактировать',
        'sidebar.delete': 'Удалить',
        'sidebar.close': 'Закрыть панель',
        'sidebar.open': 'Открыть заметки',

        // Header
        'header.prev': 'Предыдущий месяц',
        'header.next': 'Следующий месяц',

        // Modal
        'modal.confirm.title': 'Подтвердите удаление',
        'modal.confirm.desc': 'Вы уверены, что хотите удалить эту заметку?',

        // Misc
        'mock.warning': '⚠ Демо-данные',
        'loading': '···',
    },
};

/** Returns a translate function bound to the given language */
export function createTranslator(lang = 'en') {
    const dict = translations[lang] ?? translations.en;
    return (key, fallback) => dict[key] ?? fallback ?? key;
}
