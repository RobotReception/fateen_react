import { useState, useCallback, useEffect } from "react"
import {
    Plus, Trash2, Edit3, Search, X, Users, UserPlus,
    Loader2, AlertCircle, Save,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import { getAccounts } from "../../inbox/services/inbox-service"
import type { AccountInfo } from "../../inbox/services/inbox-service"
import type { AccountGroup, CreateGroupPayload, UpdateGroupPayload } from "../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))", marginBottom: 5 }
const inputSt: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-surface, var(--t-page))", fontSize: 13, outline: "none", color: "var(--t-text, #1f2937)", transition: "border-color 0.15s" }

interface AccountGroupsTabProps { onNavigateToTab?: (tab: string) => void }

export function AccountGroupsTab(_props: AccountGroupsTabProps) {
    const [groups, setGroups] = useState<AccountGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [showCreate, setShowCreate] = useState(false)
    const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
    const [formName, setFormName] = useState("")
    const [formDesc, setFormDesc] = useState("")
    const [formAccounts, setFormAccounts] = useState("")
    const [formActive, setFormActive] = useState(true)
    const [showAddAccounts, setShowAddAccounts] = useState<string | null>(null)
    const [newAccountIds, setNewAccountIds] = useState<string[]>([])
    const [addSearch, setAddSearch] = useState("")
    const [modalSearch, setModalSearch] = useState("")
    // Accounts from API
    const [accounts, setAccounts] = useState<AccountInfo[]>([])
    const [accountsLoading, setAccountsLoading] = useState(false)
    const { canPerformAction } = usePermissions()
    const canCreate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.CREATE_ACCOUNT_GROUP)
    const canUpdate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.UPDATE_ACCOUNT_GROUP)
    const canDelete = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.DELETE_ACCOUNT_GROUP)
    const canManageAccounts = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.MANAGE_GROUP_ACCOUNTS)

    // Helper: toggle one account in/out of a selection array
    const toggle = (ids: string[], id: string) =>
        ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]

    // Styled account picker list component
    const AccountPickerList = ({
        selected, onToggle, searchVal, onSearch, emptyMsg = "لا توجد حسابات",
    }: {
        selected: string[]; onToggle: (id: string) => void
        searchVal: string; onSearch: (v: string) => void; emptyMsg?: string
    }) => {
        const filtered = accounts.filter(a =>
            a.account_id.toLowerCase().includes(searchVal.toLowerCase()) ||
            a.platform.toLowerCase().includes(searchVal.toLowerCase())
        )
        const allSelected = filtered.length > 0 && filtered.every(a => selected.includes(a.account_id))
        return (
            <div>
                {/* Search + select-all */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-surface, var(--t-page))" }}>
                        <Search size={12} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                        <input value={searchVal} onChange={e => onSearch(e.target.value)} placeholder="ابحث..." style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", flex: 1, color: "var(--t-text, #1f2937)" }} />
                        {searchVal && <X size={11} style={{ cursor: "pointer", color: "var(--t-text-faint)" }} onClick={() => onSearch("")} />}
                    </div>
                    {selected.length > 0 && (
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(27,80,145,0.1)", color: "var(--t-accent)", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {selected.length} محدد
                        </span>
                    )}
                    <button
                        onClick={() => filtered.forEach(a => { if (allSelected !== filtered.every(f => selected.includes(f.account_id))) onToggle(a.account_id) })}
                        title={allSelected ? "إلغاء الكل" : "تحديد الكل"}
                        style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid var(--t-border-light)", background: allSelected ? "rgba(27,80,145,0.08)" : "transparent", fontSize: 10, cursor: "pointer", fontWeight: 600, color: allSelected ? "var(--t-accent)" : "var(--t-text-faint)", whiteSpace: "nowrap" }}
                    >
                        {allSelected ? "إلغاء" : "الكل"}
                    </button>
                </div>
                {/* List */}
                <div style={{ maxHeight: 180, overflowY: "auto", borderRadius: 10, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)" }}>
                    {accountsLoading && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, color: "var(--t-text-faint)", fontSize: 12 }}>
                            <Loader2 size={14} className="animate-spin" /> جاري تحميل الحسابات...
                        </div>
                    )}
                    {!accountsLoading && filtered.length === 0 && (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--t-text-faint)", fontSize: 12 }}>{emptyMsg}</div>
                    )}
                    {!accountsLoading && filtered.map((a, i) => {
                        const sel = selected.includes(a.account_id)
                        return (
                            <div key={a.account_id} onClick={() => onToggle(a.account_id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "8px 12px", cursor: "pointer",
                                    background: sel ? "rgba(27,80,145,0.04)" : "transparent",
                                    borderBottom: i < filtered.length - 1 ? "1px solid var(--t-border-light, #f5f5f5)" : "none",
                                    transition: "background 0.1s",
                                }}
                                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--t-surface, var(--t-page))" }}
                                onMouseLeave={e => { e.currentTarget.style.background = sel ? "rgba(27,80,145,0.04)" : "transparent" }}
                            >
                                {/* Checkbox */}
                                <div style={{
                                    width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                                    border: sel ? "2px solid var(--t-accent)" : "2px solid var(--t-border-light, var(--t-border-medium))",
                                    background: sel ? "var(--t-accent)" : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                                }}>
                                    {sel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                                {/* Icon */}
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: sel ? "var(--t-gradient-accent)" : "linear-gradient(135deg, #e0e7ff, #c7d2fe)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Users size={13} style={{ color: sel ? "#fff" : "var(--t-accent)" }} />
                                </div>
                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: sel ? "var(--t-accent)" : "var(--t-text, #1f2937)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {a.account_id}
                                    </span>
                                    <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{a.customer_count} عميل</span>
                                </div>
                                {/* Platform badge */}
                                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "rgba(27,80,145,0.08)", color: "var(--t-accent)", fontWeight: 600, flexShrink: 0 }}>
                                    {a.platform}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const fetchGroups = useCallback(async () => {
        setLoading(true); setError(null)
        try { const res = await menuService.listGroups({ page: 1, limit: 100 }); setGroups(res.data.groups || []) }
        catch (err: unknown) { setError(err instanceof Error ? err.message : "حدث خطأ في جلب المجموعات") }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchGroups() }, [fetchGroups])

    // Load accounts from API when inline add panel or modal opens
    useEffect(() => {
        if (!showAddAccounts && !showCreate) return
        setAccountsLoading(true)
        getAccounts().then(r => setAccounts(r.accounts || [])).catch(() => { }).finally(() => setAccountsLoading(false))
    }, [showAddAccounts, showCreate])

    const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || (g.description || "").toLowerCase().includes(search.toLowerCase()))

    const resetForm = () => { setShowCreate(false); setEditingGroup(null); setFormName(""); setFormDesc(""); setFormAccounts(""); setFormActive(true) }
    const openEdit = (g: AccountGroup) => { setEditingGroup(g); setFormName(g.name); setFormDesc(g.description || ""); setFormActive(g.is_active !== false); setShowCreate(true) }

    const handleSubmit = async () => {
        if (!formName.trim()) return; setSubmitting(true)
        try {
            if (editingGroup) {
                const payload: UpdateGroupPayload = {}
                if (formName !== editingGroup.name) payload.name = formName
                if (formDesc !== (editingGroup.description || "")) payload.description = formDesc
                if (formActive !== (editingGroup.is_active !== false)) payload.is_active = formActive
                await menuService.updateGroup(editingGroup.group_id, payload)
            } else {
                const accountIds = formAccounts.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
                const payload: CreateGroupPayload = { name: formName.trim(), description: formDesc.trim() || "مجموعة جديدة", account_ids: accountIds.length > 0 ? accountIds : ["placeholder"] }
                await menuService.createGroup(payload)
            }
            resetForm(); fetchGroups()
        } catch { } finally { setSubmitting(false) }
    }

    const handleDelete = async (id: string) => { try { await menuService.deleteGroup(id); fetchGroups() } catch { } }

    const handleAddAccounts = async (groupId: string) => {
        if (newAccountIds.length === 0) return; setSubmitting(true)
        try { await menuService.addAccountsToGroup(groupId, newAccountIds); setShowAddAccounts(null); setNewAccountIds([]); fetchGroups() }
        catch { } finally { setSubmitting(false) }
    }

    const handleRemoveAccount = async (groupId: string, accountId: string) => {
        try { await menuService.removeAccountsFromGroup(groupId, [accountId]); fetchGroups() } catch { }
    }


    return (
        <div>
            {/* ── Toolbar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <div style={{
                    position: "relative", flex: 1, maxWidth: 300,
                }}>
                    <Search size={14} style={{
                        position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                        color: "var(--t-text-faint, var(--t-text-faint))", pointerEvents: "none",
                    }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في المجموعات..."
                        style={{
                            width: "100%", padding: "8px 34px 8px 32px", borderRadius: 9,
                            border: "1.5px solid var(--t-border-light, var(--t-border))",
                            background: "var(--t-surface, var(--t-card-hover))", fontSize: 12,
                            color: "var(--t-text, var(--t-text))", outline: "none", fontFamily: "inherit",
                            transition: "border-color .15s",
                        }}
                        onFocus={e => e.target.style.borderColor = "var(--t-accent)"}
                        onBlur={e => e.target.style.borderColor = "var(--t-border-light, var(--t-border))"}
                    />
                    {search && <X size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--t-text-faint)" }} onClick={() => setSearch("")} />}
                </div>

                <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 7,
                    background: "rgba(27,80,145,0.05)",
                }}>
                    <Users size={12} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-accent)" }}>{groups.length} مجموعة</span>
                </div>

                {canCreate && <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: "var(--t-brand-orange)", color: "#fff", fontSize: 12, fontWeight: 600,
                    boxShadow: "0 1px 3px rgba(27,80,145,0.15)", transition: "background .15s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--t-accent-hover)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--t-accent)" }}
                >
                    <Plus size={14} /> إنشاء مجموعة
                </button>}
            </div>

            {loading && <div style={{ textAlign: "center", padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--t-accent)", margin: "0 auto 10px" }} /><p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>جاري تحميل المجموعات...</p></div>}
            {error && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: 12, marginBottom: 12 }}><AlertCircle size={15} /> {error}</div>}

            {/* ── Table ── */}
            {!loading && !error && (
                <div style={{
                    borderRadius: 14, border: "1px solid var(--t-border-light, #e8eaed)",
                    background: "var(--t-card, #fff)", overflow: "hidden", position: "relative",
                }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead>
                            <tr>
                                {["الاسم", "الوصف", "الحسابات", "الحالة", ""].map((h, i) => (
                                    <th key={i} style={{
                                        padding: "0 16px", height: 36, fontSize: 10, fontWeight: 800,
                                        color: "var(--t-text-faint)", textAlign: "right", whiteSpace: "nowrap",
                                        textTransform: "uppercase", letterSpacing: ".05em",
                                        borderBottom: "1px solid var(--t-border-light, #eaedf0)",
                                        background: "var(--t-surface, var(--t-card-hover))",
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", padding: "60px 20px", color: "var(--t-text-faint)" }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--t-surface, var(--t-surface))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                            <Users size={22} style={{ opacity: 0.4 }} />
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>لا توجد مجموعات</p>
                                        <p style={{ fontSize: 12, margin: "0 0 16px" }}>أنشئ مجموعة جديدة لتنظيم الحسابات</p>
                                        {canCreate && <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                                            display: "inline-flex", alignItems: "center", gap: 6,
                                            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                                            background: "var(--t-brand-orange)", color: "#fff", fontSize: 12, fontWeight: 600,
                                        }}><Plus size={13} /> إنشاء أول مجموعة</button>}
                                    </td>
                                </tr>
                            )}
                            {filtered.map((g, idx) => {
                                const isActive = g.is_active !== false
                                const accCount = g.accounts_count ?? g.account_ids?.length ?? 0
                                const isExpanded = expandedGroup === g.group_id
                                const isAddOpen = showAddAccounts === g.group_id
                                return (
                                    <>
                                        <tr key={g.group_id}
                                            style={{
                                                transition: "background .08s", cursor: "pointer",
                                                animation: `grpIn .2s ease-out ${idx * 30}ms both`,
                                                background: isExpanded ? "rgba(27,80,145,0.015)" : "transparent",
                                            }}
                                            onClick={() => setExpandedGroup(isExpanded ? null : g.group_id)}
                                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "rgba(27,80,145,0.012)" }}
                                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "transparent" }}
                                        >
                                            {/* Name */}
                                            <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                                        background: isActive ? "var(--t-gradient-accent)" : "#e8ebef",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        boxShadow: isActive ? "0 1px 4px var(--t-accent-muted)" : "none",
                                                    }}>
                                                        <Users size={14} style={{ color: isActive ? "#fff" : "var(--t-text-faint)" }} />
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", display: "block" }}>{g.name}</span>
                                                        <span style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace" }}>{g.group_id.substring(0, 10)}…</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Description */}
                                            <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))", maxWidth: 220 }}>
                                                <span style={{ fontSize: 12, color: "var(--t-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                                    {g.description || "—"}
                                                </span>
                                            </td>
                                            {/* Accounts count */}
                                            <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))" }}>
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    fontSize: 11, padding: "3px 10px", borderRadius: 20,
                                                    background: accCount > 0 ? "rgba(27,80,145,0.07)" : "var(--t-surface)",
                                                    color: accCount > 0 ? "var(--t-accent)" : "var(--t-text-faint)",
                                                    fontWeight: 700,
                                                }}>
                                                    <Users size={11} /> {accCount}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))" }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: isActive ? "#16a34a" : "var(--t-text-faint)" }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#16a34a" : "var(--t-border-medium)" }} />
                                                    {isActive ? "نشطة" : "معطلة"}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))" }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: "flex", gap: 3 }}>
                                                    {canManageAccounts && <button onClick={() => { setShowAddAccounts(isAddOpen ? null : g.group_id); setExpandedGroup(g.group_id) }}
                                                        title="إضافة حسابات"
                                                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #eaedf0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)", transition: "all .12s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#eaedf0"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                    ><UserPlus size={13} /></button>}
                                                    {canUpdate && <button onClick={() => openEdit(g)}
                                                        title="تعديل"
                                                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #eaedf0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)", transition: "all .12s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#eaedf0"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                    ><Edit3 size={13} /></button>}
                                                    {canDelete && <button onClick={() => handleDelete(g.group_id)}
                                                        title="حذف"
                                                        style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #eaedf0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)", transition: "all .12s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-danger)"; e.currentTarget.style.color = "var(--t-danger)" }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#eaedf0"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                    ><Trash2 size={13} /></button>}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded row — accounts panel */}
                                        {isExpanded && (
                                            <tr key={`${g.group_id}-exp`}>
                                                <td colSpan={5} style={{ padding: "0 16px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-surface))", background: "var(--t-surface, #fafbfd)" }}>
                                                    {/* Account chips */}
                                                    {g.account_ids && g.account_ids.length > 0 && (
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 12, marginBottom: 10 }}>
                                                            {g.account_ids.map(accId => (
                                                                <span key={accId} style={{
                                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                                    padding: "4px 8px 4px 10px", borderRadius: 20,
                                                                    background: "#fff", fontSize: 11, color: "var(--t-text-secondary)",
                                                                    border: "1px solid var(--t-border-light, var(--t-border))",
                                                                }}>
                                                                    {accId}
                                                                    {canManageAccounts && <button onClick={e => { e.stopPropagation(); handleRemoveAccount(g.group_id, accId) }} style={{
                                                                        background: "transparent", border: "none", cursor: "pointer",
                                                                        padding: 1, display: "flex", color: "var(--t-danger)", borderRadius: "50%",
                                                                    }}><X size={10} /></button>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Add accounts picker */}
                                                    {isAddOpen ? (
                                                        <div style={{ display: "flex", gap: 8, flexDirection: "column", maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                                                            <AccountPickerList
                                                                selected={newAccountIds}
                                                                onToggle={id => setNewAccountIds(toggle(newAccountIds, id))}
                                                                searchVal={addSearch}
                                                                onSearch={setAddSearch}
                                                                emptyMsg="لا توجد حسابات، جرب البحث"
                                                            />
                                                            <div style={{ display: "flex", gap: 6 }}>
                                                                <button onClick={e => { e.stopPropagation(); handleAddAccounts(g.group_id) }}
                                                                    disabled={submitting || newAccountIds.length === 0}
                                                                    style={{
                                                                        flex: 1, padding: "8px 14px", borderRadius: 8, border: "none",
                                                                        cursor: newAccountIds.length > 0 ? "pointer" : "default",
                                                                        background: newAccountIds.length > 0 ? "var(--t-accent)" : "var(--t-border)",
                                                                        color: newAccountIds.length > 0 ? "#fff" : "var(--t-text-faint)",
                                                                        fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                                                    }}>
                                                                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                                                                    إضافة {newAccountIds.length > 0 ? `(${newAccountIds.length})` : ""}
                                                                </button>
                                                                <button onClick={e => { e.stopPropagation(); setShowAddAccounts(null); setNewAccountIds([]); setAddSearch("") }}
                                                                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #eaedf0", background: "#fff", cursor: "pointer", color: "var(--t-text-muted)", display: "flex", alignItems: "center" }}>
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setShowAddAccounts(g.group_id) }}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: 5,
                                                                padding: "6px 12px", borderRadius: 7, border: "1px dashed var(--t-border-medium)",
                                                                background: "transparent", cursor: "pointer", fontSize: 11,
                                                                color: "var(--t-text-faint)", transition: "all .12s", marginTop: g.account_ids?.length ? 0 : 12,
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-medium)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                                        >
                                                            <UserPlus size={11} /> إضافة حسابات
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {showCreate && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={resetForm}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 460, borderRadius: 16,
                        background: "var(--t-card, #fff)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        overflow: "hidden", animation: "grpModal .2s ease-out",
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--t-border-light, #eaedf0)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(27,80,145,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {editingGroup ? <Edit3 size={15} style={{ color: "var(--t-accent)" }} /> : <Users size={15} style={{ color: "var(--t-accent)" }} />}
                                </div>
                                <div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", display: "block" }}>{editingGroup ? "تعديل المجموعة" : "إنشاء مجموعة جديدة"}</span>
                                    <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>تنظيم الحسابات في مجموعات</span>
                                </div>
                            </div>
                            <button onClick={resetForm} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #eaedf0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)" }}>
                                <X size={13} />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div><label style={labelSt}>اسم المجموعة *</label><input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: مجموعة VIP" style={inputSt} /></div>
                            <div><label style={labelSt}>الوصف *</label><textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="وصف المجموعة" rows={2} style={{ ...inputSt, resize: "vertical" }} /></div>
                            {editingGroup && (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "var(--t-surface, var(--t-page))", border: "1px solid var(--t-border-light, #eaedf0)" }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary)" }}>نشطة</label>
                                    <button onClick={() => setFormActive(!formActive)} style={{
                                        width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                                        background: formActive ? "var(--t-accent)" : "var(--t-border-medium)", position: "relative", transition: "all 0.2s",
                                    }}>
                                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, right: formActive ? 3 : 21, transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                    </button>
                                </div>
                            )}
                            {!editingGroup && (
                                <div style={{ padding: 12, borderRadius: 10, background: "var(--t-surface, var(--t-page))", border: "1px solid var(--t-border-light, #eaedf0)", display: "flex", flexDirection: "column", gap: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-accent)", margin: 0, display: "flex", alignItems: "center", gap: 5 }}><Users size={12} /> الحسابات الأولية</p>
                                    <AccountPickerList
                                        selected={formAccounts ? formAccounts.split(",").filter(Boolean) : []}
                                        onToggle={id => {
                                            const cur = formAccounts ? formAccounts.split(",").filter(Boolean) : []
                                            setFormAccounts(toggle(cur, id).join(","))
                                        }}
                                        searchVal={modalSearch}
                                        onSearch={setModalSearch}
                                        emptyMsg="لا توجد حسابات متاحة"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Modal Footer */}
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light, #eaedf0)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={resetForm} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid var(--t-border)", background: "#fff", color: "var(--t-text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleSubmit} disabled={submitting || !formName.trim()} style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "8px 18px", borderRadius: 8, border: "none",
                                background: formName.trim() ? "var(--t-accent)" : "var(--t-border)",
                                color: formName.trim() ? "#fff" : "var(--t-text-faint)",
                                fontSize: 12, fontWeight: 600, cursor: formName.trim() ? "pointer" : "default",
                                boxShadow: formName.trim() ? "0 1px 3px rgba(27,80,145,0.15)" : "none",
                                transition: "background .15s",
                            }}
                                onMouseEnter={e => { if (formName.trim()) e.currentTarget.style.background = "var(--t-accent-hover)" }}
                                onMouseLeave={e => { if (formName.trim()) e.currentTarget.style.background = "var(--t-accent)" }}
                            >
                                {submitting && <Loader2 size={12} className="animate-spin" />}
                                {editingGroup ? <><Save size={12} /> حفظ</> : <><Plus size={12} /> إنشاء</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes grpIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
                @keyframes grpModal { from { opacity:0; transform:scale(.97) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
            `}</style>
        </div>
    )
}

