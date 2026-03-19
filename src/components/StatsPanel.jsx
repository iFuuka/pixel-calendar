import React, { useMemo, useEffect, useRef } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, differenceInDays, parseISO } from 'date-fns';
import './StatsPanel.css';

export default function StatsPanel({ isOpen, onClose, allNotes, moods, t }) {
    const tr = t || ((k, fb) => fb || k);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        panelRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    const stats = useMemo(() => {
        const dateKeys = Object.keys(allNotes).filter(k => (allNotes[k]?.length ?? 0) > 0).sort();
        const totalNotes = Object.values(allNotes).reduce((s, arr) => s + arr.length, 0);

        // Notes this month
        const thisMonth = format(new Date(), 'yyyy-MM');
        const notesThisMonth = dateKeys
            .filter(k => k.startsWith(thisMonth))
            .reduce((s, k) => s + allNotes[k].length, 0);

        // Streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let streak = 0;
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const dateSet = new Set(dateKeys);

        // Walk backwards from today
        for (let i = 0; i <= 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            if (dateSet.has(key)) {
                streak++;
                if (i <= streak) currentStreak = streak;
            } else {
                if (i === 0) { /* today can be empty, check yesterday */ }
                else {
                    longestStreak = Math.max(longestStreak, streak);
                    streak = 0;
                }
            }
        }
        longestStreak = Math.max(longestStreak, streak);
        // Fix: current streak should break at first gap
        currentStreak = 0;
        for (let i = 0; i <= 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            if (dateSet.has(key)) {
                currentStreak++;
            } else if (i > 0) {
                break;
            }
        }

        // Top tags
        const tagCounts = {};
        Object.values(allNotes).forEach(notes => {
            notes.forEach(n => {
                (n.tags || []).forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });
        });
        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        const maxTagCount = topTags.length > 0 ? topTags[0][1] : 1;

        // Heatmap for current year
        const year = new Date().getFullYear();
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 0, 1));
        const allDaysOfYear = eachDayOfInterval({ start: yearStart, end: yearEnd });
        const heatmapData = allDaysOfYear.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            return {
                date: key,
                count: allNotes[key]?.length ?? 0,
                dayOfWeek: day.getDay(),
            };
        });

        // Mood distribution
        const moodCounts = {};
        if (moods) {
            Object.values(moods).forEach(emoji => {
                moodCounts[emoji] = (moodCounts[emoji] || 0) + 1;
            });
        }
        const moodEntries = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
        const totalMoods = Object.keys(moods || {}).length;

        return { totalNotes, notesThisMonth, currentStreak, longestStreak, topTags, maxTagCount, heatmapData, dateKeys, moodEntries, totalMoods };
    }, [allNotes, moods]);

    if (!isOpen) return null;

    const maxHeat = Math.max(1, ...stats.heatmapData.map(d => d.count));

    return (
        <>
            <div className="stats-backdrop" onClick={onClose} aria-hidden="true" />
            <div
                className="stats-panel pixel-border"
                role="dialog"
                aria-modal="true"
                aria-label={tr('stats.title')}
                ref={panelRef}
                tabIndex={-1}
            >
                <div className="stats-header">
                    <h2 className="stats-title">{tr('stats.title', 'Statistics')}</h2>
                    <button className="settings-close-btn" onClick={onClose} aria-label={tr('modal.close')}>✕</button>
                </div>

                {stats.totalNotes === 0 ? (
                    <div className="stats-empty">
                        <span>📊</span>
                        <p>{tr('stats.nodata')}</p>
                    </div>
                ) : (
                    <div className="stats-body">
                        {/* Counters */}
                        <div className="stats-counters">
                            <div className="stat-card">
                                <span className="stat-value">{stats.totalNotes}</span>
                                <span className="stat-label">{tr('stats.notes.total')}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{stats.notesThisMonth}</span>
                                <span className="stat-label">{tr('stats.notes.month')}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{stats.currentStreak}</span>
                                <span className="stat-label">{tr('stats.streak.current')} ({tr('stats.days')})</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{stats.longestStreak}</span>
                                <span className="stat-label">{tr('stats.streak.longest')} ({tr('stats.days')})</span>
                            </div>
                        </div>

                        {/* Top tags */}
                        {stats.topTags.length > 0 && (
                            <div className="stats-section">
                                <h3 className="stats-section-title">{tr('stats.tags.top')}</h3>
                                <div className="stats-tags-bars">
                                    {stats.topTags.map(([tag, count]) => (
                                        <div key={tag} className="stats-tag-bar">
                                            <span className="stats-tag-name">#{tag}</span>
                                            <div className="stats-bar-track">
                                                <div
                                                    className="stats-bar-fill"
                                                    style={{ width: `${(count / stats.maxTagCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="stats-tag-count">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Heatmap */}
                        <div className="stats-section">
                            <h3 className="stats-section-title">{tr('stats.heatmap')}</h3>
                            <div className="stats-heatmap">
                                {stats.heatmapData.map((d) => (
                                    <div
                                        key={d.date}
                                        className="heatmap-cell"
                                        title={`${d.date}: ${d.count} notes`}
                                        style={{
                                            '--heat': d.count === 0 ? 0 : 0.2 + (d.count / maxHeat) * 0.8,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mood distribution */}
                        {stats.moodEntries.length > 0 && (
                            <div className="stats-section">
                                <h3 className="stats-section-title">{tr('mood.title', 'Mood')} ({stats.totalMoods})</h3>
                                <div className="stats-mood-row">
                                    {stats.moodEntries.map(([emoji, count]) => (
                                        <div key={emoji} className="stats-mood-item">
                                            <span className="stats-mood-emoji">{emoji}</span>
                                            <span className="stats-mood-count">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
