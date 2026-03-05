import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
    Bell, BellOff, CheckCheck, X, ChevronRight,
    MessageSquare, ShieldAlert, Package, Megaphone,
    Clock, ClipboardList, Zap, ShoppingCart, ArrowRight,
    LogIn, ArrowRightLeft, AtSign,
} from "lucide-react"
import type { NotificationItem } from "../services/notification-service"

/* ── Type → visual config ── */
const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
    message: { icon: MessageSquare, color: "#2563eb", bg: "#eff6ff", label: "رسالة" },
    order_created: { icon: ShoppingCart, color: "#059669", bg: "#ecfdf5", label: "طلب جديد" },
    order_updated: { icon: Package, color: "#d97706", bg: "#fffbeb", label: "تحديث طلب" },
    security_alert: { icon: ShieldAlert, color: "#dc2626", bg: "#fef2f2", label: "تنبيه أمني" },
    system_update: { icon: Zap, color: "#7c3aed", bg: "#f5f3ff", label: "تحديث النظام" },
    announcement: { icon: Megaphone, color: "#0891b2", bg: "#ecfeff", label: "إعلان" },
    reminder: { icon: Clock, color: "#ea580c", bg: "#fff7ed", label: "تذكير" },
    assignment: { icon: ClipboardList, color: "#4f46e5", bg: "#eef2ff", label: "تعيين" },
    team_assignment: { icon: ClipboardList, color: "#7c3aed", bg: "#f5f3ff", label: "تعيين فريق" },
    conversation_closed: { icon: MessageSquare, color: "#6b7280", bg: "#f3f4f6", label: "إغلاق محادثة" },
    conversation_reopened: { icon: MessageSquare, color: "#059669", bg: "#ecfdf5", label: "إعادة فتح" },
    payment: { icon: ShoppingCart, color: "#0891b2", bg: "#ecfeff", label: "دفع" },
    welcome: { icon: Bell, color: "#059669", bg: "#ecfdf5", label: "ترحيب" },
    account_status: { icon: ShieldAlert, color: "#d97706", bg: "#fffbeb", label: "حالة الحساب" },
    test: { icon: Bell, color: "#6b7280", bg: "#f3f4f6", label: "اختبار" },
    handover: { icon: ArrowRightLeft, color: "#d97706", bg: "#fffbeb", label: "تحويل محادثة" },
    login: { icon: LogIn, color: "#059669", bg: "#ecfdf5", label: "تسجيل دخول" },
    mention: { icon: AtSign, color: "#e11d48", bg: "#fff1f2", label: "منشن" },
}

function getTypeConfig(type?: string | null) {
    if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type]
    return { icon: Bell, color: "#6b7280", bg: "#f3f4f6", label: "إشعار" }
}

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return "الآن"
    if (diff < 3600) return `${Math.floor(diff / 60)}د`
    if (diff < 86400) return `${Math.floor(diff / 3600)}س`
    if (diff < 604800) return `${Math.floor(diff / 86400)} يوم`
    return new Date(dateStr).toLocaleDateString("ar-SA")
}

function formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("ar-SA", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    })
}

/* ── Detail View ── */
function NotificationDetail({
    notification,
    onBack,
    onMarkAsRead,
}: {
    notification: NotificationItem
    onBack: () => void
    onMarkAsRead: (id: string) => void
}) {
    useEffect(() => {
        if (!notification.is_read) onMarkAsRead(notification.id)
    }, [notification.id])

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Back bar */}
            <button
                onClick={onBack}
                style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 14px",
                    background: "none", border: "none",
                    borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                    cursor: "pointer", color: "var(--t-primary, #2563eb)",
                    fontSize: 12, fontWeight: 600,
                    transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7" }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
            >
                <ArrowRight size={13} />
                العودة للإشعارات
            </button>

            {/* Detail body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
                {/* Title */}
                <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: "var(--t-text, #111827)",
                    marginBottom: 10, lineHeight: 1.5,
                }}>
                    {notification.title}
                </div>

                {/* Full body */}
                <div style={{
                    fontSize: 13, color: "var(--t-text-secondary, #374151)",
                    lineHeight: 1.75,
                }}>
                    {notification.body}
                </div>

                {/* Timestamp only */}
                <div style={{ marginTop: 16, fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>
                    {formatFullDate(notification.created_at)}
                </div>
            </div>
        </div>
    )
}

/* ── Main Panel ── */
interface NotificationPanelProps {
    notifications: NotificationItem[]
    loading: boolean
    unreadCount: number
    onMarkAsRead: (id: string) => void
    onMarkAllAsRead: () => void
    onClose: () => void
}

