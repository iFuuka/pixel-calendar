import React, { useEffect, useRef, useState } from 'react';
import './ToastNotification.css';

/**
 * ToastNotification — custom in-app notification popup.
 * Renders in the bottom-right corner, auto-closes after 8 seconds.
 */
export default function ToastNotification({ notification, onClose, onReminderAction }) {
    const [exiting, setExiting] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const closing = useRef(false);
    const closeTimer = useRef(null);

    useEffect(() => {
        if (!notification) return;
        setExiting(false);
        setBusy(false);
        setError('');
        closing.current = false;

        const timer = notification.kind === 'reminder' ? null : setTimeout(() => {
            if (closing.current) return;
            closing.current = true;
            setExiting(true);
            closeTimer.current = setTimeout(onClose, 350);
        }, 8000);

        return () => { clearTimeout(timer); clearTimeout(closeTimer.current); };
    }, [notification, onClose]);

    if (!notification) return null;

    function handleClose() {
        if (closing.current || busy) return;
        closing.current = true;
        setExiting(true);
        closeTimer.current = setTimeout(onClose, 350);
    }

    async function actOnReminder(action) {
        if (busy || closing.current) return;
        setBusy(true);
        setError('');
        try {
            await onReminderAction(action, notification);
            setBusy(false);
            handleClose();
        } catch (err) {
            setBusy(false);
            setError(err.message || notification.errorLabel);
        }
    }

    const tags = (notification.tags ?? '').split(', ').filter(Boolean);
    function handleAction() {
        if (!notification.actionUrl) return;
        if (window.electronUpdates) {
            window.electronUpdates.openRelease(notification.actionUrl);
        } else {
            window.open(notification.actionUrl, '_blank', 'noopener,noreferrer');
        }
        handleClose();
    }

    return (
        <div className={`toast-notification pixel-border${exiting ? ' toast--exiting' : ''}`}>
            <div className="toast-header">
                <span className="toast-title">{notification.title || 'Pixel Calendar'}</span>
                <button className="toast-close" onClick={handleClose} disabled={busy || exiting} aria-label="Close">&#10005;</button>
            </div>
            <div className="toast-body">
                <div className="toast-date">&#128197; {notification.dateKey}</div>
                <div className="toast-text">{notification.noteText}</div>
                {notification.kind === 'reminder' && (
                    <div className="toast-reminder-actions">
                        <button className="toast-action" onClick={() => actOnReminder('open')} disabled={busy || exiting}>{notification.openLabel}</button>
                        <button className="toast-action" onClick={() => actOnReminder('snooze')} disabled={busy || exiting}>{notification.snoozeLabel}</button>
                    </div>
                )}
                {error && <p className="toast-error" role="alert">{error}</p>}
                {notification.actionUrl && (
                    <button className="toast-action" type="button" onClick={handleAction}>
                        {notification.actionLabel || 'Open'}
                    </button>
                )}
                {tags.length > 0 && (
                    <div className="toast-tags">
                        {tags.map((tag) => (
                            <span key={tag} className="toast-tag">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
            {notification.kind !== 'reminder' && <div className="toast-progress">
                <div className="toast-progress-bar" />
            </div>}
        </div>
    );
}
