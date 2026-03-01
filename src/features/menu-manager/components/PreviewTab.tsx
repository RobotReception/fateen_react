import { useState, useEffect } from "react"
import {
    Eye,
    Loader2,
    AlertCircle,
    ChevronLeft,
    Smartphone,
} from "lucide-react"
import * as menuService from "../services/menu-manager-service"
import type { Template, MenuTreeNode } from "../types"
import { MENU_ITEM_TYPES } from "../types"

interface PreviewTabProps {
    onNavigateToTab?: (tab: string) => void
    selectedTemplateId?: string | null
}

export function PreviewTab({ selectedTemplateId }: PreviewTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(selectedTemplateId || null)
    const [, setTree] = useState<MenuTreeNode | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [breadcrumb, setBreadcrumb] = useState<MenuTreeNode[]>([])
    const [currentNode, setCurrentNode] = useState<MenuTreeNode | null>(null)

    useEffect(() => {
        menuService.listTemplates({ page: 1, limit: 100 })
            .then(res => setTemplates(res.data.templates || []))
            .catch(() => {/* silent */ })
    }, [])

    useEffect(() => {
        if (selectedTemplateId) setCurrentTemplateId(selectedTemplateId)
    }, [selectedTemplateId])

    useEffect(() => {
        if (!currentTemplateId) { setTree(null); setCurrentNode(null); setBreadcrumb([]); return }
        setLoading(true)
        setError(null)
        menuService.getTemplateTree(currentTemplateId)
            .then(res => {
                setTree(res.data)
                setCurrentNode(res.data)
                setBreadcrumb([res.data])
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "خطأ في تحميل الشجرة"))
            .finally(() => setLoading(false))
    }, [currentTemplateId])

    const navigateTo = (node: MenuTreeNode) => {
        setCurrentNode(node)
        // Find index in breadcrumb
        const idx = breadcrumb.findIndex(b => b.item.id === node.item.id)
        if (idx >= 0) {
            setBreadcrumb(breadcrumb.slice(0, idx + 1))
        } else {
            setBreadcrumb([...breadcrumb, node])
        }
    }

    const goBack = () => {
        if (breadcrumb.length > 1) {
            const newBread = breadcrumb.slice(0, -1)
            setBreadcrumb(newBread)
            setCurrentNode(newBread[newBread.length - 1])
        }
    }

    const header = currentNode?.item.content?.presentation?.header || currentNode?.item.title || ""
    const footer = currentNode?.item.content?.presentation?.footer || ""
    const button = currentNode?.item.content?.presentation?.button || ""

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: 0 }}>المعاينة</h2>
                    <p style={{ fontSize: 13, color: "var(--t-text-secondary, #6b7280)", margin: "4px 0 0" }}>
                        معاينة تفاعلية لعرض القائمة كما يراها المستخدم النهائي
                    </p>
                </div>
                <select
                    value={currentTemplateId || ""}
                    onChange={(e) => setCurrentTemplateId(e.target.value || null)}
                    style={{
                        padding: "7px 12px", borderRadius: 9,
                        border: "1px solid var(--t-border-light, #e5e7eb)",
                        background: "var(--t-surface, #f9fafb)", fontSize: 13,
                        color: "var(--t-text, #1f2937)", outline: "none", minWidth: 200,
                    }}
                >
                    <option value="">— اختر قالب للمعاينة —</option>
                    {templates.map(t => (
                        <option key={t.template_id} value={t.template_id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {!currentTemplateId && (
                <div style={{ textAlign: "center", padding: 80, color: "var(--t-text-muted, #9ca3af)" }}>
                    <Smartphone size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                    <p style={{ fontSize: 15, fontWeight: 600 }}>اختر قالباً لمعاينته</p>
                    <p style={{ fontSize: 12 }}>سيتم عرض القائمة كما تظهر للمستخدم النهائي</p>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                    <p style={{ fontSize: 13, color: "#6b7280" }}>جاري تحميل المعاينة...</p>
                </div>
            )}

            {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 16, borderRadius: 12, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 13 }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* ── Phone Simulator ── */}
            {currentNode && !loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                    <div style={{
                        width: 360, minHeight: 560, borderRadius: 32,
                        background: "var(--t-card, #fff)",
                        border: "3px solid #1f2937",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)",
                        overflow: "hidden", display: "flex", flexDirection: "column",
                        position: "relative",
                    }}>
                        {/* Phone Status Bar */}
                        <div style={{
                            height: 28, background: "#1f2937",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 600, color: "#fff",
                        }}>
                            <div style={{ width: 60, height: 4, borderRadius: 4, background: "#374151" }} />
                        </div>

                        {/* Chat Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #004786, #0098d6)",
                            padding: "12px 16px",
                            display: "flex", alignItems: "center", gap: 10,
                        }}>
                            {breadcrumb.length > 1 && (
                                <button onClick={goBack} style={{
                                    background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                                    padding: 4, cursor: "pointer", display: "flex",
                                }}>
                                    <ChevronLeft size={16} style={{ color: "#fff", transform: "rotate(180deg)" }} />
                                </button>
                            )}
                            <div style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: "rgba(255,255,255,0.2)", display: "flex",
                                alignItems: "center", justifyContent: "center",
                            }}>
                                <Eye size={16} style={{ color: "#fff" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>فطين</p>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", margin: 0 }}>متصل</p>
                            </div>
                        </div>

                        {/* Chat Body */}
                        <div style={{
                            flex: 1, padding: 16, overflowY: "auto",
                            background: "#f0f2f5",
                        }}>
                            {/* Bot Message Bubble */}
                            <div style={{
                                maxWidth: "85%", borderRadius: "4px 16px 16px 16px",
                                background: "#fff", padding: 12,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                marginBottom: 12,
                            }}>
                                {header && (
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
                                        {header}
                                    </p>
                                )}

                                {/* Menu Items */}
                                {currentNode.children.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {currentNode.children
                                            .filter(c => c.item.is_active)
                                            .sort((a, b) => a.item.order - b.item.order)
                                            .map((child, idx) => {
                                                const typeConfig = MENU_ITEM_TYPES.find(t => t.value === child.item.type)
                                                return (
                                                    <button
                                                        key={child.item.id}
                                                        onClick={() => child.item.type === "submenu" ? navigateTo(child) : undefined}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: 8,
                                                            padding: "8px 12px", borderRadius: 10,
                                                            border: "1px solid #e5e7eb", background: "#fafafa",
                                                            cursor: child.item.type === "submenu" ? "pointer" : "default",
                                                            transition: "all 0.15s", textAlign: "right",
                                                            width: "100%", color: "inherit",
                                                        }}
                                                        onMouseEnter={e => { if (child.item.type === "submenu") e.currentTarget.style.background = "#f0f4ff" }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = "#fafafa" }}
                                                    >
                                                        <span style={{
                                                            width: 22, height: 22, borderRadius: 6,
                                                            background: "#004786", color: "#fff",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                                                        }}>
                                                            {idx + 1}
                                                        </span>
                                                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: "#1f2937" }}>
                                                            {child.item.title}
                                                        </span>
                                                        {child.item.type === "submenu" && (
                                                            <ChevronLeft size={13} style={{ color: "#9ca3af", transform: "rotate(180deg)" }} />
                                                        )}
                                                        {child.item.type !== "submenu" && (
                                                            <span style={{
                                                                fontSize: 9, padding: "2px 6px", borderRadius: 8,
                                                                background: `${typeConfig?.color || "#6b7280"}12`,
                                                                color: typeConfig?.color || "#6b7280", fontWeight: 600,
                                                            }}>
                                                                {typeConfig?.label || child.item.type}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                    </div>
                                ) : (
                                    /* Leaf node content */
                                    <div>
                                        {currentNode.item.content?.reply && (
                                            <p style={{ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                                {currentNode.item.content.reply}
                                            </p>
                                        )}
                                        {!currentNode.item.content?.reply && (
                                            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                                                (لا يوجد محتوى)
                                            </p>
                                        )}
                                    </div>
                                )}

                                {footer && (
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "10px 0 0", textAlign: "center" }}>
                                        {footer}
                                    </p>
                                )}
                            </div>

                            {/* Button badge */}
                            {button && currentNode.children.length > 0 && (
                                <div style={{ textAlign: "center" }}>
                                    <span style={{
                                        display: "inline-block", padding: "6px 20px", borderRadius: 20,
                                        background: "#fff", border: "1px solid #004786", color: "#004786",
                                        fontSize: 12, fontWeight: 600,
                                    }}>
                                        {button}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Breadcrumb (bottom) */}
                        {breadcrumb.length > 1 && (
                            <div style={{
                                padding: "8px 12px", background: "#fff",
                                borderTop: "1px solid #e5e7eb",
                                display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center",
                            }}>
                                {breadcrumb.map((b, i) => (
                                    <span key={b.item.id} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                        <button
                                            onClick={() => navigateTo(b)}
                                            style={{
                                                background: "transparent", border: "none",
                                                fontSize: 11, color: i === breadcrumb.length - 1 ? "#004786" : "#9ca3af",
                                                fontWeight: i === breadcrumb.length - 1 ? 600 : 400,
                                                cursor: "pointer", padding: "2px 4px",
                                            }}
                                        >
                                            {b.item.title.substring(0, 15)}{b.item.title.length > 15 ? "..." : ""}
                                        </button>
                                        {i < breadcrumb.length - 1 && <ChevronLeft size={10} style={{ color: "#d1d5db" }} />}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Phone Home Bar */}
                        <div style={{ height: 20, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 100, height: 4, borderRadius: 4, background: "#1f2937" }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
