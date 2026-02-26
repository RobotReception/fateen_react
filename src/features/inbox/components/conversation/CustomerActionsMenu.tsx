import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import {
    CheckCircle, MessageSquareText, UserPlus, Tag,
    ChevronRight, Bot, BotOff, Users, UserX, X,
} from "lucide-react"
import type { Customer, SidebarLifecycle, SidebarTeam } from "../../types/inbox.types"
import { useAuthStore } from "@/stores/auth-store"
import {
    useCloseConversation, useReopenConversation, useAssignAgent,
    useUpdateLifecycle, useToggleAI, useAssignTeams, useRemoveTeams,
} from "../../hooks/use-customer-actions"
import { useInboxSummary } from "../../hooks/use-inbox-summary"
import { getBriefUsers } from "../../services/inbox-service"

/* ═══════════ Types ═══════════ */
interface Props {
    customer: Customer
    open: boolean
    onClose: () => void
    anchorRef: React.RefObject<HTMLElement | null>
}

type SubPanel = null | "close-notes" | "assign" | "lifecycle" | "teams"

const CLOSE_CATEGORIES = [
    { value: "resolved", label: "تم الحل" },
    { value: "no_response", label: "لا يوجد رد" },
    { value: "wrong_number", label: "رقم خاطئ" },
    { value: "spam", label: "بريد مزعج" },
    { value: "other", label: "أخرى" },
]

