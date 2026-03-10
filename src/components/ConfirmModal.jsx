import React, { useEffect, useRef } from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, t }) {
    const tr = t || ((k, fb) => fb || k);
    const modalRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        function handleKey(e) {
            if (e.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onCancel]);

    // Trap focus inside modal
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="confirm-backdrop" onClick={onCancel} aria-hidden="true" />
            <div
                ref={modalRef}
                className="confirm-modal pixel-border"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-desc"
                tabIndex={-1}
            >
                <div className="confirm-header">
                    <span className="confirm-icon">⚠️</span>
                    <h3 id="confirm-title" className="confirm-title">{title || tr('modal.confirm.title', 'Confirm')}</h3>
                </div>

                <div className="confirm-body">
                    <p id="confirm-desc" className="confirm-msg">{message}</p>

                    <div className="confirm-actions">
                        <button
                            className="btn btn-ghost confirm-btn-cancel"
                            onClick={onCancel}
                        >
                            {tr('modal.cancel', 'Cancel')}
                        </button>
                        <button
                            className="btn btn-danger confirm-btn-delete"
                            onClick={onConfirm}
                        >
                            {tr('modal.delete', 'Delete')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
