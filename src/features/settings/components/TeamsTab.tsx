import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"
import {
    useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam,
    useTeamMembers, useAddTeamMember, useRemoveTeamMember,
    useDeletedTeams, useRestoreTeam,
} from "../hooks/use-teams-tags"
import type { Team } from "../types/teams-tags"
import { getBriefUsers } from "@/features/inbox/services/inbox-service"
import {
    Plus, Trash2, Pencil, Users, X, Loader2, Search, AlertTriangle, Check,
    MoreVertical, UserPlus, Mail, Shield, ChevronDown, Lock,
    ArrowUpDown, RotateCcw, ChevronLeft, ChevronRight,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import { usePermissions } from "@/lib/usePermissions"

/* ═══════════════════════════════════════
   CSS — DarAI branded
═══════════════════════════════════════ */
const CSS = `
.tt-table { width:100%; border-collapse:separate; border-spacing:0; }
.tt-table thead th {
    padding:10px 14px; font-size:10.5px; font-weight:700; color:var(--t-text-muted);
    text-align:right; border-bottom:1px solid #eaedf0; white-space:nowrap;
    background:#fafbfc; text-transform:uppercase; letter-spacing:.03em;
}
.tt-table thead th:first-child { border-radius:0 8px 0 0; }
.tt-table thead th:last-child { border-radius:8px 0 0 0; }
.tt-table tbody td {
    padding:11px 14px; font-size:12px; color:var(--t-text,var(--t-text)); border-bottom:1px solid #f0f1f3;
    vertical-align:middle;
}
.tt-table tbody tr { transition:background .1s; }
.tt-table tbody tr:hover { background:rgba(27,80,145,.02); }
.tt-table tbody tr:last-child td { border-bottom:none; }
.tt-th-sort { display:inline-flex; align-items:center; gap:3px; cursor:pointer; user-select:none; }
.tt-th-sort:hover { color:var(--t-accent); }

.tt-field {
    width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--t-border);
    background:var(--t-card-hover); font-size:12px; color:var(--t-text,var(--t-text)); outline:none;
    transition:border-color .15s,box-shadow .15s; box-sizing:border-box; font-family:inherit;
}
.tt-field:focus { border-color:var(--t-accent); box-shadow:0 0 0 3px rgba(27,80,145,.06); }
.tt-field::placeholder { color:var(--t-text-faint); opacity:.7; }

.tt-label { font-size:11px; font-weight:700; color:var(--t-text-muted); display:block; margin-bottom:5px; }

.tt-btn-primary {
    display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px;
    border:none; background:var(--t-brand-orange); color:#fff; font-size:12px;
    font-weight:700; cursor:pointer; transition:all .12s; font-family:inherit;
    box-shadow:0 1px 3px rgba(27,80,145,.15);
}
.tt-btn-primary:hover:not(:disabled) { background:#003d73; }
.tt-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

.tt-btn-ghost {
    display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px;
    border:1.5px solid var(--t-border); background:transparent; color:var(--t-text,var(--t-text-secondary));
    font-size:11px; font-weight:600; cursor:pointer; transition:all .12s; font-family:inherit;
}
.tt-btn-ghost:hover { border-color:var(--t-accent); color:var(--t-accent); }

.tt-actions-btn {
    width:28px; height:28px; border-radius:7px; border:none; background:transparent;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--t-text-faint); transition:all .1s;
}
.tt-actions-btn:hover { background:var(--t-surface); color:var(--t-accent); }

.tt-actions-menu {
    position:absolute; left:0; top:100%; margin-top:2px; z-index:20;
    background:#fff; border:1px solid #eaedf0; border-radius:10px;
    box-shadow:0 6px 20px rgba(0,0,0,.08); min-width:140px; padding:4px;
    animation:ttMenuIn .1s ease-out;
}
.tt-actions-menu button {
    width:100%; padding:7px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:6px; border-radius:7px;
    font-size:11px; font-weight:600; color:var(--t-text,var(--t-text-secondary)); transition:background .08s;
    font-family:inherit; text-align:right;
}
.tt-actions-menu button:hover { background:var(--t-surface); }
.tt-actions-menu button.danger { color:var(--t-danger); }
.tt-actions-menu button.danger:hover { background:rgba(239,68,68,.04); }

.tt-member-chip {
    display:inline-flex; align-items:center; gap:4px; padding:3px 8px 3px 4px;
    border-radius:6px; background:rgba(27,80,145,.04); border:1px solid rgba(27,80,145,.1);
    font-size:11px; font-weight:600; color:var(--t-accent);
}
.tt-member-chip button {
    display:flex; align-items:center; justify-content:center; width:14px; height:14px;
    border-radius:4px; border:none; background:transparent; cursor:pointer;
    color:rgba(27,80,145,.4); transition:all .1s; padding:0;
}
.tt-member-chip button:hover { background:rgba(239,68,68,.1); color:var(--t-danger); }

.tt-members-dropdown {
    position:absolute; left:0; right:0; top:100%; margin-top:2px; z-index:10;
    background:#fff; border:1px solid #eaedf0; border-radius:10px;
    box-shadow:0 6px 20px rgba(0,0,0,.08); max-height:180px; overflow-y:auto;
    animation:ttMenuIn .1s ease-out;
}
.tt-members-dropdown button {
    width:100%; padding:7px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:8px; font-size:11px; font-weight:500;
    color:var(--t-text,var(--t-text-secondary)); transition:background .08s; font-family:inherit; text-align:right;
}
.tt-members-dropdown button:hover { background:#fafbfc; }

.tt-tab-bar { display:flex; gap:2px; background:#f0f1f3; border-radius:10px; padding:3px; }
.tt-tab {
    padding:6px 16px; border-radius:8px; border:none; background:transparent;
    font-size:11px; font-weight:700; color:var(--t-text-muted); cursor:pointer;
    transition:all .12s; font-family:inherit; display:inline-flex; align-items:center; gap:5px;
}
.tt-tab:hover { color:var(--t-accent); }
.tt-tab.active { background:#fff; color:var(--t-accent); box-shadow:0 1px 3px rgba(0,0,0,.06); }
.tt-tab .tt-tab-count {
    font-size:9px; font-weight:800; padding:1px 6px; border-radius:10px;
    background:rgba(27,80,145,.08); color:var(--t-accent);
}
.tt-tab.active .tt-tab-count { background:rgba(27,80,145,.12); }

.tt-status-badge {
    display:inline-flex; align-items:center; gap:3px;
    font-size:9.5px; font-weight:700; padding:2px 8px; border-radius:6px;
}
.tt-status-badge.active { background:rgba(22,163,74,.08); color:#16a34a; }
.tt-status-badge.inactive { background:rgba(239,68,68,.06); color:var(--t-danger); }

.tt-restore-btn {
    display:inline-flex; align-items:center; gap:5px; padding:6px 14px; border-radius:8px;
    border:1.5px solid rgba(27,80,145,.15); background:rgba(27,80,145,.03);
    color:var(--t-accent); font-size:11px; font-weight:700; cursor:pointer;
    transition:all .12s; font-family:inherit;
}
.tt-restore-btn:hover { background:rgba(27,80,145,.08); border-color:var(--t-accent); }
.tt-restore-btn:disabled { opacity:.5; cursor:not-allowed; }

.tt-pagination {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding:12px 0; font-size:11px; color:var(--t-text-muted);
}
.tt-pagination button {
    display:inline-flex; align-items:center; gap:4px; padding:5px 12px;
    border-radius:7px; border:1.5px solid var(--t-border); background:#fff;
    font-size:11px; font-weight:600; color:var(--t-text,var(--t-text-secondary));
    cursor:pointer; transition:all .12s; font-family:inherit;
}
.tt-pagination button:hover:not(:disabled) { border-color:var(--t-accent); color:var(--t-accent); }
.tt-pagination button:disabled { opacity:.4; cursor:not-allowed; }

@keyframes ttIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes ttMenuIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
`

const AVATAR_GRADIENTS = [
    "var(--t-gradient-accent)",
    "var(--t-gradient-accent)",
    "linear-gradient(135deg, #7c3aed, #a855f7)",
    "linear-gradient(135deg, #0891b2, #06b6d4)",
    "var(--t-gradient-accent)",
]

function hashCode(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return Math.abs(h)
}

function fmtDate(d?: string) {
    if (!d) return "—"
    try {
        return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Aden" }).format(new Date(d))
    } catch { return d }
}

/* ─── Modal ─── */
function Modal({ title, subtitle, width = 440, onClose, children }: {
    title: string; subtitle?: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 16, background: "#fff", overflow: "hidden",
                width: "100%", maxWidth: width, margin: 16, animation: "ttIn .15s ease-out",
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 12px 40px rgba(0,0,0,.12)",
            }}>
                {/* Gradient header */}
                <div style={{
                    background: "var(--t-brand-orange)",
                    padding: "14px 16px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{title}</div>
                        {subtitle && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.65)", marginTop: 2, lineHeight: 1.4 }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: "rgba(255,255,255,.12)", border: "none", cursor: "pointer",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .12s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.25)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)" }}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

/* ─── Team Form with Members selector ─── */
function TeamFormModal({ team, onClose, tenantId }: { team?: Team; onClose: () => void; tenantId: string }) {
    const createMut = useCreateTeam(tenantId)
    const updateMut = useUpdateTeam(tenantId)
    const addMemberMut = useAddTeamMember(tenantId)
    const removeMemberMut = useRemoveTeamMember(tenantId)
    const isEdit = !!team

    const [name, setName] = useState(team?.name ?? "")
    const [desc, setDesc] = useState(team?.description ?? "")
    const [showDropdown, setShowDropdown] = useState(false)
    const [memberSearch, setMemberSearch] = useState("")

    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })

    const { data: membersData } = useTeamMembers(tenantId, isEdit ? team.team_id : "")

    const currentMembers = membersData?.members ?? []
    const allUsers = briefData?.users ?? []
    const memberIds = new Set(currentMembers.map(m => m.user_id))
    const available = allUsers.filter(u =>
        !memberIds.has(u.user_id) &&
        u.name.toLowerCase().includes(memberSearch.toLowerCase())
    )

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = { name, description: desc || undefined }
        if (isEdit) {
            updateMut.mutate({ teamId: team.team_id, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <Modal
            title={isEdit ? "تعديل الفريق" : "فريق جديد"}
            subtitle="أنشئ فريقاً لتجميع المستخدمين. يمكن استخدام الفرق بدلاً من المستخدمين لمشاركة الموارد."
            width={460}
            onClose={onClose}
        >
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                    <label className="tt-label">اسم الفريق</label>
                    <input className="tt-field" value={name} onChange={e => setName(e.target.value)}
                        placeholder="الاستقبال" required />
                </div>
                <div>
                    <label className="tt-label">وصف الفريق</label>
                    <textarea className="tt-field" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder="أضف وصفاً للفريق مثلاً: إدارة جهات اتصال التسويق."
                        style={{ resize: "vertical", lineHeight: 1.4 }} />
                </div>

                {isEdit && (
                    <div>
                        <label className="tt-label">أعضاء الفريق</label>
                        <div style={{ position: "relative" }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                    display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
                                    padding: "6px 10px", minHeight: 36,
                                    borderRadius: 8, border: "1.5px solid var(--t-border)",
                                    background: "var(--t-card-hover)", cursor: "pointer",
                                    transition: "border-color .15s",
                                }}
                            >
                                {currentMembers.map(m => (
                                    <span key={m.user_id} className="tt-member-chip">
                                        {m.full_name}
                                        <button type="button" onClick={e => {
                                            e.stopPropagation()
                                            removeMemberMut.mutate({ teamId: team.team_id, userId: m.user_id })
                                        }}>
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {currentMembers.length === 0 && (
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>اختر أعضاء...</span>
                                )}
                                <ChevronDown size={13} style={{ marginRight: "auto", color: "var(--t-text-faint)" }} />
                            </div>

                            {showDropdown && (
                                <>
                                    <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowDropdown(false)} />
                                    <div className="tt-members-dropdown">
                                        <div style={{ padding: "6px 8px", borderBottom: "1px solid #f0f1f3" }}>
                                            <input className="tt-field" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                                                placeholder="ابحث عن عضو..." style={{ fontSize: 11, padding: "6px 10px" }} autoFocus
                                                onClick={e => e.stopPropagation()} />
                                        </div>
                                        {available.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "12px 0", fontSize: 11, color: "var(--t-text-faint)" }}>
                                                لا يوجد أعضاء متاحين
                                            </div>
                                        ) : available.map(u => (
                                            <button key={u.user_id} type="button"
                                                onClick={() => addMemberMut.mutate({ teamId: team.team_id, userId: u.user_id })}
                                                disabled={addMemberMut.isPending}>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                                    background: AVATAR_GRADIENTS[hashCode(u.user_id) % AVATAR_GRADIENTS.length],
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 9, fontWeight: 700, color: "#fff",
                                                }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{u.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div style={{
                    display: "flex", gap: 8, justifyContent: "flex-end",
                    paddingTop: 8, borderTop: "1px solid #eaedf0", marginTop: 2,
                }}>
                    <button type="button" className="tt-btn-ghost" onClick={onClose}>إلغاء</button>
                    <button type="submit" className="tt-btn-primary" disabled={isPending || !name.trim()}>
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        {isEdit ? "حفظ" : "إنشاء"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

/* ─── Actions Dropdown ─── */
function ActionsDropdown({ onEdit, onMembers, onDelete, memberCount }: {
    onEdit: () => void; onMembers: () => void; onDelete: () => void; memberCount: number
}) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: "relative", zIndex: open ? 20 : 1 }}>
            <button className="tt-actions-btn" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
                <MoreVertical size={14} />
            </button>
            {open && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 15 }} onClick={() => setOpen(false)} />
                    <div className="tt-actions-menu" dir="rtl">
                        <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.UPDATE_TEAM}>
                            <button onClick={() => { onEdit(); setOpen(false) }}>
                                <Pencil size={12} /> تعديل
                            </button>
                        </ActionGuard>
                        <button onClick={() => { onMembers(); setOpen(false) }}>
                            <Users size={12} /> الأعضاء ({memberCount})
                        </button>
                        <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.DELETE_TEAM}>
                            <button className="danger" onClick={() => { onDelete(); setOpen(false) }}>
                                <Trash2 size={12} /> حذف
                            </button>
                        </ActionGuard>
                    </div>
                </>
            )}
        </div>
    )
}

