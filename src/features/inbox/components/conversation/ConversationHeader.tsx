import { useState } from "react"
import { CheckCircle, RotateCcw, PanelRightOpen, X } from "lucide-react"
import { Avatar } from "../ui/Avatar"
import { StatusBadge } from "../ui/StatusBadge"
import type { Customer } from "../../types/inbox.types"
import { useConversationStore } from "../../store/conversation.store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { closeConversation, reopenConversation } from "../../services/inbox-service"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

interface Props { customer: Customer }

export function ConversationHeader({ customer: c }: Props) {
    const { toggleDetails, detailsOpen } = useConversationStore()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const [showCloseModal, setShowCloseModal] = useState(false)

    const isClosed = c.conversation_status?.is_closed ?? false
    const isOpen = !isClosed

    const closeMutation = useMutation({
        mutationFn: (p: { reason: string; category: string }) =>
            closeConversation(c.customer_id, { ...p, lang: "ar" }),
        onSuccess: () => {
            toast.success("تم إغلاق المحادثة")
            queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
            queryClient.invalidateQueries({ queryKey: ["inbox-summary"] })
            setShowCloseModal(false)
        },
        onError: (e: any) => {
            toast.error(e?.response?.status === 423 ? "المحادثة مغلقة مسبقاً" : "فشل إغلاق المحادثة")
        },
    })

    const reopenMutation = useMutation({
        mutationFn: () => reopenConversation(c.customer_id, {
            user_id: user?.id ?? c.assigned?.assigned_to ?? "",
        }),
        onSuccess: () => {
            toast.success("تم إعادة فتح المحادثة")
            queryClient.invalidateQueries({ queryKey: ["inbox-customers"] })
            queryClient.invalidateQueries({ queryKey: ["inbox-summary"] })
        },
        onError: () => toast.error("فشل إعادة فتح المحادثة"),
    })

    const displayName = c.sender_name?.trim() || c.customer_id

    return (
        <>
            <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", background: "var(--t-card)",
                borderBottom: "1px solid var(--t-border-light)", flexShrink: 0,
            }}>
                {c.profile_photo ? (
                    <img src={c.profile_photo} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.display = "none" }} />
                ) : (
                    <Avatar name={displayName} size={36} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 2 }}>{displayName}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusBadge status={c.session_status} />
                        {c.platform && (
                            <span style={{ fontSize: 11, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 3 }}>
                                {c.platform_icon && <img src={c.platform_icon} alt="" style={{ width: 12, height: 12 }} />}
                                {c.platform}
                            </span>
                        )}
                        {c.lifecycle?.name && (
                            <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>
                                {c.lifecycle.icon && `${c.lifecycle.icon} `}{c.lifecycle.name}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isOpen ? (
                        <button style={{ ...iconBtn, color: "#059669" }} title="إغلاق المحادثة"
                            onClick={() => setShowCloseModal(true)}>
                            <CheckCircle size={16} />
                        </button>
                    ) : (
                        <button style={{ ...iconBtn, color: "#3b82f6" }} title="إعادة فتح"
                            onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending}>
                            <RotateCcw size={16} />
                        </button>
                    )}
                    <button onClick={toggleDetails}
                        style={{ ...iconBtn, background: detailsOpen ? "var(--t-surface)" : "transparent" }}
                        title="التفاصيل">
                        <PanelRightOpen size={16} />
                    </button>
                </div>
            </div>

            {showCloseModal && (
                <CloseModal isPending={closeMutation.isPending}
                    onClose={() => setShowCloseModal(false)}
                    onSubmit={(r, cat) => closeMutation.mutate({ reason: r, category: cat })} />
            )}
        </>
    )
}

const REASONS = [
    { value: "resolved", label: "تم الحل" },
    { value: "no_response", label: "لا يوجد رد" },
    { value: "wrong_number", label: "رقم خاطئ" },
    { value: "spam", label: "بريد مزعج" },
    { value: "other", label: "أخرى" },
]

function CloseModal({ onClose, onSubmit, isPending }: {
    onClose: () => void; onSubmit: (r: string, c: string) => void; isPending: boolean
}) {
    const [reason, setReason] = useState("resolved")
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: "var(--t-card)", borderRadius: 12, padding: "20px 22px", width: 320,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid var(--t-border-light)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", margin: 0 }}>إغلاق المحادثة</h3>
                    <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--t-text-faint)" }}><X size={16} /></button>
                </div>
                <label style={{ fontSize: 12, color: "var(--t-text-secondary)", display: "block", marginBottom: 6 }}>سبب الإغلاق</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid var(--t-border-light)", background: "var(--t-surface)",
                    color: "var(--t-text)", fontSize: 13, outline: "none", marginBottom: 16,
                }}>
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 12, cursor: "pointer" }}>إلغاء</button>
                    <button onClick={() => onSubmit(reason, reason)} disabled={isPending} style={{
                        flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                        background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700,
                        cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1,
                    }}>{isPending ? "جاري..." : "إغلاق"}</button>
                </div>
            </div>
        </div>
    )
}

const iconBtn: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid var(--t-border-light)", background: "transparent",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--t-text-muted)", transition: "background 0.12s", flexShrink: 0,
}
