import { useState, useCallback, useEffect } from "react"
import {
    Plus,
    Trash2,
    Edit3,
    Search,
    X,
    Link2,
    Loader2,
    AlertCircle,
    User,
    Users,
    Building,
    ArrowUpDown,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Assignment, AssignmentType, Template, CreateAssignmentPayload, UpdateAssignmentPayload } from "../types"

const TYPE_CONFIG: Record<AssignmentType, { label: string; color: string; bg: string; icon: typeof User; priority: number }> = {
    account: { label: "حساب", color: "#1976d2", bg: "rgba(25,118,210,0.08)", icon: User, priority: 100 },
    group: { label: "مجموعة", color: "#7b1fa2", bg: "rgba(123,31,162,0.08)", icon: Users, priority: 50 },
    tenant: { label: "مستأجر", color: "#2e7d32", bg: "rgba(46,125,50,0.08)", icon: Building, priority: 10 },
}

interface AssignmentsTabProps {
    onNavigateToTab?: (tab: string) => void
}

export function AssignmentsTab(_props: AssignmentsTabProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState<AssignmentType | "">("")
    const [showCreate, setShowCreate] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form
    const [formType, setFormType] = useState<AssignmentType>("account")
    const [formTargetId, setFormTargetId] = useState("")
    const [formTemplateId, setFormTemplateId] = useState("")
    const [formPriority, setFormPriority] = useState(100)
    const [formActive, setFormActive] = useState(true)

    const fetchAssignments = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [asnRes, tplRes] = await Promise.all([
                menuService.listAssignments({
                    page: 1, limit: 100,
                    assignment_type: typeFilter || undefined,
                }),
                menuService.listTemplates({ page: 1, limit: 100 }),
            ])
            setAssignments(asnRes.data.assignments || [])
            setTemplates(tplRes.data.templates || [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "حدث خطأ في جلب التعيينات")
        } finally {
            setLoading(false)
        }
    }, [typeFilter])

    useEffect(() => { fetchAssignments() }, [fetchAssignments])

    const filtered = assignments.filter((a) =>
        a.target_id.toLowerCase().includes(search.toLowerCase()) ||
        a.assignment_id.toLowerCase().includes(search.toLowerCase())
    )

    const resetForm = () => {
        setShowCreate(false)
        setEditingAssignment(null)
        setFormType("account")
        setFormTargetId("")
        setFormTemplateId("")
        setFormPriority(100)
        setFormActive(true)
    }

    const openEdit = (a: Assignment) => {
        setEditingAssignment(a)
        setFormType(a.assignment_type)
        setFormTargetId(a.target_id)
        setFormTemplateId(a.template_id)
        setFormPriority(a.priority)
        setFormActive(a.is_active)
        setShowCreate(true)
    }

    const handleSubmit = async () => {
        if (!formTargetId.trim() || !formTemplateId) return
        setSubmitting(true)
        try {
            if (editingAssignment) {
                const payload: UpdateAssignmentPayload = {
                    priority: formPriority,
                    is_active: formActive,
                }
                await menuService.updateAssignment(editingAssignment.assignment_id, payload)
            } else {
                const payload: CreateAssignmentPayload = {
                    assignment_type: formType,
                    target_id: formTargetId.trim(),
                    template_id: formTemplateId,
                    priority: formPriority,
                    is_active: formActive,
                }
                await menuService.createAssignment(payload)
            }
            resetForm()
            fetchAssignments()
        } catch {/* silent */ } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await menuService.deleteAssignment(id)
            fetchAssignments()
        } catch {/* silent */ }
    }

    const getTemplateName = (id: string) => templates.find(t => t.template_id === id)?.name || id.substring(0, 12) + "..."

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>التعيينات</h2>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", margin: "4px 0 0" }}>
                        ربط القوالب بالحسابات والمجموعات والمستأجرين
                    </p>
                </div>
                <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                    fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,71,134,0.2)",
                }}>
                    <Plus size={15} /> إنشاء تعيين
                </button>
            </div>

            {/* ── Priority Legend ── */}
            <div style={{
                display: "flex", gap: 12, marginBottom: 16, padding: "10px 14px",
                borderRadius: 10, background: "var(--t-surface, #f9fafb)",
                border: "1px solid var(--t-border-light, #e5e7eb)", flexWrap: "wrap",
            }}>
                <span style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)", fontWeight: 600 }}>نظام الأولوية:</span>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                        <cfg.icon size={11} /> {cfg.label} ({cfg.priority})
                    </span>
                ))}
            </div>

            {/* ── Filters ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", borderRadius: 10,
                    background: "var(--t-surface, #f9fafb)", border: "1px solid var(--t-border-light, #e5e7eb)",
                    flex: "1 1 200px", maxWidth: 320,
                }}>
                    <Search size={14} style={{ color: "var(--t-text-muted, #9ca3af)" }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بمعرف الهدف..."
                        style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", flex: 1, color: "var(--t-text, #1f2937)" }} />
                    {search && <X size={13} style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setSearch("")} />}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {([["", "الكل"], ["account", "حساب"], ["group", "مجموعة"], ["tenant", "مستأجر"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setTypeFilter(val as AssignmentType | "")} style={{
                            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                            border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                            borderColor: typeFilter === val ? "#004786" : "var(--t-border-light, #e5e7eb)",
                            background: typeFilter === val ? "rgba(0,71,134,0.08)" : "transparent",
                            color: typeFilter === val ? "#004786" : "var(--t-text-secondary, #6b7280)",
                        }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل التعيينات...</p>
                </div>
            )}
            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13 }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Table ── */}
            {!loading && !error && (
                <div style={{
                    borderRadius: 14, border: "1px solid var(--t-border-light, #e5e7eb)",
                    background: "var(--t-card, #fff)", overflow: "hidden",
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "var(--t-surface, #f9fafb)" }}>
                                {["النوع", "الهدف", "القالب", "الأولوية", "الحالة", "الإجراءات"].map(h => (
                                    <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", fontSize: 12, borderBottom: "1px solid var(--t-border-light, #e5e7eb)" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((a) => {
                                const tc = TYPE_CONFIG[a.assignment_type] || TYPE_CONFIG.account
                                const TIcon = tc.icon
                                return (
                                    <tr key={a.assignment_id} style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover, #fafafa)" }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                padding: "3px 10px", borderRadius: 20,
                                                background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600,
                                            }}>
                                                <TIcon size={11} /> {tc.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--t-text, #1f2937)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {a.target_id}
                                        </td>
                                        <td style={{ padding: "10px 14px", color: "var(--t-text-secondary, #6b7280)" }}>
                                            {getTemplateName(a.template_id)}
                                        </td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                padding: "2px 8px", borderRadius: 12,
                                                background: "rgba(0,71,134,0.06)", color: "#004786",
                                                fontSize: 11, fontWeight: 700,
                                            }}>
                                                <ArrowUpDown size={10} /> {a.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%",
                                                background: a.is_active ? "#16a34a" : "#9ca3af",
                                                display: "inline-block", marginLeft: 6,
                                            }} />
                                            {a.is_active ? "نشط" : "معطّل"}
                                        </td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <button onClick={() => openEdit(a)} style={iconBtnStyle} title="تعديل">
                                                    <Edit3 size={13} />
                                                </button>
                                                <button onClick={() => handleDelete(a.assignment_id)} style={{ ...iconBtnStyle, color: "#ef4444" }} title="حذف">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--t-text-muted, #9ca3af)" }}>
                                        <Link2 size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                                        <p style={{ fontSize: 14, fontWeight: 600 }}>لا توجد تعيينات</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {showCreate && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
                }} onClick={resetForm}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 460, borderRadius: 18,
                        background: "var(--t-card, #fff)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                        <div style={{ background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)", padding: "16px 20px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                                    {editingAssignment ? "تعديل التعيين" : "إنشاء تعيين جديد"}
                                </span>
                                <button onClick={resetForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}>
                                    <X size={14} style={{ color: "#fff" }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                            {!editingAssignment && (
                                <>
                                    <div>
                                        <label style={labelStyle}>نوع التعيين *</label>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {(Object.entries(TYPE_CONFIG) as [AssignmentType, typeof TYPE_CONFIG.account][]).map(([key, cfg]) => (
                                                <button key={key} onClick={() => { setFormType(key); setFormPriority(cfg.priority) }}
                                                    style={{
                                                        flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                                        border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                                                        borderColor: formType === key ? cfg.color : "var(--t-border-light, #e5e7eb)",
                                                        background: formType === key ? cfg.bg : "transparent",
                                                        color: formType === key ? cfg.color : "var(--t-text-secondary)",
                                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                                                    }}>
                                                    <cfg.icon size={13} /> {cfg.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>معرف الهدف *</label>
                                        <input value={formTargetId} onChange={(e) => setFormTargetId(e.target.value)}
                                            placeholder={formType === "tenant" ? "مثال: prideidea" : "معرف الحساب أو المجموعة"}
                                            style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>القالب *</label>
                                        <select value={formTemplateId} onChange={(e) => setFormTemplateId(e.target.value)} style={inputStyle}>
                                            <option value="">— اختر قالب —</option>
                                            {templates.map(t => (
                                                <option key={t.template_id} value={t.template_id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={labelStyle}>الأولوية</label>
                                <input type="number" value={formPriority} onChange={(e) => setFormPriority(Number(e.target.value))}
                                    min={0} max={1000} style={inputStyle} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <label style={{ ...labelStyle, margin: 0 }}>نشط</label>
                                <button onClick={() => setFormActive(!formActive)} style={{
                                    width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                                    background: formActive ? "#004786" : "#d1d5db", position: "relative", transition: "all 0.2s",
                                }}>
                                    <div style={{
                                        width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                        position: "absolute", top: 2, right: formActive ? 2 : 18,
                                        transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light, #e5e7eb)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={resetForm} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>
                                إلغاء
                            </button>
                            <button onClick={handleSubmit} disabled={submitting || (!editingAssignment && (!formTargetId.trim() || !formTemplateId))} style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: "linear-gradient(135deg, #004786, #0098d6)",
                                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                opacity: submitting || (!editingAssignment && (!formTargetId.trim() || !formTemplateId)) ? 0.6 : 1,
                            }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                {editingAssignment ? "حفظ" : "إنشاء"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}

const iconBtnStyle: React.CSSProperties = {
    background: "transparent", border: "none", borderRadius: 6,
    padding: 5, cursor: "pointer", color: "var(--t-text-muted, #9ca3af)",
    transition: "all 0.15s", display: "flex", alignItems: "center",
}

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--t-text-secondary, #6b7280)", marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid var(--t-border-light, #e5e7eb)",
    background: "var(--t-surface, #f9fafb)", fontSize: 13,
    outline: "none", color: "var(--t-text, #1f2937)",
}
