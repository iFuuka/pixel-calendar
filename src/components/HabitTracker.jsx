import React, { useState } from 'react';
import { format } from 'date-fns';
import './HabitTracker.css';

export default function HabitTracker({ habits, onAdd, onRemove, onToggle, isChecked, getStreak, t }) {
    const tr = t || ((k, fb) => fb || k);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const doneCount = habits.filter(h => isChecked(todayKey, h.id)).length;

    function handleAdd() {
        if (!name.trim()) return;
        onAdd(name.trim(), '✓');
        setName('');
        setAdding(false);
    }

    function cancelAdd() {
        setAdding(false);
        setName('');
    }

    return (
        <div className="habit-tracker">
            <div className="habit-header">
                <div>
                    <h3 className="habit-title">{tr('habits.title', 'Habits')}</h3>
                    <span className="habit-subtitle">
                        {habits.length > 0
                            ? `${doneCount}/${habits.length} ${tr('dashboard.today', 'Today').toLowerCase()}`
                            : tr('habits.empty', 'No habits yet. Press + to add one!')}
                    </span>
                </div>
                {!adding && (
                    <button className="habit-add-btn" type="button" onClick={() => setAdding(true)}>
                        +
                    </button>
                )}
            </div>

            {adding && (
                <div className="habit-add-row">
                    <input
                        className="habit-input"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') cancelAdd();
                        }}
                        placeholder={tr('habits.name', 'Habit name...')}
                        autoFocus
                    />
                    <button className="habit-save-btn" type="button" onClick={handleAdd}>OK</button>
                    <button className="habit-cancel-btn" type="button" onClick={cancelAdd}>×</button>
                </div>
            )}

            {habits.length > 0 && (
                <div className="habit-list">
                    {habits.map(h => {
                        const checked = isChecked(todayKey, h.id);
                        const streak = getStreak(h.id);
                        return (
                            <div key={h.id} className={`habit-card ${checked ? 'habit-card--done' : ''}`}>
                                <button
                                    className="habit-check"
                                    type="button"
                                    onClick={() => onToggle(todayKey, h.id)}
                                    aria-pressed={checked}
                                    title={h.name}
                                >
                                    <span className="habit-check-box">{checked ? '✓' : ''}</span>
                                    <span className="habit-card-name">{h.name}</span>
                                </button>
                                {streak > 0 && <span className="habit-streak">🔥{streak}</span>}
                                <button
                                    className="habit-remove"
                                    type="button"
                                    onClick={() => onRemove(h.id)}
                                    title="Remove"
                                    aria-label="Remove habit"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