/* ═══════════ Main Component ═══════════ */
export function CustomerActionsMenu({ customer: c, open, onClose, anchorRef }: Props) {
    const [subPanel, setSubPanel] = useState<SubPanel>(null)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
    const [subPos, setSubPos] = useState({ top: 0, left: 0 })
    const menuRef = useRef<HTMLDivElement>(null)
    const { user } = useAuthStore()
    const { data: summary } = useInboxSummary(user?.id)
    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })
    const allUsers = briefData?.users ?? []

    const closeMut = useCloseConversation(c.customer_id)
    const reopenMut = useReopenConversation(c.customer_id)
    const assignMut = useAssignAgent(c.customer_id)
    const lifecycleMut = useUpdateLifecycle(c.customer_id)
    const aiMut = useToggleAI(c.customer_id)
    const assignTeamsMut = useAssignTeams(c.customer_id)
    const removeTeamsMut = useRemoveTeams(c.customer_id)

    const isClosed = c.conversation_status?.is_closed ?? false

    // Position — open towards the LEFT (messages area)
    useEffect(() => {
        if (!open || !anchorRef.current) return
        const calc = () => {
            const r = anchorRef.current!.getBoundingClientRect()
            setMenuPos({ top: r.top, left: r.left - 196 })
        }
        calc()
        window.addEventListener("resize", calc)
        return () => window.removeEventListener("resize", calc)
    }, [open, anchorRef])

    // Outside click
    useEffect(() => {
        if (!open) return
        const handle = (e: MouseEvent) => {
            const t = e.target as Node
            const portal = document.getElementById("cam-root")
            if (portal?.contains(t) || anchorRef.current?.contains(t)) return
            onClose()
        }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [open, onClose, anchorRef])

    useEffect(() => { if (!open) setSubPanel(null) }, [open])

    useEffect(() => {
        if (!open) return
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
        document.addEventListener("keydown", h)
        return () => document.removeEventListener("keydown", h)
    }, [open, onClose])

    const done = useCallback(() => { onClose(); setSubPanel(null) }, [onClose])

    // Calculate sub-panel pos from the menu's live rect
    const openSub = useCallback((panel: SubPanel, e: React.MouseEvent) => {
        setSubPanel(prev => prev === panel ? null : panel)
        if (menuRef.current) {
            const mr = menuRef.current.getBoundingClientRect()
            const row = (e.currentTarget as HTMLElement).getBoundingClientRect()
            setSubPos({ top: row.top, left: mr.left - 6 })
        }
    }, [])

    if (!open) return null

    const lifecycles: SidebarLifecycle[] = summary?.lifecycles ?? []
    const teams: SidebarTeam[] = summary?.teams ?? []
    const currentTeamIds = c.team_ids?.teams ?? []

    const portal = (
        <div id="cam-root">
            {/* Backdrop */}
            <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={done} />

            {/* ── Main Menu ── */}
            <div ref={menuRef} className="cam-menu" dir="rtl" style={{
                position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999,
            }} onClick={e => e.stopPropagation()}>

                {isClosed ? (
                    <MItem icon={<span className="cam-emoji">🔄</span>} label="إعادة فتح"
                        onClick={() => reopenMut.mutate(user?.id ?? c.assigned?.assigned_to ?? "", { onSuccess: done })}
                        loading={reopenMut.isPending} />
                ) : (<>
                    <MItem icon={<CheckCircle size={14} />} label="إغلاق"
                        onClick={() => closeMut.mutate({ reason: "resolved", category: "resolved", lang: "ar" }, { onSuccess: done })}
                        loading={closeMut.isPending} iconColor="#059669" />
                    <MItem icon={<MessageSquareText size={14} />} label="إغلاق مع ملاحظات" arrow
                        onClick={(e) => openSub("close-notes", e)}
                        active={subPanel === "close-notes"} />
                </>)}

                <div className="cam-sep" />

                <MItem icon={<UserPlus size={14} />} label="تعيين" arrow
                    onClick={(e) => openSub("assign", e)}
                    active={subPanel === "assign"} />
                <MItem icon={<Tag size={14} />} label="دورة الحياة" arrow
                    onClick={(e) => openSub("lifecycle", e)}
                    active={subPanel === "lifecycle"} />

                <div className="cam-sep" />

                <MItem icon={<Users size={14} />} label="الفرق" arrow
                    onClick={(e) => openSub("teams", e)}
                    active={subPanel === "teams"} />
                <MItem
                    icon={c.enable_ai ? <BotOff size={14} /> : <Bot size={14} />}
                    label={c.enable_ai ? "تعطيل AI" : "تفعيل AI"}
                    onClick={() => aiMut.mutate(!c.enable_ai, { onSuccess: done })}
                    loading={aiMut.isPending}
                    iconColor={c.enable_ai ? "#ef4444" : "#8b5cf6"}
                />
            </div>

            {/* ── Sub-panels ── */}

            {subPanel === "close-notes" && (
                <CloseNotesPanel
                    customerName={c.sender_name || c.customer_id}
                    top={subPos.top} left={subPos.left - 260}
                    onClose={done}
                    onSubmit={(cat, sum) => closeMut.mutate({ reason: sum || cat, category: cat, lang: "ar" }, { onSuccess: done })}
                    isPending={closeMut.isPending}
                />
            )}

            {subPanel === "assign" && (
                <Flyout title="تعيين موظف" top={subPos.top} left={subPos.left - 210} scroll>
                    {c.assigned?.is_assigned && (
                        <MItem icon={<UserX size={15} />} label="إلغاء التعيين" danger
                            onClick={() => assignMut.mutate({ assigned_to: null, is_assigned: false }, { onSuccess: done })}
                            loading={assignMut.isPending} />
                    )}
                    {user && (
                        <MItem icon={<span className="cam-emoji">👤</span>}
                            label={`تعيين لي (${user.first_name})`}
                            onClick={() => assignMut.mutate({ assigned_to: user.id, is_assigned: true, performed_by_name: user.first_name }, { onSuccess: done })}
                            loading={assignMut.isPending}
                            active={c.assigned?.assigned_to === user.id}
                            suffix={c.assigned?.assigned_to === user.id ? <span className="cam-check">✓</span> : undefined}
                        />
                    )}
                    {allUsers.length > 0 && <div className="cam-sep" />}
                    {allUsers.filter(u => u.user_id !== user?.id).map(u => (
                        <MItem key={u.user_id}
                            icon={
                                u.profile_picture
                                    ? <img src={u.profile_picture} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    : <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{u.name.charAt(0).toUpperCase()}</div>
                            }
                            label={u.name}
                            onClick={() => assignMut.mutate({ assigned_to: u.user_id, is_assigned: true, performed_by_name: u.name }, { onSuccess: done })}
                            loading={assignMut.isPending}
                            active={c.assigned?.assigned_to === u.user_id}
                            suffix={c.assigned?.assigned_to === u.user_id ? <span className="cam-check">✓</span> : undefined}
                        />
                    ))}
                </Flyout>
            )}

            {subPanel === "lifecycle" && (
                <Flyout title="دورة الحياة" top={subPos.top} left={subPos.left - 195} scroll>
                    {lifecycles.length === 0 && <p className="cam-empty">لا توجد دورات حياة</p>}
                    {lifecycles.map(lc => (
                        <MItem key={lc.code}
                            icon={<span className="cam-emoji">{lc.icon || "📌"}</span>}
                            label={lc.name}
                            onClick={() => lifecycleMut.mutate(lc.code, { onSuccess: done })}
                            loading={lifecycleMut.isPending}
                            active={c.lifecycle?.code === lc.code}
                            suffix={c.lifecycle?.code === lc.code ? <span className="cam-check">✓</span> : undefined}
                        />
                    ))}
                </Flyout>
            )}

            {subPanel === "teams" && (
                <Flyout title="إدارة الفرق" top={subPos.top} left={subPos.left - 195} scroll>
                    {teams.length === 0 && <p className="cam-empty">لا توجد فرق</p>}
                    {teams.map(team => {
                        const isIn = currentTeamIds.includes(team.team_id)
                        return (
                            <MItem key={team.team_id}
                                icon={<span className="cam-emoji">{team.icon || "👥"}</span>}
                                label={team.name}
                                active={isIn}
                                onClick={() => {
                                    if (isIn) removeTeamsMut.mutate([team.team_id], { onSuccess: done })
                                    else assignTeamsMut.mutate([team.team_id], { onSuccess: done })
                                }}
                                loading={assignTeamsMut.isPending || removeTeamsMut.isPending}
                                suffix={isIn ? <span className="cam-check">✓</span> : undefined}
                            />
                        )
                    })}
                </Flyout>
            )}

            {/* ── Styles ── */}
            <style>{`
                .cam-menu {
                    min-width: 190px; width: 190px;
                    background: var(--t-card);
                    border: 1px solid var(--t-border);
                    border-radius: 12px;
                    padding: 4px;
                    box-shadow: 0 12px 40px var(--t-shadow), 0 3px 10px var(--t-shadow), 0 0 0 1px var(--t-border);
                    animation: camFadeIn .14s cubic-bezier(.22,1,.36,1);
                }
                .cam-sep { height:1px; background:linear-gradient(90deg,transparent,var(--t-border) 20%,var(--t-border) 80%,transparent); margin:3px 8px; }

                .cam-item {
                    display:flex; align-items:center; gap:8px;
                    width:100%; padding:6px 10px; border-radius:8px;
                    border:none; background:transparent; cursor:pointer;
                    font-size:12.5px; font-weight:500; color:var(--t-text);
                    text-align:right; transition:all .12s ease;
                    position:relative; font-family:inherit;
                }
                .cam-item:hover:not(:disabled) { background:var(--t-surface); }
                .cam-item:active:not(:disabled) { background:var(--t-surface-deep); transform:scale(.98); }
                .cam-item:disabled { color:var(--t-text-faint); cursor:not-allowed; }
                .cam-item[data-active="true"] { background:var(--t-surface); }
                .cam-item[data-danger="true"] { color:var(--t-danger); }
                .cam-item[data-danger="true"]:hover { background:var(--t-danger-soft); }

                .cam-item-icon {
                    width:22px; height:22px; border-radius:6px;
                    display:flex; align-items:center; justify-content:center;
                    background:var(--t-surface); color:var(--t-text-muted); flex-shrink:0;
                    transition:all .12s ease;
                }
                .cam-item:hover .cam-item-icon { background:var(--t-accent-muted); color:var(--t-accent); }
                .cam-item[data-danger="true"] .cam-item-icon { background:var(--t-danger-soft); color:var(--t-danger); }

                .cam-arrow { color:var(--t-text-faint); flex-shrink:0; transition:transform .12s; }
                .cam-item:hover .cam-arrow { color:var(--t-text-muted); transform:translateX(-2px); }

                .cam-emoji { font-size:12px; line-height:1; }
                .cam-check { font-size:11px; color:var(--t-success); font-weight:700; }
                .cam-empty { font-size:11px; color:var(--t-text-faint); padding:8px 12px; margin:0; text-align:center; }

                .cam-flyout {
                    background:var(--t-card);
                    border:1px solid var(--t-border);
                    border-radius:12px; padding:4px;
                    box-shadow:0 12px 40px var(--t-shadow), 0 3px 10px var(--t-shadow);
                    animation: camSlideIn .15s cubic-bezier(.22,1,.36,1);
                }
                .cam-flyout-title {
                    font-size:10px; font-weight:700; color:var(--t-text-faint);
                    text-transform:uppercase; letter-spacing:.04em;
                    padding:6px 12px 3px; margin:0;
                }

                .cam-close-panel {
                    width:260px; background:var(--t-card);
                    border:1px solid var(--t-border);
                    border-radius:14px; padding:16px;
                    box-shadow:0 16px 48px var(--t-shadow), 0 4px 14px var(--t-shadow);
                    animation: camSlideIn .18s cubic-bezier(.22,1,.36,1);
                }
                .cam-close-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; gap:8px; }
                .cam-close-title { font-size:13px; font-weight:700; color:var(--t-text); margin:0; line-height:1.3; }
                .cam-close-sub { font-size:11px; color:var(--t-text-muted); margin:2px 0 0; }
                .cam-close-x { border:none; background:none; cursor:pointer; color:var(--t-text-faint); padding:4px; border-radius:8px; transition:all .12s; display:flex; }
                .cam-close-x:hover { background:var(--t-surface); color:var(--t-text-muted); }

                .cam-label { font-size:11px; font-weight:600; color:var(--t-text-secondary); display:block; margin-bottom:5px; }

                .cam-select {
                    width:100%; padding:8px 10px; border-radius:8px;
                    border:1px solid var(--t-border); background:var(--t-surface);
                    color:var(--t-text); font-size:12px; outline:none;
                    margin-bottom:12px; cursor:pointer; font-family:inherit;
                    transition:border-color .12s;
                    appearance:none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat:no-repeat;
                    background-position: left 8px center;
                    padding-left:28px;
                }
                .cam-select:focus { border-color:var(--t-accent); box-shadow:0 0 0 3px var(--t-accent-muted); }

                .cam-textarea {
                    width:100%; padding:8px 10px; border-radius:8px;
                    border:1px solid var(--t-border); background:var(--t-surface);
                    color:var(--t-text); font-size:12px; outline:none; resize:vertical;
                    margin-bottom:14px; font-family:inherit; min-height:60px;
                    transition:border-color .12s; line-height:1.5;
                }
                .cam-textarea:focus { border-color:var(--t-accent); box-shadow:0 0 0 3px var(--t-accent-muted); }
                .cam-textarea::placeholder { color:var(--t-text-faint); }

                .cam-close-actions { display:flex; justify-content:flex-end; gap:6px; }
                .cam-btn-cancel {
                    padding:7px 14px; border-radius:8px; border:1px solid var(--t-border);
                    background:var(--t-card); color:var(--t-text-muted); font-size:12px;
                    cursor:pointer; font-weight:500; transition:all .12s; font-family:inherit;
                }
                .cam-btn-cancel:hover { background:var(--t-surface); border-color:var(--t-surface-deep); }
                .cam-btn-close {
                    padding:7px 16px; border-radius:8px; border:none;
                    background:var(--t-success); color:#fff; font-size:12px;
                    font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit;
                }
                .cam-btn-close:hover { opacity:.9; box-shadow:0 4px 12px rgba(5,150,105,.25); }
                .cam-btn-close:active { transform:scale(.97); }
                .cam-btn-close:disabled { opacity:.6; cursor:not-allowed; }

                @keyframes camFadeIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
                @keyframes camSlideIn{from{opacity:0;transform:translateX(10px) scale(.97)}to{opacity:1;transform:translateX(0) scale(1)}}
            `}</style>
        </div>
    )

    return createPortal(portal, document.body)
}

