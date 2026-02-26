import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth-store"
import {
    useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam,
    useTeamMembers, useAddTeamMember, useRemoveTeamMember,
} from "../hooks/use-teams-tags"
import type { Team } from "../types/teams-tags"
import { getBriefUsers } from "@/features/inbox/services/inbox-service"
import {
    Plus, Trash2, Pencil, Users, X, Loader2, Search, AlertTriangle, Check,
    MoreVertical, UserPlus, Mail, Shield, ChevronDown,
    ArrowUpDown,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.tt-table { width:100%; border-collapse:separate; border-spacing:0; }
.tt-table thead th {
    padding:8px 12px; font-size:11px; font-weight:600; color:var(--t-text-secondary);
    text-align:right; border-bottom:1px solid var(--t-border); white-space:nowrap;
    background:var(--t-surface);
}
.tt-table tbody td {
    padding:9px 12px; font-size:12px; color:var(--t-text); border-bottom:1px solid var(--t-border-light);
    vertical-align:middle;
}
.tt-table tbody tr { transition:background .1s; }
.tt-table tbody tr:hover { background:color-mix(in srgb,var(--t-accent) 3%,transparent); }
.tt-table tbody tr:last-child td { border-bottom:none; }
.tt-th-sort { display:inline-flex; align-items:center; gap:3px; cursor:pointer; user-select:none; }
.tt-th-sort:hover { color:var(--t-accent); }

.tt-field {
    width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--t-border);
    background:var(--t-surface); font-size:12px; color:var(--t-text); outline:none;
    transition:border-color .15s,box-shadow .15s; box-sizing:border-box; font-family:inherit;
}
.tt-field:focus { border-color:var(--t-accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--t-accent) 10%,transparent); }
.tt-field::placeholder { color:var(--t-text-faint); opacity:.6; }

.tt-label { font-size:11px; font-weight:700; color:var(--t-text-secondary); display:block; margin-bottom:4px; }

.tt-btn-primary {
    display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px;
    border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:12px;
    font-weight:700; cursor:pointer; transition:opacity .12s; font-family:inherit;
}
.tt-btn-primary:hover:not(:disabled) { opacity:.88; }
.tt-btn-primary:disabled { opacity:.5; cursor:not-allowed; }

.tt-btn-ghost {
    display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px;
    border:1.5px solid var(--t-border); background:transparent; color:var(--t-text);
    font-size:11px; font-weight:600; cursor:pointer; transition:all .12s; font-family:inherit;
}
.tt-btn-ghost:hover { border-color:var(--t-accent); color:var(--t-accent); }

.tt-actions-btn {
    width:26px; height:26px; border-radius:6px; border:none; background:transparent;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:var(--t-text-faint); transition:all .1s;
}
.tt-actions-btn:hover { background:var(--t-surface); color:var(--t-text); }

.tt-actions-menu {
    position:absolute; left:0; top:100%; margin-top:2px; z-index:20;
    background:var(--t-card); border:1px solid var(--t-border); border-radius:8px;
    box-shadow:0 6px 20px rgba(0,0,0,.1); min-width:130px; padding:3px;
    animation:ttMenuIn .1s ease-out;
}
.tt-actions-menu button {
    width:100%; padding:6px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:6px; border-radius:6px;
    font-size:11px; font-weight:600; color:var(--t-text); transition:background .08s;
    font-family:inherit; text-align:right;
}
.tt-actions-menu button:hover { background:var(--t-surface); }
.tt-actions-menu button.danger { color:var(--t-danger); }
.tt-actions-menu button.danger:hover { background:rgba(239,68,68,.06); }

/* Member chip */
.tt-member-chip {
    display:inline-flex; align-items:center; gap:4px; padding:3px 8px 3px 4px;
    border-radius:6px; background:var(--t-surface); border:1px solid var(--t-border-light);
    font-size:11px; font-weight:600; color:var(--t-text);
}
.tt-member-chip button {
    display:flex; align-items:center; justify-content:center; width:14px; height:14px;
    border-radius:4px; border:none; background:transparent; cursor:pointer;
    color:var(--t-text-faint); transition:all .1s; padding:0;
}
.tt-member-chip button:hover { background:rgba(239,68,68,.1); color:var(--t-danger); }

