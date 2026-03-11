import { useRef, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
    Bell, BellOff, CheckCheck, X, ChevronRight, ChevronDown,
    MessageSquare, ShieldAlert, Package, Megaphone,
    Clock, ClipboardList, Zap, ShoppingCart, ArrowRight,
    LogIn, ArrowRightLeft, AtSign, ExternalLink, Loader2, Info,
} from "lucide-react"
import type { NotificationItem } from "../services/notification-service"

/* ── Type → visual config ── */
const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
    message: { icon: MessageSquare, color: "#2563eb", bg: "#eff6ff", label: "رسالة" },
    order_created: { icon: ShoppingCart, color: "#059669", bg: "#ecfdf5", label: "طلب جديد" },
    order_updated: { icon: Package, color: "#d97706", bg: "#fffbeb", label: "تحديث طلب" },
    security_alert: { icon: ShieldAlert, color: "var(--t-danger)", bg: "#fef2f2", label: "تنبيه أمني" },
    system_update: { icon: Zap, color: "#7c3aed", bg: "#f5f3ff", label: "تحديث النظام" },
    announcement: { icon: Megaphone, color: "#0891b2", bg: "#ecfeff", label: "إعلان" },
    reminder: { icon: Clock, color: "#ea580c", bg: "#fff7ed", label: "تذكير" },
    assignment: { icon: ClipboardList, color: "#4f46e5", bg: "#eef2ff", label: "تعيين" },
    team_assignment: { icon: ClipboardList, color: "#7c3aed", bg: "#f5f3ff", label: "تعيين فريق" },
    conversation_closed: { icon: MessageSquare, color: "var(--t-text-muted)", bg: "var(--t-surface)", label: "إغلاق محادثة" },
    conversation_reopened: { icon: MessageSquare, color: "#059669", bg: "#ecfdf5", label: "إعادة فتح" },
    payment: { icon: ShoppingCart, color: "#0891b2", bg: "#ecfeff", label: "دفع" },
    welcome: { icon: Bell, color: "#059669", bg: "#ecfdf5", label: "ترحيب" },
    account_status: { icon: ShieldAlert, color: "#d97706", bg: "#fffbeb", label: "حالة الحساب" },
    test: { icon: Bell, color: "var(--t-text-muted)", bg: "var(--t-surface)", label: "اختبار" },
    handover: { icon: ArrowRightLeft, color: "#d97706", bg: "#fffbeb", label: "تحويل محادثة" },
    login: { icon: LogIn, color: "#059669", bg: "#ecfdf5", label: "تسجيل دخول" },
    mention: { icon: AtSign, color: "#e11d48", bg: "#fff1f2", label: "منشن" },
}

function getTypeConfig(type?: string | null) {
    if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type]
    return { icon: Bell, color: "var(--t-text-muted)", bg: "var(--t-surface)", label: "إشعار" }
}

/* ── Human-readable data key labels ── */
const DATA_LABELS: Record<string, string> = {
    customer_id: "معرّف العميل",
    account_id: "معرّف الحساب",
    platform: "المنصة",
    agent_name: "اسم الموظف",
    team_name: "اسم الفريق",
    reason: "السبب",
    device: "الجهاز",
    ip_address: "عنوان IP",
    browser: "المتصفح",
    location: "الموقع",
    order_id: "رقم الطلب",
    amount: "المبلغ",
    status: "الحالة",
    sender_name: "اسم المرسل",
    message_preview: "معاينة الرسالة",
}

