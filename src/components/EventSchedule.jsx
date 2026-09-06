import { REPEAT_OPTIONS } from '../utils/events';

export default function EventSchedule({ value, onChange, dateKey, t }) {
    const repeat = value.repeat || 'none';
    return (
        <div className="event-schedule">
            <div className="event-schedule-fields">
                <label>
                    <span>{t('event.time')}</span>
                    <input type="time" value={value.time || ''}
                        onChange={e => onChange({ ...value, time: e.target.value })} />
                </label>
                <label>
                    <span>{t('event.repeat')}</span>
                    <select value={repeat} onChange={e => onChange({
                        ...value, repeat: e.target.value,
                        repeatUntil: e.target.value === 'none' ? '' : value.repeatUntil || '',
                    })}>
                        {REPEAT_OPTIONS.map(option => <option key={option} value={option}>{t(`event.repeat.${option}`)}</option>)}
                    </select>
                </label>
                {repeat !== 'none' && (
                    <label>
                        <span>{t('event.until')}</span>
                        <input type="date" min={dateKey} value={value.repeatUntil || ''}
                            onChange={e => {
                                if (!e.target.value || e.target.value >= dateKey) {
                                    onChange({ ...value, repeatUntil: e.target.value });
                                }
                            }} />
                    </label>
                )}
            </div>
            <label className="event-all-day">
                <input type="checkbox" checked={!value.time}
                    onChange={e => onChange({ ...value, time: e.target.checked ? '' : '09:00' })} />
                {t('event.allDay')}
            </label>
            <label className="event-all-day">
                <input type="checkbox" checked={!!value.outdoor}
                    onChange={e => onChange({ ...value, outdoor: e.target.checked })} />
                {t('event.outdoor')}
            </label>
            {(repeat === 'monthly' || repeat === 'yearly') && <p className="event-hint">{t('event.skipHint')}</p>}
        </div>
    );
}
