import React, { useState, useCallback, useMemo } from 'react';
import { addMonths, subMonths, format, parseISO, startOfMonth } from 'date-fns';
import Header from './components/Header';
import CalendarGrid from './components/CalendarGrid';
import DayModal from './components/DayModal';
import NotesSidebar from './components/NotesSidebar';
import SettingsModal from './components/SettingsModal';
import ConfirmModal from './components/ConfirmModal';
import CurrentDayDashboard from './components/CurrentDayDashboard';
import AuthorBadge from './components/AuthorBadge';
import AdminPanel from './components/AdminPanel';
import ToastNotification from './components/ToastNotification';
import { useNotes } from './hooks/useNotes';
import { useWeather } from './hooks/useWeather';
import { useSettings } from './hooks/useSettings';
import { useReminders } from './hooks/useReminders';
import { createTranslator } from './utils/i18n';
import './App.css';

export default function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoEditNoteId, setAutoEditNoteId] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null); // { dateKey, id }
  const [adminOpen, setAdminOpen] = useState(false);
  const [toastData, setToastData] = useState(null);

  // Settings (all preferences)
  const {
    settings,
    updateCity,
    updateLatLon,
    setTempUnit,
    setFirstDayOfWeek,
    setTheme,
    setLanguage,
    setTimeFormat,
    setAutoStart,
    setStartMinimized,
    THEME_KEYS,
  } = useSettings();

  // Translator — memoised to avoid re-creating on every render
  const t = useMemo(() => createTranslator(settings.language), [settings.language]);

  // Notes
  const {
    allNotes, getNotesForDate, addNote, editNote, deleteNote,
    hasNotes, clearAllNotes, importNotes, updateNoteTags, updateNoteReminder,
    markReminderNotified, allTags,
  } = useNotes();

  // Toast callback for in-app notifications (browser/dev mode)
  const handleShowToast = useCallback((data) => {
    setToastData(data);
  }, []);

  // Reminders — polls and fires notifications
  useReminders(allNotes, markReminderNotified, handleShowToast);

  // Weather — pass location from settings
  const weatherLocation = { lat: settings.lat, lon: settings.lon, locationName: settings.locationName };
  const { getWeatherForDate, loading: weatherLoading, locationName } = useWeather(currentMonth, weatherLocation);

  // Navigation
  const handlePrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const handleNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);

  const handleDayClick = useCallback((day) => {
    setSelectedDate((prev) => {
      if (prev && format(prev, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')) return null;
      return day;
    });
    setAutoEditNoteId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedDate(null);
    setAutoEditNoteId(null);
  }, []);

  // Sidebar: navigate to that month and open that day
  const handleNoteClick = useCallback((dateKey, noteIdToEdit = null) => {
    const date = parseISO(dateKey);
    setCurrentMonth(startOfMonth(date));
    setSelectedDate(date);
    setAutoEditNoteId(noteIdToEdit);
    setSidebarOpen(false);
  }, []);

  const handleSidebarDeleteNote = useCallback((dateKey, noteId) => {
    setNoteToDelete({ dateKey, id: noteId });
  }, []);

  const confirmDeleteNote = useCallback(() => {
    if (noteToDelete) {
      deleteNote(noteToDelete.dateKey, noteToDelete.id);
      setNoteToDelete(null);
    }
  }, [noteToDelete, deleteNote]);

  const cancelDeleteNote = useCallback(() => {
    setNoteToDelete(null);
  }, []);

  // Clear all data
  const handleClearAllData = useCallback(() => {
    clearAllNotes();
    setSelectedDate(null);
  }, [clearAllNotes]);

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedWeather = selectedDateKey ? getWeatherForDate(selectedDateKey) : null;
  const selectedNotes = selectedDateKey ? getNotesForDate(selectedDateKey) : [];

  return (
    <div className="app">
      <Header
        currentMonth={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        locationName={locationName}
        onOpenSettings={() => setSettingsOpen(true)}
        t={t}
      />

      <main className="main-content">
        {/* Notes sidebar */}
        <NotesSidebar
          allNotes={allNotes}
          onNoteClick={handleNoteClick}
          onDeleteNote={handleSidebarDeleteNote}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          t={t}
          allTags={allTags}
        />

        {/* Sidebar backdrop */}
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        <div className="content-column">
          <section className="calendar-section">
            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDayClick={handleDayClick}
              getWeatherForDate={getWeatherForDate}
              hasNotes={hasNotes}
              weatherLoading={weatherLoading}
              firstDayOfWeek={settings.firstDayOfWeek}
              t={t}
            />
          </section>

          {/* Current Day Dashboard */}
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
        </div>
      </main>

      {/* Day Modal */}
      {selectedDate && (
        <DayModal
          selectedDate={selectedDate}
          weather={selectedWeather}
          notes={selectedNotes}
          onClose={handleCloseModal}
          onAddNote={addNote}
          onEditNote={editNote}
          onDeleteNote={deleteNote}
          onUpdateNoteTags={updateNoteTags}
          onUpdateNoteReminder={updateNoteReminder}
          tempUnit={settings.tempUnit}
          lang={settings.language}
          t={t}
          autoEditNoteId={autoEditNoteId}
          allTags={allTags}
        />
      )}

      {/* Settings Modal */}
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
        themeKeys={THEME_KEYS}
      />

      {/* Note Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={noteToDelete !== null}
        title={t ? t('modal.confirm.title', 'Confirm Deletion') : 'Confirm Deletion'}
        message={t ? t('modal.confirm.desc', 'Are you sure you want to permanently delete this note?') : 'Are you sure you want to permanently delete this note?'}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        t={t}
      />

      {/* In-app toast notification (custom, not browser native) */}
      <ToastNotification
        notification={toastData}
        onClose={() => setToastData(null)}
      />

      {/* Author Watermark */}
      <AuthorBadge onAdminActivate={() => setAdminOpen(true)} />

      {/* Admin Panel (secret: 10x click on iFuuka text) */}
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        allNotes={allNotes}
        settings={settings}
        allTags={allTags}
        onShowToast={handleShowToast}
      />
    </div>
  );
}