function getDataLabel(key: string): string {
    return DATA_LABELS[key] || key.replace(/_/g, " ")
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

/* ═══════════════════════════════════════════════════════════
   Enhanced Detail View
═══════════════════════════════════════════════════════════ */
function NotificationDetail({
    notification: n,
    onBack,
    onMarkAsRead,
    onNavigate,
}: {
    notification: NotificationItem
    onBack: () => void
    onMarkAsRead: (id: string) => void
    onNavigate: (customerId: string, accountId?: string) => void
}) {
    useEffect(() => {
        if (!n.is_read) onMarkAsRead(n.id)
    }, [n.id])

    const cfg = getTypeConfig(n.data?.type)
    const Icon = cfg.icon
    const customerId = n.data?.customer_id
    const accountId = n.data?.account_id
    const canNavigate = !!customerId

    // Extract all data fields (excluding "type" which is shown as badge)
    const dataEntries = Object.entries(n.data ?? {}).filter(
        ([key, val]) => key !== "type" && val != null && val !== ""
    )

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Back bar */}
            <button
                onClick={onBack}
                className="np-back-btn"
            >
                <ArrowRight size={13} />
                العودة للإشعارات
            </button>

            {/* Detail body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
                {/* Type badge + status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div className="np-detail-icon" style={{ background: cfg.bg }}>
                        <Icon size={16} strokeWidth={1.8} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span className="np-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                        </span>
                    </div>
                    <span className="np-read-badge" data-read={n.is_read}>
                        {n.is_read ? "مقروء" : "غير مقروء"}
                    </span>
                </div>

                {/* Title */}
                <h3 className="np-detail-title">{n.title}</h3>

                {/* Full body */}
                <p className="np-detail-body">{n.body}</p>

                {/* Data Fields */}
                {dataEntries.length > 0 && (
                    <div className="np-data-section">
                        <div className="np-data-header">
                            <Info size={11} />
                            <span>التفاصيل</span>
                        </div>
                        {dataEntries.map(([key, val]) => (
                            <div className="np-data-row" key={key}>
                                <span className="np-data-label">{getDataLabel(key)}</span>
                                <span className="np-data-value" dir="ltr">{val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <div className="np-detail-time">
                    <Clock size={11} />
                    {formatFullDate(n.created_at)}
                </div>

                {/* Navigation button */}
                {canNavigate && (
                    <button
                        className="np-nav-btn"
                        onClick={() => onNavigate(customerId!, accountId)}
                    >
                        <ExternalLink size={14} />
                        فتح المحادثة
                    </button>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════
   Main Panel
═══════════════════════════════════════════════════════════ */
interface NotificationPanelProps {
    notifications: NotificationItem[]
    loading: boolean
    unreadCount: number
    totalCount: number
    hasMore: boolean
    loadingMore: boolean
    onLoadMore: () => void
    onMarkAsRead: (id: string) => void
    onMarkAllAsRead: () => void
    onClose: () => void
}

export default function NotificationPanel({
    notifications,
    loading,
    unreadCount,
    totalCount,
    hasMore,
    loadingMore,
    onLoadMore,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
}: NotificationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [selected, setSelected] = useState<NotificationItem | null>(null)
    const navigate = useNavigate()

    /* Handle navigation from detail view */
    const handleNavigate = (customerId: string, accountId?: string) => {
        onClose()
        const accParam = accountId ? `?acc=${accountId}` : ""
        navigate(`/dashboard/inbox/${customerId}${accParam}`)
    }

    /* Handle notification click — always show detail */
    const handleNotificationClick = (n: NotificationItem) => {
        if (!n.is_read) onMarkAsRead(n.id)
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
            className="np-container"
        >
            {/* ── Header ── */}
            <div className="np-header">
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="np-header-title">الإشعارات</span>
                    {unreadCount > 0 && (
                        <span className="np-unread-badge">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                    {totalCount > 0 && (
                        <span className="np-total-label">{totalCount} إشعار</span>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {unreadCount > 0 && !selected && (
                        <button onClick={onMarkAllAsRead} className="np-mark-all-btn">
                            <CheckCheck size={12} /> قراءة الكل
                        </button>
                    )}
                    <button onClick={onClose} className="np-close-btn">
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
                    onNavigate={handleNavigate}
                />
            ) : (
                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loading ? (
                        <div className="np-empty-state">
                            <div className="np-spinner" />
                            <span style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))" }}>جاري التحميل...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="np-empty-state">
                            <div className="np-empty-icon">
                                <BellOff size={22} style={{ color: "var(--t-text-faint, var(--t-border-medium))" }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))" }}>لا توجد إشعارات</span>
                            <span style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))" }}>ستظهر إشعاراتك هنا</span>
                        </div>
                    ) : (
                        <>
                            {notifications.map((n) => {
                                const cfg = getTypeConfig(n.data?.type)
                                const Icon = cfg.icon
                                const hasCustomerId = !!n.data?.customer_id
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className="np-item"
                                        data-unread={!n.is_read}
                                    >
                                        {/* Icon */}
                                        <div className="np-item-icon" style={{ background: cfg.bg }}>
                                            <Icon size={14} strokeWidth={1.8} style={{ color: cfg.color }} />
                                        </div>

                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                                <span className="np-item-title" data-unread={!n.is_read}>
                                                    {n.title}
                                                </span>
                                                <span className="np-item-time">
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                            <div className="np-item-body">
                                                {n.body}
                                            </div>
                                            {/* Type + navigation hint */}
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                                                <span className="np-item-type-tag" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                                {hasCustomerId && (
                                                    <span className="np-item-nav-hint">
                                                        <ExternalLink size={9} /> محادثة
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Indicators */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginTop: 4 }}>
                                            {!n.is_read && <div className="np-unread-dot" />}
                                            <ChevronRight size={12} style={{ color: "var(--t-text-faint, #c4c8cf)" }} />
                                        </div>
                                    </button>
                                )
                            })}

                            {/* Load More */}
                            {hasMore && (
                                <div className="np-load-more-wrap">
                                    <button
                                        className="np-load-more-btn"
                                        onClick={onLoadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 size={13} className="np-spin" />
                                                جاري التحميل...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown size={13} />
                                                تحميل المزيد
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <style>{`
                /* ── Container ── */
                .np-container {
                    position: fixed; top: 56px; left: 72px;
                    width: min(380px, calc(100vw - 24px));
                    max-height: min(560px, calc(100vh - 72px));
                    border-radius: 16px;
                    background: var(--t-card, #fff);
                    border: 1px solid var(--t-border-light, var(--t-border));
                    box-shadow: 0 20px 56px -8px rgba(0,0,0,0.2), 0 6px 20px -6px rgba(0,0,0,0.1);
                    z-index: 9998; overflow: hidden;
                    display: flex; flex-direction: column;
                    animation: npIn .18s cubic-bezier(0.16,1,0.3,1);
                }

                /* ── Header ── */
                .np-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 11px 14px 10px;
                    border-bottom: 1px solid var(--t-border-light, #f0f0f0);
                    flex-shrink: 0;
                }
                .np-header-title { font-size: 13.5px; font-weight: 800; color: var(--t-text, var(--t-text)); }
                .np-unread-badge {
                    font-size: 10px; font-weight: 800; color: #fff;
                    background: linear-gradient(135deg, var(--t-danger), var(--t-danger));
                    border-radius: 8px; padding: 0px 6px; min-width: 16px;
                    text-align: center; line-height: 17px;
                }
                .np-total-label {
                    font-size: 10px; color: var(--t-text-faint, var(--t-text-faint));
                    font-weight: 500;
                }
                .np-mark-all-btn {
                    display: flex; align-items: center; gap: 3;
                    background: none; border: none; cursor: pointer;
                    color: var(--t-primary, var(--t-accent-secondary)); font-size: 11px; font-weight: 600;
                    padding: 4px 8px; border-radius: 7px; transition: background 0.15s;
                    font-family: inherit;
                }
                .np-mark-all-btn:hover { background: var(--t-surface, var(--t-surface)); }
                .np-close-btn {
                    width: 28px; height: 28px; border-radius: 8px;
                    background: none; border: none; cursor: pointer;
                    color: var(--t-text-faint, var(--t-text-faint));
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                }
                .np-close-btn:hover { background: var(--t-surface, var(--t-surface)); color: var(--t-text, #111); }

                /* ── List items ── */
                .np-item {
                    display: flex; gap: 10px; width: 100%; padding: 10px 14px;
                    border: none; border-bottom: 1px solid var(--t-border-light, #f5f5f5);
                    background: transparent; cursor: pointer; transition: background 0.1s;
                    text-align: right; color: inherit; align-items: flex-start;
                    font-family: inherit;
                }
                .np-item[data-unread="true"] { background: rgba(0,114,181,0.035); }
                .np-item:hover { background: var(--t-surface, var(--t-accent-muted)); }
                .np-item[data-unread="true"]:hover { background: rgba(0,114,181,0.07); }

                .np-item-icon {
                    width: 34px; height: 34px; border-radius: 10px;
                    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
                }
                .np-item-title {
                    font-size: 11.5px; font-weight: 500;
                    color: var(--t-text, var(--t-text));
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
                }
                .np-item-title[data-unread="true"] { font-weight: 700; }
                .np-item-time {
                    font-size: 10px; color: var(--t-text-faint, var(--t-text-faint)); flex-shrink: 0;
                }
                .np-item-body {
                    font-size: 11px; color: var(--t-text-faint, var(--t-text-muted));
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                }
                .np-item-type-tag {
                    font-size: 9px; font-weight: 700; padding: 1px 6px;
                    border-radius: 5px; white-space: nowrap;
                }
                .np-item-nav-hint {
                    font-size: 9px; color: var(--t-primary, var(--t-accent-secondary));
                    display: inline-flex; align-items: center; gap: 2;
                    font-weight: 600; opacity: 0.7;
                }
                .np-unread-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: var(--t-gradient-accent);
                    box-shadow: 0 0 6px rgba(0,114,181,0.4);
                }

                /* ── Load more ── */
                .np-load-more-wrap {
                    padding: 8px 14px 12px; display: flex; justify-content: center;
                }
                .np-load-more-btn {
                    display: flex; align-items: center; gap: 5;
                    padding: 7px 18px; border-radius: 8px;
                    border: 1px solid var(--t-border, var(--t-border));
                    background: var(--t-surface, var(--t-page));
                    color: var(--t-text-secondary, #4b5563);
                    font-size: 11.5px; font-weight: 600; cursor: pointer;
                    transition: all 0.15s; font-family: inherit;
                }
                .np-load-more-btn:hover:not(:disabled) {
                    background: var(--t-card, #fff);
                    border-color: var(--t-primary, var(--t-accent-secondary));
                    color: var(--t-primary, var(--t-accent-secondary));
                    box-shadow: 0 2px 8px rgba(0,114,181,0.1);
                }
                .np-load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                /* ── Detail view ── */
                .np-back-btn {
                    display: flex; align-items: center; gap: 6;
                    padding: 10px 14px; background: none; border: none;
                    border-bottom: 1px solid var(--t-border-light, #f0f0f0);
                    cursor: pointer; color: var(--t-primary, var(--t-accent-secondary));
                    font-size: 12px; font-weight: 600; transition: all 0.15s;
                    font-family: inherit; flex-shrink: 0;
                }
                .np-back-btn:hover { background: var(--t-surface, var(--t-page)); }

                .np-detail-icon {
                    width: 40px; height: 40px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .np-type-badge {
                    display: inline-flex; align-items: center; gap: 4;
                    font-size: 10.5px; font-weight: 700; padding: 3px 10px;
                    border-radius: 7px;
                }
                .np-read-badge {
                    font-size: 9px; font-weight: 700; padding: 2px 8px;
                    border-radius: 6px;
                }
                .np-read-badge[data-read="true"] {
                    background: var(--t-surface, var(--t-surface));
                    color: var(--t-text-faint, var(--t-text-faint));
                }
                .np-read-badge[data-read="false"] {
                    background: rgba(0,114,181,0.1);
                    color: var(--t-accent-secondary);
                }

                .np-detail-title {
                    font-size: 14.5px; font-weight: 800; color: var(--t-text, var(--t-text));
                    margin: 0 0 8px; line-height: 1.5; letter-spacing: -0.01em;
                }
                .np-detail-body {
                    font-size: 13px; color: var(--t-text-secondary, var(--t-text-secondary));
                    line-height: 1.8; margin: 0 0 16px; white-space: pre-wrap;
                }

                /* ── Data section ── */
                .np-data-section {
                    background: var(--t-surface, var(--t-page));
                    border: 1px solid var(--t-border-light, #f0f0f0);
                    border-radius: 10px; padding: 10px 12px;
                    margin-bottom: 14px;
                }
                .np-data-header {
                    display: flex; align-items: center; gap: 5;
                    font-size: 10px; font-weight: 700; color: var(--t-text-faint, var(--t-text-faint));
                    text-transform: uppercase; letter-spacing: 0.04em;
                    margin-bottom: 8px; padding-bottom: 6px;
                    border-bottom: 1px solid var(--t-border-light, var(--t-border));
                }
                .np-data-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 4px 0; gap: 8;
                }
                .np-data-row + .np-data-row {
                    border-top: 1px solid var(--t-border-light, #f0f0f0);
                    padding-top: 5px;
                }
                .np-data-label {
                    font-size: 11px; font-weight: 600; color: var(--t-text-muted, var(--t-text-muted));
                    flex-shrink: 0;
                }
                .np-data-value {
                    font-size: 11px; font-weight: 500; color: var(--t-text, var(--t-text));
                    text-align: left; overflow: hidden; text-overflow: ellipsis;
                    white-space: nowrap; max-width: 180px;
                    font-family: 'SF Mono', 'Fira Code', monospace;
                }

                .np-detail-time {
                    display: flex; align-items: center; gap: 5;
                    font-size: 11px; color: var(--t-text-faint, var(--t-text-faint));
                    margin-bottom: 16px;
                }

                /* ── Navigation button ── */
                .np-nav-btn {
                    display: flex; align-items: center; justify-content: center; gap: 7;
                    width: 100%; padding: 10px; border-radius: 10px; border: none;
                    background: var(--t-gradient-accent);
                    color: #fff; font-size: 12.5px; font-weight: 700;
                    cursor: pointer; transition: all 0.2s; font-family: inherit;
                    box-shadow: 0 4px 14px rgba(27,80,145,0.25);
                }
                .np-nav-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(27,80,145,0.35);
                }
                .np-nav-btn:active { transform: translateY(0); }

                /* ── Empty / loading ── */
                .np-empty-state {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: 40px 20px; gap: 8;
                }
                .np-empty-icon {
                    width: 48px; height: 48px; border-radius: 14px;
                    background: var(--t-surface, var(--t-surface));
                    display: flex; align-items: center; justify-content: center;
                }
                .np-spinner {
                    width: 22px; height: 22px;
                    border: 2.5px solid var(--t-border-light, var(--t-border));
                    border-top-color: var(--t-primary, var(--t-accent-secondary));
                    border-radius: 50%; animation: npSpin .6s linear infinite;
                }

                /* ── Animations ── */
                @keyframes npIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes npSpin { to { transform: rotate(360deg); } }
                .np-spin { animation: npSpin .8s linear infinite; }
            `}</style>
        </div>,
        document.body
    )
}