/* Members selector */
.tt-members-dropdown {
    position:absolute; left:0; right:0; top:100%; margin-top:2px; z-index:10;
    background:var(--t-card); border:1px solid var(--t-border); border-radius:8px;
    box-shadow:0 6px 20px rgba(0,0,0,.1); max-height:180px; overflow-y:auto;
    animation:ttMenuIn .1s ease-out;
}
.tt-members-dropdown button {
    width:100%; padding:7px 10px; border:none; background:transparent; cursor:pointer;
    display:flex; align-items:center; gap:8px; font-size:11px; font-weight:500;
    color:var(--t-text); transition:background .08s; font-family:inherit; text-align:right;
}
.tt-members-dropdown button:hover { background:var(--t-surface); }

@keyframes ttIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes ttMenuIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
`

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
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 14, background: "var(--t-card)", border: "1px solid var(--t-border)",
                width: "100%", maxWidth: width, margin: 16, animation: "ttIn .15s ease-out",
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 12px 40px rgba(0,0,0,.1)",
            }}>
                <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    padding: "14px 16px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0,
                }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                        {subtitle && <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>{subtitle}</div>}
                    </div>
                    <button onClick={onClose} style={{
                        width: 24, height: 24, borderRadius: 6, background: "transparent",
                        border: "none", cursor: "pointer", color: "var(--t-text-faint)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
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

    // Fetch brief users for the members selector
    const { data: briefData } = useQuery({
        queryKey: ["brief-users"],
        queryFn: () => getBriefUsers(1, 100),
        staleTime: 5 * 60 * 1000,
    })

    // Fetch current members if editing
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
                {/* Team Name */}
                <div>
                    <label className="tt-label">اسم الفريق</label>
                    <input className="tt-field" value={name} onChange={e => setName(e.target.value)}
                        placeholder="الاستقبال" required />
                </div>

                {/* Description */}
                <div>
                    <label className="tt-label">وصف الفريق</label>
                    <textarea className="tt-field" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder="أضف وصفاً للفريق مثلاً: إدارة جهات اتصال التسويق."
                        style={{ resize: "vertical", lineHeight: 1.4 }} />
                </div>

                {/* Team Members (only in edit mode) */}
                {isEdit && (
                    <div>
                        <label className="tt-label">أعضاء الفريق</label>

                        {/* Selected members chips */}
                        <div style={{ position: "relative" }}>
                            <div
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{
                                    display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
                                    padding: "6px 10px", minHeight: 36,
                                    borderRadius: 8, border: "1.5px solid var(--t-border)",
                                    background: "var(--t-surface)", cursor: "pointer",
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

                            {/* Dropdown */}
                            {showDropdown && (
                                <>
                                    <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowDropdown(false)} />
                                    <div className="tt-members-dropdown">
                                        <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--t-border-light)" }}>
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
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
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

                {/* Actions */}
                <div style={{
                    display: "flex", gap: 8, justifyContent: "flex-end",
                    paddingTop: 6, borderTop: "1px solid var(--t-border-light)", marginTop: 2,
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
            {/* Add button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-faint)" }}>
                    {members.length} عضو
                </span>
                <button className="tt-btn-primary" style={{ padding: "5px 12px", fontSize: 11 }}
                    onClick={() => setShowAdd(!showAdd)}>
                    <UserPlus size={12} /> إضافة
                </button>
            </div>

            {/* Add dropdown */}
            {showAdd && (
                <div style={{
                    marginBottom: 10, padding: 8, borderRadius: 8,
                    border: "1px solid var(--t-border-light)", background: "var(--t-surface)",
                }}>
                    <input className="tt-field" value={addSearch} onChange={e => setAddSearch(e.target.value)}
                        placeholder="ابحث عن موظف..." style={{ fontSize: 11, padding: "6px 10px", marginBottom: 6 }} autoFocus />
                    <div style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                        {available.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "8px 0", fontSize: 10, color: "var(--t-text-faint)" }}>لا يوجد</div>
                        ) : available.map(u => (
                            <button key={u.user_id}
                                onClick={() => addMut.mutate({ teamId: team.team_id, userId: u.user_id })}
                                disabled={addMut.isPending}
                                style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "6px 8px", borderRadius: 6, border: "none",
                                    background: "transparent", cursor: "pointer",
                                    fontSize: 11, color: "var(--t-text)", fontFamily: "inherit",
                                    textAlign: "right", width: "100%", transition: "background .08s",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 9, fontWeight: 700, color: "#fff",
                                }}>
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ flex: 1 }}>{u.name}</span>
                                <UserPlus size={10} style={{ color: "var(--t-text-faint)" }} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Members list */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--t-text-faint)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11 }}>
                    <Loader2 size={14} className="animate-spin" /> جاري التحميل...
                </div>
            ) : members.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Users size={24} style={{ margin: "0 auto 6px", display: "block", opacity: .2 }} />
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>لا يوجد أعضاء</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {members.map(member => {
                        const initials = member.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                        return (
                            <div key={member.user_id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "8px 10px", borderRadius: 8,
                                border: "1px solid var(--t-border-light)", background: "var(--t-surface)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {member.profile_picture ? (
                                        <img src={member.profile_picture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                                            onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                                    ) : (
                                        <div style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 10, fontWeight: 700, color: "#fff",
                                        }}>
                                            {initials}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text)" }}>{member.full_name}</span>
                                            {!member.is_active && (
                                                <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(239,68,68,.1)", color: "#ef4444", fontWeight: 700 }}>غير نشط</span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
                                            {member.email && (
                                                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, color: "var(--t-text-faint)" }}>
                                                    <Mail size={9} /> {member.email}
                                                </span>
                                            )}
                                            {member.role && (
                                                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "var(--t-card)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-light)" }}>
                                                    <Shield size={8} /> {member.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeMut.mutate({ teamId: team.team_id, userId: member.user_id })}
                                    disabled={removeMut.isPending}
                                    style={{
                                        width: 24, height: 24, borderRadius: 6, border: "none",
                                        background: "rgba(239,68,68,.08)", color: "var(--t-danger)",
                                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    }}
                                    title="إزالة"
                                >
                                    {removeMut.isPending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={11} />}
                                </button>
                            </div>
                        )
                    })}
                </div>
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

    const filtered = teams
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ position: "relative", width: 200 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="tt-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الفرق" style={{ paddingInlineEnd: 32, fontSize: 11 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.CREATE_TEAM}>
                    <button className="tt-btn-primary" onClick={() => { setEditTeam(undefined); setShowForm(true) }}>
                        <Plus size={13} /> + فريق جديد
                    </button>
                </ActionGuard>
            </div>

            {/* Table */}
            <div style={{ borderRadius: 10, border: "1px solid var(--t-border)", background: "var(--t-card)", overflow: "visible" }}>
                {isLoading ? (
                    <div style={{ textAlign: "center", padding: "40px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--t-text-faint)", fontSize: 12 }}>
                        <Loader2 size={15} className="animate-spin" /> جاري التحميل...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <Users size={28} style={{ margin: "0 auto 8px", display: "block", color: "var(--t-text-faint)", opacity: .25 }} />
                        <div style={{ fontSize: 13, color: "var(--t-text-secondary)", fontWeight: 600 }}>
                            {search ? "لا توجد نتائج" : "لا توجد فرق بعد"}
                        </div>
                        {!search && (
                            <button className="tt-btn-primary" onClick={() => { setEditTeam(undefined); setShowForm(true) }} style={{ marginTop: 10 }}>
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
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(team => (
                                <tr key={team.id ?? team.team_id}>
                                    <td>
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                                                background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Users size={11} style={{ color: "var(--t-accent)" }} />
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{team.name}</span>
                                        </div>
                                    </td>
                                    <td><span style={{ color: "var(--t-text-secondary)", fontSize: 11 }}>{team.description || "—"}</span></td>
                                    <td>
                                        <button className="tt-btn-ghost" style={{ padding: "3px 8px", gap: 3, fontSize: 10 }}
                                            onClick={() => setMembersTeam(team)}>
                                            <Users size={10} /> {team.members?.length ?? 0}
                                        </button>
                                    </td>
                                    <td><span style={{ fontSize: 11, color: "var(--t-text-secondary)", whiteSpace: "nowrap" }}>{fmtDate(team.created_at)}</span></td>
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

            {/* Modals */}
            {showForm && <TeamFormModal team={editTeam} tenantId={tid} onClose={() => setShowForm(false)} />}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={360} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(239,68,68,.08)", margin: "0 auto 12px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <AlertTriangle size={20} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>
                            حذف فريق «{deleteTarget.name}»؟
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginBottom: 16 }}>
                            لا يمكن التراجع عن هذا الإجراء
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
                                }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
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
