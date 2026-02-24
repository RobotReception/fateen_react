import { useState, useCallback, useMemo } from "react"
import { ChevronDown, ChevronLeft, Loader2, Check, Minus, Lock, Shield, Search } from "lucide-react"
import { useAllPermissions, useRoleActivePermissionIds, useAddRolePermissions, useRemoveRolePermissions } from "../hooks/use-roles"
import type { PermissionSection } from "../types"

/* ─── Section display names (Arabic) ─── */
const SECTION_LABELS: Record<string, string> = {
    contact_fields: "حقول الاتصال",
    contacts: "جهات الاتصال",
    customers: "العملاء",
    document_management: "إدارة الوثائق",
    document_analytics: "تحليلات الوثائق",
    documents: "المستندات",
    lifecycles: "دورات الحياة",
    menus: "القوائم",
    snippets: "المقتطفات",
    tags: "الوسوم",
    teams: "الفرق",
    admin_users: "إدارة المستخدمين",
    auth_admin: "إدارة المصادقة",
    channels: "القنوات",
    trainrequests: "طلبات التدريب (قديم)",
    train_requests: "طلبات التدريب",
    pending_requests: "الطلبات المعلقة",
    operation_history: "سجل العمليات",
    permission_admin: "إدارة الصلاحيات",
    roles: "الأدوار",
    departments: "الأقسام",
    organization: "المنظمة",
    user_profile: "الملف الشخصي",
    ai_settings: "إعدادات الذكاء الاصطناعي",
    agents: "الوكلاء",
    inbox: "صندوق الوارد",
    media: "الوسائط",
}

/* ─── Toggle Switch — forced LTR ─── */
function ToggleSwitch({ checked, disabled, onChange }: {
    checked: boolean
    disabled?: boolean
    onChange: () => void
}) {
    return (
        <button
            type="button"
            role="switch"
            dir="ltr"
            aria-checked={checked}
            disabled={disabled}
            onClick={onChange}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                width: 40,
                height: 22,
                borderRadius: 11,
                border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                backgroundColor: checked ? "var(--t-accent)" : "var(--t-surface-deep)",
                transition: "background-color 0.2s ease",
                padding: 0,
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    display: "block",
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: "var(--t-card)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "transform 0.2s ease",
                    transform: checked ? "translateX(20px)" : "translateX(2px)",
                }}
            />
        </button>
    )
}

/* ─── Section Header Checkbox ─── */
type SectionState = "all" | "some" | "none"

function SectionCheckbox({ state, disabled, onClick }: {
    state: SectionState
    disabled: boolean
    onClick: () => void
}) {
    const bg = state === "none" ? "#fff" : "var(--t-accent)"
    const border = state === "none" ? "var(--t-surface-deep)" : "var(--t-accent)"
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                borderRadius: 5,
                border: `2px solid ${border}`,
                backgroundColor: bg,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "all 0.15s ease",
                flexShrink: 0,
                padding: 0,
            }}
            title={state === "all" ? "إلغاء تحديد الكل" : "تحديد الكل"}
        >
            {state === "all" && <Check size={12} strokeWidth={3} style={{ color: "var(--t-text-on-accent)" }} />}
            {state === "some" && <Minus size={12} strokeWidth={3} style={{ color: "var(--t-text-on-accent)" }} />}
        </button>
    )
}

/* ============================================================ */

interface Props {
    role: string
}

