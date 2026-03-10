import React, { useState, useRef, useCallback } from 'react';
import './AuthorBadge.css';

export default function AuthorBadge({ onAdminActivate }) {
    const [clickCount, setClickCount] = useState(0);
    const timerRef = useRef(null);

    const handleNameClick = useCallback((e) => {
        e.stopPropagation();
        setClickCount((prev) => {
            const next = prev + 1;
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setClickCount(0), 3000);

            if (next >= 10) {
                clearTimeout(timerRef.current);
                setClickCount(0);
                if (onAdminActivate) onAdminActivate();
            }
            return next >= 10 ? 0 : next;
        });
    }, [onAdminActivate]);

    const handleAvatarClick = useCallback((e) => {
        e.stopPropagation();
        window.open('https://github.com/iFuuka/pixel-calendar', '_blank', 'noopener');
    }, []);

    return (
        <div className="author-badge">
            <img
                src="./me_chibi.png"
                alt="iFuuka"
                className="author-avatar"
                onClick={handleAvatarClick}
                role="link"
                tabIndex={0}
                title="GitHub"
            />
            <span
                className="author-name"
                onClick={handleNameClick}
                role="button"
                tabIndex={-1}
            >
                iFuuka
            </span>
            {clickCount > 0 && clickCount < 10 && (
                <span className="author-click-counter">{clickCount}/10</span>
            )}
        </div>
    );
}