/* ═══════════ Close Notes Panel ═══════════ */
function CloseNotesPanel({ customerName, top, left, onClose, onSubmit, isPending }: {
    customerName: string; top: number; left: number
    onClose: () => void; onSubmit: (cat: string, sum: string) => void; isPending: boolean
}) {
    const [category, setCategory] = useState("resolved")
    const [summary, setSummary] = useState("")
    return (
        <div className="cam-close-panel" style={{ position: "fixed", top, left, zIndex: 9999 }}
            onClick={e => e.stopPropagation()}>
            <div className="cam-close-header">
                <div>
                    <h4 className="cam-close-title">Closing Notes</h4>
                    <p className="cam-close-sub">{customerName}</p>
                </div>
                <button className="cam-close-x" onClick={onClose}><X size={16} /></button>
            </div>
            <label className="cam-label">Conversation Category</label>
            <select className="cam-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CLOSE_CATEGORIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className="cam-label">Summary</label>
            <textarea className="cam-textarea" value={summary} onChange={e => setSummary(e.target.value)}
                placeholder="Add a summary about your Conversation" rows={3} />
            <div className="cam-close-actions">
                <button className="cam-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="cam-btn-close" onClick={() => onSubmit(category, summary)} disabled={isPending}>
                    {isPending ? "جاري..." : "Close Conversation"}
                </button>
            </div>
        </div>
    )
}

