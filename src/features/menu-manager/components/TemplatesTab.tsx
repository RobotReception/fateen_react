import { useState, useCallback, useEffect } from "react"
import {
    Plus, Trash2, Edit3, Eye, Search, X, FileText,
    MoreVertical, Loader2, AlertCircle, CheckCircle2,
    Clock, Archive, FolderTree, CalendarDays, Hash,
    Save, Sparkles,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Template, TemplateStatus, CreateTemplatePayload, TemplateMetadata } from "../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2; gradient: string }> = {
    published: { label: "منشور", color: "#16a34a", bg: "rgba(22,163,74,0.08)", icon: CheckCircle2, gradient: "linear-gradient(135deg, #22c55e, #16a34a)" },
    draft: { label: "مسودة", color: "#d97706", bg: "rgba(217,119,6,0.08)", icon: Clock, gradient: "linear-gradient(135deg, #fbbf24, #d97706)" },
    archived: { label: "مؤرشف", color: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: Archive, gradient: "linear-gradient(135deg, #9ca3af, #6b7280)" },
}

// ── Shared styles ──
const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", marginBottom: 5 }
const inputSt: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-surface, #f9fafb)", fontSize: 13, outline: "none", color: "var(--t-text, #1f2937)", transition: "border-color 0.15s, box-shadow 0.15s" }

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
    const [formName, setFormName] = useState("")
    const [formDesc, setFormDesc] = useState("")
    const [formHeader, setFormHeader] = useState("")
    const [formFooter, setFormFooter] = useState("")
    const [formButton, setFormButton] = useState("")
    const [formSubmitting, setFormSubmitting] = useState(false)
    const { canPerformAction } = usePermissions()
    const canCreate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.CREATE_TEMPLATE)
    const canUpdate = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.UPDATE_TEMPLATE)
    const canDelete = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.DELETE_TEMPLATE)
    const canManage = canUpdate || canDelete

    const fetchTemplates = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await menuService.listTemplates({ page: 1, limit: 100, status: statusFilter || undefined })
            setTemplates(res.data.templates || [])
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "حدث خطأ في جلب القوالب") }
        finally { setLoading(false) }
    }, [statusFilter])

    useEffect(() => { fetchTemplates() }, [fetchTemplates])

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase())
    )

    const resetForm = () => { setFormName(""); setFormDesc(""); setFormHeader(""); setFormFooter(""); setFormButton(""); setShowCreate(false); setEditingTemplate(null) }
    const openEdit = (t: Template) => { setEditingTemplate(t); setFormName(t.name); setFormDesc(t.description || ""); setFormHeader(t.metadata?.header || ""); setFormFooter(t.metadata?.footer || ""); setFormButton(t.metadata?.button || ""); setShowCreate(true) }

    const handleSubmit = async () => {
        if (!formName.trim()) return; setFormSubmitting(true)
        try {
            if (editingTemplate) {
                const payload: { name?: string; description?: string; metadata?: TemplateMetadata } = {}
                if (formName !== editingTemplate.name) payload.name = formName
                if (formDesc !== (editingTemplate.description || "")) payload.description = formDesc
                const meta: TemplateMetadata = {}; if (formHeader) meta.header = formHeader; if (formFooter) meta.footer = formFooter; if (formButton) meta.button = formButton
                if (Object.keys(meta).length > 0) payload.metadata = meta
                await menuService.updateTemplate(editingTemplate.template_id, payload)
            } else {
                const payload: CreateTemplatePayload = { name: formName }; if (formDesc) payload.description = formDesc
                await menuService.createTemplate(payload)
            }
            resetForm(); fetchTemplates()
        } catch { } finally { setFormSubmitting(false) }
    }

    const handleDelete = async (id: string) => { try { await menuService.deleteTemplate(id); fetchTemplates() } catch { } }
    const handleStatusChange = async (t: Template, newStatus: TemplateStatus) => { try { await menuService.updateTemplate(t.template_id, { status: newStatus }); setActiveMenu(null); fetchTemplates() } catch { } }

    const statusCounts = { all: templates.length, published: templates.filter(t => t.status === "published").length, draft: templates.filter(t => t.status === "draft").length, archived: templates.filter(t => t.status === "archived").length }

    return (
        <div>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", borderRadius: 12,
                    background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, #e5e7eb)",
                    flex: "1 1 200px", maxWidth: 360, transition: "border-color 0.15s, box-shadow 0.15s",
                }}>
                    <Search size={15} style={{ color: "var(--t-text-muted, #9ca3af)", flexShrink: 0 }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القوالب..."
                        style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", flex: 1, color: "var(--t-text, #1f2937)" }} />
                    {search && <X size={13} style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setSearch("")} />}
                </div>

                <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "var(--t-surface, #f3f4f6)" }}>
                    {([["", "الكل", statusCounts.all], ["published", "منشور", statusCounts.published], ["draft", "مسودة", statusCounts.draft], ["archived", "مؤرشف", statusCounts.archived]] as const).map(([val, label, cnt]) => (
                        <button key={val} onClick={() => setStatusFilter(val as TemplateStatus | "")} style={{
                            padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                            border: "none", cursor: "pointer", transition: "all 0.15s",
                            background: statusFilter === val ? "var(--t-card, #fff)" : "transparent",
                            color: statusFilter === val ? "var(--t-text, #1f2937)" : "var(--t-text-muted, #9ca3af)",
                            boxShadow: statusFilter === val ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                            display: "flex", alignItems: "center", gap: 4,
                        }}>
                            {label}
                            <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 6, background: statusFilter === val ? "rgba(0,71,134,0.08)" : "transparent", color: statusFilter === val ? "#004786" : "#9ca3af", fontWeight: 700 }}>{cnt}</span>
                        </button>
                    ))}
                </div>

                {canCreate && <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                    fontSize: 13, fontWeight: 600, transition: "all 0.2s",
                    boxShadow: "0 3px 12px rgba(0,71,134,0.25)",
                    marginRight: "auto",
                }}>
                    <Plus size={15} /> إنشاء قالب
                </button>}
            </div>

            {/* ── Loading / Error ── */}
            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={30} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل القوالب...</p>
                </div>
            )}
            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderRadius: 14, background: "rgba(239,68,68,0.05)", color: "#ef4444", fontSize: 13, border: "1px solid rgba(239,68,68,0.12)" }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* ── Templates Grid ── */}
            {!loading && !error && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                    {filtered.map(t => {
                        const st = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft
                        const StIcon = st.icon
                        const isMenuOpen = activeMenu === t.template_id
                        return (
                            <div key={t.template_id} style={{
                                borderRadius: 16, border: "1px solid var(--t-border-light, #e5e7eb)",
                                background: "var(--t-card, #fff)", overflow: "hidden",
                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)" }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03)"; e.currentTarget.style.transform = "translateY(0)" }}
                            >
                                {/* ─ Card top gradient bar ─ */}
                                <div style={{ height: 4, background: st.gradient }} />

                                <div style={{ padding: "16px 18px" }}>
                                    {/* Header */}
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 11, background: st.gradient,
                                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                boxShadow: `0 3px 10px ${st.color}30`,
                                            }}>
                                                <FileText size={18} style={{ color: "#fff" }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</h3>
                                                {t.description && <p style={{ fontSize: 12, color: "var(--t-text-secondary, #6b7280)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>}
                                            </div>
                                        </div>
                                        {canManage && <div style={{ position: "relative" }}>
                                            <button onClick={() => setActiveMenu(isMenuOpen ? null : t.template_id)} style={{
                                                background: isMenuOpen ? "var(--t-surface, #f3f4f6)" : "transparent", border: "none",
                                                cursor: "pointer", padding: 5, borderRadius: 8, color: "#9ca3af", transition: "all 0.15s",
                                            }}>
                                                <MoreVertical size={16} />
                                            </button>
                                            {isMenuOpen && (
                                                <div style={{
                                                    position: "absolute", left: 0, top: "100%", zIndex: 50, marginTop: 4,
                                                    background: "var(--t-card, #fff)", borderRadius: 12,
                                                    border: "1px solid var(--t-border-light, #e5e7eb)",
                                                    boxShadow: "0 12px 36px rgba(0,0,0,0.12)", width: 170,
                                                    padding: 5, overflow: "hidden",
                                                    animation: "menuPopIn 0.15s ease",
                                                }}>
                                                    {canUpdate && t.status !== "published" && <MenuItem icon={CheckCircle2} color="#16a34a" label="نشر القالب" onClick={() => handleStatusChange(t, "published")} />}
                                                    {canUpdate && t.status !== "archived" && <MenuItem icon={Archive} color="#6b7280" label="أرشفة" onClick={() => handleStatusChange(t, "archived")} />}
                                                    {canUpdate && t.status !== "draft" && <MenuItem icon={Clock} color="#d97706" label="مسودة" onClick={() => handleStatusChange(t, "draft")} />}
                                                    {canDelete && <><div style={{ margin: "3px 8px", borderTop: "1px solid var(--t-border-light, #e5e7eb)" }} />
                                                        <MenuItem icon={Trash2} color="#ef4444" label="حذف" onClick={() => handleDelete(t.template_id)} /></>}
                                                </div>
                                            )}
                                        </div>}
                                    </div>

                                    {/* Status + date */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "4px 10px", borderRadius: 20,
                                            background: st.bg, color: st.color, fontSize: 11, fontWeight: 600,
                                        }}>
                                            <StIcon size={11} /> {st.label}
                                        </span>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--t-text-muted, #9ca3af)" }}>
                                            <CalendarDays size={11} />
                                            {new Date(t.created_at).toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" })}
                                        </span>
                                        {t.root_menu_id && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#9ca3af" }}>
                                                <Hash size={10} /> {t.root_menu_id.substring(0, 8)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Metadata preview */}
                                    {t.metadata && (t.metadata.header || t.metadata.footer || t.metadata.button) && (
                                        <div style={{
                                            padding: "8px 12px", borderRadius: 10,
                                            background: "var(--t-surface, #f9fafb)", marginBottom: 14,
                                            fontSize: 11, color: "var(--t-text-secondary, #6b7280)",
                                            display: "flex", flexDirection: "column", gap: 3,
                                            border: "1px solid var(--t-border-light, #f0f0f0)",
                                        }}>
                                            {t.metadata.header && <div style={{ display: "flex", alignItems: "center", gap: 4 }}>📌 <span style={{ fontWeight: 500 }}>{t.metadata.header}</span></div>}
                                            {t.metadata.footer && <div style={{ display: "flex", alignItems: "center", gap: 4 }}>📝 <span style={{ fontWeight: 500 }}>{t.metadata.footer}</span></div>}
                                            {t.metadata.button && <div style={{ display: "flex", alignItems: "center", gap: 4 }}>🔘 <span style={{ fontWeight: 500 }}>{t.metadata.button}</span></div>}
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => { onSelectTemplate?.(t.template_id); onNavigateToTab?.("tree-editor") }} style={{
                                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                            padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                                            border: "none", cursor: "pointer", transition: "all 0.2s",
                                            background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                                            boxShadow: "0 2px 8px rgba(0,71,134,0.2)",
                                        }}>
                                            <FolderTree size={13} /> عرض الشجرة
                                        </button>
                                        {canUpdate && <button onClick={() => openEdit(t)} style={{
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                                            padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                                            border: "1px solid var(--t-border-light, #e5e7eb)", cursor: "pointer",
                                            background: "var(--t-card, #fff)", color: "var(--t-text-secondary, #6b7280)",
                                            transition: "all 0.15s",
                                        }}>
                                            <Edit3 size={13} /> تعديل
                                        </button>}
                                        <button onClick={() => { onSelectTemplate?.(t.template_id); onNavigateToTab?.("preview") }} style={{
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            padding: "8px 10px", borderRadius: 10,
                                            border: "1px solid var(--t-border-light, #e5e7eb)", cursor: "pointer",
                                            background: "var(--t-card, #fff)", color: "var(--t-text-secondary, #6b7280)",
                                            transition: "all 0.15s",
                                        }}>
                                            <Eye size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {filtered.length === 0 && !loading && (
                        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 80, color: "var(--t-text-muted, #9ca3af)" }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--t-surface, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <FileText size={28} style={{ opacity: 0.4 }} />
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>لا توجد قوالب</p>
                            <p style={{ fontSize: 12, marginBottom: 16 }}>ابدأ بإنشاء قالب جديد لبناء قائمة تفاعلية</p>
                            <button onClick={() => { resetForm(); setShowCreate(true) }} style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff",
                                fontSize: 13, fontWeight: 600, boxShadow: "0 3px 12px rgba(0,71,134,0.25)",
                            }}>
                                <Sparkles size={14} /> إنشاء أول قالب
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            {showCreate && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={resetForm}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: "100%", maxWidth: 500, borderRadius: 20,
                        background: "var(--t-card, #fff)", boxShadow: "0 25px 65px rgba(0,0,0,0.18)",
                        overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)",
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(160deg, #004786 0%, #0072b5 50%, #0098d6 100%)",
                            padding: "20px 22px", position: "relative", overflow: "hidden",
                        }}>
                            <div style={{ position: "absolute", top: -25, left: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                            <div style={{ position: "absolute", bottom: -15, right: -15, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {editingTemplate ? <Edit3 size={16} style={{ color: "#fff" }} /> : <Plus size={16} style={{ color: "#fff" }} />}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "block" }}>{editingTemplate ? "تعديل القالب" : "إنشاء قالب جديد"}</span>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{editingTemplate ? "تحديث بيانات القالب" : "أضف قالب قائمة تفاعلية"}</span>
                                    </div>
                                </div>
                                <button onClick={resetForm} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", transition: "background 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                                >
                                    <X size={14} style={{ color: "#fff" }} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
                            <div><label style={labelSt}>اسم القالب *</label><input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: القائمة الرئيسية" style={inputSt} /></div>
                            <div><label style={labelSt}>الوصف</label><textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="وصف مختصر للقالب..." rows={2} style={{ ...inputSt, resize: "vertical" }} /></div>
                            {editingTemplate && (
                                <div style={{ padding: 14, borderRadius: 12, background: "var(--t-surface, #f9fafb)", border: "1px solid var(--t-border-light, #f0f0f0)", display: "flex", flexDirection: "column", gap: 12 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "#004786", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>📋 بيانات العرض (Metadata)</p>
                                    <div><label style={{ ...labelSt, fontSize: 11 }}>العنوان (Header)</label><input value={formHeader} onChange={e => setFormHeader(e.target.value)} placeholder="عنوان القائمة" style={inputSt} /></div>
                                    <div><label style={{ ...labelSt, fontSize: 11 }}>التذييل (Footer)</label><input value={formFooter} onChange={e => setFormFooter(e.target.value)} placeholder="تذييل القائمة" style={inputSt} /></div>
                                    <div><label style={{ ...labelSt, fontSize: 11 }}>الزر (Button)</label><input value={formButton} onChange={e => setFormButton(e.target.value)} placeholder="نص الزر" style={inputSt} /></div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--t-border-light, #e5e7eb)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={resetForm} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleSubmit} disabled={formSubmitting || !formName.trim()} style={{
                                padding: "9px 22px", borderRadius: 10, border: "none",
                                background: formName.trim() ? "linear-gradient(135deg, #004786, #0098d6)" : "#e5e7eb",
                                color: formName.trim() ? "#fff" : "#9ca3af",
                                fontSize: 13, fontWeight: 600, cursor: formName.trim() ? "pointer" : "default",
                                display: "flex", alignItems: "center", gap: 6,
                                boxShadow: formName.trim() ? "0 3px 12px rgba(0,71,134,0.2)" : "none",
                                transition: "all 0.2s",
                            }}>
                                {formSubmitting && <Loader2 size={13} className="animate-spin" />}
                                {editingTemplate ? <><Save size={13} /> حفظ التعديلات</> : <><Plus size={13} /> إنشاء</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideIn { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:translateY(0) scale(1) } }
                @keyframes menuPopIn { from { opacity:0; transform:scale(.95) translateY(-4px) } to { opacity:1; transform:scale(1) translateY(0) } }
            `}</style>
        </div>
    )
}

// ── Menu Item Component ──
function MenuItem({ icon: Icon, color, label, onClick }: { icon: typeof Edit3; color: string; label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent",
            cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "right",
            color: color === "#ef4444" ? "#ef4444" : "var(--t-text, #374151)",
            transition: "background 0.12s",
        }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--t-surface, #f3f4f6)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
            <Icon size={13} style={{ color }} /> {label}
        </button>
    )
}
