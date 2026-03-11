import { useState, useCallback, useMemo } from "react"
import { ChevronDown, ChevronLeft, Loader2, Check, Minus, Lock, Shield, Search } from "lucide-react"
import { useAllPermissions, useRoleActivePermissionIds, useAddRolePermissions, useRemoveRolePermissions } from "../hooks/use-roles"
import type { PermissionSection } from "../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

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
    document_search: "بحث الوثائق",
}

/* ─── Toggle Switch ─── */
function ToggleSwitch({ checked, disabled, onChange }: {
    checked: boolean; disabled?: boolean; onChange: () => void
}) {
    return (
        <button
            type="button" role="switch" dir="ltr"
            aria-checked={checked} disabled={disabled} onClick={onChange}
            style={{
                position: "relative", display: "inline-flex", alignItems: "center",
                width: 38, height: 20, borderRadius: 10, border: "none",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                backgroundColor: checked ? "var(--t-accent)" : "var(--t-surface-deep, #e2e4e7)",
                transition: "background-color 0.2s ease", padding: 0, flexShrink: 0,
            }}
        >
            <span style={{
                display: "block", width: 16, height: 16, borderRadius: 8,
                backgroundColor: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                transition: "transform 0.2s ease",
                transform: checked ? "translateX(20px)" : "translateX(2px)",
            }} />
        </button>
    )
}

/* ─── Section Header Checkbox ─── */
type SectionState = "all" | "some" | "none"

function SectionCheckbox({ state, disabled, onClick }: {
    state: SectionState; disabled: boolean; onClick: () => void
}) {
    return (
        <button onClick={onClick} disabled={disabled}
            style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 18, height: 18, borderRadius: 5,
                border: `2px solid ${state === "none" ? "var(--t-surface-deep, var(--t-border-medium))" : "var(--t-accent)"}`,
                backgroundColor: state === "none" ? "#fff" : "var(--t-accent)",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "all 0.15s ease", flexShrink: 0, padding: 0,
            }}
            title={state === "all" ? "إلغاء تحديد الكل" : "تحديد الكل"}
        >
            {state === "all" && <Check size={11} strokeWidth={3} style={{ color: "#fff" }} />}
            {state === "some" && <Minus size={11} strokeWidth={3} style={{ color: "#fff" }} />}
        </button>
    )
}

/* ============================================================ */

interface Props { role: string }