/* ═══════════ Flyout Panel ═══════════ */
function Flyout({ title, top, left, children, scroll }: {
    title: string; top: number; left: number; children: React.ReactNode; scroll?: boolean
}) {
    return (
        <div className="cam-flyout" style={{
            position: "fixed", top, left, zIndex: 9999, width: 195,
            ...(scroll ? { maxHeight: 300, overflowY: "auto" as const } : {}),
        }} onClick={e => e.stopPropagation()}>
            <p className="cam-flyout-title">{title}</p>
            {children}
        </div>
    )
}

/* ═══════════ Menu Item ═══════════ */
function MItem({ icon, label, onClick, arrow, active, loading, disabled, danger, suffix, iconColor }: {
    icon: React.ReactNode; label: string; onClick?: (e: React.MouseEvent) => void
    arrow?: boolean; active?: boolean; loading?: boolean; disabled?: boolean
    danger?: boolean; suffix?: React.ReactNode; iconColor?: string
}) {
    return (
        <button className="cam-item" onClick={disabled || loading ? undefined : onClick}
            disabled={disabled || loading} data-active={active} data-danger={danger}
            style={{ opacity: loading ? .55 : 1 }}>
            <div className="cam-item-icon" style={iconColor ? { background: `${iconColor}14`, color: iconColor } : undefined}>
                {icon}
            </div>
            <span style={{ flex: 1 }}>{label}</span>
            {suffix}
            {arrow && <ChevronRight size={12} className="cam-arrow" />}
        </button>
    )
}
