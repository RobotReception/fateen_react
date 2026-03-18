import { useState, useCallback, useEffect } from "react"
import axios from "axios"
import {
    Plus, Trash2, Edit3, Search, X, Link2, Loader2, AlertCircle,
    User, Users, Building, Save, Shield,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import { getAccounts } from "../../inbox/services/inbox-service"
import type { AccountInfo } from "../../inbox/services/inbox-service"
import type { Assignment, AssignmentType, Template, CreateAssignmentPayload, UpdateAssignmentPayload, AccountGroup } from "../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import { useAuthStore } from "@/stores/auth-store"

const TYPE_CONFIG: Record<AssignmentType, { label: string; color: string; bg: string; icon: typeof User; priority: number }> = {
    account: { label: "حساب", color: "var(--t-accent)", bg: "rgba(27,80,145,0.08)", icon: User, priority: 100 },
    group: { label: "مجموعة", color: "var(--t-accent-secondary)", bg: "var(--t-accent-muted)", icon: Users, priority: 50 },
    tenant: { label: "مستأجر", color: "#2e7d32", bg: "rgba(46,125,50,0.08)", icon: Building, priority: 10 },
}

const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))", marginBottom: 5 }
const inputSt: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-surface, var(--t-page))", fontSize: 13, outline: "none", color: "var(--t-text, #1f2937)", transition: "border-color 0.15s" }

interface AssignmentsTabProps { onNavigateToTab?: (tab: string) => void }

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
    const [formError, setFormError] = useState<string | null>(null)
    const [formType, setFormType] = useState<AssignmentType>("account")
    const [formTargetId, setFormTargetId] = useState("")
    const [formTemplateId, setFormTemplateId] = useState("")
    const [formMenuKey, setFormMenuKey] = useState("root")
    const [formPriority, setFormPriority] = useState(100)
    const [formActive, setFormActive] = useState(true)
    const [formEffFrom, setFormEffFrom] = useState("")
    const [formEffUntil, setFormEffUntil] = useState("")
    const [formCustHeader, setFormCustHeader] = useState("")
    const [formCustFooter, setFormCustFooter] = useState("")
    const [formCustButton, setFormCustButton] = useState("")
    // Accounts for target selector
    const [accounts, setAccounts] = useState<AccountInfo[]>([])
    const [accountsLoading, setAccountsLoading] = useState(false)
    // Groups for target selector
    const [groups, setGroups] = useState<AccountGroup[]>([])
    const [groupsLoading, setGroupsLoading] = useState(false)
    // Confirm-delete state
    const [confirmDelete, setConfirmDelete] = useState<Assignment | null>(null)
    const [deleting, setDeleting] = useState(false)
    const { canPerformAction } = usePermissions()
    const canCreate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.CREATE_ASSIGNMENT)
    const canUpdate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.UPDATE_ASSIGNMENT)
    const canDelete = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.DELETE_ASSIGNMENT)
    const tenantId = useAuthStore(s => s.user?.tenant_id || "")

    // Auto-fill tenant_id when type is "tenant"
    useEffect(() => {
        if (formType === "tenant" && tenantId && !editingAssignment) {
            setFormTargetId(tenantId)
        }
    }, [formType, tenantId, editingAssignment])

    const fetchAssignments = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const [asnRes, tplRes] = await Promise.all([
                menuService.listAssignments({ page: 1, limit: 100, assignment_type: typeFilter || undefined }),
                menuService.listTemplates({ page: 1, limit: 100 }),
            ])
            setAssignments(asnRes.data.assignments || [])
            setTemplates(tplRes.data.templates || [])
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "حدث خطأ في جلب التعيينات") }
        finally { setLoading(false) }
    }, [typeFilter])

    useEffect(() => { fetchAssignments() }, [fetchAssignments])

    // Fetch accounts & groups on mount so names are available in table & modal
    useEffect(() => {
        setAccountsLoading(true)
        getAccounts().then(r => setAccounts(r.accounts || [])).catch(() => { }).finally(() => setAccountsLoading(false))
        setGroupsLoading(true)
        menuService.listGroups({ page: 1, limit: 100 }).then(r => setGroups(r.data.groups || [])).catch(() => { }).finally(() => setGroupsLoading(false))
    }, [])

    // Helper: resolve target_id → display name based on assignment type
    const getTargetDisplayName = (targetId: string, type: AssignmentType) => {
        if (type === "account") {
            const acc = accounts.find(a => a.account_id === targetId)
            if (!acc) return targetId
            const emoji = acc.platform === "whatsapp" ? "📱" : acc.platform === "facebook" ? "📘" : acc.platform === "instagram" ? "📸" : acc.platform === "webchat" ? "🌐" : "💬"
            return `${emoji} ${acc.name || acc.account_id}`
        }
        if (type === "group") {
            const grp = groups.find(g => g.group_id === targetId)
            return grp ? `👥 ${grp.name}` : targetId
        }
        return targetId
    }

    const filtered = assignments.filter(a => {
        const q = search.toLowerCase()
        const accountName = getTargetDisplayName(a.target_id, a.assignment_type).toLowerCase()
        return a.target_id.toLowerCase().includes(q) ||
            a.assignment_id.toLowerCase().includes(q) ||
            accountName.includes(q)
    })

    const resetForm = () => { setShowCreate(false); setEditingAssignment(null); setFormType("account"); setFormTargetId(""); setFormTemplateId(""); setFormMenuKey("root"); setFormPriority(100); setFormActive(true); setFormEffFrom(""); setFormEffUntil(""); setFormCustHeader(""); setFormCustFooter(""); setFormCustButton(""); setFormError(null) }

    const openEdit = (a: Assignment) => {
        setEditingAssignment(a); setFormType(a.assignment_type); setFormTargetId(a.target_id); setFormTemplateId(a.template_id)
        setFormMenuKey(a.menu_key || "root"); setFormPriority(a.priority); setFormActive(a.is_active)
        setFormEffFrom(a.effective_from || ""); setFormEffUntil(a.effective_until || "")
        setFormCustHeader(a.customizations?.metadata?.header || ""); setFormCustFooter(a.customizations?.metadata?.footer || ""); setFormCustButton(a.customizations?.metadata?.button || "")
        setShowCreate(true)
    }

    const extractErrorMessage = (err: unknown): string => {
        if (axios.isAxiosError(err)) {
            const respData = err.response?.data
            if (respData?.error) return typeof respData.error === "string" ? respData.error : respData.error.error || JSON.stringify(respData.error)
            if (respData?.detail) return typeof respData.detail === "string" ? respData.detail : JSON.stringify(respData.detail)
            if (respData?.message) return respData.message
            return err.message
        }
        return err instanceof Error ? err.message : "حدث خطأ غير متوقع"
    }

    const handleSubmit = async () => {
        if (!formTargetId.trim() || !formTemplateId) return; setSubmitting(true); setFormError(null)
        try {
            if (editingAssignment) {
                const payload: UpdateAssignmentPayload = {
                    template_id: formTemplateId !== editingAssignment.template_id ? formTemplateId : undefined,
                    priority: formPriority, is_active: formActive,
                    effective_from: formEffFrom || null, effective_until: formEffUntil || null,
                }
                if (formCustHeader || formCustFooter || formCustButton) {
                    payload.customizations = { metadata: { header: formCustHeader || undefined, footer: formCustFooter || undefined, button: formCustButton || undefined } }
                }
                await menuService.updateAssignment(editingAssignment.assignment_id, payload)
            } else {
                const payload: CreateAssignmentPayload = {
                    assignment_type: formType, target_id: formTargetId.trim(), template_id: formTemplateId,
                    menu_key: formMenuKey || "root", priority: formPriority, is_active: formActive,
                    effective_from: formEffFrom || undefined, effective_until: formEffUntil || undefined,
                }
                if (formCustHeader || formCustFooter || formCustButton) {
                    payload.customizations = { metadata: { header: formCustHeader || undefined, footer: formCustFooter || undefined, button: formCustButton || undefined } }
                }
                await menuService.createAssignment(payload)
            }
            resetForm(); fetchAssignments()
        } catch (err: unknown) { setFormError(extractErrorMessage(err)) } finally { setSubmitting(false) }
    }

    const handleDelete = async () => {
        if (!confirmDelete) return; setDeleting(true)
        try { await menuService.deleteAssignment(confirmDelete.assignment_id); setConfirmDelete(null); fetchAssignments() }
        catch (err: unknown) { setConfirmDelete(null); setError(extractErrorMessage(err)) }
        finally { setDeleting(false) }
    }
    const getTemplateName = (id: string) => templates.find(t => t.template_id === id)?.name || id.substring(0, 12) + "..."

    return (
        <div>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 12,
                    background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, var(--t-border))",
                    flex: "1 1 200px", maxWidth: 360,
                }}>
                    <Search size={15} style={{ color: "var(--t-text-muted, var(--t-text-faint))", flexShrink: 0 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بمعرف الهدف..."
                        style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", flex: 1, color: "var(--t-text, #1f2937)" }} />
                    {search && <X size={13} style={{ cursor: "pointer", color: "var(--t-text-faint)" }} onClick={() => setSearch("")} />}
                </div>

                <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "var(--t-surface, var(--t-surface))" }}>
                    {([["", "الكل"], ["account", "حساب"], ["group", "مجموعة"], ["tenant", "مستأجر"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setTypeFilter(val as AssignmentType | "")} style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                            border: "none", cursor: "pointer", transition: "all 0.15s",
                            background: typeFilter === val ? "var(--t-card, #fff)" : "transparent",
                            color: typeFilter === val ? "var(--t-text, #1f2937)" : "var(--t-text-muted, var(--t-text-faint))",
                            boxShadow: typeFilter === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        }}>
                            {label}
                        </button>
                    ))}
                </div>

                {canCreate && <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "var(--t-gradient-accent)", color: "#fff",
                    fontSize: 13, fontWeight: 600, boxShadow: "0 3px 12px rgba(27,80,145,0.25)",
                    marginRight: "auto",
                }}>
                    <Plus size={15} /> إنشاء تعيين
                </button>}
            </div>

            {/* ── Loading / Error ── */}
            {loading && <div style={{ textAlign: "center", padding: 60 }}><Loader2 size={30} className="animate-spin" style={{ color: "var(--t-accent)", margin: "0 auto 12px" }} /><p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>جاري تحميل التعيينات...</p></div>}
            {error && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderRadius: 14, background: "rgba(239,68,68,0.05)", color: "var(--t-danger)", fontSize: 13, border: "1px solid rgba(239,68,68,0.12)" }}><AlertCircle size={18} /> {error}</div>}

            {/* ── Table ── */}
            {!loading && !error && (
                <div style={{ borderRadius: 16, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: "var(--t-surface, var(--t-page))" }}>
                                {["النوع", "الهدف", "القالب", "الأولوية", "الحالة", "الإجراءات"].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.3, borderBottom: "1px solid var(--t-border-light, var(--t-border))" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(a => {
                                const tc = TYPE_CONFIG[a.assignment_type] || TYPE_CONFIG.account
                                const TIcon = tc.icon
                                return (
                                    <tr key={a.assignment_id} style={{ borderBottom: "1px solid var(--t-border-light, #f0f0f0)", transition: "background 0.12s" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--t-card-hover, var(--t-card-hover))"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                padding: "4px 10px", borderRadius: 20,
                                                background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 600,
                                            }}>
                                                <TIcon size={12} /> {tc.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{ fontWeight: 600, color: "var(--t-text, #1f2937)", fontSize: 13 }}>{getTargetDisplayName(a.target_id, a.assignment_type)}</span>
                                        </td>
                                        <td style={{ padding: "12px 16px", color: "var(--t-text-secondary, var(--t-text-muted))" }}>
                                            {getTemplateName(a.template_id)}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 3,
                                                padding: "3px 9px", borderRadius: 8,
                                                background: "rgba(27,80,145,0.06)", color: "var(--t-accent)",
                                                fontSize: 12, fontWeight: 700,
                                            }}>
                                                <Shield size={10} /> {a.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                fontSize: 12, fontWeight: 500,
                                                color: a.is_active ? "#16a34a" : "var(--t-text-faint)",
                                            }}>
                                                <span style={{
                                                    width: 7, height: 7, borderRadius: "50%",
                                                    background: a.is_active ? "#16a34a" : "var(--t-border-medium)",
                                                    boxShadow: a.is_active ? "0 0 6px rgba(22,163,74,0.4)" : "none",
                                                }} />
                                                {a.is_active ? "نشط" : "معطّل"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                {canUpdate && <button onClick={() => openEdit(a)} style={{
                                                    background: "transparent", border: "none", borderRadius: 8,
                                                    padding: 6, cursor: "pointer", color: "var(--t-text-muted, var(--t-text-faint))",
                                                    transition: "all 0.15s", display: "flex", alignItems: "center",
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "var(--t-surface)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                    title="تعديل">
                                                    <Edit3 size={14} />
                                                </button>}
                                                {canDelete && <button onClick={() => setConfirmDelete(a)} style={{
                                                    background: "transparent", border: "none", borderRadius: 8,
                                                    padding: 6, cursor: "pointer", color: "var(--t-text-muted, var(--t-text-faint))",
                                                    transition: "all 0.15s", display: "flex", alignItems: "center",
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "var(--t-danger)" }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                    title="حذف">
                                                    <Trash2 size={14} />
                                                </button>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: 60, color: "var(--t-text-muted, var(--t-text-faint))" }}>
                                        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--t-surface, var(--t-surface))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                            <Link2 size={24} style={{ opacity: 0.4 }} />
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>لا توجد تعيينات</p>
                                        <p style={{ fontSize: 12 }}>أنشئ تعييناً جديداً لربط قالب بحساب أو مجموعة</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {showCreate && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={resetForm}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 500, maxHeight: "90vh", borderRadius: 20,
                        background: "var(--t-card, #fff)", boxShadow: "0 25px 65px rgba(0,0,0,0.18)",
                        overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                        display: "flex", flexDirection: "column",
                    }}>
                        {/* Header */}
                        <div style={{ background: "var(--t-gradient-accent-wide)", padding: "18px 22px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {editingAssignment ? <Edit3 size={15} style={{ color: "#fff" }} /> : <Link2 size={15} style={{ color: "#fff" }} />}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "block" }}>{editingAssignment ? "تعديل التعيين" : "إنشاء تعيين جديد"}</span>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>ربط قالب بهدف محدد</span>
                                    </div>
                                </div>
                                <button onClick={resetForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}><X size={14} style={{ color: "#fff" }} /></button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
                            {formError && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.07)", color: "var(--t-danger, #dc2626)", fontSize: 12, fontWeight: 500, border: "1px solid rgba(239,68,68,0.15)" }}><AlertCircle size={15} style={{ flexShrink: 0 }} /> {formError}</div>}
                            {!editingAssignment && (
                                <>
                                    <div>
                                        <label style={labelSt}>نوع التعيين *</label>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {(Object.entries(TYPE_CONFIG) as [AssignmentType, typeof TYPE_CONFIG.account][]).map(([key, cfg]) => {
                                                const sel = formType === key
                                                return (
                                                    <button key={key} onClick={() => { setFormType(key); setFormPriority(cfg.priority) }} style={{
                                                        flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: sel ? 600 : 500,
                                                        border: "2px solid", cursor: "pointer", transition: "all 0.2s",
                                                        borderColor: sel ? cfg.color : "var(--t-border-light, var(--t-border))",
                                                        background: sel ? cfg.bg : "transparent",
                                                        color: sel ? cfg.color : "var(--t-text-secondary)",
                                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                                    }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 8, background: sel ? cfg.color : "var(--t-surface, var(--t-surface))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <cfg.icon size={13} style={{ color: sel ? "#fff" : cfg.color }} />
                                                        </div>
                                                        {cfg.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={labelSt}>معرف الهدف *</label>
                                        {formType === "account" ? (
                                            <select
                                                value={formTargetId}
                                                onChange={e => setFormTargetId(e.target.value)}
                                                style={inputSt}
                                                disabled={accountsLoading}
                                            >
                                                <option value="">{accountsLoading ? "جاري تحميل الحسابات..." : "— اختر حساب —"}</option>
                                                {accounts.map(a => {
                                                    const emoji = a.platform === "whatsapp" ? "📱" : a.platform === "facebook" ? "📘" : a.platform === "instagram" ? "📸" : a.platform === "webchat" ? "🌐" : "💬"
                                                    const displayName = a.name || a.account_id
                                                    return (
                                                        <option key={a.account_id} value={a.account_id}>
                                                            {emoji} {displayName} ({a.customer_count} عميل)
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                        ) : formType === "group" ? (
                                            <select
                                                value={formTargetId}
                                                onChange={e => setFormTargetId(e.target.value)}
                                                style={inputSt}
                                                disabled={groupsLoading}
                                            >
                                                <option value="">{groupsLoading ? "جاري تحميل المجموعات..." : "— اختر مجموعة —"}</option>
                                                {groups.map(g => (
                                                    <option key={g.group_id} value={g.group_id}>
                                                        👥 {g.name} ({g.accounts_count ?? g.account_ids?.length ?? 0} حساب)
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input value={formTargetId} readOnly disabled
                                                style={{ ...inputSt, background: "var(--t-surface-accent, rgba(27,80,145,0.04))", color: "var(--t-text-secondary)", cursor: "not-allowed", fontWeight: 600, fontFamily: "'Fira Code', monospace", letterSpacing: 0.5 }} />
                                        )}
                                    </div>
                                </>
                            )}
                            <div><label style={labelSt}>القالب *</label>
                                <select value={formTemplateId} onChange={e => setFormTemplateId(e.target.value)} style={inputSt}>
                                    <option value="">— اختر قالب —</option>
                                    {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                                </select></div>
                            {/* مفتاح القائمة والأولوية وتواريخ الفعالية مخفية — يتم إرسال القيم الافتراضية تلقائياً */}
                            <div style={{ padding: 14, borderRadius: 12, background: "var(--t-surface, var(--t-page))", border: "1px solid var(--t-border-light, #f0f0f0)", display: "flex", flexDirection: "column", gap: 10 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>📋 تخصيصات العرض (اختياري)</p>
                                <div><label style={{ ...labelSt, fontSize: 11 }}>عنوان مخصص (Header)</label><input value={formCustHeader} onChange={e => setFormCustHeader(e.target.value)} placeholder="ترحيب مخصص" style={inputSt} /></div>
                                <div><label style={{ ...labelSt, fontSize: 11 }}>تذييل مخصص (Footer)</label><input value={formCustFooter} onChange={e => setFormCustFooter(e.target.value)} placeholder="تذييل مخصص" style={inputSt} /></div>
                                <div><label style={{ ...labelSt, fontSize: 11 }}>زر مخصص (Button)</label><input value={formCustButton} onChange={e => setFormCustButton(e.target.value)} placeholder="زر مخصص" style={inputSt} /></div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                                <label style={{ ...labelSt, margin: 0 }}>نشط</label>
                                <button onClick={() => setFormActive(!formActive)} style={{
                                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                                    background: formActive ? "var(--t-accent)" : "var(--t-border-medium)", position: "relative", transition: "all 0.2s",
                                }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                        position: "absolute", top: 3, right: formActive ? 3 : 21,
                                        transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }} />
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--t-border-light)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                            <button onClick={resetForm} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleSubmit} disabled={submitting || (!editingAssignment && (!formTargetId.trim() || !formTemplateId))} style={{
                                padding: "9px 22px", borderRadius: 10, border: "none",
                                background: "var(--t-gradient-accent)",
                                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                opacity: submitting || (!editingAssignment && (!formTargetId.trim() || !formTemplateId)) ? 0.6 : 1,
                                boxShadow: "0 3px 12px var(--t-accent-muted)", transition: "all 0.2s",
                            }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                {editingAssignment ? <><Save size={13} /> حفظ</> : <><Plus size={13} /> إنشاء</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {confirmDelete && (
                <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => !deleting && setConfirmDelete(null)}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 400, borderRadius: 20,
                        background: "var(--t-card, #fff)", boxShadow: "0 25px 65px rgba(0,0,0,0.2)",
                        overflow: "hidden", animation: "modalSlideIn .2s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                        {/* Red header */}
                        <div style={{ background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)", padding: "18px 22px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Trash2 size={15} style={{ color: "#fff" }} />
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>تأكيد الحذف</span>
                            </div>
                        </div>
                        {/* Body */}
                        <div style={{ padding: "22px 22px 14px", textAlign: "center" }}>
                            <AlertCircle size={36} style={{ color: "#f59e0b", margin: "0 auto 12px" }} />
                            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text, #1f2937)", margin: "0 0 6px" }}>هل أنت متأكد من حذف هذا التعيين؟</p>
                            <p style={{ fontSize: 12, color: "var(--t-text-muted)", margin: 0, lineHeight: 1.6 }}>
                                الهدف: <strong>{getTargetDisplayName(confirmDelete.target_id, confirmDelete.assignment_type)}</strong>
                                <br />القالب: <strong>{getTemplateName(confirmDelete.template_id)}</strong>
                            </p>
                            <p style={{ fontSize: 11, color: "var(--t-danger, #dc2626)", margin: "12px 0 0", fontWeight: 500 }}>لا يمكن التراجع عن هذا الإجراء</p>
                        </div>
                        {/* Actions */}
                        <div style={{ padding: "14px 22px 18px", display: "flex", justifyContent: "center", gap: 10 }}>
                            <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={{
                                padding: "9px 24px", borderRadius: 10, border: "1px solid var(--t-border-light)",
                                background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
                            }}>إلغاء</button>
                            <button onClick={handleDelete} disabled={deleting} style={{
                                padding: "9px 24px", borderRadius: 10, border: "none",
                                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                opacity: deleting ? 0.6 : 1, boxShadow: "0 3px 12px rgba(220,38,38,0.3)",
                            }}>
                                {deleting && <Loader2 size={13} className="animate-spin" />}
                                <Trash2 size={13} /> نعم، احذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes modalSlideIn { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>
        </div>
    )
}
