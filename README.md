# Pixel Calendar

![Pixel Calendar Icon](build/icon.png)

Уютный пиксельный календарь с погодой, событиями, заметками и напоминаниями.

*A cozy pixel-art calendar with weather, events, notes and reminders.*

**[Скачать для Windows / Download for Windows](https://github.com/iFuuka/pixel-calendar/releases/latest)** — portable x64, установка не нужна.

<img width="1266" height="853" alt="Pixel Calendar" src="https://github.com/user-attachments/assets/831bbe40-bb2a-4cdb-86b4-a822391148d2" />

## Новое в 3.6.1

Обновление сохраняет знакомые пиксельные шрифты, пастельные темы и объёмные рамки.

- **Окно с живым пейзажем.** Погода, сезон и время суток меняют вид за стеклом. Листва, осадки, лепестки, бабочки и светлячки оживляют сцену; молния прорисовывается пиксель за пикселем. Кот дышит во сне и шевелит хвостом, над кружкой поднимается пар. Рама и шторы неподвижны.
- **Метки дня.** Настроение, подписанные цвета и до трёх стикеров выбираются во вкладках. Пиксельные значки видны под числом в календаре; выбранные метки легко снять. Кнопка «Жду этот день» открывает отдельную форму обратного отсчёта.
- **События со временем и повторениями.** Ежедневные, еженедельные, ежемесячные и ежегодные события, дата окончания серии, поиск и краткие записи в ячейках. Перетаскивание переносит одно вхождение; редактирование расписания меняет серию.
- **Погода для планов.** Отметка «На улице» добавляет прогноз к событию со временем. При неблагоприятной температуре или вероятности осадков можно выбрать предложенное время того же дня. Перенос выполняется только после выбора.
- **Напоминания.** Уведомление позволяет открыть день события или отложить сигнал на 15 минут. Отложенные сигналы сохраняются между запусками.
- **Полная резервная копия.** События, напоминания, привычки, настроения, оформление, отсчёты и настройки экспортируются вместе. Восстановление проверяет файл, показывает содержимое и сохраняет копию прежних данных.
- **Работа в трее.** Крестик скрывает календарь в трей; пункт выхода завершает приложение. Размер, положение и развёрнутый вид окна запоминаются. Погода обновляется в фоне, после сна и восстановления сети; прогноз дня всегда раскрыт.

Фон и анимации отключаются в настройках; учитывается системное уменьшение движения. Админ-панель → «Фон» позволяет посмотреть восемь сцен, выбрать сезон, погоду и время суток, включить автопоказ или скрыть календарь для просмотра пейзажа. Админка открывается десятью нажатиями на подпись **iFuuka**. Демо не меняет сохранённую погоду и записи.

Время событий и напоминаний соответствует часовому поясу устройства. Для напоминаний приложение должно работать, в том числе в трее. Погодные предложения учитывают температуру и осадки в час начала; длительность события, дорога и другие погодные риски не оцениваются.

## What's new in 3.6.1

- A seasonal pixel window follows the weather and daylight, with animated scenery, progressively drawn lightning, a sleeping cat and cup steam. The original fonts, themes and raised frames are preserved.
- A compact day-mark editor adds custom pixel mood/sticker icons, named color labels, visible selections and a prominent countdown button.
- Timed and recurring events support calendar previews, search and moving individual occurrences. Outdoor events can show hourly forecasts and optional same-day time suggestions.
- Reminders can open the event day or snooze for 15 minutes. Full backups include calendar data and settings, with validation and a recovery copy before restore.
- Closing the window hides it in the tray; window placement persists. Weather refreshes in the background, after resume and reconnect. Day weather stays expanded.
- Admin scenery previews offer eight presets and a slideshow. Background motion respects animation preferences, reduced motion and hidden windows.

## Возможности / Features

- Пять тем, пиксельный и классический шрифты / Five themes, pixel and classic fonts.
- Календарь месяца и недели / Month and week views.
- Погода Open-Meteo и почасовой график / Open-Meteo weather and hourly chart.
- Заметки, поиск, теги и закрепление / Notes, search, tags and pinning.
- Привычки, настроения и обратные отсчёты / Habits, moods and countdowns.
- Русский, английский, японский и корейский интерфейс / Russian, English, Japanese and Korean interface.
- Windows x64 portable: `PixelCalendar-Portable-3.6.1.exe`.

## Разработка / Development

```sh
npm ci
npm run dev
npm test
npm run lint
npm run electron:build
```

Готовый exe появляется в `release/`. Для запуска Electron в режиме разработки: `npm run electron:dev`.

`node scripts/preview-ui.mjs` создаёт визуальные примеры на вымышленных данных для всех тем. После `npm run dev` они доступны по адресу `/dist/review/vanilla-sky.html`. Production-сборка удаляет эти примеры из `dist`.

Подробности выпуска: [release_notes.md](release_notes.md).

---
*Created by iFuuka* / *Создано iFuuka*
