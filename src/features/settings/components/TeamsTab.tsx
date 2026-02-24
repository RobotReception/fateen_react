import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
    useTeams, useTeamStats, useCreateTeam, useUpdateTeam, useDeleteTeam,
} from "../hooks/use-teams-tags"
import type { Team } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, Users, X, Loader2, Search, AlertTriangle, Check,
    TrendingUp, UserCheck, UserMinus, BarChart2,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ── shared CSS ── */
const CSS = `
.tt-card { border-radius:12px; border:1px solid var(--t-border); background:var(--t-card); padding:16px 18px; }
.tt-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; transition:border-color .15s; box-sizing:border-box; }
.tt-field:focus { border-color:var(--t-accent); }
.tt-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--t-text-faint); display:block; margin-bottom:5px; }
.tt-btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:9px; border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:13px; font-weight:700; cursor:pointer; transition:opacity .15s; }
.tt-btn-primary:hover { opacity:.88; }
.tt-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:9px; border:1.5px solid var(--t-border); background:transparent; color:var(--t-text); font-size:12px; font-weight:600; cursor:pointer; }
.tt-btn-danger { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:9px; border:none; background:rgba(239,68,68,.1); color:var(--t-danger); font-size:12px; font-weight:700; cursor:pointer; }
.tt-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.tt-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media(max-width:640px){.tt-grid-4{grid-template-columns:repeat(2,1fr);}}
@keyframes ttIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

/* ── Modal shell ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: 520, margin: 16, animation: "ttIn .15s ease-out" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--t-border-light)" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex" }}><X size={17} /></button>
                </div>
                <div style={{ padding: "18px 20px" }}>{children}</div>
            </div>
        </div>
    )
}

/* ── Team Create / Edit Form ── */
function TeamFormModal({ team, onClose, tenantId }: { team?: Team; onClose: () => void; tenantId: string }) {
    const createMut = useCreateTeam(tenantId)
    const updateMut = useUpdateTeam(tenantId)
    const isEdit = !!team

    const [name, setName] = useState(team?.name ?? "")
    const [nameAr, setNameAr] = useState(team?.name_ar ?? "")
    const [nameEn, setNameEn] = useState(team?.name_en ?? "")
    const [desc, setDesc] = useState(team?.description ?? "")

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const base = { name, name_ar: nameAr || undefined, name_en: nameEn || undefined, description: desc || undefined }
        if (isEdit) {
            updateMut.mutate({ teamId: team.team_id, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    return (
        <Modal title={isEdit ? "تعديل الفريق" : "فريق جديد"} onClose={onClose}>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* الاسم الرئيسي */}
                <div>
                    <label className="tt-label">اسم الفريق *</label>
                    <input className="tt-field" value={name} onChange={e => setName(e.target.value)} placeholder="فريق المبيعات" required />
                </div>
                {/* الاسمان المحليان */}
                <div className="tt-grid-2">
                    <div>
                        <label className="tt-label">الاسم بالعربية</label>
                        <input className="tt-field" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="فريق المبيعات" />
                    </div>
                    <div>
                        <label className="tt-label">الاسم بالإنجليزية</label>
                        <input className="tt-field" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Sales Team" />
                    </div>
                </div>
                {/* الوصف */}
                <div>
                    <label className="tt-label">الوصف</label>
                    <textarea className="tt-field" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف اختياري لدور الفريق" style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                    <button type="button" className="tt-btn-ghost" onClick={onClose}>إلغاء</button>
                    <button type="submit" className="tt-btn-primary" disabled={isPending}>
                        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        {isEdit ? "حفظ" : "إنشاء"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

/* ── Confirm Delete ── */
function ConfirmDeleteModal({ label, onClose, onConfirm, loading }: {
    label: string; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
    return (
        <Modal title="تأكيد الحذف" onClose={onClose}>
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,.1)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />
                </div>
                <div style={{ fontSize: 14, color: "var(--t-text)", fontWeight: 600, marginBottom: 6 }}>حذف {label}؟</div>
                <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 18 }}>لا يمكن التراجع عن هذا الإجراء</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="tt-btn-ghost" onClick={onClose}>إلغاء</button>
                    <button className="tt-btn-danger" onClick={onConfirm} disabled={loading} style={{ padding: "7px 18px", border: "none", background: "var(--t-danger)", color: "#fff" }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} حذف
                    </button>
                </div>
            </div>
        </Modal>
    )
}

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, color }: {
    label: string; value: number | string; icon: React.ElementType; color: string
}) {
    return (
        <div className="tt-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--t-text)" }}>{value}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
            </div>
        </div>
    )
}

/* ════════════════════════════════════
   Main Component
════════════════════════════════════ */
export function TeamsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""

    const { data: teams = [], isLoading } = useTeams(tid)
    const { data: stats } = useTeamStats(tid)
    const deleteMut = useDeleteTeam(tid)

    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editTeam, setEditTeam] = useState<Team | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Team | null>(null)

    const filtered = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.team_id.toLowerCase().includes(search.toLowerCase())
    )

    const gs = stats?.general_statistics

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* ── General Statistics ── */}
            {gs && (
                <div className="tt-grid-4" style={{ marginBottom: 20 }}>
                    <StatCard label="إجمالي العملاء" value={gs.total_customers} icon={Users} color="#6366f1" />
                    <StatCard label="عملاء معيّنون" value={gs.assigned_customers} icon={UserCheck} color="#10b981" />
                    <StatCard label="غير معيّنون" value={gs.unassigned_customers} icon={UserMinus} color="#f59e0b" />
                    <StatCard label="معدل التعيين" value={`${gs.assignment_rate}%`} icon={TrendingUp} color="#3b82f6" />
                </div>
            )}

            {/* ── Team-level stats mini table ── */}
            {stats?.teams_statistics && stats.teams_statistics.length > 0 && (
                <div className="tt-card" style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <BarChart2 size={14} style={{ color: "var(--t-accent)" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)" }}>إحصائيات الفرق</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {stats.teams_statistics.map(row => (
                            <div key={row.team_name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--t-border-light)" }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text)" }}>{row.team_name}</span>
                                <div style={{ display: "flex", gap: 16 }}>
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>
                                        <span style={{ color: "#10b981", fontWeight: 700 }}>{row.members_count}</span> عضو
                                    </span>
                                    <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>
                                        <span style={{ color: "#6366f1", fontWeight: 700 }}>{row.customers_count}</span> عميل
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="tt-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في الفرق..." style={{ paddingRight: 36 }} />
                </div>
                <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.CREATE_TEAM}>
                    <button className="tt-btn-primary" onClick={() => { setEditTeam(undefined); setShowForm(true) }}>
                        <Plus size={14} /> فريق جديد
                    </button>
                </ActionGuard>
            </div>

            {/* ── Team List ── */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t-text-faint)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Loader2 size={18} className="animate-spin" /> جاري التحميل...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <Users size={32} style={{ margin: "0 auto 10px", display: "block", opacity: .25 }} />
                    <div style={{ fontSize: 14, color: "var(--t-text-faint)", fontWeight: 600 }}>لا توجد فرق</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map(team => (
                        <div key={team.id ?? team.team_id} className="tt-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--t-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Users size={17} style={{ color: "var(--t-text-on-accent)" }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{team.name}</div>
                                    {/* Show localised names if different from main name */}
                                    {(team.name_ar || team.name_en) && (
                                        <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 1 }}>
                                            {[team.name_ar, team.name_en].filter(Boolean).join(" · ")}
                                        </div>
                                    )}
                                    <div style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace", marginTop: 1 }}>{team.team_id}</div>
                                    {team.description && <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>{team.description}</div>}
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {team.members != null && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "var(--t-surface)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-light)", whiteSpace: "nowrap" }}>
                                        {team.members.length} عضو
                                    </span>
                                )}
                                <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.UPDATE_TEAM}>
                                    <button className="tt-btn-ghost" onClick={() => { setEditTeam(team); setShowForm(true) }} style={{ padding: "6px 10px" }}>
                                        <Pencil size={13} />
                                    </button>
                                </ActionGuard>
                                <ActionGuard pageBit={PAGE_BITS.TEAMS} actionBit={ACTION_BITS.DELETE_TEAM}>
                                    <button className="tt-btn-danger" onClick={() => setDeleteTarget(team)} style={{ padding: "6px 10px" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </ActionGuard>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            {showForm && <TeamFormModal team={editTeam} tenantId={tid} onClose={() => setShowForm(false)} />}
            {deleteTarget && (
                <ConfirmDeleteModal
                    label={deleteTarget.name}
                    onClose={() => setDeleteTarget(null)}
                    loading={deleteMut.isPending}
                    onConfirm={() => deleteMut.mutate(deleteTarget.team_id, { onSuccess: r => { if (r.success) setDeleteTarget(null) } })}
                />
            )}
        </div>
    )
}
