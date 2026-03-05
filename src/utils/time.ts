// utils/time.ts

// لتحويل timestamp إلى كائن تاريخ صحيح (مع دعم صيغة FastAPI الجديدة)
export const parseTimestamp = (timestamp?: string | null): Date => {
    if (!timestamp) return new Date();
    const cleaned = timestamp.split(".")[0]; // حذف جزء المايكروثانية
    return new Date(cleaned + "Z"); // إضافة Z لتحويله إلى UTC
};

// تنسيق الوقت فقط
export const formatTime = (timestamp?: string | null): string => {
    const date = parseTimestamp(timestamp);
    return date.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Riyadh",
    });
};

// تنسيق التاريخ فقط
export const formatDate = (timestamp?: string | null): string => {
    const date = parseTimestamp(timestamp);
    return date.toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Riyadh",
    });
};

// إرجاع الوقت إذا اليوم، أو التاريخ إن كان سابقًا
export const getTimeOrDate = (timestamp?: string | null): string => {
    if (!timestamp) return "";
    const now = new Date();
    const msgDate = parseTimestamp(timestamp);
    const isToday =
        now.toLocaleDateString("en", { timeZone: "Asia/Riyadh" }) ===
        msgDate.toLocaleDateString("en", { timeZone: "Asia/Riyadh" });

    return isToday ? formatTime(timestamp) : formatDate(timestamp);
};

// لمعرفة هل الجلسة نشطة خلال 24 ساعة
export const isSessionActive = (timestamp?: string | null): boolean => {
    if (!timestamp) return false;
    const now = new Date();
    const msgDate = parseTimestamp(timestamp);
    return now.getTime() - msgDate.getTime() < 24 * 60 * 60 * 1000;
};