export default function NotificationPanel({
    notifications,
    loading,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
}: NotificationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [selected, setSelected] = useState<NotificationItem | null>(null)
    const navigate = useNavigate()

    /* Handle notification click — navigate or show detail */
    const handleNotificationClick = (n: NotificationItem) => {
        const type = n.data?.type
        const customerId = n.data?.customer_id

        // Mark as read
        if (!n.is_read) onMarkAsRead(n.id)

        // Navigate to conversation for message/handover types
        if ((type === "message" || type === "handover" || type === "mention") && customerId) {
            onClose()
            navigate(`/dashboard/inbox/${customerId}`)
            return
        }

        // Otherwise show detail view
        setSelected(n)
    }

    /* Close on outside click */
    useEffect(() => {
        const timer = setTimeout(() => {
            function handle(e: MouseEvent) {
                if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
            }
            document.addEventListener("mousedown", handle)
            return () => document.removeEventListener("mousedown", handle)
        }, 50)
        return () => clearTimeout(timer)
    }, [onClose])

    /* Close on Escape */
    useEffect(() => {
        function handle(e: KeyboardEvent) {
            if (e.key === "Escape") {
                if (selected) setSelected(null)
                else onClose()
            }
        }
        document.addEventListener("keydown", handle)
        return () => document.removeEventListener("keydown", handle)
    }, [onClose, selected])

    return createPortal(
        <div
            ref={panelRef}
            dir="rtl"
            style={{
                position: "fixed",
                top: 56,
                left: 72,
                width: "min(360px, calc(100vw - 24px))",
                maxHeight: "min(500px, calc(100vh - 72px))",
                borderRadius: 14,
                background: "var(--t-card, #fff)",
                border: "1px solid var(--t-border-light, #e5e7eb)",
                boxShadow: "0 16px 48px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)",
                zIndex: 9998,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "npIn .18s cubic-bezier(0.16,1,0.3,1)",
            }}
        >
            {/* ── Header ── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px 9px",
                borderBottom: "1px solid var(--t-border-light, #f0f0f0)",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, #111827)" }}>
                        الإشعارات
                    </span>
                    {unreadCount > 0 && (
                        <span style={{
                            fontSize: 10, fontWeight: 800,
                            color: "#fff", background: "#ef4444",
                            borderRadius: 8, padding: "0px 6px", minWidth: 16,
                            textAlign: "center", lineHeight: "16px",
                        }}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {unreadCount > 0 && !selected && (
                        <button onClick={onMarkAllAsRead} style={{
                            display: "flex", alignItems: "center", gap: 3,
                            background: "none", border: "none", cursor: "pointer",
                            color: "var(--t-primary, #2563eb)", fontSize: 11, fontWeight: 600,
                            padding: "3px 7px", borderRadius: 7, transition: "background 0.15s",
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface, #f3f4f6)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
                        >
                            <CheckCheck size={12} /> قراءة الكل
                        </button>
                    )}
                    <button onClick={onClose} style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--t-text-faint, #9ca3af)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--t-surface, #f3f4f6)"; e.currentTarget.style.color = "#111" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--t-text-faint, #9ca3af)" }}
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* ── Detail view or List ── */}
            {selected ? (
                <NotificationDetail
                    notification={selected}
                    onBack={() => setSelected(null)}
                    onMarkAsRead={onMarkAsRead}
                />
            ) : (
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 20px", gap: 8 }}>
                            <div style={{
                                width: 20, height: 20,
                                border: "2px solid var(--t-border-light, #e5e7eb)",
                                borderTopColor: "var(--t-primary, #2563eb)",
                                borderRadius: "50%", animation: "spin .6s linear infinite",
                            }} />
                            <span style={{ fontSize: 12, color: "var(--t-text-faint, #9ca3af)" }}>جاري التحميل...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--t-surface, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <BellOff size={22} style={{ color: "var(--t-text-faint, #d1d5db)" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)" }}>لا توجد إشعارات</span>
                            <span style={{ fontSize: 11, color: "var(--t-text-faint, #9ca3af)" }}>ستظهر إشعاراتك هنا</span>
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const cfg = getTypeConfig(n.data?.type)
                            const Icon = cfg.icon
                            return (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        display: "flex", gap: 10,
                                        width: "100%", padding: "9px 14px",
                                        border: "none",
                                        borderBottom: "1px solid var(--t-border-light, #f5f5f5)",
                                        background: n.is_read ? "transparent" : "rgba(37,99,235,0.035)",
                                        cursor: "pointer", transition: "background 0.1s",
                                        textAlign: "right", color: "inherit",
                                        alignItems: "flex-start",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = n.is_read ? "var(--t-card-hover, #fafafa)" : "rgba(37,99,235,0.07)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(37,99,235,0.035)" }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10,
                                        background: cfg.bg, flexShrink: 0,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Icon size={14} strokeWidth={1.8} style={{ color: cfg.color }} />
                                    </div>

                                    {/* Text */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                                            <span style={{
                                                fontSize: 11, fontWeight: n.is_read ? 400 : 700,
                                                color: "var(--t-text, #111827)",
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                flex: 1,
                                            }}>
                                                {n.title}
                                            </span>
                                            <span style={{ fontSize: 10, color: "var(--t-text-faint, #9ca3af)", flexShrink: 0 }}>
                                                {timeAgo(n.created_at)}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: 11, color: "var(--t-text-faint, #6b7280)",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {n.body}
                                        </div>
                                    </div>

                                    {/* Indicators */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginTop: 6 }}>
                                        {!n.is_read && (
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
                                        )}
                                        <ChevronRight size={12} style={{ color: "var(--t-text-faint, #9ca3af)" }} />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            )}

            <style>{`
                @keyframes npIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>,
        document.body
    )
}
