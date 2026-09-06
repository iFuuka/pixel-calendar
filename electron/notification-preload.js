'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notificationApi', {
    onData: (callback) => {
        if (typeof callback !== 'function') return () => {};

        const handler = (_event, data) => callback(data);
        ipcRenderer.on('notification-data', handler);

        return () => ipcRenderer.removeListener('notification-data', handler);
    },
    close: () => ipcRenderer.send('close-notification'),
    action: (action) => ipcRenderer.send('notification-action', action),
    onActionError: (callback) => {
        if (typeof callback !== 'function') return () => {};
        const handler = (_event, error) => callback(error);
        ipcRenderer.on('notification-action-error', handler);
        return () => ipcRenderer.removeListener('notification-action-error', handler);
    },
});
