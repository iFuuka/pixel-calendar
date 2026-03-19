import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { addMonths, subMonths, addDays, format, parseISO, startOfMonth, differenceInDays } from 'date-fns';
// html2canvas loaded dynamically on export
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import DayModal from './components/DayModal';
import NotesSidebar from './components/NotesSidebar';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import CurrentDayDashboard from './components/CurrentDayDashboard';
// WeekAhead removed
import HabitTracker from './components/HabitTracker';
import StatsPanel from './components/StatsPanel';
import SeasonalDecorations from './components/SeasonalDecorations';
import AuthorBadge from './components/AuthorBadge';
import AdminPanel from './components/AdminPanel';
import ToastNotification from './components/ToastNotification';
import { useNotes } from './hooks/useNotes';
import { useWeather } from './hooks/useWeather';
import { useSettings } from './hooks/useSettings';
import { useReminders } from './hooks/useReminders';
import { useDayMeta } from './hooks/useDayMeta';
import { useMoods } from './hooks/useMoods';
import { useHabits } from './hooks/useHabits';
import { useCountdowns } from './hooks/useCountdowns';
import { createTranslator } from './utils/i18n';
import { getHolidayForDate } from './utils/holidays';
import { playSound } from './utils/sounds';
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
  const [toastData, setToastData] = useState(null);
  const calendarRef = useRef(null);

  // Settings
  const {
    settings, updateCity, updateLatLon, setTempUnit, setFirstDayOfWeek,
    setTheme, setLanguage, setTimeFormat, setAutoStart, setStartMinimized,
    setFontFamily, setCustomThemeEnabled, setCustomColor,
    setSoundEnabled, setDecorationsEnabled, setHolidaysEnabled, setHolidayCountry,
    THEME_KEYS,
  } = useSettings();

  const t = useMemo(() => createTranslator(settings.language), [settings.language]);

  const sfx = useCallback((name) => {
    if (settings.soundEnabled) playSound(name);
  }, [settings.soundEnabled]);

  // Notes
  const {
    allNotes, getNotesForDate, addNote, editNote, deleteNote, moveNote,
    hasNotes, clearAllNotes, importNotes, updateNoteTags, updateNoteReminder,
    markReminderNotified, allTags,
  } = useNotes();

  // Day meta, moods, habits, countdowns
  const { getDayMeta, setDayColor, toggleSticker } = useDayMeta();
  const { moods, getMood, setMood } = useMoods();
  const { habits, addHabit, removeHabit, toggleCheck, isChecked, getStreak } = useHabits();
  const { countdowns, addCountdown, removeCountdown } = useCountdowns();

  const handleShowToast = useCallback((data) => { setToastData(data); }, []);
  useReminders(allNotes, markReminderNotified, handleShowToast);

  // Weather
  const weatherLocation = { lat: settings.lat, lon: settings.lon, locationName: settings.locationName };
  const { getWeatherForDate, loading: weatherLoading, locationName } = useWeather(currentMonth, weatherLocation);

  // Navigation
  const handlePrevMonth = useCallback(() => { setCurrentMonth(m => subMonths(m, 1)); sfx('navigate'); }, [sfx]);
  const handleNextMonth = useCallback(() => { setCurrentMonth(m => addMonths(m, 1)); sfx('navigate'); }, [sfx]);

  const handleDayClick = useCallback((day) => {
    setSelectedDate(prev => {
      if (prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) return null;
      return day;
    });
    setAutoEditNoteId(null);
    sfx('click');
  }, [sfx]);

  const handleCloseModal = useCallback(() => { setSelectedDate(null); setAutoEditNoteId(null); }, []);

  const handleAddNote = useCallback((dateKey, text, tags, reminder) => {
    addNote(dateKey, text, tags, reminder);
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

  const handleSidebarDeleteNote = useCallback((dateKey, noteId) => { setNoteToDelete({ dateKey, id: noteId }); }, []);
  const confirmDeleteNote = useCallback(() => { if (noteToDelete) { handleDeleteNote(noteToDelete.dateKey, noteToDelete.id); setNoteToDelete(null); } }, [noteToDelete, handleDeleteNote]);
  const cancelDeleteNote = useCallback(() => { setNoteToDelete(null); }, []);
  const handleClearAllData = useCallback(() => { clearAllNotes(); setSelectedDate(null); }, [clearAllNotes]);

  const getHoliday = useCallback((dateKey) => {
    if (!settings.holidaysEnabled || !settings.holidayCountry) return null;
    return getHolidayForDate(settings.holidayCountry, dateKey);
  }, [settings.holidaysEnabled, settings.holidayCountry]);

  const handleMoveNote = useCallback((from, to, noteId) => { moveNote(from, to, noteId); sfx('toggle'); }, [moveNote, sfx]);

  // Export calendar as image
  const handleExportImage = useCallback(async () => {
    const el = calendarRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--clr-bg').trim() || '#fdf6f0',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `pixel-calendar-${format(currentMonth, 'yyyy-MM')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        sfx('noteAdd');
      }, 'image/png');
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [currentMonth, sfx]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (settingsOpen || statsOpen || adminOpen) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

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
  }, [settingsOpen, statsOpen, adminOpen, focusMode, handlePrevMonth, handleNextMonth]);

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
  const selectedHoliday = selectedDateKey ? getHoliday(selectedDateKey) : null;
  const selectedDayMeta = selectedDateKey ? getDayMeta(selectedDateKey) : null;
  const selectedMood = selectedDateKey ? getMood(selectedDateKey) : null;

  return (
    <div className={`app ${focusMode ? 'app--focus' : ''}`}>
      {settings.decorationsEnabled && <SeasonalDecorations />}

      <Header
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        locationName={locationName}
        onOpenSettings={() => { setSettingsOpen(true); sfx('modalOpen'); }}
        onOpenStats={() => { setStatsOpen(true); sfx('modalOpen'); }}
        onExportImage={handleExportImage}
        focusMode={focusMode}
        onToggleFocus={() => { setFocusMode(v => !v); sfx('toggle'); }}
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
          <section className="calendar-section" ref={calendarRef}>
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              getWeatherForDate={getWeatherForDate}
              hasNotes={hasNotes}
              weatherLoading={weatherLoading}
              firstDayOfWeek={settings.firstDayOfWeek}
              getHoliday={getHoliday}
              getDayMeta={getDayMeta}
              getMood={getMood}
              onMoveNote={handleMoveNote}
              lang={settings.language}
              t={t}
            />
          </section>

          {!focusMode && (
            <>
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
          selectedDate={selectedDate}
          weather={selectedWeather}
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
          onDeleteNote={handleDeleteNote}
          onUpdateNoteTags={updateNoteTags}
          onUpdateNoteReminder={updateNoteReminder}
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
        onSetDecorationsEnabled={setDecorationsEnabled}
        onSetHolidaysEnabled={setHolidaysEnabled}
        onSetHolidayCountry={setHolidayCountry}
        themeKeys={THEME_KEYS}
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
        message={t('modal.confirm.desc', 'Are you sure?')}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        t={t}
      />

      <ToastNotification notification={toastData} onClose={() => setToastData(null)} />
      <AuthorBadge onAdminActivate={() => setAdminOpen(true)} />
      <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} allNotes={allNotes} settings={settings} allTags={allTags} onShowToast={handleShowToast} />
    </div>
  );
}
