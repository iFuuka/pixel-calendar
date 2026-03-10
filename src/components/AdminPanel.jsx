import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { REMINDER_INTERVALS } from '../hooks/useNotes';
import './AdminPanel.css';

/**
 * AdminPanel — secret debug/testing panel.
 * Activated by clicking iFuuka badge 10 times.
 */
export default function AdminPanel({ isOpen, onClose, allNotes, settings, allTags, onShowToast }) {
    const [tab, setTab] = useState('overview');
    const [testNotifSent, setTestNotifSent] = useState(false);

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
    const storageInfo = useMemo(() => {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const val = localStorage.getItem(key);
            keys.push({ key, size: new Blob([val]).size });
        }
        const totalSize = keys.reduce((sum, k) => sum + k.size, 0);
        return { keys, totalSize };
    }, [tab]); // recalculate when tab changes

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
            <div className="admin-backdrop" onClick={onClose} />
            <div className="admin-panel pixel-border">
                <div className="admin-header">
                    <span className="admin-title">&#128295; Admin Panel</span>
                    <button className="admin-close-btn" onClick={onClose}>&#10005;</button>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'notes', label: 'Notes Data' },
                        { key: 'reminders', label: 'Reminders' },
                        { key: 'storage', label: 'Storage' },
                        { key: 'tools', label: 'Tools' },
                    ].map((t) => (
                        <button
                            key={t.key}
                            className={`admin-tab${tab === t.key ? ' active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="admin-content">
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