/* ─── Members Modal ─── */
function MembersModal({ team, onClose, tenantId }: { team: Team; onClose: () => void; tenantId: string }) {
    const { canPerformAction } = usePermissions()
    const canViewMembers = canPerformAction(PAGE_BITS.TEAMS, ACTION_BITS.GET_TEAM_MEMBERS)

    const { data: membersData, isLoading } = useTeamMembers(tenantId, team.team_id)
    const addMut = useAddTeamMember(tenantId)
    const removeMut = useRemoveTeamMember(tenantId)
    const [showAdd, setShowAdd] = useState(false)
    const [addSearch, setAddSearch] = useState("")

    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })

    const members = membersData?.members ?? []
    const allUsers = briefData?.users ?? []
    const memberIds = new Set(members.map(m => m.user_id))
    const available = allUsers.filter(u =>
        !memberIds.has(u.user_id) &&
        u.name.toLowerCase().includes(addSearch.toLowerCase())
    )

    return (
        <Modal title={`أعضاء — ${team.name}`} width={480} onClose={onClose}>
            {/* ── فحص صلاحية عرض الأعضاء ── */}
            {!canViewMembers ? (
                <div style={{ textAlign: "center", padding: "36px 0" }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        background: "rgba(245,158,11,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                    }}>
                        <Lock size={18} style={{ color: "var(--t-warning)" }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, var(--t-text))", margin: "0 0 4px" }}>لا توجد صلاحية</p>
                    <p style={{ fontSize: 11, color: "var(--t-text-faint)", margin: 0 }}>ليس لديك صلاحية عرض أعضاء الفريق</p>
                </div>
            ) : (
                <>
                    {/* Add button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-faint)" }}>
                            {members.length} عضو
                        </span>
                        <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.UPDATE_TEAM_MEMBERS}>
                            <button className="tt-btn-primary" style={{ padding: "5px 12px", fontSize: 11 }}
                                onClick={() => setShowAdd(!showAdd)}>
                                {showAdd ? <X size={12} /> : <UserPlus size={12} />}
                                {showAdd ? "إلغاء" : "إضافة"}
                            </button>
                        </ActionGuard>
                    </div>

                    {/* Add dropdown */}
                    {showAdd && (
                        <div style={{
                            marginBottom: 10, padding: 10, borderRadius: 10,
                            border: "1px solid #eaedf0", background: "#fafbfc",
                            animation: "ttMenuIn .15s ease-out",
                        }}>
                            <input className="tt-field" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                                placeholder="ابحث عن موظف..." style={{ fontSize: 11, padding: "7px 10px", marginBottom: 6 }} autoFocus />
                            <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                                {available.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "10px 0", fontSize: 10, color: "var(--t-text-faint)" }}>لا يوجد</div>
                                ) : available.map(u => (
                                    <button key={u.user_id}
                                        onClick={() => addMut.mutate({ teamId: team.team_id, userId: u.user_id })}
                                        disabled={addMut.isPending}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 7,
                                            padding: "6px 8px", borderRadius: 7, border: "none",
                                            background: "transparent", cursor: "pointer",
                                            fontSize: 11, color: "var(--t-text, var(--t-text-secondary))", fontFamily: "inherit",
                                            textAlign: "right", width: "100%", transition: "background .08s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "#f0f1f3" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        <div style={{
                                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                            background: AVATAR_GRADIENTS[hashCode(u.user_id) % AVATAR_GRADIENTS.length],
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 9, fontWeight: 700, color: "#fff",
                                        }}>
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ flex: 1 }}>{u.name}</span>
                                        <UserPlus size={10} style={{ color: "var(--t-accent)" }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Members list */}
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "28px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-accent)", fontSize: 11 }}>
                            <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                        </div>
                    ) : members.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "28px 0" }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: "rgba(27,80,145,.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 8px",
                            }}>
                                <Users size={20} style={{ color: "var(--t-accent)" }} />
                            </div>
                            <div style={{ fontSize: 12, color: "var(--t-text-faint)" }}>لا يوجد أعضاء</div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {members.map(member => {
                                const initials = member.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                                const gradient = AVATAR_GRADIENTS[hashCode(member.user_id) % AVATAR_GRADIENTS.length]
                                return (
                                    <div key={member.user_id} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "9px 12px", borderRadius: 10,
                                        border: "1px solid #eaedf0", background: "#fff",
                                        transition: "all .12s",
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-border-medium)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.03)" }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#eaedf0"; e.currentTarget.style.boxShadow = "none" }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {member.profile_picture ? (
                                                <img src={member.profile_picture} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }}
                                                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                                            ) : (
                                                <div style={{
                                                    width: 30, height: 30, borderRadius: 8,
                                                    background: gradient,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 10, fontWeight: 700, color: "#fff",
                                                }}>
                                                    {initials}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, var(--t-text))" }}>{member.full_name}</span>
                                                    {!member.is_active && (
                                                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(239,68,68,.06)", color: "var(--t-danger)", fontWeight: 700 }}>غير نشط</span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
                                                    {member.email && (
                                                        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: "var(--t-text-faint)" }}>
                                                            <Mail size={9} /> {member.email}
                                                        </span>
                                                    )}
                                                    {member.role && (
                                                        <span style={{
                                                            display: "flex", alignItems: "center", gap: 2,
                                                            fontSize: 9, fontWeight: 700,
                                                            padding: "1px 6px", borderRadius: 4,
                                                            background: "rgba(27,80,145,.04)", color: "var(--t-accent)",
                                                        }}>
                                                            <Shield size={8} /> {member.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.UPDATE_TEAM_MEMBERS}>
                                            <button
                                                onClick={() => removeMut.mutate({ teamId: team.team_id, userId: member.user_id })}
                                                disabled={removeMut.isPending}
                                                style={{
                                                    width: 26, height: 26, borderRadius: 7, border: "none",
                                                    background: "rgba(239,68,68,.06)", color: "var(--t-danger)",
                                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all .12s",
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.12)" }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,.06)" }}
                                                title="إزالة"
                                            >
                                                {removeMut.isPending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={11} />}
                                            </button>
                                        </ActionGuard>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </Modal>
    )
}

