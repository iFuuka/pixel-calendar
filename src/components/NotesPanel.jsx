import React, { useState, useRef, useEffect } from 'react';
import { REMINDER_INTERVALS } from '../hooks/useNotes';
import MarkdownText from './MarkdownText';
import EventSchedule from './EventSchedule';
import EventWeather from './EventWeather';
import './NotesPanel.css';

/* ── Tag Input (shared) ──────────────────────────────────────────── */
function TagInput({ tags, onChange, allTags = [], t }) {
    const tr = t || ((k, fb) => fb || k);
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    const suggestions = input
        ? allTags.filter(
              (tg) => tg.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tg)
          )
        : allTags.filter((tg) => !tags.includes(tg));

    function addTag(tag) {
        const trimmed = tag.trim().replace(/^#/, '');
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    }

    function removeTag(tag) {
        onChange(tags.filter((tg) => tg !== tag));
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (input.trim()) addTag(input);
        }
        if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }

    return (
        <div className="tag-input-wrap">
            <div className="tag-chips">
                {tags.map((tag) => (
                    <span key={tag} className="tag-chip">
                        #{tag}
                        <button
                            className="tag-chip-remove"
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove tag ${tag}`}
                        >
                            &times;
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    className="tag-text-input"
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? tr('tags.add', 'Add tags...') : ''}
                    size={Math.max(input.length + 1, 6)}
                />
            </div>
            {showSuggestions && suggestions.length > 0 && (
                input ? (
                    <ul className="tag-suggestions">
                        {suggestions.slice(0, 5).map((s) => (
                            <li
                                key={s}
                                className="tag-suggestion-item"
                                onMouseDown={() => addTag(s)}
                            >
                                #{s}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="tag-quick-picks">
                        {suggestions.slice(0, 8).map((s) => (
                            <button
                                key={s}
                                className="tag-quick-chip"
                                onMouseDown={() => addTag(s)}
                                type="button"
                            >
                                + #{s}
                            </button>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

/* ── Reminder Picker ─────────────────────────────────────────────── */
function ReminderPicker({ reminder, onChange, t }) {
    const tr = t || ((k, fb) => fb || k);
    const enabled = reminder?.enabled ?? false;
    const intervals = reminder?.intervals ?? [];

    function toggleEnabled() {
        onChange({
            ...reminder,
            enabled: !enabled,
            intervals: !enabled ? (intervals.length ? intervals : ['same-day']) : [],
            notified: reminder?.notified ?? [],
        });
    }

    function toggleInterval(key) {
        const next = intervals.includes(key)
            ? intervals.filter((k2) => k2 !== key)
            : [...intervals, key];
        onChange({
            ...reminder,
            enabled: true,
            intervals: next,
            notified: reminder?.notified ?? [],
        });
    }

    return (
        <div className="reminder-picker">
            <label className="reminder-toggle">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={toggleEnabled}
                />
                <span className="reminder-toggle-label">{tr('reminder.label', 'Reminder')}</span>
            </label>
            {enabled && (
                <div className="reminder-intervals">
                    {REMINDER_INTERVALS.map((opt) => (
                        <label key={opt.key} className="reminder-interval-option">
                            <input
                                type="checkbox"
                                checked={intervals.includes(opt.key)}
                                onChange={() => toggleInterval(opt.key)}
                            />
                            <span>{tr(`reminder.${opt.key}`, opt.labelEn)}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Note Item ───────────────────────────────────────────────────── */
function NoteItem({ note, dateKey, onEdit, onDelete, autoEdit, onUpdateTags, onUpdateReminder, onUpdateSchedule, allTags, t, weather, weatherStatus, notes, onAcceptWeather, tempUnit }) {
    const tr = t || ((k, fb) => fb || k);
    const [editing, setEditing] = useState(autoEdit || false);
    const [draft, setDraft] = useState(note.text);
    const [showDetails, setShowDetails] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (autoEdit) setEditing(true);
    }, [autoEdit]);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    function saveEdit() {
        if (draft.trim() && draft.trim() !== note.text) {
            onEdit(note.id, draft);
        }
        setEditing(false);
    }

    function handleDelete() {
        onDelete(note.id);
    }

    const tags = note.tags ?? [];
    const reminder = note.reminder ?? { enabled: false, intervals: [], notified: [] };

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'note', dateKey, noteId: note.id,
        }));
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleCheckToggle(lineIndex) {
        const lines = note.text.split('\n');
        const line = lines[lineIndex];
        if (/- \[ \]/.test(line)) {
            lines[lineIndex] = line.replace('- [ ]', '- [x]');
        } else if (/- \[x\]/i.test(line)) {
            lines[lineIndex] = line.replace(/- \[x\]/i, '- [ ]');
        }
        onEdit(note.id, lines.join('\n'));
    }

    return (
        <li
            className="note-item"
            draggable
            onDragStart={handleDragStart}
        >
            {(editing || showDetails) && note.repeat && note.repeat !== 'none' && <p className="event-hint">{tr('event.seriesHint')}</p>}
            {editing ? (
                <div className="note-edit-row">
                    <textarea
                        ref={inputRef}
                        className="note-textarea note-textarea--edit"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                            if (e.key === 'Escape') { setEditing(false); setDraft(note.text); }
                        }}
                        rows={3}
                    />
                    <div className="note-edit-actions">
                        <button className="btn btn-primary btn--sm" onClick={saveEdit}>{tr('notes.save', 'Save')}</button>
                        <button className="btn btn-ghost btn--sm" onClick={() => { setEditing(false); setDraft(note.text); }}>
                            {tr('notes.cancel', 'Cancel')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="note-view-row">
                    <div className="note-content">
                        <div className="event-summary">
                            <span>{note.time || tr('event.allDay')}</span>
                            {note.repeat && note.repeat !== 'none' && <span>↻ {tr(`event.repeat.${note.repeat}`)}</span>}
                        </div>
                        <div className="note-text">
                            <MarkdownText text={note.text} onToggleCheck={handleCheckToggle} />
                        </div>
                        {tags.length > 0 && (
                            <div className="note-tags-display">
                                {tags.map((tag) => (
                                    <span key={tag} className="tag-chip tag-chip--sm">#{tag}</span>
                                ))}
                            </div>
                        )}
                        {reminder.enabled && (
                            <div className="note-reminder-badge">
                                <span className="reminder-icon">&#128276;</span>
                                <span className="reminder-label">
                                    {reminder.intervals.length} {tr('reminder.count', 'reminders')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="note-actions">
                        <button
                            className="icon-btn"
                            onClick={() => setShowDetails(!showDetails)}
                            title={tr('notes.tags.reminder', 'Tags & Reminder')}
                            aria-label={tr('notes.tags.reminder', 'Tags & Reminder')}
                        >
                            &#128279;
                        </button>
                        <button
                            id={`edit-note-${note.id}`}
                            className="icon-btn"
                            onClick={() => setEditing(true)}
                            title={tr('sidebar.edit', 'Edit note')}
                            aria-label={tr('sidebar.edit', 'Edit note')}
                        >
                            &#9999;&#65039;
                        </button>
                        <button
                            id={`delete-note-${note.id}`}
                            className="icon-btn icon-btn--danger"
                            onClick={handleDelete}
                            title={tr('sidebar.delete', 'Delete note')}
                            aria-label={tr('sidebar.delete', 'Delete note')}
                        >
                            &#128465;&#65039;
                        </button>
                    </div>
                </div>
            )}

            {/* Expandable tags & reminder section */}
            <EventWeather note={note} dateKey={dateKey} weather={weather} weatherStatus={weatherStatus}
                notes={notes} onAccept={time => onAcceptWeather(dateKey, dateKey, note.id, time)} tempUnit={tempUnit} t={tr} />
            {showDetails && !editing && (
                <div className="note-details-panel">
                    <EventSchedule
                        value={{ time: note.time || '', repeat: note.repeat || 'none', repeatUntil: note.repeatUntil || '', outdoor: !!note.outdoor }}
                        onChange={schedule => onUpdateSchedule(note.id, schedule)}
                        dateKey={note.sourceDateKey || dateKey} t={t}
                    />
                    <div className="note-details-section">
                        <span className="note-details-label">{tr('tags.label', 'Tags')}</span>
                        <TagInput
                            tags={tags}
                            onChange={(newTags) => onUpdateTags(note.id, newTags)}
                            allTags={allTags}
                            t={t}
                        />
                    </div>
                    <div className="note-details-section">
                        <ReminderPicker
                            reminder={reminder}
                            onChange={(newReminder) => onUpdateReminder(note.id, newReminder)}
                            t={t}
                        />
                    </div>
                </div>
            )}
        </li>
    );
}

/* ── Notes Panel (main export) ───────────────────────────────────── */
export default function NotesPanel({
    dateKey, notes, onAdd, onEdit, onDelete, autoEditNoteId,
    onUpdateTags, onUpdateReminder, onUpdateSchedule, allTags = [], t,
    weather, weatherStatus, onAcceptWeather, tempUnit,
}) {
    const tr = t || ((k, fb) => fb || k);
    const [newText, setNewText] = useState('');
    const [newTags, setNewTags] = useState([]);
    const [newReminder, setNewReminder] = useState({ enabled: false, intervals: [], notified: [] });
    const [newSchedule, setNewSchedule] = useState({ time: '', repeat: 'none', repeatUntil: '' });
    const [showNewExtras, setShowNewExtras] = useState(false);
    const inputRef = useRef(null);

    function handleAdd() {
        if (!newText.trim()) return;
        onAdd(dateKey, newText, newTags, newReminder, newSchedule);
        setNewText('');
        setNewTags([]);
        setNewSchedule({ time: '', repeat: 'none', repeatUntil: '' });
        setNewReminder({ enabled: false, intervals: [], notified: [] });
        setShowNewExtras(false);
        inputRef.current?.focus();
    }

    return (
        <div className="notes-panel">
            <h3 className="notes-title">&#128221; {tr('notes.title', 'Notes')}</h3>

            {/* Add new note */}
            <div className="notes-add">
                <textarea
                    id="new-note-input"
                    ref={inputRef}
                    className="note-textarea"
                    placeholder={tr('notes.write', 'Write a note for this day...')}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                    }}
                    rows={2}
                />

                <EventSchedule value={newSchedule} onChange={setNewSchedule} dateKey={dateKey} t={t} />
                <EventWeather note={newSchedule} dateKey={dateKey} weather={weather} weatherStatus={weatherStatus}
                    notes={notes} onAccept={time => setNewSchedule({ ...newSchedule, time })} tempUnit={tempUnit} t={tr} />

                {/* Toggle for tags/reminder on new note */}
                <div className="notes-add-toolbar">
                    <button
                        className={`btn btn-ghost btn--sm${showNewExtras ? ' active' : ''}`}
                        onClick={() => setShowNewExtras(!showNewExtras)}
                        title={tr('notes.tags.reminder', 'Tags & Reminder')}
                    >
                        &#128279; {tr('notes.tags.reminder', 'Tags & Reminder')}
                    </button>
                    <button
                        id="btn-add-note"
                        className="btn btn-primary"
                        onClick={handleAdd}
                        disabled={!newText.trim()}
                    >
                        {tr('notes.addnote', '✨ Add Note')}
                    </button>
                </div>

                {showNewExtras && (
                    <div className="notes-add-extras">
                        <div className="note-details-section">
                            <span className="note-details-label">{tr('tags.label', 'Tags')}</span>
                            <TagInput tags={newTags} onChange={setNewTags} allTags={allTags} t={t} />
                        </div>
                        <div className="note-details-section">
                            <ReminderPicker reminder={newReminder} onChange={setNewReminder} t={t} />
                        </div>
                    </div>
                )}
            </div>

            {/* Note list */}
            {notes.length === 0 ? (
                <div className="notes-empty">
                    <span className="notes-empty-icon">&#127800;</span>
                    <p>{tr('notes.noyet', 'No notes yet. Add one above!')}</p>
                </div>
            ) : (
                <ul className="notes-list">
                    {notes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            dateKey={dateKey}
                            autoEdit={autoEditNoteId === note.id}
                            onEdit={(id, text) => onEdit(dateKey, id, text)}
                            onDelete={(id) => onDelete(dateKey, id)}
                            onUpdateTags={(id, tags) => onUpdateTags(dateKey, id, tags)}
                            onUpdateReminder={(id, rem) => onUpdateReminder(dateKey, id, rem)}
                            onUpdateSchedule={(id, schedule) => onUpdateSchedule(dateKey, id, schedule)}
                            weather={weather} weatherStatus={weatherStatus} notes={notes}
                            onAcceptWeather={onAcceptWeather} tempUnit={tempUnit}
                            allTags={allTags}
                            t={t}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
