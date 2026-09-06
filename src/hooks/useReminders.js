import { useEffect, useRef } from 'react';
import { dueReminders } from '../utils/events';

/**
 * useReminders — polls every 30 seconds, checks all notes for due reminders.
 *
 * Notification flow:
 *  - Electron: sends IPC to main process → custom notification window
 *  - Browser (dev): calls onShowToast → in-app ToastNotification component
 *
 * Both paths show custom-styled notifications, never native browser Notification API.
 */
export function useReminders(allNotes, markReminderNotified, onShowToast, t) {
    const sent = useRef(new Set());

    useEffect(() => {
        function checkReminders() {
            for (const { note, dateKey, interval, notificationKey } of dueReminders(allNotes)) {
                const key = `${note.id}:${notificationKey}:${note.time || ''}`;
                if (sent.current.has(key)) continue;
                fireNotification(dateKey, note, interval, onShowToast, t);
                sent.current.add(key);
                markReminderNotified(note.sourceDateKey, note.id, notificationKey);
            }
            if (sent.current.size > 512) sent.current = new Set([...sent.current].slice(-256));
        }

        checkReminders();
        const timer = setInterval(checkReminders, 30000);
        window.addEventListener('focus', checkReminders);
        return () => {
            clearInterval(timer);
            window.removeEventListener('focus', checkReminders);
        };
    }, [allNotes, markReminderNotified, onShowToast, t]);
}

function fireNotification(dateKey, note, intervalKey, onShowToast, t) {
    const title = 'Pixel Calendar';
    const body = note.text.length > 100 ? note.text.slice(0, 100) + '...' : note.text;
    const tags = (note.tags ?? []).length > 0 ? note.tags.join(', ') : '';

    const data = {
        title, noteText: `${note.time ? `${note.time} · ` : ''}${body}`, dateKey, intervalKey, tags,
        kind: 'reminder', noteId: note.id, openLabel: t('reminder.open'),
        snoozeLabel: t('reminder.snooze'), errorLabel: t('reminder.actionError'),
    };

    if (window.electronNotify) {
        // Electron: custom notification window via IPC
        window.electronNotify.showReminder(data);
    } else if (onShowToast) {
        // Browser (dev mode): in-app toast component
        onShowToast(data);
    }
}