/* ═══════════════════════════════════════
   Main
═══════════════════════════════════════ */
export function TeamsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""

    const { data: teams = [], isLoading } = useTeams(tid)
    const deleteMut = useDeleteTeam(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editTeam, setEditTeam] = useState<Team | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)
    const [membersTeam, setMembersTeam] = useState<Team | null>(null)
    const [sortField, setSortField] = useState<"name" | "created_at">("name")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
    const [searchFocused, setSearchFocused] = useState(false)
    const [activeTab, setActiveTab] = useState<"active" | "deleted">("active")
    const [deletedPage, setDeletedPage] = useState(1)

    const { data: deletedData, isLoading: isLoadingDeleted } = useDeletedTeams(tid, deletedPage, 20)
    const restoreMut = useRestoreTeam(tid)

    const activeTeams = teams.filter(t => t.is_active !== false)
    const filtered = activeTeams
        .filter(t =>
            !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.team_id.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1
            if (sortField === "name") return a.name.localeCompare(b.name) * dir
            return ((a.created_at ?? "") > (b.created_at ?? "") ? 1 : -1) * dir
        })

    const toggleSort = (field: "name" | "created_at") => {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDir("asc") }
    }

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Tab Switcher */}
                    <div className="tt-tab-bar">
                        <button className={`tt-tab ${activeTab === "active" ? "active" : ""}`}
                            onClick={() => setActiveTab("active")}>
                            نشطة <span className="tt-tab-count">{activeTeams.length}</span>
                        </button>
                        <button className={`tt-tab ${activeTab === "deleted" ? "active" : ""}`}
                            onClick={() => { setActiveTab("deleted"); setDeletedPage(1) }}>
                            معطلة {deletedData?.total ? <span className="tt-tab-count">{deletedData.total}</span> : null}
                        </button>
                    </div>
                    {activeTab === "active" && (
                        <div style={{ position: "relative", width: 200 }}>
                            <Search size={13} style={{
                                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                color: searchFocused ? "var(--t-accent)" : "var(--t-text-faint)",
                                pointerEvents: "none", transition: "color .15s",
                            }} />
                            <input className="tt-field" value={search}
                                onChange={e => setSearch(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                placeholder="بحث في الفرق" style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.CREATE_TEAM}>
                        <button className="tt-btn-primary" onClick={() => { setEditTeam(undefined); setShowForm(true) }}>
                            <Plus size={13} /> فريق جديد
                        </button>
                    </ActionGuard>
                </div>
            </div>

            {/* Content */}
            {activeTab === "active" ? (
                <div style={{ borderRadius: 12, border: "1px solid #eaedf0", background: "#fff", overflow: "visible" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-accent)", fontSize: 12 }}>
                            <Loader2 size={16} className="animate-spin" /> جاري التحميل...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: "rgba(27,80,145,.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 10px",
                            }}>
                                <Users size={24} style={{ color: "var(--t-accent)" }} />
                            </div>
                            <div style={{ fontSize: 13, color: "var(--t-text, var(--t-text))", fontWeight: 600 }}>
                                {search ? "لا توجد نتائج" : "لا توجد فرق بعد"}
                            </div>
                            {!search && (
                                <button className="tt-btn-primary" onClick={() => { setEditTeam(undefined); setShowForm(true) }} style={{ marginTop: 12 }}>
                                    <Plus size={13} /> أضف أول فريق
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="tt-table">
                            <thead>
                                <tr>
                                    <th><span className="tt-th-sort" onClick={() => toggleSort("name")}>الاسم <ArrowUpDown size={10} style={{ opacity: sortField === "name" ? 1 : .3 }} /></span></th>
                                    <th>الوصف</th>
                                    <th>الأعضاء</th>
                                    <th><span className="tt-th-sort" onClick={() => toggleSort("created_at")}>تاريخ الإنشاء <ArrowUpDown size={10} style={{ opacity: sortField === "created_at" ? 1 : .3 }} /></span></th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(team => (
                                    <tr key={team.id ?? team.team_id}>
                                        <td>
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                    background: AVATAR_GRADIENTS[hashCode(team.team_id) % AVATAR_GRADIENTS.length],
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                }}>
                                                    <Users size={12} style={{ color: "#fff" }} />
                                                </div>
                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{team.name}</span>
                                            </div>
                                        </td>
                                        <td><span style={{ color: "var(--t-text-muted)", fontSize: 11 }}>{team.description || "—"}</span></td>
                                        <td>
                                            <button className="tt-btn-ghost" style={{ padding: "3px 8px", gap: 3, fontSize: 10 }}
                                                onClick={() => setMembersTeam(team)}>
                                                <Users size={10} /> {team.members?.length ?? 0}
                                            </button>
                                        </td>
                                        <td><span style={{ fontSize: 11, color: "var(--t-text-muted)", whiteSpace: "nowrap" }}>{fmtDate(team.created_at)}</span></td>
                                        <td>
                                            <span className={`tt-status-badge ${team.is_active !== false ? "active" : "inactive"}`}>
                                                {team.is_active !== false ? "نشط" : "معطّل"}
                                            </span>
                                        </td>
                                        <td>
                                            <ActionsDropdown
                                                onEdit={() => { setEditTeam(team); setShowForm(true) }}
                                                onMembers={() => setMembersTeam(team)}
                                                onDelete={() => setDeleteTarget(team)}
                                                memberCount={team.members?.length ?? 0}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                /* ─── Deleted Teams View ─── */
                <div style={{ borderRadius: 12, border: "1px solid #eaedf0", background: "#fff", overflow: "visible" }}>
                    {isLoadingDeleted ? (
                        <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-accent)", fontSize: 12 }}>
                            <Loader2 size={16} className="animate-spin" /> جاري التحميل...
                        </div>
                    ) : !deletedData?.items?.length ? (
                        <div style={{ textAlign: "center", padding: "48px 0" }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: "rgba(27,80,145,.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 10px",
                            }}>
                                <Trash2 size={24} style={{ color: "var(--t-text-faint)" }} />
                            </div>
                            <div style={{ fontSize: 13, color: "var(--t-text-faint)", fontWeight: 600 }}>
                                لا توجد فرق معطلة
                            </div>
                        </div>
                    ) : (
                        <>
                            <table className="tt-table">
                                <thead>
                                    <tr>
                                        <th>الاسم</th>
                                        <th>الوصف</th>
                                        <th>الأعضاء</th>
                                        <th>تاريخ التعطيل</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedData.items.map(team => (
                                        <tr key={team.id ?? team.team_id} style={{ opacity: .75 }}>
                                            <td>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                                        background: "var(--t-border-medium)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                    }}>
                                                        <Users size={12} style={{ color: "#fff" }} />
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{team.name}</span>
                                                </div>
                                            </td>
                                            <td><span style={{ color: "var(--t-text-muted)", fontSize: 11 }}>{team.description || "—"}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-muted)" }}>{team.members?.length ?? 0}</span></td>
                                            <td><span style={{ fontSize: 11, color: "var(--t-text-muted)", whiteSpace: "nowrap" }}>{fmtDate(team.deactivated_at ?? team.updated_at)}</span></td>
                                            <td>
                                                <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.UPDATE_TEAM}>
                                                    <button className="tt-restore-btn"
                                                        disabled={restoreMut.isPending}
                                                        onClick={() => restoreMut.mutate(team.team_id)}>
                                                        {restoreMut.isPending ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                                                        استعادة
                                                    </button>
                                                </ActionGuard>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination */}
                            {deletedData.total_pages > 1 && (
                                <div className="tt-pagination">
                                    <button disabled={!deletedData.has_previous}
                                        onClick={() => setDeletedPage(p => Math.max(1, p - 1))}>
                                        <ChevronRight size={12} /> السابق
                                    </button>
                                    <span>{deletedData.page} / {deletedData.total_pages}</span>
                                    <button disabled={!deletedData.has_next}
                                        onClick={() => setDeletedPage(p => p + 1)}>
                                        التالي <ChevronLeft size={12} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            {showForm && <TeamFormModal team={editTeam} tenantId={tid} onClose={() => setShowForm(false)} />}

            {deleteTarget && (
                <Modal title="تأكيد التعطيل" width={360} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(239,68,68,.08)", margin: "0 auto 12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle size={20} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))", marginBottom: 4 }}>
                            تعطيل فريق «{deleteTarget.name}»؟
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 16 }}>
                            سيتم تعطيل الفريق ويمكنك استعادته لاحقاً
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="tt-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button
                                disabled={deleteMut.isPending}
                                onClick={() => deleteMut.mutate(deleteTarget.team_id, { onSuccess: r => { if (r.success) setDeleteTarget(null) } })}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 18px", borderRadius: 8, border: "none",
                                    background: "var(--t-danger)", color: "#fff",
                                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                    boxShadow: "0 1px 3px rgba(220,38,38,.15)",
                                }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} تعطيل
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {membersTeam && (
                <MembersModal team={membersTeam} tenantId={tid} onClose={() => setMembersTeam(null)} />
            )}
        </div>
    )
}
