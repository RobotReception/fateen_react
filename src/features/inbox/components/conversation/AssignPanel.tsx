import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import {
    UserCircle, Bot, BotOff, ChevronDown, CheckCircle, X, Search, Users, Tag
} from "lucide-react"
import React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Customer, SidebarLifecycle, SidebarTeam } from "../../types/inbox.types"
import { useAuthStore } from "@/stores/auth-store"
import {
    useCloseConversation, useReopenConversation, useAssignAgent,
    useUpdateLifecycle, useToggleAI, useAssignTeams, useRemoveTeams,
} from "../../hooks/use-customer-actions"
import { useInboxSummary } from "../../hooks/use-inbox-summary"
import { getBriefUsers } from "../../services/inbox-service"

interface Props { customer: Customer }

type DropKey = "assign" | "lifecycle" | "team" | "close"

export function AssignPanel({ customer: c }: Props) {
    const { user } = useAuthStore()
    const { data: summary } = useInboxSummary(user?.id)
    const isClosed = c.conversation_status?.is_closed ?? false

    const closeMut = useCloseConversation(c.customer_id)
    const reopenMut = useReopenConversation(c.customer_id)
    const assignMut = useAssignAgent(c.customer_id)
    const lifecycleMut = useUpdateLifecycle(c.customer_id)
    const aiMut = useToggleAI(c.customer_id)
    const teamMut = useAssignTeams(c.customer_id)
    const unassignTeamMut = useRemoveTeams(c.customer_id)

    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })
    const allUsers = briefData?.users ?? []

    const assignedId = c.assigned?.assigned_to
    const agentName = c.assigned?.assigned_to_username
        || allUsers.find(u => u.user_id === assignedId)?.name
        || ""
    const lifecycles: SidebarLifecycle[] = summary?.lifecycles ?? []
    const teams: SidebarTeam[] = summary?.teams ?? []

    const [openDrop, setOpenDrop] = useState<null | DropKey>(null)
    const [assignSearch, setAssignSearch] = useState("")
    const assignRef = useRef<HTMLButtonElement>(null)
    const lifecycleRef = useRef<HTMLButtonElement>(null)
    const teamRef = useRef<HTMLButtonElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)

    const toggle = useCallback((key: DropKey) => {
        setOpenDrop(prev => prev === key ? null : key)
        if (key === "assign") setAssignSearch("")
    }, [])
    const closeDrop = useCallback(() => { setOpenDrop(null); setAssignSearch("") }, [])

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(assignSearch.toLowerCase())
    )

    return (
        <>
            {/* ── Assign ── */}
            <CompactBtn ref={assignRef}
                icon={<UserCircle size={13} />}
                label={agentName || "Unassigned"}
                onClick={() => toggle("assign")}
                active={openDrop === "assign"}
            />
            {openDrop === "assign" && (
                <DropPanel anchorRef={assignRef} onClose={closeDrop} width={230}>
                    <div className="ap-search-wrap">
                        <Search size={13} className="ap-search-icon" />
                        <input className="ap-search-input" placeholder="بحث..."
                            value={assignSearch} onChange={e => setAssignSearch(e.target.value)} autoFocus />
                    </div>
                    <div className="ap-sep" />
                    {user && (
                        <DropItem icon={<span style={{ fontSize: 11 }}>👤</span>} label="تعيين لي"
                            active={c.assigned?.assigned_to === user.id}
                            onClick={() => { assignMut.mutate({ assigned_to: user.id, is_assigned: true, performed_by_name: user.first_name }); closeDrop() }} />
                    )}
                    {c.assigned?.is_assigned && (
                        <DropItem icon={<UserCircle size={12} />} label="إلغاء التعيين" danger
                            onClick={() => { assignMut.mutate({ assigned_to: null, is_assigned: false }); closeDrop() }} />
                    )}
                    <div className="ap-sep" />
                    {filteredUsers.length === 0 && (
                        <p style={{ fontSize: 11, color: "#9ca3af", padding: "8px 12px", margin: 0, textAlign: "center" }}>لا توجد نتائج</p>
                    )}
                    {filteredUsers.map(u => (
                        <DropItem key={u.user_id}
                            icon={u.profile_picture
                                ? <img src={u.profile_picture} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }}
                                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                                : <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>{u.name.charAt(0).toUpperCase()}</div>
                            }
                            label={u.name}
                            active={c.assigned?.assigned_to === u.user_id}
                            onClick={() => { assignMut.mutate({ assigned_to: u.user_id, is_assigned: true, performed_by_name: u.name }); closeDrop() }}
                        />
                    ))}
                </DropPanel>
            )}

            {/* ── Lifecycle ── */}
            <CompactBtn ref={lifecycleRef}
                icon={<span style={{ fontSize: 11 }}>{c.lifecycle?.icon || "📌"}</span>}
                label={c.lifecycle?.name || "Lifecycle"}
                onClick={() => toggle("lifecycle")}
                active={openDrop === "lifecycle"}
            />
            {openDrop === "lifecycle" && (
                <DropPanel anchorRef={lifecycleRef} onClose={closeDrop} width={200}>
                    <p className="ap-drop-title">دورة الحياة</p>
                    {lifecycles.map(lc => (
                        <DropItem key={lc.code}
                            icon={<span style={{ fontSize: 11 }}>{lc.icon || "📌"}</span>}
                            label={lc.name}
                            active={c.lifecycle?.code === lc.code}
                            onClick={() => { lifecycleMut.mutate(lc.code); closeDrop() }}
                        />
                    ))}
                    {c.lifecycle && (
                        <>
                            <div className="ap-sep" />
                            <DropItem icon={<X size={12} />} label="إزالة" danger
                                onClick={() => { lifecycleMut.mutate(""); closeDrop() }} />
                        </>
                    )}
                </DropPanel>
            )}

            {/* ── Team Transfer ── */}
            <CompactBtn ref={teamRef}
                icon={<Users size={13} />}
                label="Team"
                onClick={() => toggle("team")}
                active={openDrop === "team"}
            />
            {openDrop === "team" && (
                <DropPanel anchorRef={teamRef} onClose={closeDrop} width={220}>
                    <p className="ap-drop-title">تحويل لفريق</p>
                    {teams.length === 0 && (
                        <p style={{ fontSize: 11, color: "#9ca3af", padding: "8px 12px", margin: 0, textAlign: "center" }}>لا توجد فرق</p>
                    )}
                    {teams.map(t => {
                        const isActive = c.team_ids?.teams?.some(tm => tm.team_id === t.team_id) ?? false
                        const isLoading = teamMut.isPending || unassignTeamMut.isPending
                        return (
                            <button key={t.team_id} className="ap-drop-item" onClick={() => {
                                if (isActive) unassignTeamMut.mutate([t.team_id])
                                else teamMut.mutate([t.team_id])
                            }} disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
                                <span style={{
                                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                    border: isActive ? "none" : "1.5px solid #cbd5e1",
                                    background: isActive ? "linear-gradient(135deg, #0072b5, #004786)" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all .15s ease",
                                    boxShadow: isActive ? "0 1px 4px rgba(0,71,134,0.25)" : "none",
                                }}>
                                    {isActive && (
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 5.5L4 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </span>
                                <span style={{ fontSize: 11, lineHeight: 1 }}>{t.icon || "👥"}</span>
                                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 600 : 500, color: isActive ? "#004786" : "#374151" }}>{t.name}</span>
                            </button>
                        )
                    })}
                </DropPanel>
            )}

            {/* ── AI Toggle ── */}
            <button className={`ap-icon-btn ${c.enable_ai ? "ap-icon-active" : ""}`}
                onClick={() => aiMut.mutate(!c.enable_ai)} disabled={aiMut.isPending}
                title={c.enable_ai ? "تعطيل AI" : "تفعيل AI"}>
                {c.enable_ai ? <Bot size={14} /> : <BotOff size={14} />}
                <span className="ap-ai-dot-i" data-on={c.enable_ai} />
            </button>

            {/* ── Close / Reopen ── */}
            {isClosed ? (
                <button className="ap-close-btn ap-reopen-btn"
                    onClick={() => reopenMut.mutate(user?.id ?? c.assigned?.assigned_to ?? "")}
                    disabled={reopenMut.isPending}>
                    🔄 Reopen
                </button>
            ) : (
                <CompactBtn ref={closeRef}
                    icon={<CheckCircle size={13} />}
                    label="Close"
                    accent
                    onClick={() => toggle("close")}
                    active={openDrop === "close"}
                />
            )}
            {openDrop === "close" && (
                <ClosePanel anchorRef={closeRef} onClose={closeDrop}
                    onSubmit={(cat, sum) => { closeMut.mutate({ reason: sum || cat, category: cat, lang: "ar" }); closeDrop() }}
                    isPending={closeMut.isPending} />
            )}

            {/* ── Styles ── */}
            <style>{`
                .ap-compact-btn {
                    display:inline-flex; align-items:center; gap:4px;
                    padding:3px 8px; border-radius:6px;
                    border:1px solid var(--t-border-light, #e5e7eb);
                    background:transparent; cursor:pointer;
                    font-size:11.5px; font-weight:500;
                    color:var(--t-text-muted, #6b7280);
                    transition:all .15s ease; font-family:inherit;
                    white-space:nowrap; height:28px;
                }
                .ap-compact-btn:hover { background:rgba(0,114,181,0.06); border-color:rgba(0,71,134,0.2); color:#004786; }
                .ap-compact-btn[data-active="true"] { background:rgba(0,114,181,0.08); border-color:#0072b5; color:#004786; }
                .ap-compact-btn[data-accent="true"] { color:#004786; border-color:rgba(0,71,134,0.25); }
                .ap-compact-btn[data-accent="true"]:hover { background:rgba(0,114,181,0.06); border-color:#0072b5; }
                .ap-compact-chevron { color:inherit; opacity:.5; flex-shrink:0; transition:transform .15s; }
                .ap-compact-btn[data-active="true"] .ap-compact-chevron { transform:rotate(180deg); opacity:1; }

                .ap-icon-btn {
                    width:28px; height:28px; border-radius:6px;
                    border:1px solid var(--t-border-light, #e5e7eb);
                    background:transparent; cursor:pointer;
                    display:inline-flex; align-items:center; justify-content:center;
                    color:var(--t-text-muted, #6b7280); transition:all .15s;
                    position:relative;
                }
                .ap-icon-btn:hover { background:rgba(0,114,181,0.06); border-color:rgba(0,71,134,0.2); color:#004786; }
                .ap-icon-active { background:rgba(0,114,181,0.08) !important; border-color:#0072b5 !important; color:#004786 !important; }
                .ap-icon-btn:disabled { opacity:.5; cursor:not-allowed; }
                .ap-ai-dot-i {
                    position:absolute; bottom:2px; right:2px;
                    width:5px; height:5px; border-radius:50%;
                    background:#d1d5db;
                }
                .ap-ai-dot-i[data-on="true"] { background:#22c55e; box-shadow:0 0 4px #22c55e; }

                .ap-close-btn {
                    display:inline-flex; align-items:center; gap:3px;
                    padding:3px 10px; border-radius:6px; height:28px;
                    border:none; cursor:pointer;
                    font-size:11px; font-weight:600; font-family:inherit;
                    transition:all .15s;
                }
                .ap-reopen-btn { background:rgba(0,114,181,0.08); color:#0072b5; }
                .ap-reopen-btn:hover { background:rgba(0,114,181,0.14); }
                .ap-reopen-btn:disabled { opacity:.5; cursor:not-allowed; }

                .ap-drop {
                    background:#fff; border:1px solid rgba(0,0,0,.06);
                    border-radius:10px; padding:4px;
                    box-shadow:0 12px 40px rgba(0,71,134,.08), 0 4px 12px rgba(0,0,0,.06);
                    animation:apFadeIn .12s ease-out;
                    backdrop-filter:blur(8px);
                }
                .ap-drop-title {
                    font-size:10px; font-weight:700; color:#6b7280;
                    text-transform:uppercase; letter-spacing:.04em;
                    padding:6px 10px 3px; margin:0;
                }
                .ap-drop-item {
                    display:flex; align-items:center; gap:7px;
                    width:100%; padding:6px 10px; border-radius:7px;
                    border:none; background:transparent; cursor:pointer;
                    font-size:12px; font-weight:500; color:#1f2937;
                    text-align:right; transition:all .12s; font-family:inherit;
                }
                .ap-drop-item:hover { background:rgba(0,114,181,0.06); }
                .ap-drop-item[data-active="true"] { background:rgba(0,114,181,0.08); color:#004786; }
                .ap-drop-item[data-danger="true"] { color:#ef4444; }
                .ap-drop-item[data-danger="true"]:hover { background:#fef2f2; }
                .ap-sep { height:1px; background:#f0f0f0; margin:3px 6px; }
                .ap-search-wrap { display:flex; align-items:center; gap:6px; padding:6px 8px; }
                .ap-search-icon { color:#9ca3af; flex-shrink:0; }
                .ap-search-input {
                    flex:1; border:none; outline:none;
                    font-size:12px; font-family:inherit;
                    color:#1f2937; background:transparent; padding:3px 0;
                }
                .ap-search-input::placeholder { color:#c4c8cf; }

                .ap-close-panel {
                    width:260px; background:#fff;
                    border:1px solid rgba(0,0,0,.06);
                    border-radius:12px; padding:14px;
                    box-shadow:0 16px 48px rgba(0,71,134,.1), 0 4px 12px rgba(0,0,0,.06);
                    animation:apFadeIn .12s ease-out;
                }
                .ap-close-header { display:flex; align-items:center; gap:7px; margin-bottom:12px; }
                .ap-close-header svg { color:#004786; }
                .ap-close-title { font-size:13px; font-weight:700; color:#111827; margin:0; }
                .ap-label { font-size:10px; font-weight:600; color:#374151; display:block; margin-bottom:4px; }
                .ap-select {
                    width:100%; padding:7px 8px; border-radius:7px;
                    border:1px solid #e5e7eb; background:#fafbfc;
                    color:#111827; font-size:11.5px; outline:none;
                    margin-bottom:10px; cursor:pointer; font-family:inherit;
                }
                .ap-select:focus { border-color:#0072b5; }
                .ap-textarea {
                    width:100%; padding:7px 8px; border-radius:7px;
                    border:1px solid #e5e7eb; background:#fafbfc;
                    color:#111827; font-size:11.5px; outline:none; resize:vertical;
                    margin-bottom:12px; font-family:inherit; min-height:50px; line-height:1.5;
                }
                .ap-textarea:focus { border-color:#0072b5; }
                .ap-textarea::placeholder { color:#b0b6c0; }
                .ap-close-actions { display:flex; justify-content:flex-end; gap:5px; }
                .ap-btn-cancel {
                    padding:6px 12px; border-radius:7px; border:1px solid #e5e7eb;
                    background:#fff; color:#6b7280; font-size:11px;
                    cursor:pointer; font-weight:500; font-family:inherit;
                    transition:all .12s;
                }
                .ap-btn-cancel:hover { background:#f3f4f6; }
                .ap-btn-submit {
                    padding:6px 14px; border-radius:7px; border:none;
                    background:linear-gradient(135deg, #0072b5, #004786);
                    color:#fff; font-size:11px;
                    font-weight:700; cursor:pointer; font-family:inherit;
                    transition:all .15s;
                }
                .ap-btn-submit:hover { background:linear-gradient(135deg, #005f9a, #003a6e); }
                .ap-btn-submit:disabled { opacity:.6; cursor:not-allowed; }

                @keyframes apFadeIn{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
        </>
    )
}

/* ═══════ Compact Toolbar Button ═══════ */
const CompactBtn = React.forwardRef<HTMLButtonElement, {
    icon: React.ReactNode; label: string; onClick: () => void
    active?: boolean; accent?: boolean
}>(({ icon, label, onClick, active, accent }, ref) => (
    <button ref={ref} className="ap-compact-btn" onClick={onClick}
        data-active={active} data-accent={accent}>
        <span style={{ display: "flex" }}>{icon}</span>
        <span>{label}</span>
        <ChevronDown size={10} className="ap-compact-chevron" />
    </button>
))

/* ═══════ Drop Panel (portal) ═══════ */
function DropPanel({ anchorRef, onClose, width, children }: {
    anchorRef: React.RefObject<HTMLElement | null>; onClose: () => void
    width: number; children: React.ReactNode
}) {
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!anchorRef.current) return
        const r = anchorRef.current.getBoundingClientRect()
        const left = Math.min(r.left, window.innerWidth - width - 12)
        setPos({ top: r.bottom + 5, left: Math.max(8, left) })
    }, [anchorRef, width])

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            const t = e.target as Node
            if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
            onClose()
        }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [onClose, anchorRef])

    return createPortal(
        <div ref={panelRef} className="ap-drop" dir="rtl" style={{
            position: "fixed", top: pos.top, left: pos.left,
            zIndex: 9999, width, maxHeight: 340, overflowY: "auto",
        }} onClick={e => e.stopPropagation()}>
            {children}
        </div>,
        document.body
    )
}

/* ═══════ Drop Item ═══════ */
function DropItem({ icon, label, active, danger, onClick }: {
    icon: React.ReactNode; label: string
    active?: boolean; danger?: boolean; onClick: () => void
}) {
    return (
        <button className="ap-drop-item" onClick={onClick}
            data-active={active} data-danger={danger}>
            <span style={{ display: "flex", flexShrink: 0, color: danger ? "#ef4444" : active ? "#004786" : "#6b7280" }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {active && <span style={{ fontSize: 10, color: "#004786", fontWeight: 700 }}>✓</span>}
        </button>
    )
}

/* ═══════ Close Panel (portal) ═══════ */
const CLOSE_CATEGORIES = [
    { value: "resolved", label: "تم الحل" },
    { value: "no_response", label: "لا يوجد رد" },
    { value: "wrong_number", label: "رقم خاطئ" },
    { value: "spam", label: "بريد مزعج" },
    { value: "other", label: "أخرى" },
]

function ClosePanel({ anchorRef, onClose, onSubmit, isPending }: {
    anchorRef: React.RefObject<HTMLElement | null>
    onClose: () => void; onSubmit: (cat: string, sum: string) => void; isPending: boolean
}) {
    const [cat, setCat] = useState("resolved")
    const [sum, setSum] = useState("")
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!anchorRef.current) return
        const r = anchorRef.current.getBoundingClientRect()
        setPos({ top: r.bottom + 5, left: Math.max(8, Math.min(r.left, window.innerWidth - 272)) })
    }, [anchorRef])

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            const t = e.target as Node
            if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return
            onClose()
        }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [onClose, anchorRef])

    return createPortal(
        <div ref={panelRef} className="ap-close-panel" style={{
            position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
        }} onClick={e => e.stopPropagation()}>
            <div className="ap-close-header">
                <CheckCircle size={16} />
                <h4 className="ap-close-title">Closing Notes</h4>
            </div>
            <label className="ap-label">Category</label>
            <select className="ap-select" value={cat} onChange={e => setCat(e.target.value)}>
                {CLOSE_CATEGORIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className="ap-label">Summary</label>
            <textarea className="ap-textarea" value={sum} onChange={e => setSum(e.target.value)}
                placeholder="Add a summary..." rows={2} />
            <div className="ap-close-actions">
                <button className="ap-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="ap-btn-submit" onClick={() => onSubmit(cat, sum)} disabled={isPending}>
                    {isPending ? "..." : "Close"}
                </button>
            </div>
        </div>,
        document.body
    )
}