export function PermissionsGrid({ role }: Props) {
    const { data: allSections, isLoading: allLoading } = useAllPermissions()
    const { data: activeIds, isLoading: activeLoading } = useRoleActivePermissionIds(role)
    const addMut = useAddRolePermissions(role)
    const removeMut = useRemoveRolePermissions(role)

    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")
    const [searchFocused, setSearchFocused] = useState(false)

    const busy = addMut.isPending || removeMut.isPending
    const isLoading = allLoading || activeLoading
    const activeSet = activeIds || new Set<string>()

    /* ── فحص صلاحية التعديل ── */
    const { canPerformAction } = usePermissions()
    const canModify = canPerformAction(PAGE_BITS.ROLES, ACTION_BITS.ADD_ROLE_PERMISSIONS)
        || canPerformAction(PAGE_BITS.ROLES, ACTION_BITS.REMOVE_ROLE_PERMISSIONS)
    const isDisabled = busy || !canModify

    const toggleExpand = useCallback((section: string) => {
        setExpanded(p => ({ ...p, [section]: !p[section] }))
    }, [])

    const togglePerm = useCallback((permId: string) => {
        if (busy || !canModify) return
        const on = activeSet.has(permId)
        setMutatingIds(prev => new Set(prev).add(permId))
        const cleanup = () => {
            setMutatingIds(prev => { const next = new Set(prev); next.delete(permId); return next })
        }
        if (on) { removeMut.mutate([permId], { onSettled: cleanup }) }
        else { addMut.mutate([permId], { onSettled: cleanup }) }
    }, [busy, canModify, activeSet, addMut, removeMut])

    const toggleSection = useCallback((section: PermissionSection) => {
        if (busy || !canModify) return
        const allIds = section.actions.map(a => a.id)
        const allActive = section.actions.every(a => activeSet.has(a.id))
        if (allActive) { removeMut.mutate(allIds) }
        else { addMut.mutate(allIds.filter(id => !activeSet.has(id))) }
    }, [busy, canModify, activeSet, addMut, removeMut])

    const filteredSections = useMemo((): PermissionSection[] => {
        if (!allSections) return []
        if (!searchQuery.trim()) return allSections
        const q = searchQuery.trim().toLowerCase()
        return allSections
            .map(section => {
                const sectionLabel = (SECTION_LABELS[section.section] || section.section).toLowerCase()
                if (sectionLabel.includes(q)) return section
                const filteredActions = section.actions.filter(a =>
                    a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.action.toLowerCase().includes(q)
                )
                if (filteredActions.length === 0) return null
                return { ...section, actions: filteredActions }
            })
            .filter(Boolean) as PermissionSection[]
    }, [allSections, searchQuery])

    const totalPerms = useMemo(() => allSections?.reduce((acc, s) => acc + s.actions.length, 0) || 0, [allSections])
    const totalActive = useMemo(() =>
        allSections?.reduce((acc, s) => acc + s.actions.filter(a => activeSet.has(a.id)).length, 0) || 0
        , [allSections, activeSet])

    /* ─── Loading ─── */
    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div style={{ textAlign: "center" }}>
                    <Loader2 size={22} className="animate-spin" style={{ color: "var(--t-accent)", margin: "0 auto 10px" }} />
                    <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", fontWeight: 500, margin: 0 }}>جارٍ تحميل الصلاحيات...</p>
                </div>
            </div>
        )
    }

    /* ─── Empty ─── */
    if (!allSections || allSections.length === 0) {
        return (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: "rgba(27,80,145,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px"
                }}>
                    <Lock size={18} style={{ color: "var(--t-accent)" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, var(--t-text))", margin: 0 }}>لا توجد صلاحيات في النظام</p>
            </div>
        )
    }

    const progressPct = totalPerms > 0 ? (totalActive / totalPerms) * 100 : 0

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* ── Search & Summary ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
                    <Search size={13} style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        color: searchFocused ? "var(--t-accent)" : "var(--t-text-faint, var(--t-text-faint))",
                        pointerEvents: "none", transition: "color .15s",
                    }} />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="بحث في الصلاحيات..."
                        style={{
                            width: "100%", borderRadius: 8,
                            border: `1.5px solid ${searchFocused ? "var(--t-accent)" : "var(--t-border, var(--t-border))"}`,
                            background: "var(--t-surface, var(--t-card-hover))",
                            paddingRight: 32, paddingLeft: 12, paddingTop: 8, paddingBottom: 8,
                            fontSize: 12, color: "var(--t-text, var(--t-text))", outline: "none",
                            transition: "border-color .15s, box-shadow .15s",
                            boxShadow: searchFocused ? "0 0 0 3px rgba(27,80,145,0.06)" : "none",
                        }}
                    />
                </div>

                {/* Summary badge */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(27,80,145,0.04)",
                    borderRadius: 8, padding: "6px 12px",
                }}>
                    <Shield size={12} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)", fontFeatureSettings: "'tnum'" }}>
                        {totalActive}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))" }}>/</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))", fontFeatureSettings: "'tnum'" }}>
                        {totalPerms}
                    </span>
                    {/* Mini progress */}
                    <div style={{
                        width: 40, height: 4, borderRadius: 2,
                        background: "rgba(27,80,145,0.1)", overflow: "hidden",
                    }}>
                        <div style={{
                            width: `${progressPct}%`, height: "100%",
                            borderRadius: 2, backgroundColor: "var(--t-accent)",
                            transition: "width 0.3s ease",
                        }} />
                    </div>
                </div>
                <span style={{ fontSize: 11, color: "var(--t-text-faint, var(--t-text-faint))", fontWeight: 500 }}>{filteredSections.length} قسم</span>
            </div>

            {/* ── تنبيه عدم وجود صلاحية التعديل ── */}
            {!canModify && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 8,
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.15)",
                }}>
                    <Lock size={13} style={{ color: "var(--t-warning)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: "#92400e", fontWeight: 500 }}>عرض فقط — ليس لديك صلاحية تعديل الصلاحيات</span>
                </div>
            )}

            {/* ── Sections ── */}
            {filteredSections.map(section => {
                const isOpen = !!expanded[section.section]
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
                            border: "1px solid var(--t-border-light, #eaedf0)",
                            background: "var(--t-card, #fff)",
                            overflow: "hidden", transition: "box-shadow 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                        {/* Section Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                            <button
                                onClick={() => toggleExpand(section.section)}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: 24, height: 24, borderRadius: 6,
                                    border: "none", background: "var(--t-surface, var(--t-surface))", cursor: "pointer",
                                    flexShrink: 0, transition: "background 0.12s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--t-surface-deep, var(--t-border))")}
                                onMouseLeave={e => (e.currentTarget.style.background = "var(--t-surface, var(--t-surface))")}
                            >
                                {isOpen
                                    ? <ChevronDown size={13} style={{ color: "var(--t-text-secondary, var(--t-text-muted))" }} />
                                    : <ChevronLeft size={13} style={{ color: "var(--t-text-secondary, var(--t-text-muted))" }} />}
                            </button>

                            <SectionCheckbox
                                state={sectionState}
                                disabled={isDisabled}
                                onClick={() => toggleSection(section)}
                            />

                            <button
                                onClick={() => toggleExpand(section.section)}
                                style={{ flex: 1, minWidth: 0, textAlign: "right", border: "none", background: "none", cursor: "pointer", padding: 0 }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text, var(--t-text))", display: "block" }}>
                                    {label}
                                </span>
                                <span style={{ fontSize: 10, color: "var(--t-text-faint, var(--t-text-faint))", fontFamily: "monospace" }} dir="ltr">
                                    {section.section}
                                </span>
                            </button>

                            {/* Count + progress */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: activeCount > 0 ? "var(--t-accent)" : "var(--t-text-faint, var(--t-text-faint))",
                                    fontFeatureSettings: "'tnum'",
                                }}>
                                    {activeCount}/{total}
                                </span>
                                <div style={{
                                    width: 40, height: 4, borderRadius: 2,
                                    background: "var(--t-surface, #f0f1f3)", overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: `${progress}%`, height: "100%",
                                        borderRadius: 2, backgroundColor: "var(--t-accent)",
                                        transition: "width 0.3s ease",
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Permissions list */}
                        {isOpen && (
                            <div style={{ borderTop: "1px solid var(--t-border-light, #eaedf0)", animation: "pgSlide .15s ease-out" }}>
                                {section.actions.map((perm) => {
                                    const on = activeSet.has(perm.id)
                                    const isMutating = mutatingIds.has(perm.id)

                                    return (
                                        <div
                                            key={perm.id}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 10,
                                                padding: "9px 16px",
                                                borderBottom: "1px solid var(--t-border-light, #f0f1f3)",
                                                background: on ? "rgba(27,80,145,0.02)" : "transparent",
                                                transition: "background 0.12s",
                                            }}
                                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--t-surface, #fafbfc)" }}
                                            onMouseLeave={e => { e.currentTarget.style.background = on ? "rgba(27,80,145,0.02)" : "transparent" }}
                                        >
                                            <div style={{ flexShrink: 0 }}>
                                                {isMutating ? (
                                                    <div style={{ width: 38, display: "flex", justifyContent: "center" }}>
                                                        <Loader2 size={14} className="animate-spin" style={{ color: "var(--t-accent)" }} />
                                                    </div>
                                                ) : (
                                                    <ToggleSwitch checked={on} disabled={isDisabled} onChange={() => togglePerm(perm.id)} />
                                                )}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: 12.5, fontWeight: on ? 600 : 400,
                                                    color: on ? "var(--t-accent)" : "var(--t-text-secondary, var(--t-text-muted))",
                                                    margin: 0, lineHeight: 1.5,
                                                }}>
                                                    {perm.name}
                                                </p>
                                            </div>

                                            <span dir="ltr" style={{
                                                fontSize: 9.5, fontFamily: "monospace",
                                                color: "var(--t-text-faint, var(--t-text-faint))", flexShrink: 0,
                                                background: "var(--t-surface, var(--t-surface))",
                                                padding: "2px 6px", borderRadius: 4,
                                            }}>
                                                {perm.id}
                                            </span>

                                            {on && (
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 3,
                                                    fontSize: 10, fontWeight: 600, color: "var(--t-accent)", flexShrink: 0,
                                                    background: "rgba(27,80,145,0.06)",
                                                    padding: "2px 8px", borderRadius: 12,
                                                }}>
                                                    <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "var(--t-accent)" }} />
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
                    <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", margin: 0 }}>لا توجد نتائج لـ "{searchQuery}"</p>
                </div>
            )}

            <style>{`
                @keyframes pgSlide{from{opacity:0;max-height:0}to{opacity:1;max-height:5000px}}
            `}</style>
        </div>
    )
}
