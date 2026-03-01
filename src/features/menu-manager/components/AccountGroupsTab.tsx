import { useState, useCallback, useEffect } from "react"
import {
    Plus,
    Trash2,
    Edit3,
    Search,
    X,
    Users,
    UserPlus,
    Loader2,
    AlertCircle,
    Hash,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { AccountGroup, CreateGroupPayload, UpdateGroupPayload } from "../types"

interface AccountGroupsTabProps {
    onNavigateToTab?: (tab: string) => void
}

export function AccountGroupsTab(_props: AccountGroupsTabProps) {
    const [groups, setGroups] = useState<AccountGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [showCreate, setShowCreate] = useState(false)
    const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

    // Form
    const [formName, setFormName] = useState("")
    const [formDesc, setFormDesc] = useState("")
    const [formAccounts, setFormAccounts] = useState("")

    // Add/Remove accounts
    const [showAddAccounts, setShowAddAccounts] = useState<string | null>(null)
    const [newAccountIds, setNewAccountIds] = useState("")

    const fetchGroups = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await menuService.listGroups({ page: 1, limit: 100 })
            setGroups(res.data.groups || [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "حدث خطأ في جلب المجموعات")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchGroups() }, [fetchGroups])

    const filtered = groups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description || "").toLowerCase().includes(search.toLowerCase())
    )

    const resetForm = () => {
        setShowCreate(false)
        setEditingGroup(null)
        setFormName("")
        setFormDesc("")
        setFormAccounts("")
    }

    const openEdit = (g: AccountGroup) => {
        setEditingGroup(g)
        setFormName(g.name)
        setFormDesc(g.description || "")
        setShowCreate(true)
    }

    const handleSubmit = async () => {
        if (!formName.trim()) return
        setSubmitting(true)
        try {
            if (editingGroup) {
                const payload: UpdateGroupPayload = {}
                if (formName !== editingGroup.name) payload.name = formName
                if (formDesc !== (editingGroup.description || "")) payload.description = formDesc
                await menuService.updateGroup(editingGroup.group_id, payload)
            } else {
                const accountIds = formAccounts.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
                const payload: CreateGroupPayload = {
                    name: formName.trim(),
                    description: formDesc.trim() || "مجموعة جديدة",
                    account_ids: accountIds.length > 0 ? accountIds : ["placeholder"],
                }
                await menuService.createGroup(payload)
            }
            resetForm()
            fetchGroups()
        } catch {/* silent */ } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await menuService.deleteGroup(id)
            fetchGroups()
        } catch {/* silent */ }
    }

    const handleAddAccounts = async (groupId: string) => {
        const ids = newAccountIds.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
        if (ids.length === 0) return
        setSubmitting(true)
        try {
            await menuService.addAccountsToGroup(groupId, ids)
            setShowAddAccounts(null)
            setNewAccountIds("")
            fetchGroups()
        } catch {/* silent */ } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveAccount = async (groupId: string, accountId: string) => {
        try {
            await menuService.removeAccountsFromGroup(groupId, [accountId])
            fetchGroups()
        } catch {/* silent */ }
    }

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>مجموعات الحسابات</h2>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", margin: "4px 0 0" }}>
                        تنظيم الحسابات في مجموعات للتعيين الجماعي
                    </p>
                </div>
                <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                    fontSize: 13, fontWeight: 600, boxShadow: "0 2px 8px rgba(0,71,134,0.2)",
                }}>
                    <Plus size={15} /> إنشاء مجموعة
                </button>
            </div>

            {/* Search */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", borderRadius: 10,
                background: "var(--t-surface, #f9fafb)", border: "1px solid var(--t-border-light, #e5e7eb)",
                maxWidth: 320, marginBottom: 16,
            }}>
                <Search size={14} style={{ color: "var(--t-text-muted, #9ca3af)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المجموعات..."
                    style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", flex: 1, color: "var(--t-text, #1f2937)" }} />
                {search && <X size={13} style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setSearch("")} />}
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل المجموعات...</p>
                </div>
            )}
            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13 }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Groups Grid ── */}
            {!loading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                    {filtered.map((g) => (
                        <div key={g.group_id} style={{
                            borderRadius: 14, border: "1px solid var(--t-border-light, #e5e7eb)",
                            background: "var(--t-card, #fff)", overflow: "hidden",
                            transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ height: 3, background: "linear-gradient(to left, #7b1fa2, #7b1fa288)" }} />
                            <div style={{ padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: "0 0 4px" }}>
                                            {g.name}
                                        </h3>
                                        {g.description && (
                                            <p style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)", margin: 0 }}>
                                                {g.description}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <button onClick={() => openEdit(g)} style={iconBtnStyle} title="تعديل">
                                            <Edit3 size={13} />
                                        </button>
                                        <button onClick={() => handleDelete(g.group_id)} style={{ ...iconBtnStyle, color: "#ef4444" }} title="حذف">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
                                    padding: "8px 10px", borderRadius: 8, background: "var(--t-surface, #f9fafb)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                        <Users size={13} style={{ color: "#7b1fa2" }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: "#7b1fa2" }}>
                                            {g.accounts_count ?? g.account_ids?.length ?? 0}
                                        </span>
                                        <span style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)" }}>حساب</span>
                                    </div>
                                    <span style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)" }}>
                                        · {g.group_id.substring(0, 12)}
                                    </span>
                                </div>

                                {/* Accounts List (expandable) */}
                                {g.account_ids && g.account_ids.length > 0 && (
                                    <>
                                        <button
                                            onClick={() => setExpandedGroup(expandedGroup === g.group_id ? null : g.group_id)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 5,
                                                background: "transparent", border: "none", cursor: "pointer",
                                                fontSize: 12, color: "#004786", fontWeight: 500, padding: 0, marginBottom: 8,
                                            }}
                                        >
                                            <Hash size={12} /> {expandedGroup === g.group_id ? "إخفاء الحسابات" : "عرض الحسابات"}
                                        </button>
                                        {expandedGroup === g.group_id && (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                                                {g.account_ids.map((accId) => (
                                                    <span key={accId} style={{
                                                        display: "inline-flex", alignItems: "center", gap: 4,
                                                        padding: "3px 8px 3px 10px", borderRadius: 16,
                                                        background: "var(--t-surface, #f3f4f6)", fontSize: 11, color: "var(--t-text, #374151)",
                                                    }}>
                                                        {accId}
                                                        <button onClick={() => handleRemoveAccount(g.group_id, accId)} style={{
                                                            background: "transparent", border: "none", cursor: "pointer",
                                                            padding: 1, display: "flex", color: "#ef4444",
                                                        }}>
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Add Account */}
                                {showAddAccounts === g.group_id ? (
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <input value={newAccountIds} onChange={(e) => setNewAccountIds(e.target.value)}
                                            placeholder="معرفات الحسابات (مفصولة بفواصل)"
                                            style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 12 }} />
                                        <button onClick={() => handleAddAccounts(g.group_id)} disabled={submitting} style={{
                                            padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                                            background: "#004786", color: "#fff", fontSize: 12, fontWeight: 600,
                                            display: "flex", alignItems: "center", gap: 4,
                                        }}>
                                            {submitting ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                                            إضافة
                                        </button>
                                        <button onClick={() => { setShowAddAccounts(null); setNewAccountIds("") }} style={{
                                            padding: "6px 8px", borderRadius: 7, border: "1px solid var(--t-border-light)", background: "transparent",
                                            cursor: "pointer", color: "#6b7280", fontSize: 12,
                                        }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowAddAccounts(g.group_id)} style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        background: "transparent", border: "1px dashed var(--t-border-light, #d1d5db)",
                                        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                                        fontSize: 12, color: "var(--t-text-secondary, #6b7280)", width: "100%",
                                        justifyContent: "center", transition: "all 0.15s",
                                    }}>
                                        <UserPlus size={13} /> إضافة حسابات
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && !loading && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 60, color: "var(--t-text-muted, #9ca3af)" }}>
                            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                            <p style={{ fontSize: 14, fontWeight: 600 }}>لا توجد مجموعات</p>
                        </div>
                    )}
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
                        width: "100%", maxWidth: 440, borderRadius: 18,
                        background: "var(--t-card, #fff)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                        <div style={{ background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)", padding: "16px 20px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                                    {editingGroup ? "تعديل المجموعة" : "إنشاء مجموعة جديدة"}
                                </span>
                                <button onClick={resetForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}>
                                    <X size={14} style={{ color: "#fff" }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>اسم المجموعة *</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="مثال: مجموعة VIP" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>الوصف *</label>
                                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="وصف المجموعة" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                            </div>
                            {!editingGroup && (
                                <div>
                                    <label style={labelStyle}>الحسابات الأولية</label>
                                    <textarea value={formAccounts} onChange={(e) => setFormAccounts(e.target.value)}
                                        placeholder="معرفات الحسابات (كل سطر أو مفصولة بفواصل)" rows={3}
                                        style={{ ...inputStyle, resize: "vertical" }} />
                                    <span style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)" }}>
                                        أدخل معرفات الحسابات مفصولة بفواصل أو كل معرف في سطر
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={resetForm} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>
                                إلغاء
                            </button>
                            <button onClick={handleSubmit} disabled={submitting || !formName.trim()} style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: formName.trim() ? "linear-gradient(135deg, #004786, #0098d6)" : "#e5e7eb",
                                color: formName.trim() ? "#fff" : "#9ca3af",
                                fontSize: 13, fontWeight: 600, cursor: formName.trim() ? "pointer" : "default",
                                display: "flex", alignItems: "center", gap: 6,
                            }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                {editingGroup ? "حفظ" : "إنشاء"}
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
