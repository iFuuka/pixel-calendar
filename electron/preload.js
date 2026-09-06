'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronWeather', {
    onResume: callback => {
        const handler = () => callback();
        ipcRenderer.on('weather-resume', handler);
        return () => ipcRenderer.removeListener('weather-resume', handler);
    },
});

contextBridge.exposeInMainWorld('electronNotify', {
    showReminder: (data) => ipcRenderer.send('show-reminder', data),
    onAction: (callback) => {
        if (typeof callback !== 'function') return () => {};
        const handler = (_event, request) => callback(request);
        ipcRenderer.on('reminder-action', handler);
        return () => ipcRenderer.removeListener('reminder-action', handler);
    },
    completeAction: (id, result) => ipcRenderer.send('reminder-action-result', id, result),
});

contextBridge.exposeInMainWorld('electronSettings', {
    setAutoStart: (enabled, minimized) => ipcRenderer.invoke('set-auto-start', enabled, minimized),
    getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
});

contextBridge.exposeInMainWorld('electronUpdates', {
    check: () => ipcRenderer.invoke('check-for-updates'),
    openRelease: (url) => ipcRenderer.invoke('open-release-url', url),
});
