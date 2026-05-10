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
});
