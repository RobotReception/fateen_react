/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCs6KNEQcizy-aJ2qnIYqfsBV89hYwzUUQ",
    projectId: "fateen-30820",
    messagingSenderId: "221097050545",
    appId: "1:221097050545:web:d49f8bd6302c055e33bd90"
});

const messaging = firebase.messaging();

// استقبال الإشعارات عندما يكون التطبيق في الخلفية
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    self.registration.showNotification(title || 'فطين', {
        body: body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        dir: 'rtl',
        lang: 'ar',
        data: payload.data,
        tag: payload.data?.type || 'default'
    });
});
