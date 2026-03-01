import { useState, useCallback, useEffect } from "react"
import {
    Plus,
    Trash2,
    Edit3,
    Eye,
    Search,
    X,
    FileText,
    MoreVertical,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Archive,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Template, TemplateStatus, CreateTemplatePayload, TemplateMetadata } from "../types"

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    published: { label: "منشور", color: "#16a34a", bg: "rgba(22,163,74,0.08)", icon: CheckCircle2 },
    draft: { label: "مسودة", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: Clock },
    archived: { label: "مؤرشف", color: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: Archive },
}

interface TemplatesTabProps {
    onNavigateToTab?: (tab: string) => void
    onSelectTemplate?: (templateId: string) => void
}

export function TemplatesTab({ onNavigateToTab, onSelectTemplate }: TemplatesTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TemplateStatus | "">("")
    const [showCreate, setShowCreate] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)

    // Create/Edit form
    const [formName, setFormName] = useState("")
    const [formDesc, setFormDesc] = useState("")
    const [formHeader, setFormHeader] = useState("")
    const [formFooter, setFormFooter] = useState("")
    const [formButton, setFormButton] = useState("")
    const [formSubmitting, setFormSubmitting] = useState(false)

    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await menuService.listTemplates({
                page: 1,
                limit: 100,
                status: statusFilter || undefined,
            })
            setTemplates(res.data.templates || [])
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "حدث خطأ في جلب القوالب"
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => { fetchTemplates() }, [fetchTemplates])

    const filtered = templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase())
    )

    const resetForm = () => {
        setFormName("")
        setFormDesc("")
        setFormHeader("")
        setFormFooter("")
        setFormButton("")
        setShowCreate(false)
        setEditingTemplate(null)
    }

    const openEdit = (t: Template) => {
        setEditingTemplate(t)
        setFormName(t.name)
        setFormDesc(t.description || "")
        setFormHeader(t.metadata?.header || "")
        setFormFooter(t.metadata?.footer || "")
        setFormButton(t.metadata?.button || "")
        setShowCreate(true)
    }

    const handleSubmit = async () => {
        if (!formName.trim()) return
        setFormSubmitting(true)
        try {
            if (editingTemplate) {
                const payload: { name?: string; description?: string; metadata?: TemplateMetadata } = {}
                if (formName !== editingTemplate.name) payload.name = formName
                if (formDesc !== (editingTemplate.description || "")) payload.description = formDesc
                const meta: TemplateMetadata = {}
                if (formHeader) meta.header = formHeader
                if (formFooter) meta.footer = formFooter
                if (formButton) meta.button = formButton
                if (Object.keys(meta).length > 0) payload.metadata = meta
                await menuService.updateTemplate(editingTemplate.template_id, payload)
            } else {
                const payload: CreateTemplatePayload = { name: formName }
                if (formDesc) payload.description = formDesc
                await menuService.createTemplate(payload)
            }
            resetForm()
            fetchTemplates()
        } catch {
            // silent
        } finally {
            setFormSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await menuService.deleteTemplate(id)
            fetchTemplates()
        } catch {
            // silent
        }
    }

    const handleStatusChange = async (t: Template, newStatus: TemplateStatus) => {
        try {
            await menuService.updateTemplate(t.template_id, { status: newStatus })
            setActiveMenu(null)
            fetchTemplates()
        } catch {
            // silent
        }
    }

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>القوالب</h2>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", margin: "4px 0 0" }}>
                        إنشاء وإدارة قوالب القوائم التفاعلية
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowCreate(true) }}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 10,
                        border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #004786, #0098d6)",
                        color: "#fff", fontSize: 13, fontWeight: 600,
                        transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,71,134,0.2)",
                    }}
                >
                    <Plus size={15} />
                    إنشاء قالب
                </button>
            </div>

            {/* ── Filters ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px", borderRadius: 10,
                    background: "var(--t-surface, #f9fafb)",
                    border: "1px solid var(--t-border-light, #e5e7eb)",
                    flex: "1 1 200px", maxWidth: 320,
                }}>
                    <Search size={14} style={{ color: "var(--t-text-muted, #9ca3af)" }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث في القوالب..."
                        style={{
                            border: "none", background: "transparent", fontSize: 13,
                            outline: "none", flex: 1, color: "var(--t-text, #1f2937)",
                        }}
                    />
                    {search && <X size={13} style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setSearch("")} />}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {([["", "الكل"], ["published", "منشور"], ["draft", "مسودة"], ["archived", "مؤرشف"]] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setStatusFilter(val as TemplateStatus | "")}
                            style={{
                                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                                border: "1px solid",
                                borderColor: statusFilter === val ? "#004786" : "var(--t-border-light, #e5e7eb)",
                                background: statusFilter === val ? "rgba(0,71,134,0.08)" : "transparent",
                                color: statusFilter === val ? "#004786" : "var(--t-text-secondary, #6b7280)",
                                cursor: "pointer", transition: "all 0.15s",
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Loading / Error ── */}
            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل القوالب...</p>
                </div>
            )}
            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: 16, borderRadius: 12,
                    background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13,
                }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Templates Grid ── */}
            {!loading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                    {filtered.map((t) => {
                        const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
                        const StIcon = st.icon
                        return (
                            <div
                                key={t.template_id}
                                style={{
                                    borderRadius: 14, border: "1px solid var(--t-border-light, #e5e7eb)",
                                    background: "var(--t-card, #fff)", overflow: "hidden",
                                    transition: "all 0.2s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)" }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)" }}
                            >
                                {/* Card Header Gradient Line */}
                                <div style={{ height: 3, background: `linear-gradient(to left, ${st.color}, ${st.color}88)` }} />
                                <div style={{ padding: 16 }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0, marginBottom: 4 }}>
                                                {t.name}
                                            </h3>
                                            {t.description && (
                                                <p style={{
                                                    fontSize: 12, color: "var(--t-text-secondary, #6b7280)", margin: 0,
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {t.description}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === t.template_id ? null : t.template_id)}
                                                style={{
                                                    background: "transparent", border: "none", cursor: "pointer",
                                                    padding: 4, borderRadius: 6, color: "#9ca3af",
                                                    transition: "all 0.15s",
                                                }}
                                            >
                                                <MoreVertical size={15} />
                                            </button>
                                            {activeMenu === t.template_id && (
                                                <div style={{
                                                    position: "absolute", left: 0, top: "100%", zIndex: 50,
                                                    background: "var(--t-card, #fff)", borderRadius: 10,
                                                    border: "1px solid var(--t-border-light, #e5e7eb)",
                                                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 160,
                                                    padding: 4, overflow: "hidden",
                                                }}>
                                                    {t.status !== "published" && (
                                                        <button onClick={() => handleStatusChange(t, "published")} style={menuItemStyle}>
                                                            <CheckCircle2 size={13} style={{ color: "#16a34a" }} /> نشر القالب
                                                        </button>
                                                    )}
                                                    {t.status !== "archived" && (
                                                        <button onClick={() => handleStatusChange(t, "archived")} style={menuItemStyle}>
                                                            <Archive size={13} style={{ color: "#6b7280" }} /> أرشفة
                                                        </button>
                                                    )}
                                                    {t.status !== "draft" && (
                                                        <button onClick={() => handleStatusChange(t, "draft")} style={menuItemStyle}>
                                                            <Clock size={13} style={{ color: "#d97706" }} /> مسودة
                                                        </button>
                                                    )}
                                                    <div style={{ margin: "2px 6px", borderTop: "1px solid var(--t-border-light, #e5e7eb)" }} />
                                                    <button onClick={() => handleDelete(t.template_id)} style={{ ...menuItemStyle, color: "#ef4444" }}>
                                                        <Trash2 size={13} /> حذف
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "3px 10px", borderRadius: 20,
                                            background: st.bg, color: st.color,
                                            fontSize: 11, fontWeight: 600,
                                        }}>
                                            <StIcon size={11} /> {st.label}
                                        </span>
                                        {t.root_menu_id && (
                                            <span style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)" }}>
                                                · {t.root_menu_id.substring(0, 8)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Meta info */}
                                    {t.metadata && (
                                        <div style={{
                                            padding: "8px 10px", borderRadius: 8,
                                            background: "var(--t-surface, #f9fafb)", marginBottom: 12,
                                            fontSize: 11, color: "var(--t-text-secondary, #6b7280)",
                                        }}>
                                            {t.metadata.header && <div>📌 {t.metadata.header}</div>}
                                            {t.metadata.footer && <div>📝 {t.metadata.footer}</div>}
                                            {t.metadata.button && <div>🔘 {t.metadata.button}</div>}
                                        </div>
                                    )}

                                    {/* Date */}
                                    <div style={{ fontSize: 11, color: "var(--t-text-muted, #9ca3af)", marginBottom: 12 }}>
                                        تم الإنشاء: {new Date(t.created_at).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" })}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button
                                            onClick={() => {
                                                onSelectTemplate?.(t.template_id)
                                                onNavigateToTab?.("tree-editor")
                                            }}
                                            style={actionBtnStyle("#004786")}
                                        >
                                            <Eye size={13} /> عرض الشجرة
                                        </button>
                                        <button onClick={() => openEdit(t)} style={actionBtnStyle("#0072b5")}>
                                            <Edit3 size={13} /> تعديل
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {filtered.length === 0 && !loading && (
                        <div style={{
                            gridColumn: "1 / -1", textAlign: "center", padding: 60,
                            color: "var(--t-text-muted, #9ca3af)",
                        }}>
                            <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                            <p style={{ fontSize: 14, fontWeight: 600 }}>لا توجد قوالب</p>
                            <p style={{ fontSize: 12 }}>ابدأ بإنشاء قالب جديد لبناء قائمة تفاعلية</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create/Edit Modal Overlay ── */}
            {showCreate && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 20,
                }} onClick={() => resetForm()}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%", maxWidth: 480, borderRadius: 18,
                            background: "var(--t-card, #fff)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                            overflow: "hidden",
                            animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)",
                            padding: "18px 20px", position: "relative", overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                                    {editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}
                                </span>
                                <button onClick={resetForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}>
                                    <X size={14} style={{ color: "#fff" }} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={labelStyle}>اسم القالب *</label>
                                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="مثال: القائمة الرئيسية" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>الوصف</label>
                                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="وصف مختصر للقالب..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                            </div>
                            {editingTemplate && (
                                <>
                                    <div style={{ borderTop: "1px solid var(--t-border-light, #e5e7eb)", paddingTop: 12, marginTop: 4 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", marginBottom: 10 }}>
                                            بيانات العرض (Metadata)
                                        </p>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>العنوان (Header)</label>
                                        <input value={formHeader} onChange={(e) => setFormHeader(e.target.value)} placeholder="عنوان القائمة" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>التذييل (Footer)</label>
                                        <input value={formFooter} onChange={(e) => setFormFooter(e.target.value)} placeholder="تذييل القائمة" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>الزر (Button)</label>
                                        <input value={formButton} onChange={(e) => setFormButton(e.target.value)} placeholder="نص الزر" style={inputStyle} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: "12px 20px", borderTop: "1px solid var(--t-border-light, #e5e7eb)",
                            display: "flex", justifyContent: "flex-end", gap: 8,
                        }}>
                            <button onClick={resetForm} style={{
                                padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light, #e5e7eb)",
                                background: "transparent", color: "var(--t-text-secondary, #6b7280)",
                                fontSize: 13, fontWeight: 500, cursor: "pointer",
                            }}>
                                إلغاء
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={formSubmitting || !formName.trim()}
                                style={{
                                    padding: "8px 20px", borderRadius: 8, border: "none",
                                    background: formName.trim() ? "linear-gradient(135deg, #004786, #0098d6)" : "#e5e7eb",
                                    color: formName.trim() ? "#fff" : "#9ca3af",
                                    fontSize: 13, fontWeight: 600, cursor: formName.trim() ? "pointer" : "default",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}
                            >
                                {formSubmitting && <Loader2 size={13} className="animate-spin" />}
                                {editingTemplate ? "حفظ التعديلات" : "إنشاء"}
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

const menuItemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "7px 10px", borderRadius: 6,
    border: "none", background: "transparent",
    cursor: "pointer", fontSize: 12, fontWeight: 500,
    textAlign: "right", color: "var(--t-text, #374151)",
    transition: "background 0.12s",
}

const actionBtnStyle = (color: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500,
    border: `1px solid ${color}22`, background: `${color}08`,
    color, cursor: "pointer", transition: "all 0.15s",
})

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "var(--t-text-secondary, #6b7280)", marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid var(--t-border-light, #e5e7eb)",
    background: "var(--t-surface, #f9fafb)", fontSize: 13,
    outline: "none", color: "var(--t-text, #1f2937)",
    transition: "border-color 0.15s",
}
