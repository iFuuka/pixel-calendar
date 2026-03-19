/**
 * holidays.js — Public & notable holidays for multiple countries
 * Returns holidays for a given country and year.
 */

/* ── Easter calculation (Anonymous Gregorian algorithm) ────── */
function computeEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

/* ── Orthodox Easter (Julian → Gregorian) ────── */
function computeOrthodoxEaster(year) {
    const a = year % 4;
    const b = year % 7;
    const c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    const julianDate = new Date(year, month - 1, day);
    julianDate.setDate(julianDate.getDate() + 13);
    return julianDate;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function fmt(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${m}-${d}`;
}

/** Get nth occurrence of weekday in month (1-based n) */
function nthWeekday(year, month, weekday, n) {
    const first = new Date(year, month, 1);
    const diff = (weekday - first.getDay() + 7) % 7;
    const day = 1 + diff + (n - 1) * 7;
    return new Date(year, month, day);
}

/** Get last occurrence of weekday in month */
function lastWeekday(year, month, weekday) {
    const last = new Date(year, month + 1, 0);
    const diff = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - diff);
}

// Mothers Day US: 2nd Sunday of May
function mothersDayUS(year) { return nthWeekday(year, 4, 0, 2); }
// Fathers Day US: 3rd Sunday of June
function fathersDayUS(year) { return nthWeekday(year, 5, 0, 3); }

/* ══════════════════════════════════════════════════════════════
   Country holiday definitions
   ══════════════════════════════════════════════════════════════ */

function getHolidaysRU(year) {
    const easter = computeOrthodoxEaster(year);
    return [
        // ── Государственные праздники ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: '01-02', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-03', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-04', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-05', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-06', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-07', en: 'Orthodox Christmas', ru: 'Рождество Христово' },
        { date: '01-08', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '02-23', en: "Defender of the Fatherland Day", ru: 'День защитника Отечества' },
        { date: '03-08', en: "International Women's Day", ru: 'Международный женский день' },
        { date: '05-01', en: 'Spring and Labour Day', ru: 'Праздник Весны и Труда' },
        { date: '05-09', en: 'Victory Day', ru: 'День Победы' },
        { date: '06-12', en: 'Russia Day', ru: 'День России' },
        { date: '11-04', en: 'Unity Day', ru: 'День народного единства' },
        { date: fmt(easter), en: 'Orthodox Easter', ru: 'Пасха' },

        // ── Памятные и неофициальные даты ──
        { date: '01-11', en: 'Thank You Day', ru: 'День «спасибо»' },
        { date: '01-13', en: 'Russian Press Day', ru: 'День российской печати' },
        { date: '01-14', en: 'Old New Year', ru: 'Старый Новый год' },
        { date: '01-25', en: "Tatiana's Day (Students' Day)", ru: 'Татьянин день (День студента)' },
        { date: '02-08', en: 'Day of Russian Science', ru: 'День российской науки' },
        { date: '02-10', en: 'Diplomat Day', ru: 'День дипломата' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '03-01', en: 'Spring Day', ru: 'Первый день весны' },
        { date: '03-12', en: 'Maslenitsa approx.', ru: 'Масленица (примерно)' },
        { date: '03-18', en: 'Reunification Day', ru: 'День воссоединения Крыма' },
        { date: '03-27', en: 'Theatre Day', ru: 'День театра' },
        { date: '04-01', en: "April Fools' Day", ru: 'День смеха' },
        { date: '04-02', en: "Children's Book Day", ru: 'День детской книги' },
        { date: '04-07', en: 'Health Day', ru: 'День здоровья' },
        { date: '04-12', en: 'Cosmonautics Day', ru: 'День космонавтики' },
        { date: '04-22', en: 'Earth Day', ru: 'День Земли' },
        { date: '05-07', en: 'Radio Day', ru: 'День радио' },
        { date: '05-15', en: 'Family Day', ru: 'День семьи' },
        { date: '05-18', en: 'Museum Day', ru: 'День музеев' },
        { date: '05-24', en: 'Slavic Writing Day', ru: 'День славянской письменности' },
        { date: '05-27', en: 'Library Day', ru: 'День библиотек' },
        { date: '06-01', en: "Children's Day", ru: 'День защиты детей' },
        { date: '06-05', en: 'Ecologist Day', ru: 'День эколога' },
        { date: '06-06', en: 'Pushkin Day / Russian Language', ru: 'Пушкинский день / День русского языка' },
        { date: '06-22', en: 'Day of Remembrance', ru: 'День памяти и скорби' },
        { date: '06-25', en: 'Day of the Seafarer', ru: 'День моряка' },
        { date: '07-03', en: 'GIBDD Day', ru: 'День ГАИ (ГИБДД)' },
        { date: '07-08', en: 'Family Day', ru: 'День семьи, любви и верности' },
        { date: '07-20', en: 'Chess Day', ru: 'Международный день шахмат' },
        { date: '07-28', en: 'Baptism of Rus', ru: 'День крещения Руси' },
        { date: '08-01', en: 'Rear Forces Day', ru: 'День тыла ВС' },
        { date: '08-02', en: 'Airborne Forces Day', ru: 'День ВДВ' },
        { date: '08-12', en: 'Air Force Day', ru: 'День ВВС' },
        { date: '08-22', en: 'Flag Day', ru: 'День флага России' },
        { date: '09-01', en: 'Knowledge Day', ru: 'День знаний' },
        { date: '09-03', en: 'End of WWII Day', ru: 'День окончания Второй мировой' },
        { date: '09-08', en: 'Literacy Day', ru: 'День грамотности' },
        { date: '09-27', en: 'Tourism Day', ru: 'День туризма' },
        { date: '10-01', en: 'Music Day', ru: 'День музыки' },
        { date: '10-04', en: 'Animal Day', ru: 'День животных' },
        { date: '10-05', en: "Teacher's Day", ru: 'День учителя' },
        { date: '10-25', en: 'Customs Officer Day', ru: 'День таможенника' },
        { date: '10-28', en: 'Animation Day', ru: 'День анимации' },
        { date: '10-31', en: 'Halloween', ru: 'Хэллоуин' },
        { date: '11-10', en: 'Police Day', ru: 'День полиции' },
        { date: '11-16', en: 'Tolerance Day', ru: 'День толерантности' },
        { date: '11-21', en: 'Accountant Day', ru: 'День бухгалтера' },
        { date: '11-27', en: "Mother's Day (RU)", ru: 'День матери' },
        { date: '12-04', en: 'Computer Science Day', ru: 'День информатики' },
        { date: '12-09', en: 'Heroes Day', ru: 'День героев Отечества' },
        { date: '12-12', en: 'Constitution Day', ru: 'День Конституции' },
        { date: '12-22', en: 'Energy Worker Day', ru: 'День энергетика' },
        { date: '12-27', en: 'Rescue Worker Day', ru: 'День спасателя' },
        { date: '12-31', en: "New Year's Eve", ru: 'Канун Нового года' },
    ];
}

function getHolidaysUS(year) {
    const easter = computeEaster(year);
    const goodFriday = addDays(easter, -2);
    const mlk = nthWeekday(year, 0, 1, 3);
    const presidents = nthWeekday(year, 1, 1, 3);
    const memorial = lastWeekday(year, 4, 1);
    const labor = nthWeekday(year, 8, 1, 1);
    const columbus = nthWeekday(year, 9, 1, 2);
    const thanksgiving = nthWeekday(year, 10, 4, 4);
    const blackFriday = addDays(thanksgiving, 1);
    const mothersDay = mothersDayUS(year);
    const fathersDay = fathersDayUS(year);

    return [
        // ── Federal holidays ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: fmt(mlk), en: 'MLK Day', ru: 'День Мартина Лютера Кинга' },
        { date: fmt(presidents), en: "Presidents' Day", ru: 'День президентов' },
        { date: fmt(memorial), en: 'Memorial Day', ru: 'День памяти' },
        { date: '06-19', en: 'Juneteenth', ru: 'День отмены рабства' },
        { date: '07-04', en: 'Independence Day', ru: 'День независимости' },
        { date: fmt(labor), en: 'Labor Day', ru: 'День труда' },
        { date: fmt(columbus), en: 'Columbus Day', ru: 'День Колумба' },
        { date: '11-11', en: 'Veterans Day', ru: 'День ветеранов' },
        { date: fmt(thanksgiving), en: 'Thanksgiving', ru: 'День благодарения' },
        { date: '12-25', en: 'Christmas Day', ru: 'Рождество' },

        // ── Notable & cultural ──
        { date: fmt(goodFriday), en: 'Good Friday', ru: 'Страстная пятница' },
        { date: fmt(easter), en: 'Easter', ru: 'Пасха' },
        { date: '02-02', en: 'Groundhog Day', ru: 'День сурка' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '03-14', en: 'Pi Day', ru: 'День числа Пи' },
        { date: '03-17', en: "St. Patrick's Day", ru: 'День святого Патрика' },
        { date: '04-01', en: "April Fools' Day", ru: 'День смеха' },
        { date: '04-15', en: 'Tax Day', ru: 'День подачи налогов' },
        { date: '04-22', en: 'Earth Day', ru: 'День Земли' },
        { date: '05-04', en: 'Star Wars Day', ru: 'День Звёздных войн' },
        { date: '05-05', en: 'Cinco de Mayo', ru: 'Синко де Майо' },
        { date: fmt(mothersDay), en: "Mother's Day", ru: 'День матери' },
        { date: fmt(fathersDay), en: "Father's Day", ru: 'День отца' },
        { date: fmt(blackFriday), en: 'Black Friday', ru: 'Чёрная пятница' },
        { date: '10-31', en: 'Halloween', ru: 'Хэллоуин' },
        { date: '12-24', en: 'Christmas Eve', ru: 'Сочельник' },
        { date: '12-31', en: "New Year's Eve", ru: 'Канун Нового года' },

        // ── Awareness & fun ──
        { date: '01-15', en: 'Wikipedia Day', ru: 'День Википедии' },
        { date: '01-24', en: 'Compliment Day', ru: 'День комплиментов' },
        { date: '02-04', en: 'World Cancer Day', ru: 'День борьбы с раком' },
        { date: '03-08', en: "Women's Day", ru: 'Международный женский день' },
        { date: '03-20', en: 'Spring Equinox', ru: 'Весеннее равноденствие' },
        { date: '06-05', en: 'Environment Day', ru: 'День окружающей среды' },
        { date: '06-14', en: 'Flag Day', ru: 'День флага' },
        { date: '06-21', en: 'Summer Solstice', ru: 'Летнее солнцестояние' },
        { date: '08-26', en: "Women's Equality Day", ru: 'День равенства женщин' },
        { date: '09-11', en: 'Patriot Day', ru: 'День патриота' },
        { date: '09-22', en: 'Autumn Equinox', ru: 'Осеннее равноденствие' },
        { date: '10-16', en: 'Boss Day', ru: 'День босса' },
        { date: '11-01', en: 'Day of the Dead', ru: 'День мёртвых' },
        { date: '12-21', en: 'Winter Solstice', ru: 'Зимнее солнцестояние' },
    ];
}

function getHolidaysGB(year) {
    const easter = computeEaster(year);
    const goodFriday = addDays(easter, -2);
    const easterMonday = addDays(easter, 1);
    const earlyMay = nthWeekday(year, 4, 1, 1);
    const springBank = lastWeekday(year, 4, 1);
    const summerBank = lastWeekday(year, 7, 1);
    const mothersDay = addDays(easter, -21); // UK Mothering Sunday

    return [
        // ── Bank Holidays ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: fmt(goodFriday), en: 'Good Friday', ru: 'Страстная пятница' },
        { date: fmt(easter), en: 'Easter Sunday', ru: 'Пасха' },
        { date: fmt(easterMonday), en: 'Easter Monday', ru: 'Пасхальный понедельник' },
        { date: fmt(earlyMay), en: 'Early May Bank Holiday', ru: 'Майский выходной' },
        { date: fmt(springBank), en: 'Spring Bank Holiday', ru: 'Весенний выходной' },
        { date: fmt(summerBank), en: 'Summer Bank Holiday', ru: 'Летний выходной' },
        { date: '12-25', en: 'Christmas Day', ru: 'Рождество' },
        { date: '12-26', en: 'Boxing Day', ru: 'День подарков' },

        // ── Notable dates ──
        { date: '01-25', en: 'Burns Night', ru: 'Ночь Бёрнса' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: fmt(mothersDay), en: "Mothering Sunday", ru: 'День матери' },
        { date: '03-01', en: "St. David's Day", ru: 'День святого Давида' },
        { date: '03-17', en: "St. Patrick's Day", ru: 'День святого Патрика' },
        { date: '04-01', en: "April Fools' Day", ru: 'День смеха' },
        { date: '04-23', en: "St. George's Day", ru: 'День святого Георгия' },
        { date: '06-21', en: 'Summer Solstice', ru: 'Летнее солнцестояние' },
        { date: '10-31', en: 'Halloween', ru: 'Хэллоуин' },
        { date: '11-05', en: 'Guy Fawkes Night', ru: 'Ночь Гая Фокса' },
        { date: '11-11', en: 'Remembrance Day', ru: 'День памяти' },
        { date: '11-30', en: "St. Andrew's Day", ru: "День святого Андрея" },
        { date: '12-24', en: 'Christmas Eve', ru: 'Сочельник' },
        { date: '12-31', en: "New Year's Eve / Hogmanay", ru: 'Канун Нового года' },
    ];
}

function getHolidaysDE(year) {
    const easter = computeEaster(year);
    const goodFriday = addDays(easter, -2);
    const easterMonday = addDays(easter, 1);
    const ascension = addDays(easter, 39);
    const whitMonday = addDays(easter, 50);
    const rosenmontag = addDays(easter, -48);

    return [
        // ── Gesetzliche Feiertage ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: fmt(goodFriday), en: 'Good Friday', ru: 'Страстная пятница' },
        { date: fmt(easter), en: 'Easter Sunday', ru: 'Пасха' },
        { date: fmt(easterMonday), en: 'Easter Monday', ru: 'Пасхальный понедельник' },
        { date: '05-01', en: 'Labour Day', ru: 'День труда' },
        { date: fmt(ascension), en: 'Ascension Day', ru: 'Вознесение' },
        { date: fmt(whitMonday), en: 'Whit Monday', ru: 'Духов день' },
        { date: '10-03', en: 'German Unity Day', ru: 'День немецкого единства' },
        { date: '12-25', en: 'Christmas Day', ru: 'Рождество' },
        { date: '12-26', en: "St. Stephen's Day", ru: 'Второй день Рождества' },

        // ── Notable dates ──
        { date: '01-06', en: 'Epiphany', ru: 'Богоявление' },
        { date: fmt(rosenmontag), en: 'Rosenmontag (Carnival)', ru: 'Розенмонтаг (Карнавал)' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '04-01', en: 'April Fools', ru: 'День смеха' },
        { date: '04-30', en: 'Walpurgis Night', ru: 'Вальпургиева ночь' },
        { date: '06-21', en: 'Summer Solstice', ru: 'Летнее солнцестояние' },
        { date: '08-08', en: 'Augsburg Peace Day', ru: 'Аугсбургский день мира' },
        { date: '08-15', en: 'Assumption of Mary', ru: 'Успение Богородицы' },
        { date: '09-20', en: 'Oktoberfest start', ru: 'Начало Октоберфеста' },
        { date: '10-31', en: 'Reformation Day', ru: 'День Реформации' },
        { date: '11-01', en: "All Saints' Day", ru: 'День всех святых' },
        { date: '11-11', en: "St. Martin's Day", ru: 'День святого Мартина' },
        { date: '12-06', en: 'St. Nicholas Day', ru: 'День святого Николая' },
        { date: '12-24', en: 'Christmas Eve', ru: 'Сочельник' },
        { date: '12-31', en: "New Year's Eve", ru: 'Канун Нового года' },
    ];
}

function getHolidaysFR(year) {
    const easter = computeEaster(year);
    const easterMonday = addDays(easter, 1);
    const ascension = addDays(easter, 39);
    const whitMonday = addDays(easter, 50);

    return [
        // ── Jours fériés ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: fmt(easter), en: 'Easter', ru: 'Пасха' },
        { date: fmt(easterMonday), en: 'Easter Monday', ru: 'Пасхальный понедельник' },
        { date: '05-01', en: 'Labour Day', ru: 'День труда' },
        { date: '05-08', en: 'Victory in Europe Day', ru: 'День Победы (Европа)' },
        { date: fmt(ascension), en: 'Ascension Day', ru: 'Вознесение' },
        { date: fmt(whitMonday), en: 'Whit Monday', ru: 'Духов день' },
        { date: '07-14', en: 'Bastille Day', ru: 'День взятия Бастилии' },
        { date: '08-15', en: 'Assumption of Mary', ru: 'Успение Богородицы' },
        { date: '11-01', en: "All Saints' Day", ru: 'День всех святых' },
        { date: '11-11', en: 'Armistice Day', ru: 'День перемирия' },
        { date: '12-25', en: 'Christmas Day', ru: 'Рождество' },

        // ── Dates notables ──
        { date: '01-06', en: 'Epiphany', ru: 'Богоявление' },
        { date: '02-02', en: 'Candlemas', ru: 'Сретение (блинный день)' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '03-08', en: "Women's Day", ru: 'Женский день' },
        { date: '03-20', en: 'Francophonie Day', ru: 'День франкофонии' },
        { date: '04-01', en: 'Poisson d\'Avril', ru: 'День рыбы (1 апреля)' },
        { date: '05-04', en: "Star Wars Day", ru: 'День Звёздных войн' },
        { date: '06-21', en: 'Fête de la Musique', ru: 'Праздник музыки' },
        { date: '09-16', en: 'Heritage Days', ru: 'Дни наследия' },
        { date: '10-31', en: 'Halloween', ru: 'Хэллоуин' },
        { date: '12-24', en: 'Réveillon de Noël', ru: 'Рождественский сочельник' },
        { date: '12-31', en: "New Year's Eve", ru: 'Канун Нового года' },
    ];
}

function getHolidaysJP(year) {
    const vernalDay = 20;
    const autumnalDay = year % 4 === 0 ? 22 : 23;
    const marineDay = nthWeekday(year, 6, 1, 3);
    const sportsDay = nthWeekday(year, 9, 1, 2);
    const comingOfAge = nthWeekday(year, 0, 1, 2);

    return [
        // ── 国民の祝日 (National Holidays) ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: '01-02', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: '01-03', en: 'New Year Holiday', ru: 'Новогодние каникулы' },
        { date: fmt(comingOfAge), en: 'Coming of Age Day', ru: 'День совершеннолетия' },
        { date: '02-11', en: 'National Foundation Day', ru: 'День основания государства' },
        { date: '02-23', en: "Emperor's Birthday", ru: 'День рождения императора' },
        { date: `03-${String(vernalDay).padStart(2, '0')}`, en: 'Vernal Equinox Day', ru: 'День весеннего равноденствия' },
        { date: '04-29', en: 'Showa Day', ru: 'День Сёва' },
        { date: '05-03', en: 'Constitution Memorial Day', ru: 'День конституции' },
        { date: '05-04', en: 'Greenery Day', ru: 'День зелени' },
        { date: '05-05', en: "Children's Day", ru: 'День детей' },
        { date: fmt(marineDay), en: 'Marine Day', ru: 'День моря' },
        { date: '08-11', en: 'Mountain Day', ru: 'День гор' },
        { date: `09-${String(autumnalDay).padStart(2, '0')}`, en: 'Autumnal Equinox Day', ru: 'День осеннего равноденствия' },
        { date: fmt(sportsDay), en: 'Sports Day', ru: 'День спорта' },
        { date: '11-03', en: 'Culture Day', ru: 'День культуры' },
        { date: '11-23', en: 'Labour Thanksgiving Day', ru: 'День благодарности труду' },

        // ── Notable dates ──
        { date: '02-03', en: 'Setsubun', ru: 'Сэцубун (изгнание духов)' },
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '03-03', en: 'Hina Matsuri (Girls)', ru: 'Хина Мацури (День девочек)' },
        { date: '03-14', en: 'White Day', ru: 'Белый день' },
        { date: '04-01', en: 'Fiscal Year Start', ru: 'Начало финансового года' },
        { date: '07-07', en: 'Tanabata', ru: 'Танабата (Звёздный фестиваль)' },
        { date: '08-13', en: 'Obon begins', ru: 'Начало Обон' },
        { date: '08-15', en: 'Obon / WWII End Day', ru: 'Обон / Окончание войны' },
        { date: '10-31', en: 'Halloween', ru: 'Хэллоуин' },
        { date: '11-15', en: 'Shichi-Go-San', ru: 'Сити-Го-Сан (Дети 7-5-3)' },
        { date: '12-23', en: 'Christmas Eve Eve', ru: 'Канун сочельника' },
        { date: '12-24', en: 'Christmas Eve', ru: 'Сочельник' },
        { date: '12-25', en: 'Christmas', ru: 'Рождество' },
        { date: '12-31', en: 'Omisoka (NYE)', ru: 'Омисока (Канун Нового года)' },
    ];
}

function getHolidaysCN(year) {
    return [
        // ── Public holidays ──
        { date: '01-01', en: "New Year's Day", ru: 'Новый год' },
        { date: '05-01', en: 'Labour Day', ru: 'День труда' },
        { date: '10-01', en: 'National Day', ru: 'День образования КНР' },
        { date: '10-02', en: 'National Day Holiday', ru: 'Каникулы Дня КНР' },
        { date: '10-03', en: 'National Day Holiday', ru: 'Каникулы Дня КНР' },

        // ── Notable dates ──
        { date: '02-14', en: "Valentine's Day", ru: 'День святого Валентина' },
        { date: '03-08', en: "Women's Day", ru: 'Женский день' },
        { date: '03-12', en: 'Arbor Day', ru: 'День посадки деревьев' },
        { date: '04-01', en: "April Fools' Day", ru: 'День смеха' },
        { date: '04-05', en: 'Qingming Festival', ru: 'Цинмин (День усопших)' },
        { date: '05-04', en: 'Youth Day', ru: 'День молодёжи' },
        { date: '06-01', en: "Children's Day", ru: 'День детей' },
        { date: '08-01', en: 'Army Day', ru: 'День армии' },
        { date: '09-10', en: "Teacher's Day", ru: 'День учителя' },
        { date: '09-28', en: "Confucius' Birthday", ru: 'День рождения Конфуция' },
        { date: '10-31', en: 'Halloween (informal)', ru: 'Хэллоуин' },
        { date: '11-11', en: 'Singles Day', ru: 'День холостяков (11.11)' },
        { date: '12-25', en: 'Christmas (informal)', ru: 'Рождество' },
        { date: '12-31', en: "New Year's Eve", ru: 'Канун Нового года' },
    ];
}

/* ── Supported countries ─────────────────────────────────── */

export const HOLIDAY_COUNTRIES = [
    { code: 'RU', en: 'Russia', ru: 'Россия', flag: '🇷🇺' },
    { code: 'US', en: 'United States', ru: 'США', flag: '🇺🇸' },
    { code: 'GB', en: 'United Kingdom', ru: 'Великобритания', flag: '🇬🇧' },
    { code: 'DE', en: 'Germany', ru: 'Германия', flag: '🇩🇪' },
    { code: 'FR', en: 'France', ru: 'Франция', flag: '🇫🇷' },
    { code: 'JP', en: 'Japan', ru: 'Япония', flag: '🇯🇵' },
    { code: 'CN', en: 'China', ru: 'Китай', flag: '🇨🇳' },
];

const COUNTRY_FNS = {
    RU: getHolidaysRU,
    US: getHolidaysUS,
    GB: getHolidaysGB,
    DE: getHolidaysDE,
    FR: getHolidaysFR,
    JP: getHolidaysJP,
    CN: getHolidaysCN,
};

/**
 * Get a map of holidays for a given country and year.
 * Returns: { 'MM-DD': [{ en, ru }, ...], ... }
 */
export function getHolidaysForYear(countryCode, year) {
    const fn = COUNTRY_FNS[countryCode];
    if (!fn) return {};
    const list = fn(year);
    const map = {};
    for (const h of list) {
        const key = h.date.split('-').map(p => p.padStart(2, '0')).join('-');
        if (!map[key]) map[key] = [];
        map[key].push({ en: h.en, ru: h.ru });
    }
    return map;
}

/**
 * Check if a dateKey ('yyyy-MM-dd') has holidays.
 * Returns array of holiday objects [{ en, ru }, ...] or null.
 */
export function getHolidayForDate(countryCode, dateKey) {
    if (!countryCode || !dateKey) return null;
    const year = parseInt(dateKey.slice(0, 4), 10);
    const mmdd = dateKey.slice(5);
    const holidays = getHolidaysForYear(countryCode, year);
    return holidays[mmdd] || null;
}
