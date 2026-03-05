import { initializeApp, type FirebaseApp } from "firebase/app"
import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from "firebase/messaging"

const firebaseConfig = {
    apiKey: "AIzaSyCs6KNEQcizy-aJ2qnIYqfsBV89hYwzUUQ",
    authDomain: "fateen-30820.firebaseapp.com",
    projectId: "fateen-30820",
    storageBucket: "fateen-30820.firebasestorage.app",
    messagingSenderId: "221097050545",
    appId: "1:221097050545:web:d49f8bd6302c055e33bd90",
    measurementId: "G-WH2DVJwZLT",
}

const VAPID_KEY =
    "BKsF36-w51KiOsZR3uAROYuXxFGRneVHlcRWxsfFhbUCKeovMOvRn8W40cqODfKtZWpl5RUbuI50ycel12UqAc0"

// ── Lazy initialization to avoid errors crashing the app ──
let _app: FirebaseApp | null = null
let _messaging: Messaging | null = null

function getFirebaseMessaging(): Messaging | null {
    try {
        if (!_app) _app = initializeApp(firebaseConfig)
        if (!_messaging) _messaging = getMessaging(_app)
        return _messaging
    } catch (error) {
        console.warn("Firebase Messaging init skipped:", error)
        return null
    }
}

/**
 * طلب إذن الإشعارات والحصول على FCM Token
 * يعود بـ null بدون رمي خطأ إذا فشل أي شيء
 */
export async function requestNotificationPermission(): Promise<string | null> {
    try {
        if (typeof Notification === "undefined") {
            console.warn("Notifications not supported in this browser")
            return null
        }

        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
            console.warn("إذن الإشعارات مرفوض")
            return null
        }

        const messaging = getFirebaseMessaging()
        if (!messaging) return null

        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        return token
    } catch (error) {
        console.warn("FCM registration skipped (non-critical):", error)
        return null
    }
}

/**
 * الاستماع للإشعارات أثناء تواجد المستخدم في التطبيق (Foreground)
 * يعود بـ cleanup function أو undefined إذا فشل
 */
export function onForegroundMessage(
    callback: (payload: {
        id: string
        title: string
        body: string
        data: Record<string, string>
        timestamp: Date
    }) => void
): (() => void) | undefined {
    try {
        const messaging = getFirebaseMessaging()
        if (!messaging) return undefined

        return onMessage(messaging, (payload: MessagePayload) => {
            callback({
                id: payload.messageId ?? crypto.randomUUID(),
                title: payload.notification?.title ?? "",
                body: payload.notification?.body ?? "",
                data: (payload.data as Record<string, string>) ?? {},
                timestamp: new Date(),
            })
        })
    } catch (error) {
        console.warn("Foreground message listener skipped:", error)
        return undefined
    }
}
