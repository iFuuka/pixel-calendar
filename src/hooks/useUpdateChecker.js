import { useEffect } from 'react';

const LAST_SEEN_KEY = 'pixel-calendar-last-seen-update';
const FALLBACK_REPO = 'iFuuka/pixel-calendar';

function normalizeVersion(version) {
    return String(version || '').trim().replace(/^v/i, '');
}

function compareVersions(a, b) {
    const pa = normalizeVersion(a).split('.').map((part) => parseInt(part, 10) || 0);
    const pb = normalizeVersion(b).split('.').map((part) => parseInt(part, 10) || 0);
    const max = Math.max(pa.length, pb.length);
    for (let i = 0; i < max; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

async function checkGitHubFallback(currentVersion) {
    const res = await fetch(`https://api.github.com/repos/${FALLBACK_REPO}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const release = await res.json();
    const latestVersion = normalizeVersion(release.tag_name || release.name);
    return {
        ok: true,
        currentVersion,
        latestVersion,
        latestName: release.name || release.tag_name,
        releaseUrl: release.html_url,
        updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
    };
}

export function useUpdateChecker({ enabled, currentVersion, onShowToast, t }) {
    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        async function check() {
            try {
                const result = window.electronUpdates
                    ? await window.electronUpdates.check()
                    : await checkGitHubFallback(currentVersion);

                if (cancelled || !result?.ok || !result.updateAvailable) return;

                const latest = normalizeVersion(result.latestVersion);
                const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
                if (lastSeen === latest) return;
                localStorage.setItem(LAST_SEEN_KEY, latest);

                onShowToast({
                    title: t('update.available.title', 'Update available'),
                    noteText: `${t('update.available.body', 'New version available')}: ${result.latestName || `v${latest}`} (${t('update.current', 'current')}: v${result.currentVersion}).`,
                    dateKey: new Date().toISOString().slice(0, 10),
                    intervalKey: 'app-update',
                    tags: 'update, github',
                    actionUrl: result.releaseUrl,
                    actionLabel: t('update.open', 'Open release'),
                });
            } catch {
                // Silent by design: update checks should never annoy on network failure.
            }
        }

        const timer = setTimeout(check, 2500);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [enabled, currentVersion, onShowToast, t]);
}
