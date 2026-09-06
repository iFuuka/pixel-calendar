import React, { useState, useRef, useCallback, useEffect } from 'react';
import './AuthorBadge.css';

export default function AuthorBadge({ onAdminActivate }) {
    const [clickCount, setClickCount] = useState(0);
    const timerRef = useRef(null);
    const clickCountRef = useRef(0);
    useEffect(() => () => clearTimeout(timerRef.current), []);

    const handleNameClick = useCallback((e) => {
        e.stopPropagation();
        const next = clickCountRef.current + 1;
        clearTimeout(timerRef.current);
        clickCountRef.current = next >= 10 ? 0 : next;
        setClickCount(clickCountRef.current);
        if (next >= 10) {
            onAdminActivate?.();
        } else {
            timerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
                setClickCount(0);
            }, 3000);
        }
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
