import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
    X,
    Monitor,
    Smartphone,
    Globe,
    Clock,
    Shield,
    Loader2,
    Trash2,
    CheckSquare,
    Square,
    ChevronDown,
    ChevronUp,
    Wifi,
    LogOut,
    AlertTriangle,
} from "lucide-react"
import {
    getUserSessions,
    getSessionInfo,
    getMe,
    revokeSession,
    revokeMultipleSessions,
    revokeAllSessionsForUser,
} from "../services/users-service"
import { useAuthStore } from "@/stores/auth-store"
import type { AdminUser, SessionInfo } from "../types"

interface UserSessionsDialogProps {
    open: boolean
    user: AdminUser | null
    onClose: () => void
}

/** Guess device type from user_agent string */
function guessDevice(ua?: string): "mobile" | "desktop" {
    if (!ua) return "desktop"
    const lower = ua.toLowerCase()
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) return "mobile"
    return "desktop"
}

/** Format datetime to readable Arabic */
function formatDate(iso?: string): string {
    if (!iso) return "—"
    try {
        return new Intl.DateTimeFormat("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Aden",
        }).format(new Date(iso))
    } catch {
        return iso
    }
}

/** Simple relative time */
function relativeTime(iso?: string): string {
    if (!iso) return ""
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "الآن"
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    return `منذ ${days} يوم`
}

