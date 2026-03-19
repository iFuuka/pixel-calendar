import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { GearIcon } from './PixelIcons';
import { HOLIDAY_COUNTRIES } from '../utils/holidays';
import './SettingsModal.css';

const MapPicker = lazy(() => import('./MapPicker'));

const STORAGE_KEY = 'pixel-calendar-notes';

/* Theme swatch colours (accent colour shown per palette) */
const THEME_META = [
    { key: 'vanilla-sky', dot: '#cbb8f0', accent: '#f8b8cc' },
    { key: 'lavender-night', dot: '#6040a0', accent: '#c060a0' },
    { key: 'matcha-box', dot: '#8fbe78', accent: '#b8d8a8' },
    { key: 'autumn-sunset', dot: '#f0a840', accent: '#f09060' },
    { key: 'terraria-forest', dot: '#4a8c18', accent: '#80c8f0' },
];

export default function SettingsModal({
    isOpen,
    onClose,
    settings,
    t,                    // translator fn
    onUpdateCity,
    onUpdateLatLon,
    onSetTempUnit,
    onSetFirstDayOfWeek,
    onSetTheme,
    onSetLanguage,
    onSetTimeFormat,
    onClearAllData,
    onImportNotes,
    onSetAutoStart,
    onSetStartMinimized,
    onSetFontFamily,
    onSetCustomThemeEnabled,
    onSetCustomColor,
    onSetSoundEnabled,
    onSetDecorationsEnabled,
    onSetHolidaysEnabled,
    onSetHolidayCountry,
    themeKeys,
}) {
    const isElectron = !!window.electronSettings;
    const [cityInput, setCityInput] = useState(settings.city || '');
    const [geoStatus, setGeoStatus] = useState(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [mapMounted, setMapMounted] = useState(false);
    const [importStatus, setImportStatus] = useState(null);
    const modalRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => { setCityInput(settings.city || ''); setGeoStatus(null); }, [settings.city]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
            const timer = setTimeout(() => setMapMounted(true), 120);
            return () => clearTimeout(timer);
        } else {
            setMapMounted(false);
        }
    }, [isOpen]);

    async function handleGeoSearch(e) {
        e.preventDefault();
        if (!cityInput.trim()) return;
        setGeoLoading(true);
        setGeoStatus(null);
        const result = await onUpdateCity(cityInput);
        setGeoStatus(result);
        setGeoLoading(false);
    }

    function handleExportNotes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
            const blob = new Blob([raw], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pixel-calendar-notes-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Export failed.'); }
    }

    function handleImportNotes() {
        fileInputRef.current?.click();
    }

    function handleFileSelected(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportStatus(null);

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                // Validate: must be an object with date keys containing arrays of notes
                if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                    setImportStatus({ ok: false, error: t('settings.import.error.format', 'Invalid file format') });
                    return;
                }

                let imported = 0;
                for (const [key, notes] of Object.entries(data)) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
                        setImportStatus({ ok: false, error: t('settings.import.error.format', 'Invalid file format') });
                        return;
                    }
                    if (!Array.isArray(notes)) {
                        setImportStatus({ ok: false, error: t('settings.import.error.format', 'Invalid file format') });
                        return;
                    }
                    imported += notes.length;
                }

                onImportNotes(data);
                setImportStatus({ ok: true, count: imported });
            } catch {
                setImportStatus({ ok: false, error: t('settings.import.error.parse', 'Failed to parse JSON file') });
            }
        };
        reader.readAsText(file);
        // Reset so the same file can be selected again
        e.target.value = '';
    }

    function handleClearData() {
        if (!confirmClear) { setConfirmClear(true); return; }
        onClearAllData();
        setConfirmClear(false);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <>
            <div className="settings-backdrop" onClick={onClose} aria-hidden="true" />

            <div
                id="settings-modal"
                className="settings-modal pixel-border"
                role="dialog"
                aria-modal="true"
                aria-label={t('settings.title')}
                ref={modalRef}
                tabIndex={-1}
            >
                {/* Header */}
                <div className="settings-header">
                    <div className="settings-title-group">
                        <GearIcon size={20} />
                        <h2 className="settings-title">{t('settings.title')}</h2>
                    </div>
                    <button id="btn-settings-close" className="settings-close-btn" onClick={onClose} aria-label={t('modal.close')}>✕</button>
                </div>

                <div className="settings-body">

                    {/* ── 🎨 Theme ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.theme')}</h3>
                        <div className="theme-swatch-row">
                            {THEME_META.map(({ key, dot, accent }) => (
                                <button
                                    key={key}
                                    id={`btn-theme-${key}`}
                                    className={`theme-swatch-btn ${settings.theme === key ? 'theme-swatch-btn--active' : ''}`}
                                    onClick={() => onSetTheme(key)}
                                    aria-pressed={settings.theme === key}
                                    title={t(`theme.${key}`)}
                                    style={{ '--swatch-dot': dot, '--swatch-accent': accent }}
                                >
                                    <span className="theme-swatch-dot" />
                                    <span className="theme-swatch-label">{t(`theme.${key}`)}</span>
                                    {settings.theme === key && <span className="theme-swatch-check">✓</span>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* ── 🎨 Custom Theme ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.customtheme')}</h3>
                        <label className="settings-checkbox-row">
                            <input
                                type="checkbox"
                                checked={settings.customThemeEnabled ?? false}
                                onChange={(e) => onSetCustomThemeEnabled(e.target.checked)}
                            />
                            <span>{t('settings.customtheme.enable')}</span>
                        </label>
                        {settings.customThemeEnabled && (
                            <div className="custom-theme-colors">
                                {[
                                    { key: 'bg', label: t('settings.customtheme.bg') },
                                    { key: 'surface', label: t('settings.customtheme.surface') },
                                    { key: 'accent', label: t('settings.customtheme.accent') },
                                    { key: 'text', label: t('settings.customtheme.text') },
                                ].map(({ key, label }) => (
                                    <label key={key} className="custom-color-row">
                                        <span className="custom-color-label">{label}</span>
                                        <input
                                            type="color"
                                            value={settings.customColors?.[key] || '#000000'}
                                            onChange={(e) => onSetCustomColor(key, e.target.value)}
                                            className="custom-color-input"
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── 🌐 Language ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.lang')}</h3>
                        <div className="settings-toggle-row">
                            <button
                                id="btn-lang-en"
                                className={`settings-toggle-btn ${settings.language === 'en' ? 'active' : ''}`}
                                onClick={() => onSetLanguage('en')}
                                aria-pressed={settings.language === 'en'}
                            >🇬🇧 English</button>
                            <button
                                id="btn-lang-ru"
                                className={`settings-toggle-btn ${settings.language === 'ru' ? 'active' : ''}`}
                                onClick={() => onSetLanguage('ru')}
                                aria-pressed={settings.language === 'ru'}
                            >🇷🇺 Русский</button>
                        </div>
                    </section>

                    {/* ── 🔤 Font ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.font')}</h3>
                        <div className="settings-toggle-row">
                            <button
                                className={`settings-toggle-btn ${(settings.fontFamily || 'pixel') === 'pixel' ? 'active' : ''}`}
                                onClick={() => onSetFontFamily('pixel')}
                                aria-pressed={(settings.fontFamily || 'pixel') === 'pixel'}
                            >{t('settings.font.pixel')}</button>
                            <button
                                className={`settings-toggle-btn ${settings.fontFamily === 'classic' ? 'active' : ''}`}
                                onClick={() => onSetFontFamily('classic')}
                                aria-pressed={settings.fontFamily === 'classic'}
                            >{t('settings.font.classic')}</button>
                        </div>
                    </section>

                    {/* ── 🕐 Time Format ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.timeformat')}</h3>
                        <div className="settings-toggle-row">
                            <button
                                id="btn-time-24"
                                className={`settings-toggle-btn ${settings.timeFormat === '24' ? 'active' : ''}`}
                                onClick={() => onSetTimeFormat('24')}
                                aria-pressed={settings.timeFormat === '24'}
                            >{t('settings.24h')}</button>
                            <button
                                id="btn-time-12"
                                className={`settings-toggle-btn ${settings.timeFormat === '12' ? 'active' : ''}`}
                                onClick={() => onSetTimeFormat('12')}
                                aria-pressed={settings.timeFormat === '12'}
                            >{t('settings.12h')}</button>
                        </div>
                    </section>

                    {/* ── 📍 Location ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.location')}</h3>
                        <form className="settings-geo-form" onSubmit={handleGeoSearch}>
                            <input
                                id="input-city"
                                className="settings-input"
                                type="text"
                                placeholder={t('settings.location.hint')}
                                value={cityInput}
                                onChange={(e) => { setCityInput(e.target.value); setGeoStatus(null); setConfirmClear(false); }}
                                aria-label={t('settings.location.hint')}
                            />
                            <button
                                id="btn-geo-search"
                                type="submit"
                                className="btn btn-primary"
                                disabled={geoLoading || !cityInput.trim()}
                            >{geoLoading ? '…' : t('settings.search')}</button>
                        </form>
                        {geoStatus && (
                            <p className={`settings-geo-status ${geoStatus.ok ? 'ok' : 'err'}`}>
                                {geoStatus.ok ? `✅ ${geoStatus.locationName}` : `❌ ${geoStatus.error}`}
                            </p>
                        )}
                        {mapMounted && (
                            <Suspense fallback={<div className="map-loading-placeholder">🗺 …</div>}>
                                <MapPicker
                                    lat={settings.lat}
                                    lon={settings.lon}
                                    locationName={settings.locationName}
                                    onLocationChange={onUpdateLatLon}
                                />
                            </Suspense>
                        )}
                    </section>

                    {/* ── 🌡 Temp Unit ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.temp')}</h3>
                        <div className="settings-toggle-row">
                            <button id="btn-temp-celsius" className={`settings-toggle-btn ${settings.tempUnit === 'C' ? 'active' : ''}`} onClick={() => onSetTempUnit('C')} aria-pressed={settings.tempUnit === 'C'}>°C Celsius</button>
                            <button id="btn-temp-fahrenheit" className={`settings-toggle-btn ${settings.tempUnit === 'F' ? 'active' : ''}`} onClick={() => onSetTempUnit('F')} aria-pressed={settings.tempUnit === 'F'}>°F Fahrenheit</button>
                        </div>
                    </section>

                    {/* ── 📅 First Day ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.week')}</h3>
                        <div className="settings-toggle-row">
                            <button id="btn-week-sunday" className={`settings-toggle-btn ${settings.firstDayOfWeek === 0 ? 'active' : ''}`} onClick={() => onSetFirstDayOfWeek(0)} aria-pressed={settings.firstDayOfWeek === 0}>{t('settings.sunday')}</button>
                            <button id="btn-week-monday" className={`settings-toggle-btn ${settings.firstDayOfWeek === 1 ? 'active' : ''}`} onClick={() => onSetFirstDayOfWeek(1)} aria-pressed={settings.firstDayOfWeek === 1}>{t('settings.monday')}</button>
                        </div>
                    </section>

                    {/* ── 🔊 Sound ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.sound')}</h3>
                        <label className="settings-checkbox-row">
                            <input
                                type="checkbox"
                                checked={settings.soundEnabled ?? false}
                                onChange={(e) => onSetSoundEnabled(e.target.checked)}
                            />
                            <span>{t('settings.sound.enable')}</span>
                        </label>
                    </section>

                    {/* ── 🌸 Decorations ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.decorations')}</h3>
                        <label className="settings-checkbox-row">
                            <input
                                type="checkbox"
                                checked={settings.decorationsEnabled ?? true}
                                onChange={(e) => onSetDecorationsEnabled(e.target.checked)}
                            />
                            <span>{t('settings.decorations.enable')}</span>
                        </label>
                    </section>

                    {/* ── 🎉 Holidays ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.holidays')}</h3>
                        <label className="settings-checkbox-row">
                            <input
                                type="checkbox"
                                checked={settings.holidaysEnabled ?? false}
                                onChange={(e) => onSetHolidaysEnabled(e.target.checked)}
                            />
                            <span>{t('settings.holidays.enable')}</span>
                        </label>
                        {settings.holidaysEnabled && (
                            <div className="holiday-country-grid">
                                {HOLIDAY_COUNTRIES.map(({ code, en, ru, flag }) => (
                                    <button
                                        key={code}
                                        className={`settings-toggle-btn holiday-country-btn ${settings.holidayCountry === code ? 'active' : ''}`}
                                        onClick={() => onSetHolidayCountry(code)}
                                        aria-pressed={settings.holidayCountry === code}
                                    >
                                        {flag} {settings.language === 'ru' ? ru : en}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── 🚀 Auto-start (Electron only) ── */}
                    {isElectron && (
                        <section className="settings-section">
                            <h3 className="settings-section-title">{t('settings.startup', '🚀 Startup')}</h3>
                            <label className="settings-checkbox-row">
                                <input
                                    type="checkbox"
                                    checked={settings.autoStart ?? false}
                                    onChange={(e) => onSetAutoStart(e.target.checked)}
                                />
                                <span>{t('settings.autostart', 'Launch on system startup')}</span>
                            </label>
                            {settings.autoStart && (
                                <label className="settings-checkbox-row settings-checkbox-sub">
                                    <input
                                        type="checkbox"
                                        checked={settings.startMinimized ?? false}
                                        onChange={(e) => onSetStartMinimized(e.target.checked)}
                                    />
                                    <span>{t('settings.startminimized', 'Start minimized to tray')}</span>
                                </label>
                            )}
                        </section>
                    )}

                    {/* ── 💾 Data Management ── */}
                    <section className="settings-section">
                        <h3 className="settings-section-title">{t('settings.data')}</h3>
                        <div className="settings-data-btns">
                            <button id="btn-export-notes" className="btn btn-primary" onClick={handleExportNotes}>{t('settings.export')}</button>
                            <button id="btn-import-notes" className="btn btn-primary" onClick={handleImportNotes}>{t('settings.import', '⬆ Import Notes')}</button>
                            <button id="btn-clear-data" className={`btn ${confirmClear ? 'btn-danger' : 'btn-ghost'}`} onClick={handleClearData}>
                                {confirmClear ? t('settings.confirm') : t('settings.clear')}
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleFileSelected}
                        />
                        {importStatus && (
                            <p className={`settings-geo-status ${importStatus.ok ? 'ok' : 'err'}`}>
                                {importStatus.ok
                                    ? `✅ ${t('settings.import.success', 'Imported')} ${importStatus.count} ${t('settings.import.notes', 'notes')}`
                                    : `❌ ${importStatus.error}`}
                            </p>
                        )}
                        {confirmClear && <p className="settings-confirm-msg">{t('settings.confirm.msg')}</p>}
                    </section>
                </div>
            </div>
        </>
    );
}
