import React, { useEffect, useState } from 'react';
import './ToastNotification.css';

/**
 * ToastNotification — custom in-app notification popup.
 * Renders in the bottom-right corner, auto-closes after 8 seconds.
 */
export default function ToastNotification({ notification, onClose }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!notification) return;
        setExiting(false);

        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 350);
        }, 8000);

        return () => clearTimeout(timer);
    }, [notification, onClose]);

    if (!notification) return null;

    function handleClose() {
        setExiting(true);
        setTimeout(onClose, 350);
    }

    const tags = (notification.tags ?? '').split(', ').filter(Boolean);

    return (
        <div className={`toast-notification pixel-border${exiting ? ' toast--exiting' : ''}`}>
            <div className="toast-header">
                <span className="toast-title">{notification.title || 'Pixel Calendar'}</span>
                <button className="toast-close" onClick={handleClose}>&#10005;</button>
            </div>
            <div className="toast-body">
                <div className="toast-date">&#128197; {notification.dateKey}</div>
                <div className="toast-text">{notification.noteText}</div>
                {tags.length > 0 && (
                    <div className="toast-tags">
                        {tags.map((tag) => (
                            <span key={tag} className="toast-tag">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>
            <div className="toast-progress">
                <div className="toast-progress-bar" />
            </div>
        </div>
    );
}
