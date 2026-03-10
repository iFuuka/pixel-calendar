import React, { useMemo, useState, useCallback } from 'react';
import { parseISO, format } from 'date-fns';
import { NotesListIcon } from './PixelIcons';
import './NotesSidebar.css';

/**
 * NotesSidebar — shows ALL notes across every date, sorted chronologically.
 * Supports text search and tag filtering.
 */
export default function NotesSidebar({ allNotes, onNoteClick, onDeleteNote, isOpen, onToggle, allTags = [], t }) {
    const tr = t || ((k, fb) => fb || k);
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    // Flatten all notes with their date key, sort chronologically
    const sortedEntries = useMemo(() => {
        const entries = [];
        Object.entries(allNotes).forEach(([dateKey, notes]) => {
            notes.forEach((note) => {
                entries.push({ dateKey, note });
            });
        });
        entries.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
        return entries;
    }, [allNotes]);

    const filtered = useMemo(() => {
        let result = sortedEntries;

        // Filter by selected tag
        if (selectedTag) {
            result = result.filter(({ note }) =>
                (note.tags ?? []).includes(selectedTag)
            );
        }

        // Filter by search text (searches note text, date, and tags)
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                ({ dateKey, note }) =>
                    note.text.toLowerCase().includes(q) ||
                    dateKey.includes(q) ||
                    (note.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
            );
        }

        return result;
    }, [sortedEntries, search, selectedTag]);

    const totalCount = sortedEntries.length;

    // Group filtered entries by dateKey for display
    const grouped = useMemo(() => {
        const map = new Map();
        filtered.forEach(({ dateKey, note }) => {
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey).push(note);
        });
        return [...map.entries()];
    }, [filtered]);

    const formatDate = useCallback((dateKey) => {
        try {
            return format(parseISO(dateKey), 'MMMM d, yyyy');
        } catch {
            return dateKey;
        }
    }, []);

    return (
        <>
            {/* Toggle button (always visible) */}
            <button
                id="btn-notes-sidebar-toggle"
                className={`sidebar-toggle-btn pixel-border ${isOpen ? 'active' : ''}`}
                onClick={onToggle}
                aria-label={isOpen ? tr('sidebar.close', 'Close sidebar') : tr('sidebar.open', 'Open notes sidebar')}
                title={tr('sidebar.allnotes', 'All Notes')}
            >
                <NotesListIcon size={18} />
                <span className="sidebar-toggle-label">{tr('sidebar.notes', 'Notes')}</span>
                {totalCount > 0 && (
                    <span className="sidebar-badge">{totalCount}</span>
                )}
            </button>

            {/* Sidebar panel */}
            <aside
                id="notes-sidebar"
                className={`notes-sidebar pixel-border ${isOpen ? 'notes-sidebar--open' : ''}`}
                aria-label={tr('sidebar.allnotes', 'All Notes')}
            >
                <div className="sidebar-header">
                    <span className="sidebar-title">&#128203; {tr('sidebar.allnotes', 'All Notes')}</span>
                    <button
                        className="sidebar-close-btn"
                        onClick={onToggle}
                        aria-label={tr('sidebar.close', 'Close sidebar')}
                    >&#10005;</button>
                </div>

                {/* Search */}
                <div className="sidebar-search-wrap">
                    <input
                        id="sidebar-search"
                        className="sidebar-search"
                        type="text"
                        placeholder={tr('sidebar.search', '🔍 Search notes & tags...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label={tr('notes.search', 'Search notes')}
                    />
                </div>

                {/* Tag filter chips */}
                {allTags.length > 0 && (
                    <div className="sidebar-tags-filter">
                        <button
                            className={`sidebar-tag-chip${selectedTag === null ? ' active' : ''}`}
                            onClick={() => setSelectedTag(null)}
                        >
                            {tr('tags.all', 'All')}
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                className={`sidebar-tag-chip${selectedTag === tag ? ' active' : ''}`}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* Notes list */}
                <div className="sidebar-list">
                    {grouped.length === 0 ? (
                        <div className="sidebar-empty">
                            {totalCount === 0
                                ? <><span className="sidebar-empty-icon">&#127800;</span><p>{tr('sidebar.noyet', 'No notes yet!')}</p><p className="sidebar-empty-sub">{tr('sidebar.noyet.sub', 'Click any day to add one.')}</p></>
                                : <><span className="sidebar-empty-icon">&#128269;</span><p>{tr('sidebar.nomatch', 'No notes match.')}</p></>
                            }
                        </div>
                    ) : (
                        grouped.map(([dateKey, notes]) => (
                            <div key={dateKey} className="sidebar-date-group">
                                <button
                                    className="sidebar-date-badge"
                                    onClick={() => onNoteClick(dateKey)}
                                    aria-label={formatDate(dateKey)}
                                    title={formatDate(dateKey)}
                                >
                                    &#128197; {formatDate(dateKey)}
                                </button>
                                <ul className="sidebar-notes-list">
                                    {notes.map((note) => (
                                        <li
                                            key={note.id}
                                            className="sidebar-note-item"
                                            onClick={() => onNoteClick(dateKey)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && onNoteClick(dateKey)}
                                        >
                                            <span className="sidebar-note-bullet">&#128196;</span>
                                            <div className="sidebar-note-content">
                                                <span className="sidebar-note-text">{note.text}</span>
                                                {(note.tags ?? []).length > 0 && (
                                                    <div className="sidebar-note-tags">
                                                        {note.tags.map((tag) => (
                                                            <span key={tag} className="sidebar-note-tag">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {note.reminder?.enabled && (
                                                    <span className="sidebar-note-reminder-icon" title={tr('sidebar.hasreminder', 'Has reminder')}>&#128276;</span>
                                                )}
                                            </div>
                                            <div className="sidebar-note-actions">
                                                <button
                                                    className="icon-btn"
                                                    title={tr('sidebar.edit', 'Edit note')}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onNoteClick(dateKey, note.id);
                                                    }}
                                                    aria-label={tr('sidebar.edit', 'Edit note')}
                                                >&#9999;&#65039;</button>
                                                <button
                                                    className="icon-btn icon-btn--danger"
                                                    title={tr('sidebar.delete', 'Delete note')}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteNote(dateKey, note.id);
                                                    }}
                                                    aria-label={tr('sidebar.delete', 'Delete note')}
                                                >&#128465;&#65039;</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}
