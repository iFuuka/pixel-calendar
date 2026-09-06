import { useRef, useState } from 'react';
import { MOOD_OPTIONS } from '../hooks/useMoods';
import DayMarkIcon from './DayMarkIcon';
import './DayDecorations.css';

const COLORS = [
    { key: 'red', color: '#e57373' },
    { key: 'blue', color: '#64b5f6' },
    { key: 'green', color: '#81c784' },
    { key: 'yellow', color: '#ffd54f' },
    { key: 'purple', color: '#ba68c8' },
];
const STICKERS = [
    ['🎂', 'birthday'], ['✈️', 'travel'], ['❤️', 'love'], ['⭐', 'star'], ['🎁', 'gift'],
    ['🎵', 'music'], ['☕', 'coffee'], ['🏆', 'win'], ['📌', 'pin'], ['🔥', 'fire'],
];
const TABS = ['mood', 'color', 'stickers'];

export default function DayDecorations({ dateKey, dayMeta, mood, onSetMood, onSetDayColor,
    onToggleSticker, countdowns = [], onAddCountdown, onRemoveCountdown, t }) {
    const [tab, setTab] = useState('mood');
    const [countdownOpen, setCountdownOpen] = useState(false);
    const [label, setLabel] = useState('');
    const tabRefs = useRef([]);
    const color = dayMeta?.color || null;
    const stickers = dayMeta?.stickers || [];
    const colorName = COLORS.find(option => option.color === color)?.key;
    const moodName = MOOD_OPTIONS.find(option => option.emoji === mood)?.key;
    const dayCountdowns = countdowns.filter(item => item.dateKey === dateKey);
    const tabNames = { mood: t('mood.title', 'Mood'), color: t('daymeta.color.tab', 'Color'), stickers: t('daymeta.stickers', 'Stickers') };
    const removeName = name => t('daymeta.remove', 'Remove: {name}').replace('{name}', name);

    function moveTab(event, index) {
        const next = event.key === 'ArrowRight' ? (index + 1) % TABS.length
            : event.key === 'ArrowLeft' ? (index + TABS.length - 1) % TABS.length
                : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        setTab(TABS[next]);
        tabRefs.current[next]?.focus();
    }

    function addCountdown(event) {
        event.preventDefault();
        if (!label.trim()) return;
        onAddCountdown(dateKey, label.trim());
        setLabel('');
    }

    return <>
        <section className="day-decorations" aria-labelledby="day-marks-title">
            <div className="day-marks-heading">
                <span className="day-marks-calendar" style={{ '--mark-color': color || 'var(--clr-lavender)' }} aria-hidden="true">
                    {Number(dateKey.slice(-2))}
                </span>
                <h3 id="day-marks-title">{t('daymeta.title', 'Day marks')}</h3>
            </div>
            {(color || mood || stickers.length > 0) && <div className="day-marks-selected" aria-label={t('daymeta.selected', 'Selected marks')}>
                {color && <button type="button" className="day-mark-chip" onClick={() => onSetDayColor(null)}
                    aria-label={removeName(t(`daymeta.color.${colorName || 'purple'}`, 'Color'))}>
                    <span className="day-mark-swatch" style={{ '--mark-color': color }} aria-hidden="true" />
                    {t(`daymeta.color.${colorName || 'purple'}`, 'Color')}<span aria-hidden="true">×</span>
                </button>}
                {mood && <button type="button" className="day-mark-chip" onClick={() => onSetMood(dateKey, null)}
                    aria-label={removeName(t(`mood.${moodName || 'title'}`, 'Mood'))}>
                    <DayMarkIcon value={mood} size={16} /><span aria-hidden="true">×</span>
                </button>}
                {stickers.map(sticker => {
                    const key = STICKERS.find(([value]) => value === sticker)?.[1];
                    return <button type="button" key={sticker} className="day-mark-chip" onClick={() => onToggleSticker(sticker)}
                        aria-label={removeName(key ? t(`daymeta.sticker.${key}`, key) : sticker)}>
                        <DayMarkIcon value={sticker} size={16} /><span aria-hidden="true">×</span>
                    </button>;
                })}
            </div>}
            <div className="day-marks-tabs" role="tablist" aria-label={t('daymeta.title', 'Day marks')}>
                {TABS.map((key, index) => <button type="button" key={key} id={`day-marks-tab-${key}`}
                    ref={element => { tabRefs.current[index] = element; }} role="tab" aria-selected={tab === key}
                    aria-controls={`day-marks-panel-${key}`} tabIndex={tab === key ? 0 : -1}
                    onClick={() => setTab(key)} onKeyDown={event => moveTab(event, index)}>
                    {tabNames[key]}
                    {key === 'stickers' && <span className="day-marks-count">{stickers.length}/3</span>}
                </button>)}
            </div>
            <div className={`day-marks-options day-marks-options--${tab}`} role="tabpanel"
                id={`day-marks-panel-${tab}`} aria-labelledby={`day-marks-tab-${tab}`}>
                {tab === 'mood' && <>
                    {MOOD_OPTIONS.map(({ emoji, key }) => <button type="button" key={key} className="day-mark-option"
                        data-mood={emoji} aria-label={t(`mood.${key}`, key)} aria-pressed={mood === emoji}
                        onClick={() => onSetMood(dateKey, mood === emoji ? null : emoji)}>
                        <DayMarkIcon value={emoji} size={32} /><span>{t(`daymeta.mood.${key}`, t(`mood.${key}`, key))}</span>
                    </button>)}
                    <button type="button" className="day-mark-option day-mark-option--clear" data-mood=""
                        aria-pressed={!mood} onClick={() => onSetMood(dateKey, null)}>
                        <span className="day-mark-empty" aria-hidden="true">×</span><span>{t('daymeta.clear', 'None')}</span>
                    </button>
                </>}
                {tab === 'color' && <>
                    {COLORS.map(option => <button type="button" key={option.key} className="day-mark-option day-mark-option--color"
                        data-day-color={option.color} aria-pressed={color === option.color}
                        onClick={() => onSetDayColor(color === option.color ? null : option.color)}>
                        <span className="day-mark-ribbon" style={{ '--mark-color': option.color }} aria-hidden="true" />
                        <span>{t(`daymeta.color.${option.key}`, option.key)}</span>
                    </button>)}
                    <button type="button" className="day-mark-option day-mark-option--color day-mark-option--clear"
                        data-day-color="" aria-pressed={!color} onClick={() => onSetDayColor(null)}>
                        <span className="day-mark-empty" aria-hidden="true">×</span><span>{t('daymeta.clear', 'None')}</span>
                    </button>
                </>}
                {tab === 'stickers' && STICKERS.map(([sticker, key]) => <button type="button" key={key}
                    className="day-mark-option" data-sticker={sticker} aria-pressed={stickers.includes(sticker)}
                    disabled={stickers.length >= 3 && !stickers.includes(sticker)} onClick={() => onToggleSticker(sticker)}>
                    <DayMarkIcon value={sticker} size={32} /><span>{t(`daymeta.sticker.${key}`, key)}</span>
                </button>)}
            </div>
        </section>

        <section className="day-countdown" aria-label={t('countdown.title', 'Countdown')}>
            <button type="button" id="day-countdown-toggle" className="day-countdown-toggle"
                aria-expanded={countdownOpen} aria-controls="day-countdown-editor" onClick={() => setCountdownOpen(open => !open)}>
                <svg className="day-countdown-icon" width="28" height="28" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
                    <path d="M1 2H15V15H1Z" fill="currentColor" />
                    <path d="M2 6H14V14H2Z" fill="var(--clr-surface)" />
                    <path d="M2 3H14V5H2Z" fill="var(--clr-peach2)" />
                    <path d="M4 0H6V4H4ZM10 0H12V4H10Z" fill="currentColor" />
                    <path d="M4 8H6V10H4ZM7 8H9V10H7ZM4 11H6V13H4Z" fill="var(--clr-border)" />
                    <path d="M10 9H12V11H14V13H10V14H8V12H10Z" fill="var(--clr-rose2)" />
                </svg>
                <span className="day-countdown-toggle-label">{t('daymeta.countdown', 'Count down to this day')}</span>
                <span className="day-countdown-toggle-sign" aria-hidden="true">{countdownOpen ? '−' : '+'}</span>
            </button>
            {dayCountdowns.length > 0 && <ul className="day-countdown-list">
                {dayCountdowns.map(item => <li key={item.id}>
                    <span className="day-countdown-emoji" aria-hidden="true">{item.emoji || '🎯'}</span>
                    <span className="day-countdown-name">{item.label}</span>
                    <button type="button" data-remove-countdown={item.id} onClick={() => onRemoveCountdown(item.id)}
                        aria-label={removeName(item.label)}>×</button>
                </li>)}
            </ul>}
            {countdownOpen && <form id="day-countdown-editor" className="day-countdown-form" onSubmit={addCountdown}>
                <label htmlFor="day-countdown-label" className="day-countdown-label">{t('daymeta.countdown.name', 'Event name')}</label>
                <div className="day-countdown-fields">
                    <input id="day-countdown-label" value={label} onChange={event => setLabel(event.target.value)}
                        placeholder={t('countdown.label', 'Event name…')} autoComplete="off" />
                    <button type="submit" id="day-countdown-add" disabled={!label.trim()}>{t('daymeta.add', 'Add')}</button>
                </div>
            </form>}
        </section>
    </>;
}
