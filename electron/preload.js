'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronNotify', {
    showReminder: (data) => ipcRenderer.send('show-reminder', data),
});

contextBridge.exposeInMainWorld('electronSettings', {
    setAutoStart: (enabled, minimized) => ipcRenderer.invoke('set-auto-start', enabled, minimized),
    getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
});

contextBridge.exposeInMainWorld('electronUpdates', {
    check: () => ipcRenderer.invoke('check-for-updates'),
    openRelease: (url) => ipcRenderer.invoke('open-release-url', url),
});
