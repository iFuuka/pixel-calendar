import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { REMINDER_INTERVALS } from '../hooks/useNotes';
import PixelWindow from './PixelWindow';
import { SCENE_PRESETS } from '../utils/scenePresets';
import './AdminPanel.css';

/**
 * AdminPanel — secret debug/testing panel.
 * Activated by clicking iFuuka badge 10 times.
 */
export default function AdminPanel({
    isOpen, onClose, allNotes, settings, allTags, onShowToast,
    scenePreview = null, liveScene = {}, onScenePreviewChange,
    scenePlaying = false, onScenePlayingChange,
    sceneShowcase = false, onSceneShowcaseChange,
}) {
    const [tab, setTab] = useState('overview');
    const [testNotifSent, setTestNotifSent] = useState(false);
    const lang = settings.language === 'ru' ? 'ru' : 'en';
    const ru = lang === 'ru';
    const scene = scenePreview ?? liveScene;

    function chooseScene(nextScene) {
        onScenePlayingChange?.(false);
        onScenePreviewChange?.(nextScene);
    }

    function chooseTab(nextTab) {
        if (tab === 'scenery' && nextTab !== 'scenery') {
            onSceneShowcaseChange?.(false);
            chooseScene(null);
        }
        setTab(nextTab);
    }

    // ── Stats ────────────────────────────────────────
    const stats = useMemo(() => {
        let totalNotes = 0;
        let notesWithTags = 0;
        let notesWithReminders = 0;
        let totalReminders = 0;
        const dateKeys = Object.keys(allNotes);

        dateKeys.forEach((dk) => {
            allNotes[dk].forEach((note) => {
                totalNotes++;
                if ((note.tags ?? []).length > 0) notesWithTags++;
                if (note.reminder?.enabled) {
                    notesWithReminders++;
                    totalReminders += (note.reminder.intervals ?? []).length;
                }
            });
        });

        return {
            totalNotes,
            totalDates: dateKeys.length,
            notesWithTags,
            notesWithReminders,
            totalReminders,
            totalTags: allTags.length,
        };
    }, [allNotes, allTags]);

    // ── Reminders list ───────────────────────────────
    const allReminders = useMemo(() => {
        const result = [];
        Object.entries(allNotes).forEach(([dateKey, notes]) => {
            notes.forEach((note) => {
                if (note.reminder?.enabled && note.reminder.intervals?.length > 0) {
                    result.push({ dateKey, note });
                }
            });
        });
        result.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        return result;
    }, [allNotes]);

    // ── localStorage info ────────────────────────────
    const storageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        storageKeys.push({ key, size: new Blob([val]).size });
    }
    const storageInfo = {
        keys: storageKeys,
        totalSize: storageKeys.reduce((sum, k) => sum + k.size, 0),
    };

    // ── Test notification ────────────────────────────
    function sendTestNotification() {
        const data = {
            title: 'Test Notification',
            noteText: 'This is a test reminder from Admin Panel!',
            dateKey: format(new Date(), 'yyyy-MM-dd'),
            intervalKey: 'test',
            tags: 'test, admin',
        };

        if (window.electronNotify) {
            window.electronNotify.showReminder(data);
        } else if (onShowToast) {
            onShowToast(data);
        }
        setTestNotifSent(true);
        setTimeout(() => setTestNotifSent(false), 3000);
    }

    if (!isOpen) return null;

    return (
        <>
            <div className={`admin-backdrop${sceneShowcase ? ' admin-backdrop--showcase' : ''}`} onClick={onClose} />
            <div className={`admin-panel pixel-border${sceneShowcase ? ' admin-panel--showcase' : ''}`}>
                <div className="admin-header">
                    <span className="admin-title">{sceneShowcase ? (ru ? 'Просмотр фона' : 'Scenery preview') : <>&#128295; Admin Panel</>}</span>
                    <button className="admin-close-btn" onClick={onClose} aria-label={ru ? 'Закрыть админ-панель' : 'Close admin panel'}>&#10005;</button>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'scenery', label: ru ? 'Фон' : 'Scenery' },
                        { key: 'notes', label: 'Notes Data' },
                        { key: 'reminders', label: 'Reminders' },
                        { key: 'storage', label: 'Storage' },
                        { key: 'tools', label: 'Tools' },
                    ].map((t) => (
                        <button
                            key={t.key}
                            className={`admin-tab${tab === t.key ? ' active' : ''}`}
                            id={`admin-tab-${t.key}`}
                            onClick={() => chooseTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="admin-content">
                    {tab === 'scenery' && (
                        <div className="admin-section admin-scene-section">
                            {!sceneShowcase && (
                                <div className="admin-scene-preview">
                                    <PixelWindow scene={scene} animated={settings.decorationsEnabled ?? true} />
                                </div>
                            )}
                            <div className="admin-scene-status" aria-live="polite">
                                <span className={`admin-scene-indicator${scenePreview ? ' admin-scene-indicator--preview' : ''}`} />
                                {scenePlaying ? (ru ? 'Сцены сменяются' : 'Playing scenes') : scenePreview ? (ru ? 'Просмотр фона' : 'Scenery preview') : (ru ? 'Текущая погода' : 'Live weather')}
                            </div>
                            <div className="admin-scene-controls">
                                <label htmlFor="admin-scene-season">
                                    <span>{ru ? 'Сезон' : 'Season'}</span>
                                    <select id="admin-scene-season" value={scene.season ?? 'summer'} onChange={(event) => chooseScene({ ...scene, season: event.target.value })}>
                                        <option value="spring">{ru ? 'Весна' : 'Spring'}</option>
                                        <option value="summer">{ru ? 'Лето' : 'Summer'}</option>
                                        <option value="autumn">{ru ? 'Осень' : 'Autumn'}</option>
                                        <option value="winter">{ru ? 'Зима' : 'Winter'}</option>
                                    </select>
                                </label>
                                <label htmlFor="admin-scene-weather">
                                    <span>{ru ? 'Погода' : 'Weather'}</span>
                                    <select id="admin-scene-weather" value={scene.weather ?? 'unknown'} onChange={(event) => chooseScene({ ...scene, weather: event.target.value })}>
                                        <option value="clear">{ru ? 'Ясно' : 'Clear'}</option>
                                        <option value="cloudy">{ru ? 'Облачно' : 'Cloudy'}</option>
                                        <option value="rain">{ru ? 'Дождь' : 'Rain'}</option>
                                        <option value="snow">{ru ? 'Снег' : 'Snow'}</option>
                                        <option value="fog">{ru ? 'Туман' : 'Fog'}</option>
                                        <option value="storm">{ru ? 'Гроза' : 'Storm'}</option>
                                        {(!scene.weather || scene.weather === 'unknown') && <option value="unknown">{ru ? 'Нет прогноза' : 'No forecast'}</option>}
                                    </select>
                                </label>
                                <label htmlFor="admin-scene-phase">
                                    <span>{ru ? 'Время суток' : 'Time of day'}</span>
                                    <select id="admin-scene-phase" value={scene.phase ?? 'day'} onChange={(event) => chooseScene({ ...scene, phase: event.target.value })}>
                                        <option value="day">{ru ? 'День' : 'Day'}</option>
                                        <option value="dusk">{ru ? 'Закат' : 'Dusk'}</option>
                                        <option value="night">{ru ? 'Ночь' : 'Night'}</option>
                                    </select>
                                </label>
                            </div>
                            <div className="admin-scene-presets" aria-label={ru ? 'Готовые сцены' : 'Scene presets'}>
                                {SCENE_PRESETS.map((preset) => {
                                    const active = scenePreview !== null && ['season', 'weather', 'phase'].every((key) => scene[key] === preset.scene[key]);
                                    return (
                                        <button key={preset.id} className={`admin-scene-preset${active ? ' active' : ''}`} data-scene-preset={preset.id} aria-pressed={active} onClick={() => chooseScene(preset.scene)}>
                                            {preset.label[lang]}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="admin-scene-actions">
                                <button id="admin-scene-play" className={`btn ${scenePlaying ? 'btn-secondary' : 'btn-primary'}`} aria-pressed={scenePlaying} onClick={() => onScenePlayingChange?.(!scenePlaying)}>
                                    {scenePlaying ? (ru ? 'Пауза' : 'Pause') : (ru ? 'Сменять сцены' : 'Play scenes')}
                                </button>
                                <button id="admin-scene-reset" className="btn btn-ghost" onClick={() => chooseScene(null)} disabled={!scenePreview && !scenePlaying}>
                                    {ru ? 'Текущая погода' : 'Live weather'}
                                </button>
                                <button id="admin-scene-showcase" className="btn admin-scene-showcase-btn" aria-pressed={sceneShowcase} onClick={() => onSceneShowcaseChange?.(!sceneShowcase)}>
                                    {sceneShowcase ? (ru ? 'К календарю' : 'Back to calendar') : (ru ? 'Посмотреть фон' : 'View scenery')}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* ── Overview Tab ──────────────────── */}
                    {tab === 'overview' && (
                        <div className="admin-section">
                            <h4 className="admin-section-title">App Stats</h4>
                            <div className="admin-stats-grid">
                                <StatCard label="Total Notes" value={stats.totalNotes} />
                                <StatCard label="Dates with Notes" value={stats.totalDates} />
                                <StatCard label="Notes with Tags" value={stats.notesWithTags} />
                                <StatCard label="Unique Tags" value={stats.totalTags} />
                                <StatCard label="Notes with Reminders" value={stats.notesWithReminders} />
                                <StatCard label="Total Reminder Entries" value={stats.totalReminders} />
                            </div>

                            <h4 className="admin-section-title">Settings</h4>
                            <div className="admin-kv-list">
                                {Object.entries(settings).map(([key, value]) => (
                                    <div key={key} className="admin-kv-row">
                                        <span className="admin-kv-key">{key}</span>
                                        <span className="admin-kv-value">{String(value)}</span>
                                    </div>
                                ))}
                            </div>

                            <h4 className="admin-section-title">All Tags</h4>
                            <div className="admin-tags-list">
                                {allTags.length === 0 ? (
                                    <span className="admin-muted">No tags yet</span>
                                ) : (
                                    allTags.map((tag) => (
                                        <span key={tag} className="admin-tag">#{tag}</span>
                                    ))
                                )}
                            </div>

                            <h4 className="admin-section-title">Environment</h4>
                            <div className="admin-kv-list">
                                <div className="admin-kv-row">
                                    <span className="admin-kv-key">Electron IPC</span>
                                    <span className="admin-kv-value">{window.electronNotify ? 'Available' : 'Not available'}</span>
                                </div>
                                <div className="admin-kv-row">
                                    <span className="admin-kv-key">Browser Notifications</span>
                                    <span className="admin-kv-value">
                                        {'Notification' in window ? Notification.permission : 'Not supported'}
                                    </span>
                                </div>
                                <div className="admin-kv-row">
                                    <span className="admin-kv-key">User Agent</span>
                                    <span className="admin-kv-value admin-kv-value--wrap">{navigator.userAgent}</span>
                                </div>
                                <div className="admin-kv-row">
                                    <span className="admin-kv-key">Screen</span>
                                    <span className="admin-kv-value">{window.screen.width}x{window.screen.height}</span>
                                </div>
                                <div className="admin-kv-row">
                                    <span className="admin-kv-key">Window</span>
                                    <span className="admin-kv-value">{window.innerWidth}x{window.innerHeight}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Notes Data Tab ────────────────── */}
                    {tab === 'notes' && (
                        <div className="admin-section">
                            <h4 className="admin-section-title">Raw Notes Data</h4>
                            <pre className="admin-json">
                                {JSON.stringify(allNotes, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* ── Reminders Tab ─────────────────── */}
                    {tab === 'reminders' && (
                        <div className="admin-section">
                            <h4 className="admin-section-title">
                                Active Reminders ({allReminders.length})
                            </h4>
                            {allReminders.length === 0 ? (
                                <p className="admin-muted">No active reminders</p>
                            ) : (
                                <div className="admin-reminders-list">
                                    {allReminders.map(({ dateKey, note }) => (
                                        <div key={note.id} className="admin-reminder-card">
                                            <div className="admin-reminder-date">{dateKey}</div>
                                            <div className="admin-reminder-text">
                                                {note.text.length > 60 ? note.text.slice(0, 60) + '...' : note.text}
                                            </div>
                                            <div className="admin-reminder-intervals">
                                                {note.reminder.intervals.map((key) => {
                                                    const info = REMINDER_INTERVALS.find((r) => r.key === key);
                                                    const notified = (note.reminder.notified ?? []).includes(key);
                                                    return (
                                                        <span
                                                            key={key}
                                                            className={`admin-reminder-chip${notified ? ' notified' : ''}`}
                                                        >
                                                            {info?.labelEn ?? key}
                                                            {notified && ' \u2713'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                            {(note.tags ?? []).length > 0 && (
                                                <div className="admin-reminder-tags">
                                                    {note.tags.map((t) => (
                                                        <span key={t} className="admin-tag">#{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Storage Tab ───────────────────── */}
                    {tab === 'storage' && (
                        <div className="admin-section">
                            <h4 className="admin-section-title">
                                localStorage ({(storageInfo.totalSize / 1024).toFixed(2)} KB total)
                            </h4>
                            <div className="admin-kv-list">
                                {storageInfo.keys.map(({ key, size }) => (
                                    <div key={key} className="admin-kv-row">
                                        <span className="admin-kv-key">{key}</span>
                                        <span className="admin-kv-value">{(size / 1024).toFixed(2)} KB</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Tools Tab ─────────────────────── */}
                    {tab === 'tools' && (
                        <div className="admin-section">
                            <h4 className="admin-section-title">Test Tools</h4>
                            <div className="admin-tools">
                                <div className="admin-tool-card">
                                    <h5>Send Test Notification</h5>
                                    <p className="admin-muted">
                                        Sends a test reminder notification to verify the notification system works.
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={sendTestNotification}
                                        disabled={testNotifSent}
                                    >
                                        {testNotifSent ? 'Sent!' : 'Send Test Notification'}
                                    </button>
                                </div>

                                <div className="admin-tool-card">
                                    <h5>Copy Notes JSON</h5>
                                    <p className="admin-muted">
                                        Copy all notes data as JSON to clipboard.
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(allNotes, null, 2));
                                        }}
                                    >
                                        Copy to Clipboard
                                    </button>
                                </div>

                                <div className="admin-tool-card">
                                    <h5>Copy Settings JSON</h5>
                                    <p className="admin-muted">
                                        Copy current settings as JSON to clipboard.
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                                        }}
                                    >
                                        Copy to Clipboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="admin-stat-card">
            <span className="admin-stat-value">{value}</span>
            <span className="admin-stat-label">{label}</span>
        </div>
    );
}
