import { useEffect, useRef } from 'react';

/**
 * Map interval keys to milliseconds before the target date's 9:00 AM.
 */
const INTERVAL_MS = {
    'same-day': 0,
    '1-day': 24 * 60 * 60 * 1000,
    '2-days': 2 * 24 * 60 * 60 * 1000,
    '3-days': 3 * 24 * 60 * 60 * 1000,
    '1-week': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Get the 9:00 AM timestamp for a given date key (yyyy-MM-dd).
 */
function getTargetTime(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d, 9, 0, 0, 0);
    return date.getTime();
}

/**
 * useReminders — polls every 30 seconds, checks all notes for due reminders.
 *
 * Notification flow:
 *  - Electron: sends IPC to main process → custom notification window
 *  - Browser (dev): calls onShowToast → in-app ToastNotification component
 *
 * Both paths show custom-styled notifications, never native browser Notification API.
 */
export function useReminders(allNotes, markReminderNotified, onShowToast) {
    const lastCheckRef = useRef(0);

    useEffect(() => {
        function checkReminders() {
            const now = Date.now();
            if (now - lastCheckRef.current < 25000) return;
            lastCheckRef.current = now;

            Object.entries(allNotes).forEach(([dateKey, notes]) => {
                notes.forEach((note) => {
                    const rem = note.reminder;
                    if (!rem?.enabled || !rem.intervals?.length) return;

                    const target = getTargetTime(dateKey);

                    rem.intervals.forEach((intervalKey) => {
                        if ((rem.notified ?? []).includes(intervalKey)) return;

                        const offsetMs = INTERVAL_MS[intervalKey] ?? 0;
                        const fireAt = target - offsetMs;

                        // Fire if within a 2-minute window after fire time
                        if (now >= fireAt && now < fireAt + 2 * 60 * 1000) {
                            fireNotification(dateKey, note, intervalKey, onShowToast);
                            markReminderNotified(dateKey, note.id, intervalKey);
                        }
                    });
                });
            });
        }

        checkReminders();
        const timer = setInterval(checkReminders, 30000);
        return () => clearInterval(timer);
    }, [allNotes, markReminderNotified, onShowToast]);
}

function fireNotification(dateKey, note, intervalKey, onShowToast) {
    const title = 'Pixel Calendar';
    const body = note.text.length > 100 ? note.text.slice(0, 100) + '...' : note.text;
    const tags = (note.tags ?? []).length > 0 ? note.tags.join(', ') : '';

    const data = { title, noteText: body, dateKey, intervalKey, tags };

    if (window.electronNotify) {
        // Electron: custom notification window via IPC
        window.electronNotify.showReminder(data);
    } else if (onShowToast) {
        // Browser (dev mode): in-app toast component
        onShowToast(data);
    }
}
