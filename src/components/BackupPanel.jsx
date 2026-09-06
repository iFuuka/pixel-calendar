import { useRef, useState } from 'react';
import { backupCounts, createBackup, MAX_BACKUP_BYTES, parseBackup, RECOVERY_KEY, restoreBackup } from '../utils/backup';

function downloadBackup(backup, prefix = 'backup') {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pixel-calendar-${prefix}-${backup.createdAt.slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BackupPanel({ t }) {
    const fileRef = useRef(null);
    const [pending, setPending] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [hasRecovery] = useState(() => {
        try { return !!localStorage.getItem(RECOVERY_KEY); } catch { return false; }
    });

    function exportBackup(recovery = false) {
        try {
            setError('');
            downloadBackup(recovery ? parseBackup(localStorage.getItem(RECOVERY_KEY)) : createBackup(localStorage), recovery ? 'recovery' : 'backup');
        } catch { setError(t('backup.exportError')); }
    }

    async function selectBackup(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setError('');
        setPending(null);
        if (file.size > MAX_BACKUP_BYTES) { setError(t('backup.sizeError')); return; }
        setBusy(true);
        try { setPending({ backup: parseBackup(await file.text()), filename: file.name }); }
        catch { setError(t('backup.invalid')); }
        finally { setBusy(false); }
    }

    function confirmRestore() {
        if (!pending) return;
        setBusy(true);
        try {
            const backup = structuredClone(pending.backup);
            const current = createBackup(localStorage).data.settings;
            // OS launch registration belongs to this device.
            for (const key of ['autoStart', 'startMinimized']) backup.data.settings[key] = current[key] ?? false;
            restoreBackup(localStorage, backup);
            window.location.reload();
        } catch {
            setError(t('backup.restoreError'));
            setBusy(false);
        }
    }

    return (
        <div className="backup-panel">
            <h4>{t('backup.title')}</h4>
            <p className="event-hint">{t('backup.description')}</p>
            <div className="settings-data-btns">
                <button className="btn btn-primary" id="btn-export-backup" onClick={() => exportBackup()} disabled={busy}>{t('backup.export')}</button>
                <button className="btn btn-ghost" id="btn-import-backup" onClick={() => fileRef.current?.click()} disabled={busy}>{t('backup.import')}</button>
                {hasRecovery && <button className="btn btn-ghost" onClick={() => exportBackup(true)}>{t('backup.recovery')}</button>}
            </div>
            <input ref={fileRef} id="backup-file-input" type="file" accept=".json,application/json" hidden onChange={selectBackup} />
            {pending && (
                <div className="backup-preview" aria-live="polite">
                    <strong>{t('backup.preview')}</strong>
                    <p className="backup-filename">{pending.filename}</p>
                    <p>{t('backup.created')} {new Date(pending.backup.createdAt).toLocaleString()}</p>
                    <dl className="backup-counts">
                        {Object.entries(backupCounts(pending.backup)).map(([key, count]) => (
                            <div key={key}><dt>{t(`backup.count.${key}`)}</dt><dd>{count}</dd></div>
                        ))}
                    </dl>
                    <p>{t('backup.replaceHint')}</p>
                    <p className="event-hint">{t('backup.deviceHint')}</p>
                    <div className="settings-data-btns">
                        <button className="btn btn-danger" id="btn-confirm-restore" onClick={confirmRestore} disabled={busy}>{t('backup.confirm')}</button>
                        <button className="btn btn-ghost" onClick={() => setPending(null)} disabled={busy}>{t('notes.cancel')}</button>
                    </div>
                </div>
            )}
            {error && <p className="settings-geo-status err" role="alert">{error}</p>}
        </div>
    );
}
