import React from 'react';
import { GearIcon } from './PixelIcons';
import './Header.css';

export default function Header({ currentMonth, onPrev, onNext, locationName, onOpenSettings, t }) {
    const monthKey = 'month.' + ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][currentMonth.getMonth()];
    const month = t ? t(monthKey) : currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    return (
        <header className="header pixel-border">
            <div className="header-left">
                <span className="header-icon">🌸</span>
                <div className="header-title-group">
                    <h1 className="header-title">{t ? t('app.title') : 'Pixel Calendar'}</h1>
                    <span className="header-location">📍 {locationName}</span>
                </div>
            </div>

            <div className="header-nav">
                <button
                    id="btn-prev-month"
                    className="nav-btn btn pixel-border"
                    onClick={onPrev}
                    aria-label={t ? t('header.prev', 'Previous month') : 'Previous month'}
                >
                    ←
                </button>
                <div className="header-month-year">
                    <span className="month-name">{month}</span>
                    <span className="year-name">{year}</span>
                </div>
                <button
                    id="btn-next-month"
                    className="nav-btn btn pixel-border"
                    onClick={onNext}
                    aria-label={t ? t('header.next', 'Next month') : 'Next month'}
                >
                    →
                </button>
            </div>

            <div className="header-right">
                <button
                    id="btn-open-settings"
                    className="settings-btn btn pixel-border"
                    onClick={onOpenSettings}
                    aria-label={t ? t('settings.title', 'Settings') : 'Settings'}
                    title={t ? t('settings.title', 'Settings') : 'Settings'}
                >
                    <GearIcon size={18} />
                    <span className="settings-btn-label">{t ? t('settings.title') : 'Settings'}</span>
                </button>
            </div>
        </header>
    );
}