export function UserSessionsDialog({ open, user, onClose }: UserSessionsDialogProps) {
    const { user: currentUser } = useAuthStore()
    const tenantId = currentUser?.tenant_id || ""

    const [sessions, setSessions] = useState<SessionInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Selection state
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Expanded session details
    const [expanded, setExpanded] = useState<string | null>(null)
    const [expandedDetail, setExpandedDetail] = useState<SessionInfo | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)

    // Action loading
    const [revoking, setRevoking] = useState<string | null>(null) // single revoke
    const [bulkRevoking, setBulkRevoking] = useState(false)

    // Current session handle from /admin/me
    const [currentSessionHandle, setCurrentSessionHandle] = useState<string | null>(null)

    const fetchSessions = useCallback(async () => {
        if (!user || !tenantId) return
        setLoading(true)
        setError(null)
        setSelected(new Set())
        setExpanded(null)
        setExpandedDetail(null)
        try {
            // Fetch sessions and current user info in parallel
            const [sessionsResult, meResult] = await Promise.all([
                getUserSessions(user.user_id, tenantId),
                getMe(tenantId).catch(() => null),
            ])

            if (sessionsResult.success) {
                setSessions(sessionsResult.data?.sessions ?? [])
            } else {
                setError(sessionsResult.message || "فشل جلب الجلسات")
            }

            // Extract current session handle from /admin/me
            if (meResult?.success && meResult.data?.session?.session_handle) {
                setCurrentSessionHandle(meResult.data.session.session_handle)
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            setError(e.response?.data?.message || "حدث خطأ أثناء جلب الجلسات")
        } finally {
            setLoading(false)
        }
    }, [user, tenantId])

    useEffect(() => {
        if (open && user) fetchSessions()
    }, [open, user, fetchSessions])

    // ── Expand session to see details ──
    const handleExpand = async (sessionHandle: string) => {
        if (expanded === sessionHandle) {
            setExpanded(null)
            setExpandedDetail(null)
            return
        }
        setExpanded(sessionHandle)
        setDetailLoading(true)
        try {
            const result = await getSessionInfo(sessionHandle, tenantId)
            if (result.success) {
                setExpandedDetail(result.data?.session ?? null)
            }
        } catch {
            // If getSessionInfo fails, just show what we have from the list
            setExpandedDetail(null)
        } finally {
            setDetailLoading(false)
        }
    }

    // ── Select / deselect ──
    const toggleSelect = (handle: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(handle)) next.delete(handle)
            else next.add(handle)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selected.size === sessions.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(sessions.map((s) => s.session_handle)))
        }
    }

    // ── Revoke single session ──
    const handleRevokeOne = async (handle: string) => {
        setRevoking(handle)
        try {
            const result = await revokeSession({ session_handle: handle }, tenantId)
            if (result.success) {
                toast.success("تم إيقاف الجلسة")
                setSessions((prev) => prev.filter((s) => s.session_handle !== handle))
                setSelected((prev) => {
                    const next = new Set(prev)
                    next.delete(handle)
                    return next
                })
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || "فشل إيقاف الجلسة")
        } finally {
            setRevoking(null)
        }
    }

    // ── Revoke selected sessions ──
    const handleRevokeSelected = async () => {
        if (selected.size === 0) return
        setBulkRevoking(true)
        try {
            const result = await revokeMultipleSessions(
                { session_handles: Array.from(selected) },
                tenantId
            )
            if (result.success) {
                toast.success(`تم إيقاف ${result.data.revoked_count} جلسة`)
                setSessions((prev) => prev.filter((s) => !selected.has(s.session_handle)))
                setSelected(new Set())
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || "فشل إيقاف الجلسات")
        } finally {
            setBulkRevoking(false)
        }
    }

    // ── Revoke ALL sessions ──
    const handleRevokeAll = async () => {
        if (!user) return
        setBulkRevoking(true)
        try {
            const result = await revokeAllSessionsForUser(user.user_id, tenantId)
            if (result.success) {
                toast.success(`تم إيقاف ${result.data.revoked_count} جلسة`)
                setSessions([])
                setSelected(new Set())
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } }
            toast.error(e.response?.data?.message || "فشل إيقاف الجلسات")
        } finally {
            setBulkRevoking(false)
        }
    }

    if (!open || !user) return null

    const displayName = user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
                dir="rtl"
                style={{ animation: "fadeSlideUp 0.3s ease-out", maxHeight: "85vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900">
                            <Monitor size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">جلسات المستخدم</h2>
                            <p className="text-xs text-gray-400">{displayName} — {sessions.length} جلسة نشطة</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                {sessions.length > 0 && (
                    <div className="flex items-center justify-between border-b border-gray-50 px-6 py-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                            >
                                {selected.size === sessions.length ? (
                                    <CheckSquare size={14} className="text-purple-500" />
                                ) : (
                                    <Square size={14} />
                                )}
                                {selected.size === sessions.length ? "إلغاء التحديد" : "تحديد الكل"}
                            </button>
                            {selected.size > 0 && (
                                <span className="text-xs text-gray-400">
                                    {selected.size} محدد
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {selected.size > 0 && (
                                <button
                                    onClick={handleRevokeSelected}
                                    disabled={bulkRevoking}
                                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                                >
                                    {bulkRevoking ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    إيقاف المحدد ({selected.size})
                                </button>
                            )}
                            <button
                                onClick={handleRevokeAll}
                                disabled={bulkRevoking || sessions.length === 0}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-50 disabled:opacity-50"
                            >
                                {bulkRevoking && selected.size === 0 ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                                إيقاف الكل
                            </button>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 size={32} className="animate-spin text-purple-400" />
                            <p className="mt-3 text-sm text-gray-400">جاري جلب الجلسات...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertTriangle size={32} className="text-red-400" />
                            <p className="mt-3 text-sm text-red-500">{error}</p>
                            <button onClick={fetchSessions} className="mt-2 text-xs text-purple-500 hover:underline">
                                إعادة المحاولة
                            </button>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Shield size={32} className="text-gray-300" />
                            <p className="mt-3 text-sm text-gray-400">لا توجد جلسات نشطة</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[...sessions].sort((a, b) => {
                                const aCurrent = a.session_handle === currentSessionHandle || a.is_current ? 1 : 0
                                const bCurrent = b.session_handle === currentSessionHandle || b.is_current ? 1 : 0
                                return bCurrent - aCurrent
                            }).map((session) => {
                                const isExpanded = expanded === session.session_handle
                                const isCurrent = session.session_handle === currentSessionHandle || session.is_current === true
                                const device = guessDevice(session.device_info?.user_agent || session.device)
                                const DeviceIcon = device === "mobile" ? Smartphone : Monitor

                                return (
                                    <div
                                        key={session.session_handle}
                                        className={`rounded-xl border-2 transition-all ${isCurrent
                                            ? "border-purple-400 bg-gray-50 "
                                            : "border-gray-100 bg-white hover:border-gray-200"
                                            }`}
                                        style={isCurrent ? { animation: "currentSessionGlow 3s ease-in-out infinite alternate" } : undefined}
                                    >
                                        {/* Session row */}
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleSelect(session.session_handle)}
                                                className="shrink-0 text-gray-400 hover:text-purple-500"
                                            >
                                                {selected.has(session.session_handle) ? (
                                                    <CheckSquare size={16} className="text-purple-500" />
                                                ) : (
                                                    <Square size={16} />
                                                )}
                                            </button>

                                            {/* Device icon */}
                                            <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isCurrent
                                                ? "bg-gray-900 text-white "
                                                : "bg-gray-100 text-gray-400"
                                                }`}>
                                                <DeviceIcon size={18} />
                                                {isCurrent && (
                                                    <span className="absolute -top-1 -left-1 flex h-3.5 w-3.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-gray-700">
                                                        {session.device || session.device_info?.user_agent?.substring(0, 40) || "جهاز غير معروف"}
                                                    </p>
                                                    {isCurrent && (
                                                        <span className="shrink-0 rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                            ● الجلسة الحالية
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
                                                    {(session.ip_address || session.device_info?.ip_address) && (
                                                        <span className="flex items-center gap-1">
                                                            <Globe size={10} />
                                                            {session.ip_address || session.device_info?.ip_address}
                                                        </span>
                                                    )}
                                                    {session.last_accessed && (
                                                        <span className="flex items-center gap-1">
                                                            <Wifi size={10} />
                                                            {relativeTime(session.last_accessed)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1">
                                                {/* Expand */}
                                                <button
                                                    onClick={() => handleExpand(session.session_handle)}
                                                    className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                                                    title="عرض التفاصيل"
                                                >
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                                {/* Revoke single */}
                                                <button
                                                    onClick={() => handleRevokeOne(session.session_handle)}
                                                    disabled={revoking === session.session_handle}
                                                    className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                                    title="إيقاف الجلسة"
                                                >
                                                    {revoking === session.session_handle ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <X size={14} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded detail */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 px-4 py-3">
                                                {detailLoading ? (
                                                    <div className="flex items-center gap-2 py-2">
                                                        <Loader2 size={14} className="animate-spin text-gray-400" />
                                                        <span className="text-xs text-gray-400">جاري تحميل التفاصيل...</span>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="font-medium text-gray-500">معرف الجلسة</span>
                                                                <p className="mt-0.5 truncate font-mono text-gray-700" dir="ltr">
                                                                    {session.session_handle}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">تاريخ الإنشاء</span>
                                                                <p className="mt-0.5 flex items-center gap-1 text-gray-700">
                                                                    <Clock size={10} />
                                                                    {formatDate(session.created_at || expandedDetail?.created_at)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">تاريخ الانتهاء</span>
                                                                <p className="mt-0.5 flex items-center gap-1 text-gray-700">
                                                                    <Clock size={10} />
                                                                    {formatDate(session.expires_at || expandedDetail?.expires_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <span className="font-medium text-gray-500">آخر نشاط</span>
                                                                <p className="mt-0.5 text-gray-700">
                                                                    {formatDate(session.last_accessed || expandedDetail?.last_accessed)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">عنوان IP</span>
                                                                <p className="mt-0.5 font-mono text-gray-700" dir="ltr">
                                                                    {session.ip_address || session.device_info?.ip_address || expandedDetail?.device_info?.ip_address || "—"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-500">متصفح / جهاز</span>
                                                                <p className="mt-0.5 truncate text-gray-700" dir="ltr">
                                                                    {session.device_info?.user_agent || expandedDetail?.device_info?.user_agent || session.device || "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-3">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                        إغلاق
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes currentSessionGlow {
                    from { box-shadow: 0 4px 14px -2px rgba(147, 51, 234, 0.15); }
                    to   { box-shadow: 0 4px 20px -2px rgba(147, 51, 234, 0.30); }
                }
            `}</style>
        </div>
    )
}
