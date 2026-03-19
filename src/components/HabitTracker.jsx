import React, { useState } from 'react';
import { format } from 'date-fns';
import './HabitTracker.css';

export default function HabitTracker({ habits, onAdd, onRemove, onToggle, isChecked, getStreak, t }) {
    const tr = t || ((k, fb) => fb || k);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    function handleAdd() {
        if (!name.trim()) return;
        onAdd(name.trim(), '✅');
        setName('');
        setAdding(false);
    }

    return (
        <div className="habit-tracker-compact">
            <span className="habit-label">{tr('habits.title', 'Habits')}</span>
            <div className="habit-chips">
                {habits.map(h => {
                    const checked = isChecked(todayKey, h.id);
                    const streak = getStreak(h.id);
                    return (
                        <button
                            key={h.id}
                            className={`habit-chip ${checked ? 'habit-chip--done' : ''}`}
                            onClick={() => onToggle(todayKey, h.id)}
                            title={`${h.name}${streak > 0 ? ` (🔥${streak})` : ''}`}
                        >
                            <span>{h.icon}</span>
                            <span className="habit-chip-name">{h.name}</span>
                            {streak > 0 && <span className="habit-chip-streak">🔥{streak}</span>}
                            <span
                                className="habit-chip-x"
                                onClick={(e) => { e.stopPropagation(); onRemove(h.id); }}
                            >✕</span>
                        </button>
                    );
                })}
                {adding ? (
                    <div className="habit-inline-add">
                        <input
                            className="habit-inline-input"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                            placeholder={tr('habits.name', 'Name...')}
                            autoFocus
                        />
                        <button className="habit-inline-ok" onClick={handleAdd}>✓</button>
                    </div>
                ) : (
                    <button className="habit-chip habit-chip--add" onClick={() => setAdding(true)}>+</button>
                )}
            </div>
        </div>
    );
}
