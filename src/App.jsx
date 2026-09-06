import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, format, parseISO, startOfMonth, differenceInDays, isSameMonth } from 'date-fns';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import DayModal from './components/DayModal';
import NotesSidebar from './components/NotesSidebar';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import CurrentDayDashboard from './components/CurrentDayDashboard';
import WeekAhead from './components/WeekAhead';
import HabitTracker from './components/HabitTracker';
import StatsPanel from './components/StatsPanel';
import SeasonalDecorations from './components/SeasonalDecorations';
import PixelWindow from './components/PixelWindow';
import AuthorBadge from './components/AuthorBadge';
import AdminPanel from './components/AdminPanel';
import ToastNotification from './components/ToastNotification';
import { useNotes } from './hooks/useNotes';
import { useWeather } from './hooks/useWeather';
import { useWeatherAlerts } from './hooks/useWeatherAlerts';
import { useUpdateChecker } from './hooks/useUpdateChecker';
import { useSettings } from './hooks/useSettings';
import { useReminders } from './hooks/useReminders';
import { useDayMeta } from './hooks/useDayMeta';
import { useMoods } from './hooks/useMoods';
import { useHabits } from './hooks/useHabits';
import { useCountdowns } from './hooks/useCountdowns';
import { useScenePreview } from './hooks/useScenePreview';
import { createTranslator } from './utils/i18n';
import { getHolidayForDate } from './utils/holidays';
import { playSound } from './utils/sounds';
import { getWindowScene } from './utils/windowScene';
import packageJson from '../package.json';
import './App.css';

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [autoEditNoteId, setAutoEditNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const { scenePreview, scenePlaying, sceneShowcase, setScenePreview, setScenePlaying,
    setSceneShowcase, resetScenePreview } = useScenePreview(adminOpen);
  const openAdmin = useCallback(() => { resetScenePreview(); setAdminOpen(true); }, [resetScenePreview]);
  const closeAdmin = useCallback(() => { resetScenePreview(); setAdminOpen(false); }, [resetScenePreview]);
  useEffect(() => {
    if (!adminOpen) return;
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeAdmin();
      }
    };
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [adminOpen, closeAdmin]);
  const [toastQueue, setToastQueue] = useState([]);
  const toastData = toastQueue[0] || null;
  const [calendarView, setCalendarView] = useState('month');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarLayers, setCalendarLayers] = useState({
    weather: true,
    holidays: true,
    notes: true,
    meta: true,
  });

  // Settings
  const {
    settings, updateCity, updateLatLon, setTempUnit, setFirstDayOfWeek,
    setTheme, setLanguage, setTimeFormat, setAutoStart, setStartMinimized,
    setFontFamily, setCustomThemeEnabled, setCustomColor,
    setSoundEnabled, setWeatherAlertsEnabled, setUpdateAlertsEnabled, setDecorationsEnabled, setWindowBackgroundEnabled, setHolidaysEnabled, setHolidayCountry,
  } = useSettings();

  const t = useMemo(() => createTranslator(settings.language), [settings.language]);

  const sfx = useCallback((name) => {
    if (settings.soundEnabled) playSound(name);
  }, [settings.soundEnabled]);

  // Notes
  const {
    allNotes, getNotesForDate, addNote, editNote, deleteNote, moveNote,
    hasNotes, clearAllNotes, importNotes, updateNoteTags, updateNoteReminder,
    markReminderNotified, updateNoteSchedule, snoozeReminder, allTags,
  } = useNotes();

  // Day meta, moods, habits, countdowns
  const { getDayMeta, setDayColor, toggleSticker } = useDayMeta();
  const { moods, getMood, setMood } = useMoods();
  const { habits, addHabit, removeHabit, toggleCheck, isChecked, getStreak } = useHabits();
  const { countdowns, addCountdown, removeCountdown } = useCountdowns();

  const handleShowToast = useCallback((data) => { setToastQueue(queue => [...queue, data]); }, []);
  const handleCloseToast = useCallback(() => { setToastQueue(queue => queue.slice(1)); }, []);
  useReminders(allNotes, markReminderNotified, handleShowToast, t);

  // Weather
  const weatherLocation = { lat: settings.lat, lon: settings.lon, locationName: settings.locationName };
  const {
    getWeatherForDate,
    loading: weatherLoading,
    locationName,
    error: weatherError,
    usingCache: weatherUsingCache,
    lastUpdated: weatherLastUpdated,
    timezone: weatherTimezone,
    now: weatherNow,
    refreshWeather,
  } = useWeather(weatherLocation);

  useWeatherAlerts({
    enabled: settings.weatherAlertsEnabled,
    getWeatherForDate,
    onShowToast: handleShowToast,
    t,
  });

  useUpdateChecker({
    enabled: settings.updateAlertsEnabled,
    currentVersion: packageJson.version,
    onShowToast: handleShowToast,
    t,
  });

  // Navigation
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(m => calendarView === 'week' ? subWeeks(m, 1) : subMonths(m, 1));
    sfx('navigate');
  }, [calendarView, sfx]);
  const handleNextMonth = useCallback(() => {
    setCurrentMonth(m => calendarView === 'week' ? addWeeks(m, 1) : addMonths(m, 1));
    sfx('navigate');
  }, [calendarView, sfx]);
  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(calendarView === 'week' ? today : startOfMonth(today));
    setSelectedDate(today);
    setAutoEditNoteId(null);
    sfx('click');
  }, [calendarView, sfx]);

  const handleCalendarViewChange = useCallback((view) => {
    if (view === calendarView) return;

    if (view === 'week') {
      const today = new Date();
      const weekAnchor = selectedDate || (isSameMonth(today, currentMonth) ? today : currentMonth);
      setCurrentMonth(weekAnchor);
    } else {
      setCurrentMonth((date) => startOfMonth(date));
    }

    setCalendarView(view);
    sfx('toggle');
  }, [calendarView, currentMonth, selectedDate, sfx]);

  const handleDayClick = useCallback((day) => {
    setSelectedDate(prev => {
      if (prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) return null;
      return day;
    });
    setAutoEditNoteId(null);
    sfx('click');
  }, [sfx]);

  const handleCloseModal = useCallback(() => { setSelectedDate(null); setAutoEditNoteId(null); }, []);

  const handleAddNote = useCallback((dateKey, text, tags, reminder, schedule) => {
    addNote(dateKey, text, tags, reminder, schedule);
    sfx('noteAdd');
  }, [addNote, sfx]);

  const handleDeleteNote = useCallback((dateKey, noteId) => {
    deleteNote(dateKey, noteId);
    sfx('noteDelete');
  }, [deleteNote, sfx]);

  const handleNoteClick = useCallback((dateKey, noteIdToEdit = null) => {
    const date = parseISO(dateKey);
    setCurrentMonth(startOfMonth(date));
    setSelectedDate(date);
    setAutoEditNoteId(noteIdToEdit);
    setSidebarOpen(false);
  }, []);

  const handleSidebarDeleteNote = useCallback((dateKey, noteId) => {
    const note = (allNotes[dateKey] || []).find(item => item.id === noteId)
      || getNotesForDate(dateKey).find(item => item.id === noteId);
    setNoteToDelete({ dateKey, id: noteId, recurring: !!note?.repeat && note.repeat !== 'none' });
  }, [allNotes, getNotesForDate]);

  const handleReminderAction = useCallback((action, notification) => {
    const { dateKey, noteId } = notification;
    if (!getNotesForDate(dateKey).some(note => note.id === noteId)) throw new Error(t('reminder.unavailable'));
    if (action === 'snooze') {
      try { snoozeReminder(dateKey, noteId); } catch { throw new Error(t('reminder.actionError')); }
    } else if (action === 'open') {
      setSettingsOpen(false); setStatsOpen(false); setAdminOpen(false); setSidebarOpen(false);
      const date = parseISO(dateKey);
      setCurrentMonth(calendarView === 'week' ? date : startOfMonth(date));
      setSelectedDate(date);
      setAutoEditNoteId(null);
    } else throw new Error(t('reminder.actionError'));
  }, [getNotesForDate, snoozeReminder, calendarView, t]);

  useEffect(() => window.electronNotify?.onAction?.(request => {
    try {
      handleReminderAction(request.action, request.notification);
      window.electronNotify.completeAction(request.id, { ok: true });
    } catch (error) {
      window.electronNotify.completeAction(request.id, { ok: false, error: error.message });
    }
  }), [handleReminderAction]);
  const confirmDeleteNote = useCallback(() => { if (noteToDelete) { handleDeleteNote(noteToDelete.dateKey, noteToDelete.id); setNoteToDelete(null); } }, [noteToDelete, handleDeleteNote]);
  const cancelDeleteNote = useCallback(() => { setNoteToDelete(null); }, []);
  const handleClearAllData = useCallback(() => { clearAllNotes(); setSelectedDate(null); }, [clearAllNotes]);

  const getHoliday = useCallback((dateKey) => {
    if (!settings.holidaysEnabled || !settings.holidayCountry) return null;
    return getHolidayForDate(settings.holidayCountry, dateKey);
  }, [settings.holidaysEnabled, settings.holidayCountry]);

  const handleMoveNote = useCallback((from, to, noteId) => { moveNote(from, to, noteId); sfx('toggle'); }, [moveNote, sfx]);

  const toggleCalendarLayer = useCallback((key) => {
    setCalendarLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const getCalendarSearchMatch = useCallback((dateKey) => {
    const query = calendarSearch.trim().toLowerCase();
    if (!query) return false;

    const notes = getNotesForDate(dateKey);
    const noteMatch = notes.some((note) =>
      note.text?.toLowerCase().includes(query)
      || (note.tags ?? []).some((tag) => tag.toLowerCase().includes(query))
    );
    if (noteMatch) return true;

    const holiday = getHoliday(dateKey);
    if (holiday?.some((h) => h.en.toLowerCase().includes(query) || h.ru.toLowerCase().includes(query))) return true;

    return (getMood(dateKey) ?? '').toLowerCase().includes(query);
  }, [getNotesForDate, calendarSearch, getHoliday, getMood]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (settingsOpen || statsOpen || adminOpen || selectedDate || noteToDelete) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevMonth(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNextMonth(); }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const today = new Date();
        setSelectedDate(today);
        setCurrentMonth(startOfMonth(today));
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setFocusMode(v => !v);
        }
      }
      if (e.key === 'Escape') {
        if (focusMode) setFocusMode(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [settingsOpen, statsOpen, adminOpen, selectedDate, noteToDelete, focusMode, handlePrevMonth, handleNextMonth]);

  // Active countdowns for dashboard
  const activeCountdowns = useMemo(() => {
    const today = new Date();
    return countdowns.map(cd => {
      const target = parseISO(cd.dateKey);
      const diff = differenceInDays(target, today);
      return { ...cd, daysLeft: diff };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [countdowns]);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedWeather = selectedDateKey ? getWeatherForDate(selectedDateKey) : null;
  const selectedNotes = selectedDateKey ? getNotesForDate(selectedDateKey) : [];
  // The sidebar can still edit a series whose first occurrence was moved away.
  if (autoEditNoteId && !selectedNotes.some(note => note.id === autoEditNoteId)) {
    const source = (allNotes[selectedDateKey] || []).find(note => note.id === autoEditNoteId);
    if (source) selectedNotes.push({ ...source, sourceDateKey: selectedDateKey });
  }
  const selectedHoliday = selectedDateKey ? getHoliday(selectedDateKey) : null;
  const selectedDayMeta = selectedDateKey ? getDayMeta(selectedDateKey) : null;
  const selectedMood = selectedDateKey ? getMood(selectedDateKey) : null;
  const windowDate = new Date(weatherNow);
  const windowScene = getWindowScene({
    date: windowDate,
    weather: getWeatherForDate(format(windowDate, 'yyyy-MM-dd')),
    lat: settings.lat,
    lastUpdated: weatherLastUpdated,
    now: weatherNow,
  });
  const showingSceneDemo = adminOpen && (scenePreview !== null || sceneShowcase);
  const showWindow = showingSceneDemo || (settings.windowBackgroundEnabled && !focusMode);
  const displayedScene = adminOpen && scenePreview ? scenePreview : windowScene;

  return (
    <>
    {showWindow && <PixelWindow scene={displayedScene} animated={settings.decorationsEnabled} />}
    <div className={`app ${focusMode ? 'app--focus' : ''} ${showWindow ? 'app--window' : ''} ${adminOpen && sceneShowcase ? 'app--scene-showcase' : ''}`}>
      {settings.decorationsEnabled && !showWindow && !focusMode && <SeasonalDecorations />}

      <Header
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        locationName={locationName}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        weatherUsingCache={weatherUsingCache}
        weatherLastUpdated={weatherLastUpdated}
        onRefreshWeather={refreshWeather}
        onOpenSettings={() => { setSettingsOpen(true); sfx('modalOpen'); }}
        onOpenStats={() => { setStatsOpen(true); sfx('modalOpen'); }}
        focusMode={focusMode}
        t={t}
      />

      <main className="main-content">
        {!focusMode && (
          <>
            <NotesSidebar
              allNotes={allNotes}
              onNoteClick={handleNoteClick}
              onDeleteNote={handleSidebarDeleteNote}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(v => !v)}
              t={t}
              allTags={allTags}
            />
            {sidebarOpen && (
              <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            )}
          </>
        )}

        <div className="content-column">
          <section className="calendar-toolbar pixel-border">
            <div className="calendar-toolbar-left">
              <button className="calendar-tool-btn" type="button" onClick={handleToday}>
                {t('calendar.today', 'Today')}
              </button>
              <div className="calendar-view-toggle" role="group" aria-label={t('calendar.view', 'Calendar view')}>
                <button
                  className={`calendar-tool-btn ${calendarView === 'month' ? 'calendar-tool-btn--active' : ''}`}
                  type="button"
                  onClick={() => handleCalendarViewChange('month')}
                >
                  {t('calendar.view.month', 'Month')}
                </button>
                <button
                  className={`calendar-tool-btn ${calendarView === 'week' ? 'calendar-tool-btn--active' : ''}`}
                  type="button"
                  onClick={() => handleCalendarViewChange('week')}
                >
                  {t('calendar.view.week', 'Week')}
                </button>
              </div>
            </div>
            <input
              className="calendar-search"
              type="search"
              value={calendarSearch}
              onChange={(e) => setCalendarSearch(e.target.value)}
              placeholder={t('calendar.search', 'Search calendar...')}
              aria-label={t('calendar.search', 'Search calendar')}
            />
            <div className="calendar-layer-toggle" role="group" aria-label={t('calendar.layers', 'Calendar layers')}>
              {['weather', 'holidays', 'notes', 'meta'].map((key) => (
                <button
                  key={key}
                  className={`calendar-layer-btn ${calendarLayers[key] ? 'calendar-layer-btn--active' : ''}`}
                  type="button"
                  onClick={() => toggleCalendarLayer(key)}
                  aria-pressed={calendarLayers[key]}
                >
                  {t(`calendar.layer.${key}`)}
                </button>
              ))}
            </div>
          </section>

          <section className="calendar-section">
            <CalendarGrid
              currentMonth={currentMonth}
              viewMode={calendarView}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              getWeatherForDate={getWeatherForDate}
              hasNotes={hasNotes}
              getNotesForDate={getNotesForDate}
              weatherLoading={weatherLoading}
              firstDayOfWeek={settings.firstDayOfWeek}
              tempUnit={settings.tempUnit}
              density="detailed"
              getHoliday={getHoliday}
              getDayMeta={getDayMeta}
              getMood={getMood}
              onMoveNote={handleMoveNote}
              layers={calendarLayers}
              searchActive={calendarSearch.trim().length > 0}
              getSearchMatch={getCalendarSearchMatch}
              lang={settings.language}
              t={t}
            />
          </section>

          {!focusMode && (
            <>
              <section className="week-ahead-section">
                <WeekAhead
                  getWeatherForDate={getWeatherForDate}
                  getNotesForDate={getNotesForDate}
                  getDayMeta={getDayMeta}
                  onDayClick={handleDayClick}
                  tempUnit={settings.tempUnit}
                  t={t}
                />
              </section>

              {/* Countdowns — visible cards */}
              {activeCountdowns.length > 0 && (
                <section className="countdowns-section">
                  {activeCountdowns.map(cd => (
                    <div key={cd.id} className={`cd-card pixel-border ${cd.daysLeft === 0 ? 'cd-card--today' : cd.daysLeft < 0 ? 'cd-card--past' : ''}`}>
                      <span className="cd-card-emoji">{cd.emoji}</span>
                      <div className="cd-card-info">
                        <span className="cd-card-label">{cd.label}</span>
                        <span className="cd-card-days">
                          {cd.daysLeft > 0
                            ? `${cd.daysLeft} ${t('countdown.days.left')}`
                            : cd.daysLeft === 0
                            ? `🎉 ${t('countdown.today')}`
                            : `${Math.abs(cd.daysLeft)} ${t('countdown.passed')}`}
                        </span>
                      </div>
                      <button className="cd-card-x" onClick={() => removeCountdown(cd.id)} title="✕">✕</button>
                    </div>
                  ))}
                </section>
              )}

              {/* Habits bar */}
              <section className="compact-bar pixel-border">
                <HabitTracker
                    habits={habits}
                    onAdd={addHabit}
                    onRemove={removeHabit}
                    onToggle={toggleCheck}
                    isChecked={isChecked}
                    getStreak={getStreak}
                    t={t}
                  />
                </section>

              <section className="dashboard-section">
                <CurrentDayDashboard
                  getWeatherForDate={getWeatherForDate}
                  getNotesForDate={getNotesForDate}
                  tempUnit={settings.tempUnit}
                  timeFormat={settings.timeFormat}
                  lang={settings.language}
                  onOpenDay={handleDayClick}
                  t={t}
                />
              </section>
            </>
          )}
        </div>
      </main>

      {selectedDate && (
        <DayModal
          key={selectedDateKey}
          selectedDate={selectedDate}
          weather={selectedWeather}
          weatherStatus={{ lastUpdated: weatherLastUpdated, usingCache: weatherUsingCache, error: weatherError, timezone: weatherTimezone, locationName, now: weatherNow }}
          onAcceptWeather={moveNote}
          notes={selectedNotes}
          holiday={selectedHoliday}
          dayMeta={selectedDayMeta}
          mood={selectedMood}
          onSetMood={setMood}
          countdowns={countdowns}
          onAddCountdown={addCountdown}
          onRemoveCountdown={removeCountdown}
          onClose={handleCloseModal}
          onAddNote={handleAddNote}
          onEditNote={editNote}
          onDeleteNote={handleSidebarDeleteNote}
          onUpdateNoteTags={updateNoteTags}
          onUpdateNoteReminder={updateNoteReminder}
          onUpdateNoteSchedule={updateNoteSchedule}
          onSetDayColor={(color) => setDayColor(selectedDateKey, color)}
          onToggleSticker={(sticker) => toggleSticker(selectedDateKey, sticker)}
          tempUnit={settings.tempUnit}
          lang={settings.language}
          t={t}
          autoEditNoteId={autoEditNoteId}
          allTags={allTags}
        />
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        t={t}
        onUpdateCity={updateCity}
        onUpdateLatLon={updateLatLon}
        onSetTempUnit={setTempUnit}
        onSetFirstDayOfWeek={setFirstDayOfWeek}
        onSetTheme={setTheme}
        onSetLanguage={setLanguage}
        onSetTimeFormat={setTimeFormat}
        onClearAllData={handleClearAllData}
        onImportNotes={importNotes}
        onSetAutoStart={setAutoStart}
        onSetStartMinimized={setStartMinimized}
        onSetFontFamily={setFontFamily}
        onSetCustomThemeEnabled={setCustomThemeEnabled}
        onSetCustomColor={setCustomColor}
        onSetSoundEnabled={setSoundEnabled}
        onSetWeatherAlertsEnabled={setWeatherAlertsEnabled}
        onSetUpdateAlertsEnabled={setUpdateAlertsEnabled}
        onSetDecorationsEnabled={setDecorationsEnabled}
        onSetWindowBackgroundEnabled={setWindowBackgroundEnabled}
        onSetHolidaysEnabled={setHolidaysEnabled}
        onSetHolidayCountry={setHolidayCountry}
      />

      <StatsPanel
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        allNotes={allNotes}
        moods={moods}
        t={t}
      />

      <ConfirmModal
        isOpen={noteToDelete !== null}
        title={t('modal.confirm.title', 'Confirm Deletion')}
        message={noteToDelete?.recurring
          ? t('event.deleteSeries') : t('modal.confirm.desc', 'Are you sure?')}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        t={t}
      />

      <ToastNotification notification={toastData} onClose={handleCloseToast} onReminderAction={handleReminderAction} />
      <AuthorBadge onAdminActivate={openAdmin} />
      <AdminPanel isOpen={adminOpen} onClose={closeAdmin} allNotes={allNotes} settings={settings} allTags={allTags} onShowToast={handleShowToast}
        scenePreview={scenePreview} liveScene={windowScene} onScenePreviewChange={setScenePreview}
        scenePlaying={scenePlaying} onScenePlayingChange={setScenePlaying}
        sceneShowcase={sceneShowcase} onSceneShowcaseChange={setSceneShowcase} />
    </div>
    </>
  );
}