export function PermissionsGrid({ role }: Props) {
    const { data: allSections, isLoading: allLoading } = useAllPermissions()
    const { data: activeIds, isLoading: activeLoading } = useRoleActivePermissionIds(role)
    const addMut = useAddRolePermissions(role)
    const removeMut = useRemoveRolePermissions(role)

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
    const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")

    const busy = addMut.isPending || removeMut.isPending
    const isLoading = allLoading || activeLoading
    const activeSet = activeIds || new Set<string>()

    const toggleCollapse = useCallback((section: string) => {
        setCollapsed(p => ({ ...p, [section]: !p[section] }))
    }, [])

    const togglePerm = useCallback((permId: string) => {
        if (busy) return
        const on = activeSet.has(permId)

        setMutatingIds(prev => new Set(prev).add(permId))
        const cleanup = () => {
            setMutatingIds(prev => {
                const next = new Set(prev)
                next.delete(permId)
                return next
            })
        }

        if (on) {
            removeMut.mutate([permId], { onSettled: cleanup })
        } else {
            addMut.mutate([permId], { onSettled: cleanup })
        }
    }, [busy, activeSet, addMut, removeMut])

    const toggleSection = useCallback((section: PermissionSection) => {
        if (busy) return
        const allIds = section.actions.map(a => a.id)
        const allActive = section.actions.every(a => activeSet.has(a.id))

        if (allActive) {
            removeMut.mutate(allIds)
        } else {
            const toAdd = allIds.filter(id => !activeSet.has(id))
            addMut.mutate(toAdd)
        }
    }, [busy, activeSet, addMut, removeMut])

    const filteredSections = useMemo((): PermissionSection[] => {
        if (!allSections) return []
        if (!searchQuery.trim()) return allSections

        const q = searchQuery.trim().toLowerCase()
        return allSections
            .map(section => {
                const sectionLabel = (SECTION_LABELS[section.section] || section.section).toLowerCase()
                if (sectionLabel.includes(q)) return section

                const filteredActions = section.actions.filter(a =>
                    a.name.toLowerCase().includes(q) ||
                    a.id.toLowerCase().includes(q) ||
                    a.action.toLowerCase().includes(q)
                )
                if (filteredActions.length === 0) return null
                return { ...section, actions: filteredActions }
            })
            .filter(Boolean) as PermissionSection[]
    }, [allSections, searchQuery])

    const totalPerms = useMemo(() =>
        allSections?.reduce((acc, s) => acc + s.actions.length, 0) || 0
        , [allSections])

    const totalActive = useMemo(() =>
        allSections?.reduce((acc, s) =>
            acc + s.actions.filter(a => activeSet.has(a.id)).length, 0
        ) || 0
        , [allSections, activeSet])

    /* ─── Loading ─── */
    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div style={{ textAlign: "center" }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: "var(--t-text-faint)", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 13, color: "var(--t-text-muted)", fontWeight: 500 }}>جارٍ تحميل الصلاحيات...</p>
                </div>
            </div>
        )
    }

    /* ─── Empty ─── */
    if (!allSections || allSections.length === 0) {
        return (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 10, background: "var(--t-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px"
                }}>
                    <Lock size={18} style={{ color: "var(--t-text-faint)" }} />
                </div>
                <p style={{ fontSize: 14, color: "var(--t-text-secondary)", fontWeight: 600 }}>لا توجد صلاحيات في النظام</p>
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── Search & Summary ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Search */}
                <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
                    <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="بحث في الصلاحيات..."
                        style={{
                            width: "100%",
                            borderRadius: 8,
                            border: "1px solid var(--t-border)",
                            background: "var(--t-card-hover)",
                            paddingRight: 34, paddingLeft: 12, paddingTop: 9, paddingBottom: 9,
                            fontSize: 13, color: "var(--t-text)",
                            outline: "none",
                            transition: "border-color 0.15s, background 0.15s",
                        }}
                        onFocus={e => { e.target.style.borderColor = "var(--t-text-faint)"; e.target.style.background = "var(--t-card)" }}
                        onBlur={e => { e.target.style.borderColor = "var(--t-border)"; e.target.style.background = "var(--t-card-hover)" }}
                    />
                </div>

                {/* Summary */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--t-surface)",
                    border: "1px solid var(--t-border)",
                    borderRadius: 8, padding: "7px 12px",
                }}>
                    <Shield size={13} style={{ color: "var(--t-text-muted)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", fontFeatureSettings: "'tnum'" }}>
                        {totalActive}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--t-text-faint)" }}>/</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text-secondary)", fontFeatureSettings: "'tnum'" }}>
                        {totalPerms}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--t-text-muted)", fontWeight: 500 }}>مفعّلة</span>
                </div>

                <span style={{ fontSize: 12, color: "var(--t-text-faint)", fontWeight: 500 }}>{filteredSections.length} قسم</span>
            </div>

            {/* ── Sections ── */}
            {filteredSections.map(section => {
                const isOpen = !collapsed[section.section]
                const label = SECTION_LABELS[section.section] || section.section.replace(/_/g, " ")
                const activeCount = section.actions.filter(a => activeSet.has(a.id)).length
                const total = section.actions.length
                const sectionState: SectionState = activeCount === 0 ? "none" : activeCount === total ? "all" : "some"
                const progress = total > 0 ? (activeCount / total) * 100 : 0

                return (
                    <div
                        key={section.section}
                        style={{
                            borderRadius: 10,
                            border: "1px solid var(--t-border)",
                            background: "var(--t-card)",
                            overflow: "hidden",
                            transition: "box-shadow 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px var(--t-shadow)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                        {/* Section Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                            {/* Collapse */}
                            <button
                                onClick={() => toggleCollapse(section.section)}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: 26, height: 26, borderRadius: 6,
                                    border: "none", background: "var(--t-surface)", cursor: "pointer",
                                    flexShrink: 0, transition: "background 0.12s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--t-surface-deep)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "var(--t-surface)")}
                            >
                                {isOpen
                                    ? <ChevronDown size={14} style={{ color: "var(--t-text-secondary)" }} />
                                    : <ChevronLeft size={14} style={{ color: "var(--t-text-secondary)" }} />}
                            </button>

                            {/* Select all */}
                            <SectionCheckbox
                                state={sectionState}
                                disabled={busy}
                                onClick={() => toggleSection(section)}
                            />

                            {/* Section name */}
                            <button
                                onClick={() => toggleCollapse(section.section)}
                                style={{
                                    flex: 1, minWidth: 0, textAlign: "right",
                                    border: "none", background: "none", cursor: "pointer", padding: 0
                                }}
                            >
                                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--t-text)", display: "block" }}>
                                    {label}
                                </span>
                                <span style={{ fontSize: 11, color: "var(--t-text-faint)", fontFamily: "monospace" }} dir="ltr">
                                    {section.section}
                                </span>
                            </button>

                            {/* Count + progress */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 600, color: activeCount > 0 ? "var(--t-accent)" : "var(--t-text-faint)",
                                    fontFeatureSettings: "'tnum'",
                                }}>
                                    {activeCount}/{total}
                                </span>
                                <div style={{
                                    width: 44, height: 5, borderRadius: 3,
                                    background: "var(--t-surface)", overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${progress}%`, height: "100%",
                                        borderRadius: 3, backgroundColor: "var(--t-accent)",
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Permissions list */}
                        {isOpen && (
                            <div style={{ borderTop: "1px solid var(--t-border-light)", animation: "pgSlide .15s ease-out" }}>
                                {section.actions.map((perm) => {
                                    const on = activeSet.has(perm.id)
                                    const isMutating = mutatingIds.has(perm.id)

                                    return (
                                        <div
                                            key={perm.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "10px 18px",
                                                borderBottom: "1px solid var(--t-border-light)",
                                                background: on ? "var(--t-card-hover)" : "transparent",
                                                transition: "background 0.12s",
                                            }}
                                            onMouseEnter={e => {
                                                if (!on) e.currentTarget.style.background = "var(--t-card-hover)"
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = on ? "var(--t-card-hover)" : "transparent"
                                            }}
                                        >
                                            {/* Toggle */}
                                            <div style={{ flexShrink: 0 }}>
                                                {isMutating ? (
                                                    <div style={{ width: 40, display: "flex", justifyContent: "center" }}>
                                                        <Loader2 size={16} className="animate-spin" style={{ color: "var(--t-text-faint)" }} />
                                                    </div>
                                                ) : (
                                                    <ToggleSwitch
                                                        checked={on}
                                                        disabled={busy}
                                                        onChange={() => togglePerm(perm.id)}
                                                    />
                                                )}
                                            </div>

                                            {/* Permission name */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: 13,
                                                    fontWeight: on ? 600 : 400,
                                                    color: on ? "var(--t-accent)" : "var(--t-text-muted)",
                                                    margin: 0,
                                                    lineHeight: 1.5,
                                                }}>
                                                    {perm.name}
                                                </p>
                                            </div>

                                            {/* Permission ID */}
                                            <span dir="ltr" style={{
                                                fontSize: 10,
                                                fontFamily: "monospace",
                                                color: "var(--t-text-faint)",
                                                flexShrink: 0,
                                                background: "var(--t-surface)",
                                                padding: "2px 7px",
                                                borderRadius: 5,
                                            }}>
                                                {perm.id}
                                            </span>

                                            {/* Status */}
                                            {on && (
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    fontSize: 11, fontWeight: 600,
                                                    color: "var(--t-text-secondary)", flexShrink: 0,
                                                    background: "var(--t-surface)",
                                                    padding: "3px 9px",
                                                    borderRadius: 20,
                                                }}>
                                                    <span style={{
                                                        width: 5, height: 5, borderRadius: 3,
                                                        backgroundColor: "var(--t-accent)",
                                                    }} />
                                                    مفعّلة
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* No search results */}
            {filteredSections.length === 0 && searchQuery.trim() && (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>لا توجد نتائج لـ "{searchQuery}"</p>
                </div>
            )}

            <style>{`
                @keyframes pgFade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pgSlide{from{opacity:0;max-height:0}to{opacity:1;max-height:5000px}}
            `}</style>
        </div>
    )
}
