import React, { useState, useCallback, useEffect, useMemo } from "react"
import { PreviewTab } from "../PreviewTab"
import {
    ChevronDown, Plus, Trash2, Edit3,
    Folder, FileText, Zap, Image, File, Video, List,
    Loader2, AlertCircle, FolderTree, X, ChevronsDown, ChevronsUp,
    Save, Paperclip, Phone, Globe,
} from "lucide-react"
import * as menuService from "../../services/menu-manager-service"
import { getTeamsCacheView } from "@/features/settings/services/teams-tags-service"
import type { Template, MenuTreeNode, MenuItem, MenuItemType, CreateMenuItemPayload, UpdateMenuItemPayload, MenuItemContent, ApiCallInputField } from "../../types"
import { MENU_ITEM_TYPES } from "../../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import { validateContentForm, getCharCountInfo, hasErrors, LIMITS, validateTitle } from "./validation"
import type { ValidationErrors } from "./validation"
import ApiCallFields from "./ApiCallFields"

const TYPE_ICONS: Record<MenuItemType, typeof Folder> = {
    submenu: Folder, text: FileText, action: Zap, images: Image,
    files: File, videos: Video, list: List, multi: Paperclip,
    api_call: Globe,
}

// 💡 Reusable Styles 💡
const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, var(--t-text-muted))", marginBottom: 5 }
const inputSt: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-surface, var(--t-page))", fontSize: 13, outline: "none", color: "var(--t-text, #1f2937)" }
const iconBtn: React.CSSProperties = { background: "transparent", border: "none", borderRadius: 5, padding: 4, cursor: "pointer", color: "var(--t-text-muted, var(--t-text-faint))", transition: "all 0.15s", display: "flex", alignItems: "center" }
const sectionBox: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 10, background: "var(--t-surface, var(--t-page))", border: "1px solid var(--t-border-light, var(--t-border))" }
const errorBorder: React.CSSProperties = { borderColor: "#ef4444" }

// ── Validation UI Helpers ──
function CharCounter({ value, max }: { value: string; max: number }) {
    const info = getCharCountInfo(value, max)
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, fontFamily: "'Fira Code', monospace",
            color: info.color, marginRight: 4, direction: "ltr", display: "inline-block",
            transition: "color 0.2s",
        }}>
            {info.count}/{info.max}
        </span>
    )
}

function FieldError({ error }: { error?: string }) {
    if (!error) return null
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 4, marginTop: 4,
            fontSize: 11, color: "#ef4444", fontWeight: 500,
            animation: "fieldErrorIn 0.2s ease",
        }}>
            <AlertCircle size={12} style={{ flexShrink: 0 }} />
            <span>{error}</span>
        </div>
    )
}

// 🔔 Toast Notification
interface ToastData { type: "error" | "success" | "info"; title: string; message: string }

function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
    if (!toast) return null
    const colors = {
        error: { bg: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "#fca5a5", icon: "#dc2626", title: "#991b1b" },
        success: { bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "#86efac", icon: "#16a34a", title: "#166534" },
        info: { bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "#93c5fd", icon: "#2563eb", title: "#1e40af" },
    }
    const c = colors[toast.type]
    return (
        <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
            minWidth: 340, maxWidth: 520, padding: "14px 18px", borderRadius: 14,
            background: c.bg, border: `1px solid ${c.border}`,
            boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
            animation: "toastSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)",
            display: "flex", alignItems: "flex-start", gap: 12,
            backdropFilter: "blur(12px)",
        }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${c.icon}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                {toast.type === "error" ? <AlertCircle size={16} style={{ color: c.icon }} /> : toast.type === "success" ? <span style={{ fontSize: 16 }}>✓</span> : <span style={{ fontSize: 16 }}>ℹ</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.title, marginBottom: 3 }}>{toast.title}</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{toast.message}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}><X size={14} /></button>
        </div>
    )
}

/** Extract a clean error message from an Axios/backend error response */
function extractApiError(err: any): string {
    const data = err?.response?.data
    // Pydantic validation errors (FastAPI returns detail as array)
    if (Array.isArray(data?.detail)) {
        return data.detail.map((d: any) => {
            const field = (d.loc || []).filter((l: string) => l !== "body").join(" → ")
            return field ? `${field}: ${d.msg}` : d.msg
        }).join("\n")
    }
    // Single message formats
    return data?.detail || data?.message || data?.error || err?.message || "خطأ غير معروف"
}

// 💡 Content Form for a specific type (shared between Add & Edit) 💡
interface UploadingFile { file: File; progress: number; mediaId?: string; error?: string }
interface ContentFormState {
    reply: string; format: string
    presHeader: string; presFooter: string; presButton: string
    actionType: string; actionParams: string
    assets: { asset_id: string; caption: string; media_type?: string; fileName?: string }[]
    listText: string
    listItems: { id: string; title: string; description: string; target_key: string }[]
    // api_call fields
    apiUrl: string; apiMethod: string; apiTimeout: number; apiRetryCount: number
    apiExecMode: string; apiCollectionStrategy: string; apiInitialMsg: string
    apiHeaders: string; apiBodyTemplate: string; apiQueryParams: string
    apiSuccessTemplate: string; apiErrorTemplate: string
    apiAuthType: string; apiAuthConfig: string
    apiRequiresConfirmation: boolean; apiConfirmationTemplate: string
    apiResponseType: string; apiResponseMapping: string
    apiConditionalResponses: { condition: string; template: string }[]
    apiMediaUrlPath: string; apiMediaType: string; apiMediaCaptionTemplate: string
    apiIntentDescription: string
    apiInputs: {
        key: string; label: string; type: string; required: boolean; order: number
        prompt_message: string; error_message: string; placeholder: string; default_value: string
        validation_regex: string; min_value: string; max_value: string; min_length: string; max_length: string; type_error: string
        options: { value: string; label: string }[]; display_as: string
        options_source: string; image_analysis: string; api_call_config: string
        trigger_after: string; depends_on: string; show_condition: string
        formula: string; accepted_types: string; max_size_mb: string
        display_in_summary: boolean; filter_options: boolean
        cross_validation: string; default_when: string
    }[]
}

const defaultContentForm = (): ContentFormState => ({
    reply: "", format: "plain",
    presHeader: "", presFooter: "", presButton: "",
    actionType: "", actionParams: "",
    assets: [],
    listText: "",
    listItems: [],
    // api_call defaults
    apiUrl: "", apiMethod: "POST", apiTimeout: 30, apiRetryCount: 0,
    apiExecMode: "immediate", apiCollectionStrategy: "sequential", apiInitialMsg: "",
    apiHeaders: "", apiBodyTemplate: "", apiQueryParams: "",
    apiSuccessTemplate: "✅ تم تنفيذ العملية بنجاح", apiErrorTemplate: "❌ حدث خطأ أثناء تنفيذ العملية",
    apiAuthType: "none", apiAuthConfig: "",
    apiRequiresConfirmation: false, apiConfirmationTemplate: "",
    apiResponseType: "text", apiResponseMapping: "",
    apiConditionalResponses: [],
    apiMediaUrlPath: "", apiMediaType: "", apiMediaCaptionTemplate: "",
    apiIntentDescription: "",
    apiInputs: [],
})

function loadContentForm(item: MenuItem): ContentFormState {
    const c = item.content || {}
    return {
        reply: (c.reply as string) || "",
        format: (c.format as string) || "plain",
        presHeader: c.presentation?.header || "",
        presFooter: c.presentation?.footer || "",
        presButton: c.presentation?.button || "",
        actionType: c.action?.type || "",
        actionParams: c.action?.params ? JSON.stringify(c.action.params, null, 2) : "",
        assets: (c.assets || []).map((a: { asset_id: string; caption?: string | null; media_type?: string }) => ({ asset_id: a.asset_id, caption: a.caption || "", media_type: a.media_type || "" })),
        listText: (c.text as string) || "",
        listItems: (c.items || []).map((i: { id: string; title: string; description?: string; target_key?: string }) => ({
            id: i.id, title: i.title, description: i.description || "", target_key: i.target_key || ""
        })),
        // api_call
        apiUrl: (c.url as string) || "",
        apiMethod: (c.method as string) || "POST",
        apiTimeout: (c.timeout_seconds as number) || 30,
        apiRetryCount: (c.retry_count as number) || 0,
        apiExecMode: (c.execution_mode as string) || "immediate",
        apiCollectionStrategy: (c.collection_strategy as string) || "sequential",
        apiInitialMsg: (c.initial_message as string) || "",
        apiHeaders: c.headers ? JSON.stringify(c.headers, null, 2) : "",
        apiBodyTemplate: c.body_template ? JSON.stringify(c.body_template, null, 2) : "",
        apiQueryParams: c.query_params ? JSON.stringify(c.query_params, null, 2) : "",
        apiSuccessTemplate: (c.success_template as string) || "✅ تم تنفيذ العملية بنجاح",
        apiErrorTemplate: (c.error_template as string) || "❌ حدث خطأ أثناء تنفيذ العملية",
        apiAuthType: (c.auth_type as string) || "none",
        apiAuthConfig: c.auth_config ? JSON.stringify(c.auth_config, null, 2) : "",
        apiRequiresConfirmation: !!c.require_confirmation,
        apiConfirmationTemplate: (c.confirmation_template as string) || "",
        apiResponseType: (c.response_type as string) || "text",
        apiResponseMapping: c.response_mapping ? JSON.stringify(c.response_mapping, null, 2) : "",
        apiConditionalResponses: ((c.conditional_responses as { condition: string; template: string }[]) || []),
        apiMediaUrlPath: (c.media_url_path as string) || "",
        apiMediaType: (c.media_type as string) || "",
        apiMediaCaptionTemplate: (c.media_caption_template as string) || "",

        apiIntentDescription: (c.intent_description as string) || "",
        apiInputs: ((c.inputs as ApiCallInputField[]) || []).map((inp) => ({
            key: inp.key || "", label: inp.label || "", type: inp.type || "text",
            required: inp.required !== false, order: inp.order || 0,
            prompt_message: inp.prompt_message || "", error_message: inp.error_message || "",
            placeholder: inp.placeholder || "", default_value: inp.default_value || "",
            validation_regex: inp.validation_regex || "",
            min_value: inp.min_value != null ? String(inp.min_value) : "",
            max_value: inp.max_value != null ? String(inp.max_value) : "",
            min_length: inp.min_length != null ? String(inp.min_length) : "",
            max_length: inp.max_length != null ? String(inp.max_length) : "",
            type_error: inp.type_error || "",
            options: (inp.options || []).map(o => ({ value: o.value, label: o.label })),
            display_as: inp.display_as || "interactive_list",
            options_source: inp.options_source ? JSON.stringify(inp.options_source, null, 2) : "",
            image_analysis: inp.image_analysis ? JSON.stringify(inp.image_analysis, null, 2) : "",
            api_call_config: inp.api_call_config ? JSON.stringify(inp.api_call_config, null, 2) : "",
            trigger_after: (inp.trigger_after || []).join(", "),
            depends_on: (inp.depends_on || []).join(", "),
            show_condition: inp.show_condition || "",
            formula: inp.formula || "",
            accepted_types: (inp.accepted_types || []).join(", "),
            max_size_mb: inp.max_size_mb != null ? String(inp.max_size_mb) : "",
            display_in_summary: inp.display_in_summary ?? false,
            filter_options: inp.filter_options ?? false,
            cross_validation: inp.cross_validation ? JSON.stringify(inp.cross_validation) : "",
            default_when: inp.default_when ? JSON.stringify(inp.default_when) : "",
        })),
    }
}

function buildContent(type: MenuItemType, f: ContentFormState): MenuItemContent | undefined {
    switch (type) {
        case "submenu":
            if (!f.presHeader && !f.presFooter && !f.presButton) return undefined
            return { presentation: { header: f.presHeader || undefined, footer: f.presFooter || undefined, button: f.presButton || undefined } }
        case "text":
            if (!f.reply) return undefined
            return { reply: f.reply, format: f.format || "plain" }
        case "action": {
            let params: Record<string, unknown> = {}
            try { if (f.actionParams.trim()) params = JSON.parse(f.actionParams) } catch { /* ignore */ }
            return { action: { type: "handoff", params }, reply: f.reply || undefined }
        }
        case "images":
        case "files":
        case "videos":
            return { assets: f.assets.length ? f.assets.map(a => ({ asset_id: a.asset_id, caption: a.caption || undefined })) : undefined }
        case "multi":
            return {
                reply: f.reply || undefined,
                assets: f.assets.length ? f.assets.map(a => ({ asset_id: a.asset_id, media_type: a.media_type || undefined, caption: a.caption || undefined })) : undefined,
            }
        case "list":
            return {
                text: f.listText || undefined,
                items: f.listItems.length ? f.listItems.map(i => ({
                    id: i.id, title: i.title,
                    description: i.description || undefined,
                    target_key: i.target_key || undefined,
                })) : undefined,
            }
        case "api_call": {
            let headers: Record<string, string> | undefined
            let bodyTpl: Record<string, unknown> | undefined
            let authCfg: Record<string, string> | undefined
            let qParams: Record<string, string> | undefined
            let respMap: Record<string, string> | undefined
            try { if (f.apiHeaders.trim()) headers = JSON.parse(f.apiHeaders) } catch { /* ignore */ }
            try { if (f.apiBodyTemplate.trim()) bodyTpl = JSON.parse(f.apiBodyTemplate) } catch { /* ignore */ }
            try { if (f.apiAuthConfig.trim()) authCfg = JSON.parse(f.apiAuthConfig) } catch { /* ignore */ }
            try { if (f.apiQueryParams.trim()) qParams = JSON.parse(f.apiQueryParams) } catch { /* ignore */ }
            try { if (f.apiResponseMapping.trim()) respMap = JSON.parse(f.apiResponseMapping) } catch { /* ignore */ }
            return {
                url: f.apiUrl,
                method: f.apiMethod || "POST",
                headers,
                timeout_seconds: f.apiTimeout || 30,
                retry_count: f.apiRetryCount || undefined,
                execution_mode: f.apiExecMode || "immediate",
                collection_strategy: f.apiExecMode === "collect_data" ? (f.apiCollectionStrategy || "sequential") : undefined,
                initial_message: f.apiInitialMsg || undefined,
                inputs: f.apiInputs.length ? f.apiInputs.map((inp, i) => {
                    const r: Record<string, unknown> = {
                        key: inp.key, label: inp.label, type: inp.type || "text",
                        required: inp.required, order: inp.order || i,
                    }
                    if (inp.prompt_message) r.prompt_message = inp.prompt_message
                    if (inp.error_message) r.error_message = inp.error_message
                    if (inp.placeholder) r.placeholder = inp.placeholder
                    if (inp.default_value) r.default_value = inp.default_value
                    if (inp.validation_regex) r.validation_regex = inp.validation_regex
                    if (inp.min_value) r.min_value = parseFloat(inp.min_value)
                    if (inp.max_value) r.max_value = parseFloat(inp.max_value)
                    if (inp.min_length) r.min_length = parseInt(inp.min_length)
                    if (inp.max_length) r.max_length = parseInt(inp.max_length)
                    if (inp.type_error) r.type_error = inp.type_error
                    if (inp.options.length) r.options = inp.options
                    if (inp.display_as && inp.display_as !== "interactive_list") r.display_as = inp.display_as
                    if (inp.depends_on) r.depends_on = inp.depends_on.split(",").map(s => s.trim()).filter(Boolean)
                    if (inp.show_condition) r.show_condition = inp.show_condition
                    if (inp.trigger_after) r.trigger_after = inp.trigger_after.split(",").map(s => s.trim()).filter(Boolean)
                    if (inp.formula) r.formula = inp.formula
                    if (inp.accepted_types) r.accepted_types = inp.accepted_types.split(",").map(s => s.trim()).filter(Boolean)
                    if (inp.max_size_mb) r.max_size_mb = parseInt(inp.max_size_mb)
                    try { if (inp.options_source) r.options_source = JSON.parse(inp.options_source) } catch { /* */ }
                    try { if (inp.image_analysis) r.image_analysis = JSON.parse(inp.image_analysis) } catch { /* */ }
                    try { if (inp.api_call_config) r.api_call_config = JSON.parse(inp.api_call_config) } catch { /* */ }
                    return r as unknown as ApiCallInputField
                }) : undefined,
                body_template: bodyTpl,
                query_params: qParams,
                success_template: f.apiSuccessTemplate || undefined,
                error_template: f.apiErrorTemplate || undefined,
                auth_type: f.apiAuthType !== "none" ? f.apiAuthType : undefined,
                auth_config: authCfg,
                require_confirmation: f.apiRequiresConfirmation || undefined,
                confirmation_template: f.apiConfirmationTemplate || undefined,
                response_type: f.apiResponseType !== "text" ? f.apiResponseType : undefined,
                response_mapping: respMap,
                conditional_responses: f.apiConditionalResponses.length ? f.apiConditionalResponses : undefined,
                media_url_path: f.apiMediaUrlPath || undefined,
                media_type: f.apiMediaType || undefined,
                media_caption_template: f.apiMediaCaptionTemplate || undefined,

                intent_description: f.apiIntentDescription || undefined,
            }
        }
        default: return undefined
    }
}

// �"?�"? Media Upload Zone �"?�"?
// ── Media Upload Zone (Redesigned) ──
function MediaUploadZone({ form, setForm, accept, label, icon, templateId, itemId }: {
    form: ContentFormState; setForm: (f: ContentFormState) => void; accept: string; label: string; icon: string
    templateId?: string | null; itemId?: string | null
}) {
    const [uploading, setUploading] = useState<UploadingFile[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [previews, setPreviews] = useState<Record<string, string>>({})
    const [deletingIdx, setDeletingIdx] = useState<number | null>(null)
    const formRef = React.useRef(form)
    formRef.current = form

    const handleDeleteAsset = async (index: number) => {
        const asset = form.assets[index]
        if (!asset) return
        // If we have templateId + itemId, call the API to delete from backend
        if (templateId && itemId) {
            setDeletingIdx(index)
            try {
                const res = await menuService.deleteItemAsset(templateId, itemId, asset.asset_id)
                if (res.success) {
                    setForm({ ...formRef.current, assets: formRef.current.assets.filter((_, j) => j !== index) })
                }
            } catch {
                // Silent fail — keep asset in UI
            } finally {
                setDeletingIdx(null)
            }
        } else {
            // No item saved yet (add mode) — just remove locally
            setForm({ ...form, assets: form.assets.filter((_, j) => j !== index) })
        }
    }

    const isImageAccept = accept.includes("image") || accept === "*/*"
    const isVideoAccept = accept.includes("video") || accept === "*/*"

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const newFiles = Array.from(files)

        // Create local previews for images
        newFiles.forEach(file => {
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file)
                setPreviews(prev => ({ ...prev, [file.name]: url }))
            }
        })

        setUploading(prev => [...prev, ...newFiles.map(f => ({ file: f, progress: 0 }))])

        for (const file of newFiles) {
            try {
                const res = await menuService.uploadMedia(file)
                const mediaId = res.data.media_id
                // Detect media_type from MIME type
                const detectedType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file"
                // Use ref to avoid stale closure
                const currentAssets = formRef.current.assets
                setForm({ ...formRef.current, assets: [...currentAssets, { asset_id: mediaId, caption: "", media_type: detectedType, fileName: file.name }] })
                // Transfer preview from file.name key to mediaId key (use functional updater to avoid stale closure)
                setPreviews(prev => {
                    if (prev[file.name]) {
                        const updated = { ...prev, [mediaId]: prev[file.name] }
                        delete updated[file.name]
                        return updated
                    }
                    return prev
                })
                setUploading(prev => prev.map(u => u.file === file ? { ...u, progress: 100, mediaId } : u))
                setTimeout(() => setUploading(prev => prev.filter(u => u.file !== file)), 1200)
            } catch {
                setUploading(prev => prev.map(u => u.file === file ? { ...u, error: "فشل الرفع" } : u))
            }
        }
    }

    // Cleanup blob URLs on unmount
    React.useEffect(() => {
        return () => { Object.values(previews).forEach(url => { if (url.startsWith("blob:")) URL.revokeObjectURL(url) }) }
    }, [])

    const fileIcon = (_assetId: string) => {
        if (isVideoAccept && !isImageAccept) return "🎬"
        if (!isImageAccept) return "📄"
        return icon
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ ...labelSt, margin: 0 }}>{icon} {label} ({form.assets.length})</label>
                {form.assets.length > 0 && (
                    <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>يمكنك رفع عدة ملفات دفعة واحدة</span>
                )}
            </div>

            {/* ── Uploaded Assets Grid ── */}
            {form.assets.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isImageAccept ? "repeat(auto-fill, minmax(180px, 1fr))" : "1fr",
                    gap: 10, marginBottom: 10,
                }}>
                    {form.assets.map((asset, i) => (
                        <div key={i} style={{
                            borderRadius: 12, overflow: "hidden",
                            background: "var(--t-card, #fff)",
                            border: "1px solid var(--t-border-light, var(--t-border))",
                            transition: "box-shadow 0.2s, transform 0.2s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)" }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                        >
                            {/* Preview Area */}
                            {isImageAccept && (
                                <div style={{
                                    width: "100%", height: 130, overflow: "hidden",
                                    background: "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    position: "relative",
                                }}>
                                    {previews[asset.asset_id] ? (
                                        <img src={previews[asset.asset_id]} alt={asset.caption || "preview"}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ textAlign: "center" }}>
                                            <span style={{ fontSize: 32, opacity: 0.4 }}>{fileIcon(asset.asset_id)}</span>
                                            <p style={{ fontSize: 9, color: "var(--t-text-faint)", margin: "4px 0 0" }}>تحميل المعاينة...</p>
                                        </div>
                                    )}
                                    {/* Delete button overlay */}
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(i) }}
                                        disabled={deletingIdx === i}
                                        style={{
                                            position: "absolute", top: 6, left: 6,
                                            width: 24, height: 24, borderRadius: "50%",
                                            background: deletingIdx === i ? "rgba(150,150,150,0.85)" : "rgba(239,68,68,0.85)", backdropFilter: "blur(4px)",
                                            border: "none", cursor: deletingIdx === i ? "wait" : "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "transform 0.15s",
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        {deletingIdx === i ? <Loader2 size={12} className="animate-spin" style={{ color: "#fff" }} /> : <X size={12} style={{ color: "#fff" }} />}
                                    </button>
                                    {/* Status badge */}
                                    <span style={{
                                        position: "absolute", bottom: 6, right: 6,
                                        fontSize: 9, padding: "2px 8px", borderRadius: 6,
                                        background: "rgba(34,197,94,0.9)", color: "#fff", fontWeight: 700,
                                        backdropFilter: "blur(4px)",
                                    }}>✓ مرفوع</span>
                                </div>
                            )}

                            {/* Non-image file row */}
                            {!isImageAccept && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: "linear-gradient(135deg, rgba(27,80,145,0.08), rgba(27,80,145,0.15))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 18, flexShrink: 0,
                                    }}>
                                        {fileIcon(asset.asset_id)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: 12, fontFamily: "'Fira Code', monospace", color: "var(--t-text-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} dir="ltr">
                                            {asset.fileName || asset.asset_id}
                                        </span>
                                        <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 600 }}>✓ مرفوع بنجاح</span>
                                    </div>
                                    <button onClick={() => handleDeleteAsset(i)}
                                        disabled={deletingIdx === i}
                                        style={{ ...iconBtn, color: deletingIdx === i ? "var(--t-text-faint)" : "var(--t-danger)", padding: 6 }}>
                                        {deletingIdx === i ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            )}

                            {/* Caption */}
                            <div style={{ padding: isImageAccept ? "8px 10px 10px" : "0 14px 12px" }}>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 4 }}>
                                    الوصف التوضيحي <CharCounter value={asset.caption} max={LIMITS.MEDIA_CAPTION} />
                                </label>
                                <textarea
                                    value={asset.caption}
                                    onChange={e => {
                                        const updated = [...form.assets]
                                        updated[i] = { ...updated[i], caption: e.target.value }
                                        setForm({ ...form, assets: updated })
                                    }}
                                    placeholder="أضف وصفاً توضيحياً لهذا الملف..."
                                    rows={2}
                                    style={{
                                        ...inputSt, fontSize: 13, padding: "8px 12px",
                                        resize: "vertical", lineHeight: 1.6,
                                        minHeight: 44,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Upload Progress ── */}
            {uploading.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {uploading.map((u, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                            borderRadius: 10, border: "1px solid var(--t-border-light)",
                            background: u.error ? "rgba(239,68,68,0.04)" : "rgba(27,80,145,0.03)",
                            transition: "all 0.3s",
                        }}>
                            {/* Thumbnail preview for uploading images */}
                            {u.file.type.startsWith("image/") && previews[u.file.name] ? (
                                <img src={previews[u.file.name]} alt=""
                                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0, opacity: u.error ? 0.4 : 0.8 }} />
                            ) : (
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                                    background: u.error ? "rgba(239,68,68,0.08)" : "rgba(27,80,145,0.08)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {u.error ? <AlertCircle size={16} style={{ color: "var(--t-danger)" }} />
                                        : <Loader2 size={16} className="animate-spin" style={{ color: "var(--t-accent)" }} />}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, color: "var(--t-text-secondary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {u.file.name}
                                </span>
                                <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>
                                    {(u.file.size / 1024).toFixed(0)} KB
                                </span>
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                                background: u.error ? "rgba(239,68,68,0.08)" : u.mediaId ? "rgba(34,197,94,0.08)" : "rgba(27,80,145,0.08)",
                                color: u.error ? "#ef4444" : u.mediaId ? "#22c55e" : "var(--t-accent)",
                            }}>
                                {u.error || (u.mediaId ? "✓ تم" : "⏳ جاري الرفع...")}
                            </span>
                            {u.error && (
                                <button onClick={() => setUploading(prev => prev.filter((_, j) => j !== i))}
                                    style={{ ...iconBtn, color: "var(--t-text-faint)" }}><X size={12} /></button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Drop Zone ── */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => {
                    const inp = document.createElement("input")
                    inp.type = "file"; inp.accept = accept; inp.multiple = true
                    inp.onchange = () => handleFiles(inp.files); inp.click()
                }}
                style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: form.assets.length > 0 ? "14px 12px" : "28px 16px",
                    borderRadius: 12, cursor: "pointer", transition: "all 0.25s ease",
                    border: `2px dashed ${dragOver ? "var(--t-accent)" : "var(--t-border-light, var(--t-border-medium))"}`,
                    background: dragOver ? "rgba(27,80,145,0.06)" : "var(--t-surface, transparent)",
                    transform: dragOver ? "scale(1.01)" : "scale(1)",
                }}
                onMouseEnter={e => { if (!dragOver) e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.background = "rgba(27,80,145,0.03)" }}
                onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = "var(--t-border-light, var(--t-border-medium))"; e.currentTarget.style.background = "var(--t-surface, transparent)" }}
            >
                <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: dragOver ? "rgba(27,80,145,0.15)" : "rgba(27,80,145,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                }}>
                    {dragOver ? <Paperclip size={18} style={{ color: "var(--t-accent)" }} /> : <Plus size={18} style={{ color: "var(--t-accent)" }} />}
                </div>
                <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t-accent)", display: "block" }}>
                        {form.assets.length > 0 ? "إضافة ملفات أخرى" : "اسحب الملفات هنا أو انقر للاختيار"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2, display: "block" }}>
                        يدعم رفع عدة ملفات دفعة واحدة • {accept === "*/*" ? "جميع الأنواع" : accept.replace(/\*/g, "").replace(/\./g, " ")}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ── Handoff Action Fields Component (replaces generic action form) ──
function HandoffActionFields({ form, setForm, mode: _mode }: { form: ContentFormState; setForm: (f: ContentFormState) => void; mode: "add" | "edit" }) {
    const [teams, setTeams] = useState<{ team_id: string; name: string }[]>([])
    const [loadingTeams, setLoadingTeams] = useState(false)

    // Parse current params from form
    const currentParams = React.useMemo(() => {
        try { return form.actionParams.trim() ? JSON.parse(form.actionParams) : {} } catch { return {} }
    }, [form.actionParams])

    const selectedTeamId = currentParams.team_id || ""
    const aiEnabled = currentParams.ai_enabled ?? false
    const autoReply = currentParams.auto_reply ?? ""
    const priority = currentParams.priority || "normal"

    // Update specific param key
    const updateParam = (key: string, value: unknown) => {
        const updated = { ...currentParams, [key]: value }
        setForm({ ...form, actionParams: JSON.stringify(updated, null, 2) })
    }

    // Fetch teams on mount
    useEffect(() => {
        setLoadingTeams(true)
        import("@/stores/auth-store").then(mod => {
            const tenantId = mod.useAuthStore.getState().user?.tenant_id || ""
            if (!tenantId) { setLoadingTeams(false); return }
            getTeamsCacheView(tenantId)
                .then(res => setTeams((res.data?.teams || []).filter((t: { is_in_menu?: boolean }) => t.is_in_menu !== false)))
                .catch(() => {/* silent */ })
                .finally(() => setLoadingTeams(false))
        }).catch(() => setLoadingTeams(false))
    }, [])

    const handleTeamChange = (teamId: string) => {
        const team = teams.find(t => t.team_id === teamId)
        const updated = { ...currentParams, team_id: teamId, team_name: team?.name || "" }
        setForm({ ...form, actionParams: JSON.stringify(updated, null, 2) })
    }

    return (
        <div style={sectionBox}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>🤝 تحويل لموظف (Handoff)</p>

            {/* Team Selection */}
            <div>
                <label style={labelSt}>الفريق المستهدف *</label>
                {loadingTeams ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <Loader2 size={14} className="animate-spin" style={{ color: "var(--t-accent)" }} />
                        <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>جاري تحميل الفرق...</span>
                    </div>
                ) : (
                    <select
                        value={selectedTeamId}
                        onChange={e => handleTeamChange(e.target.value)}
                        style={inputSt}
                    >
                        <option value="">— اختر الفريق —</option>
                        {teams.map(t => (
                            <option key={t.team_id} value={t.team_id}>{t.name}</option>
                        ))}
                    </select>
                )}
                {selectedTeamId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, padding: "4px 10px", borderRadius: 6, background: "rgba(27,80,145,0.06)", width: "fit-content" }}>
                        <span style={{ fontSize: 10, color: "var(--t-accent)", fontWeight: 600 }}>Team ID:</span>
                        <span style={{ fontSize: 10, color: "var(--t-text-muted)", fontFamily: "'Fira Code', monospace", direction: "ltr" }}>{selectedTeamId}</span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--t-border-light)", margin: "6px 0" }} />

            {/* 3 Automation Mechanisms */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text-secondary)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}>⚙️ آليات التحويل</p>

            {/* 1. AI Enabled */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: aiEnabled ? "rgba(16,185,129,0.06)" : "var(--t-surface)", border: `1px solid ${aiEnabled ? "rgba(16,185,129,0.2)" : "var(--t-border-light)"}`, transition: "all 0.2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🤖</span>
                    <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text)", display: "block" }}>تفعيل الذكاء الاصطناعي</span>
                        <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>الرد التلقائي بالذكاء الاصطناعي قبل التحويل</span>
                    </div>
                </div>
                <button
                    onClick={() => updateParam("ai_enabled", !aiEnabled)}
                    style={{
                        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                        background: aiEnabled ? "var(--t-success, #10b981)" : "#d1d5db",
                        position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}
                >
                    <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3,
                        left: aiEnabled ? 23 : 3,
                        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }} />
                </button>
            </div>

            {/* 2. Priority */}
            <div>
                <label style={labelSt}>🔥 أولوية التحويل</label>
                <div style={{ display: "flex", gap: 6 }}>
                    {[
                        { value: "low", label: "منخفضة", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
                        { value: "normal", label: "عادية", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
                        { value: "high", label: "عالية", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
                    ].map(p => (
                        <button
                            key={p.value}
                            onClick={() => updateParam("priority", p.value)}
                            style={{
                                flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${priority === p.value ? p.color : "var(--t-border-light)"}`,
                                background: priority === p.value ? p.bg : "transparent",
                                color: priority === p.value ? p.color : "var(--t-text-muted)",
                                fontSize: 12, fontWeight: priority === p.value ? 700 : 500,
                                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Auto Reply */}
            <div>
                <label style={labelSt}>💬 رسالة تلقائية عند التحويل</label>
                <textarea
                    value={autoReply}
                    onChange={e => updateParam("auto_reply", e.target.value)}
                    rows={2}
                    placeholder="جاري تحويلك لموظف الخدمة..."
                    style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }}
                />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--t-border-light)", margin: "6px 0" }} />

            {/* Reply message */}
            <div>
                <label style={labelSt}>↩️ رسالة الرد — تُرسل للمستخدم عند تنفيذ الإجراء</label>
                <textarea
                    value={form.reply}
                    onChange={e => setForm({ ...form, reply: e.target.value })}
                    rows={2}
                    placeholder="جاري تحويلك لموظف الخدمة..."
                    style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }}
                    maxLength={LIMITS.ACTION_REPLY}
                />
            </div>
        </div>
    )
}

// ── Content Fields Component ──
function ContentFields({ type, form, setForm, mode, errors = {}, templateId, itemId }: { type: MenuItemType; form: ContentFormState; setForm: (f: ContentFormState) => void; mode: "add" | "edit"; errors?: ValidationErrors; templateId?: string | null; itemId?: string | null }) {
    const sectionTitle = (icon: string, title: string) => (
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--t-accent)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>{icon} {title}</p>
    )
    const fieldStyle = (key: string, base: React.CSSProperties = inputSt) => errors[key] ? { ...base, ...errorBorder } : base
    switch (type) {
        case "submenu":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🗂️", "إعدادات العرض (Presentation)")}
                    <div>
                        <label style={labelSt}>العنوان (Header) — يظهر أعلى القائمة <CharCounter value={form.presHeader} max={LIMITS.SUBMENU_HEADER} /></label>
                        <input value={form.presHeader} onChange={e => setForm({ ...form, presHeader: e.target.value })} placeholder="بنك القاسمي للتمويل..." style={fieldStyle("presHeader")} maxLength={LIMITS.SUBMENU_HEADER + 10} />
                        <FieldError error={errors.presHeader} />
                    </div>
                    <div>
                        <label style={labelSt}>التذييل (Footer) — يظهر أسفل القائمة <CharCounter value={form.presFooter} max={LIMITS.SUBMENU_FOOTER} /></label>
                        <input value={form.presFooter} onChange={e => setForm({ ...form, presFooter: e.target.value })} placeholder="اختر الخدمة المطلوبة" style={fieldStyle("presFooter")} maxLength={LIMITS.SUBMENU_FOOTER + 10} />
                        <FieldError error={errors.presFooter} />
                    </div>
                    <div>
                        <label style={labelSt}>زر الرجوع (Button) — نص زر القائمة <CharCounter value={form.presButton} max={LIMITS.SUBMENU_BUTTON} /></label>
                        <input value={form.presButton} onChange={e => setForm({ ...form, presButton: e.target.value })} placeholder="اختر من التالي" style={fieldStyle("presButton")} maxLength={LIMITS.SUBMENU_BUTTON + 5} />
                        <FieldError error={errors.presButton} />
                    </div>
                </div>
            )
        case "text":
            return (
                <div style={sectionBox}>
                    {sectionTitle("💬", "الرد النصي")}
                    <div>
                        <label style={labelSt}>نص الرد * <CharCounter value={form.reply} max={LIMITS.TEXT_REPLY} /></label>
                        <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })} rows={mode === "edit" ? 6 : 3} placeholder="النص الذي سيُرسل كرد للمستخدم..." style={{ ...fieldStyle("reply", { ...inputSt, resize: "vertical" as const, lineHeight: 1.7 }) }} maxLength={LIMITS.TEXT_REPLY} />
                        <FieldError error={errors.reply} />
                    </div>
                    <div>
                        <label style={labelSt}>التنسيق</label>
                        <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} style={fieldStyle("format")}>
                            <option value="plain">نص عادي (Plain)</option>
                            <option value="markdown">Markdown</option>
                        </select>
                        <FieldError error={errors.format} />
                    </div>
                </div>
            )
        case "action":
            return <HandoffActionFields form={form} setForm={setForm} mode={mode} />
        case "images":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🖼️", "إعدادات الصور")}
                    <MediaUploadZone form={form} setForm={setForm} accept="image/*" label="الصور" icon="🖼️" templateId={templateId} itemId={itemId} />
                    <FieldError error={errors.assets} />
                </div>
            )
        case "multi":
            return (
                <div style={sectionBox}>
                    {sectionTitle("📎", "وسائط متعددة (صور • ملفات • فيديو)")}
                    <div style={{ marginBottom: 10 }}>
                        <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--t-text-secondary, #64748b)", marginBottom: 4 }}>نص يُرسل قبل الوسائط (اختياري)</label>
                        <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })} rows={2} placeholder="إليك الملفات المطلوبة 📎" maxLength={4096}
                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--t-border-light, #e2e8f0)", background: "var(--t-card, #fff)", fontSize: 12.5, resize: "vertical" as const, minHeight: 48 }} />
                    </div>
                    <MediaUploadZone form={form} setForm={setForm} accept="*/*" label="الملفات" icon="📎" templateId={templateId} itemId={itemId} />
                    <FieldError error={errors.assets} />
                </div>
            )
        case "files":
            return (
                <div style={sectionBox}>
                    {sectionTitle("📎", "إعدادات الملفات")}
                    <MediaUploadZone form={form} setForm={setForm} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" label="الملفات" icon="📎" templateId={templateId} itemId={itemId} />
                    <FieldError error={errors.assets} />
                </div>
            )
        case "videos":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🎬", "إعدادات الفيديوهات")}
                    <MediaUploadZone form={form} setForm={setForm} accept="video/*" label="الفيديوهات" icon="🎬" templateId={templateId} itemId={itemId} />
                    <FieldError error={errors.assets} />
                </div>
            )
        case "list":
            return (
                <div style={sectionBox}>
                    {sectionTitle("📋", "إعدادات القائمة التفاعلية (List)")}
                    <div>
                        <label style={labelSt}>النص المصاحب <CharCounter value={form.listText} max={LIMITS.LIST_TEXT} /></label>
                        <textarea value={form.listText} onChange={e => setForm({ ...form, listText: e.target.value })} rows={2}
                            placeholder="اختر من القائمة التالية..." style={{ ...fieldStyle("listText", { ...inputSt, resize: "vertical" as const }) }} maxLength={LIMITS.LIST_TEXT} />
                        <FieldError error={errors.listText} />
                    </div>
                    <div>
                        <label style={labelSt}>العناصر ({form.listItems.length}/{LIMITS.LIST_ITEMS_MAX})</label>
                        <FieldError error={errors.listItems} />
                    </div>
                    {form.listItems.map((li, i) => {
                        const idErr = errors[`listItem_${i}_id`]
                        const titleErr = errors[`listItem_${i}_title`]
                        const descErr = errors[`listItem_${i}_desc`]
                        const targetErr = errors[`listItem_${i}_target`]
                        const hasItemErr = idErr || titleErr || descErr || targetErr
                        return (
                            <div key={i} style={{ padding: 8, borderRadius: 8, background: "var(--t-card, #fff)", border: `1px solid ${hasItemErr ? "#ef4444" : "var(--t-border-light)"}`, transition: "border-color 0.2s" }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <input value={li.id} onChange={e => { const n = [...form.listItems]; n[i] = { ...n[i], id: e.target.value }; setForm({ ...form, listItems: n }) }}
                                        placeholder="ID" style={{ ...inputSt, width: 60, fontSize: 11, padding: "6px 8px", ...(idErr ? errorBorder : {}) }} dir="ltr" />
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                                        <input value={li.title} onChange={e => { const n = [...form.listItems]; n[i] = { ...n[i], title: e.target.value }; setForm({ ...form, listItems: n }) }}
                                            placeholder="العنوان" style={{ ...inputSt, flex: 1, fontSize: 12, padding: "6px 10px", ...(titleErr ? errorBorder : {}) }} maxLength={LIMITS.LIST_ITEM_TITLE + 5} />
                                        <CharCounter value={li.title} max={LIMITS.LIST_ITEM_TITLE} />
                                    </div>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                                        <input value={li.description} onChange={e => { const n = [...form.listItems]; n[i] = { ...n[i], description: e.target.value }; setForm({ ...form, listItems: n }) }}
                                            placeholder="الوصف" style={{ ...inputSt, flex: 1, fontSize: 12, padding: "6px 10px", ...(descErr ? errorBorder : {}) }} maxLength={LIMITS.LIST_ITEM_DESC + 10} />
                                        <CharCounter value={li.description} max={LIMITS.LIST_ITEM_DESC} />
                                    </div>
                                    <input value={li.target_key} onChange={e => { const n = [...form.listItems]; n[i] = { ...n[i], target_key: e.target.value }; setForm({ ...form, listItems: n }) }}
                                        placeholder="target_key" style={{ ...inputSt, width: 100, fontSize: 11, padding: "6px 8px", ...(targetErr ? errorBorder : {}) }} dir="ltr" />
                                    <button onClick={() => { const n = form.listItems.filter((_, j) => j !== i); setForm({ ...form, listItems: n }) }} style={{ ...iconBtn, color: "var(--t-danger)" }}><X size={14} /></button>
                                </div>
                                {hasItemErr && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                                        {idErr && <FieldError error={idErr} />}
                                        {titleErr && <FieldError error={titleErr} />}
                                        {descErr && <FieldError error={descErr} />}
                                        {targetErr && <FieldError error={targetErr} />}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {form.listItems.length < LIMITS.LIST_ITEMS_MAX && (
                        <button onClick={() => setForm({ ...form, listItems: [...form.listItems, { id: `item_${form.listItems.length + 1}`, title: "", description: "", target_key: "" }] })}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--t-border-light)", background: "transparent", color: "var(--t-accent)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                            <Plus size={13} /> إضافة عنصر
                        </button>
                    )}
                </div>
            )
        case "api_call":
            return <ApiCallFields form={form} setForm={setForm} />
        default:
            return <p style={{ fontSize: 12, color: "var(--t-text-faint)", margin: 0 }}>لا توجد حقول إضافية لهذا النوع</p>
    }
}

// ── Media Preview Component ──
function MediaPreview({ assets, type }: { assets: { asset_id: string; caption?: string | null }[]; type: "images" | "files" | "videos" }) {
    const [urls, setUrls] = useState<Record<string, { url: string; loading: boolean; error?: string }>>({})
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!assets.length) return
        const init: typeof urls = {}
        assets.forEach(a => { init[a.asset_id] = { url: "", loading: true } })
        setUrls(init)
        assets.forEach(async (a) => {
            try {
                const res = await menuService.getMediaPublicUrl(a.asset_id)
                setUrls(prev => ({ ...prev, [a.asset_id]: { url: res.data.url, loading: false } }))
            } catch {
                setUrls(prev => ({ ...prev, [a.asset_id]: { url: "", loading: false, error: "فشل التحميل" } }))
            }
        })
    }, [assets])

    return (
        <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {assets.map(a => {
                    const entry = urls[a.asset_id]
                    if (!entry || entry.loading) return (
                        <div key={a.asset_id} style={{ width: type === "images" ? 100 : "100%", height: type === "images" ? 100 : 48, borderRadius: 10, background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--t-border-light, var(--t-border))" }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: "var(--t-text-faint)" }} />
                        </div>
                    )
                    if (entry.error) return (
                        <div key={a.asset_id} style={{ width: type === "images" ? 100 : "100%", height: type === "images" ? 100 : 48, borderRadius: 10, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "var(--t-danger)" }}>
                            <AlertCircle size={14} /> {entry.error}
                        </div>
                    )
                    if (type === "images") return (
                        <div key={a.asset_id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div onClick={() => setLightboxUrl(entry.url)} style={{ width: 100, height: 100, borderRadius: 10, overflow: "hidden", border: "1px solid var(--t-border-light, var(--t-border))", cursor: "pointer", transition: "all 0.2s" }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "scale(1.05)" }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "scale(1)" }}>
                                <img src={entry.url} alt={a.caption || a.asset_id} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            {a.caption && <span style={{ fontSize: 10, color: "var(--t-text-muted)", textAlign: "center", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.caption}</span>}
                        </div>
                    )
                    if (type === "videos") return (
                        <div key={a.asset_id} style={{ width: "100%" }}>
                            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--t-border-light)" }}>
                                <video src={entry.url} controls style={{ width: "100%", maxHeight: 200, display: "block", background: "#000" }} />
                            </div>
                            {a.caption && <span style={{ fontSize: 11, color: "var(--t-text-muted)", marginTop: 3, display: "block" }}>📌 {a.caption}</span>}
                        </div>
                    )
                    return (
                        <a key={a.asset_id} href={entry.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, textDecoration: "none", background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light)", transition: "all 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(156,39,176,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Paperclip size={14} style={{ color: "#9c27b0" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #1f2937)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.caption || a.asset_id}</span>
                                <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>انقر للتحميل</span>
                            </div>
                        </a>
                    )
                })}
            </div>
            {lightboxUrl && (
                <div onClick={() => setLightboxUrl(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 40 }}>
                    <img src={lightboxUrl} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
                    <button onClick={() => setLightboxUrl(null)} style={{ position: "absolute", top: 20, left: 20, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={18} style={{ color: "#fff" }} />
                    </button>
                    <style>{`@keyframes lbFadeIn{from{opacity:0}to{opacity:1}}@keyframes lbZoomIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
                </div>
            )}
        </>
    )
}

// ── Detail Content Display (Read-Only) ──
function DetailContentView({ item }: { item: MenuItem }) {
    const c = item.content || {}
    if (item.type === "submenu" && c.presentation) {
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, color: "var(--t-accent)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>🗂️ إعدادات العرض</span>
                {c.presentation.header && <div style={{ fontSize: 12 }}>📌 <strong>العنوان:</strong> {c.presentation.header}</div>}
                {c.presentation.footer && <div style={{ fontSize: 12 }}>📄 <strong>التذييل:</strong> {c.presentation.footer}</div>}
                {c.presentation.button && <div style={{ fontSize: 12 }}>🔘 <strong>الزر:</strong> {c.presentation.button}</div>}
            </div>
        )
    }
    if (item.type === "text" && c.reply) {
        return (
            <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-muted)" }}>الرد:</span>
                <div style={{ padding: 10, borderRadius: 8, background: "var(--t-surface, var(--t-page))", fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.7, marginTop: 4 }}>{c.reply as string}</div>
                {c.format && c.format !== "plain" && <span style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 2, display: "block" }}>التنسيق: {c.format as string}</span>}
            </div>
        )
    }
    if (item.type === "action" && c.action) {
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, color: "#ed6c02", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Zap size={12} /> إجراء</span>
                <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(237,108,2,0.1)", color: "#ed6c02", fontWeight: 600, fontSize: 11, width: "fit-content" }}>{c.action.type}</span>
                {c.action.params && Object.keys(c.action.params).length > 0 && (
                    <pre style={{ padding: 8, borderRadius: 8, background: "#1f2937", color: "#a5f3fc", fontSize: 11, margin: 0, overflow: "auto", maxHeight: 100 }}>{JSON.stringify(c.action.params, null, 2)}</pre>
                )}
                {c.reply && <div style={{ fontSize: 12, color: "var(--t-text-secondary)" }}>↩️ {c.reply as string}</div>}
            </div>
        )
    }
    if ((item.type === "images" || item.type === "files" || item.type === "videos" || item.type === "multi") && c.assets && (c.assets as { asset_id: string; caption?: string | null }[]).length > 0) {
        const assets = c.assets as { asset_id: string; caption?: string | null }[]
        const icons: Record<string, string> = { images: "🖼️", files: "📎", videos: "🎬" }
        const labels: Record<string, string> = { images: "صور", files: "ملفات", videos: "فيديوهات" }
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>{icons[item.type]} {labels[item.type]} ({assets.length})</span>
                <MediaPreview assets={assets} type={item.type as "images" | "files" | "videos"} />
            </div>
        )
    }
    if (item.type === "list" && c.items && (c.items as { id: string; title: string; description?: string; target_key?: string }[]).length > 0) {
        const listItems = c.items as { id: string; title: string; description?: string; target_key?: string }[]
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, color: "#00796b", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><List size={12} /> قائمة تفاعلية ({listItems.length})</span>
                {c.text && <div style={{ fontSize: 12, color: "var(--t-text-secondary)" }}>{c.text as string}</div>}
                {listItems.map((li, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, background: "var(--t-card, #fff)" }}>
                        <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{li.title}</span>
                        {li.description && <span style={{ fontSize: 10, color: "var(--t-text-faint)" }}>{li.description}</span>}
                        {li.target_key && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "rgba(0,121,107,0.08)", color: "#00796b", fontWeight: 600 }}>{li.target_key}</span>}
                    </div>
                ))}
            </div>
        )
    }
    if (item.type === "api_call" && c.url) {
        const inputs = (c.inputs as ApiCallInputField[]) || []
        const modeLabel = c.execution_mode === "collect_data" ? "جمع بيانات" : "فوري"
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, color: "#0288d1", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Globe size={12} /> استدعاء API</span>
                <div style={{ fontSize: 12 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(2,136,209,0.1)", color: "#0288d1", fontWeight: 600, fontSize: 11, marginLeft: 6 }}>{(c.method as string) || "POST"}</span>
                    <code style={{ fontSize: 11, color: "var(--t-text-secondary)", marginRight: 4 }} dir="ltr">{c.url as string}</code>
                </div>
                <div style={{ fontSize: 11, color: "var(--t-text-muted)" }}>الوضع: {modeLabel} • المهلة: {(c.timeout_seconds as number) || 30}ث</div>
                {inputs.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--t-text-muted)" }}>المدخلات: {inputs.map(inp => inp.label || inp.key).join("، ")}</div>
                )}
                {c.auth_type && c.auth_type !== "none" && (
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(237,108,2,0.08)", color: "#ed6c02", fontWeight: 600 }}>🔐 {c.auth_type as string}</span>
                )}
            </div>
        )
    }
    return null
}

// ── Preview Embed ──
function PreviewTabEmbed({ templateId }: { templateId: string | null }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 280, height: "100%" }}>
            <PreviewTab selectedTemplateId={templateId || undefined} embedded />
        </div>
    )
}

// ── Main Tree Editor Component ──
interface TreeEditorTabProps {
    onNavigateToTab?: (tab: string) => void
    selectedTemplateId?: string | null
}

export function TreeEditorTab({ selectedTemplateId }: TreeEditorTabProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [tid, setTid] = useState<string | null>(selectedTemplateId || null)
    const [rootNode, setRootNode] = useState<MenuTreeNode | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<MenuItem | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [fetchingId, setFetchingId] = useState<string | null>(null)
    const [addParentId, setAddParentId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [previewVisible, setPreviewVisible] = useState(true)
    const [toast, setToast] = useState<ToastData | null>(null)
    const toastTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
    const showToast = useCallback((t: ToastData) => {
        clearTimeout(toastTimer.current)
        setToast(t)
        toastTimer.current = setTimeout(() => setToast(null), 6000)
    }, [])
    const closeToast = useCallback(() => { clearTimeout(toastTimer.current); setToast(null) }, [])
    const [eTitle, setETitle] = useState("")
    const [eKey, setEKey] = useState("")
    const [eDesc, setEDesc] = useState("")
    const [eActive, setEActive] = useState(true)
    const [eContent, setEContent] = useState<ContentFormState>(defaultContentForm())
    const [eOrder, setEOrder] = useState<number | "">("")

    const [aTitle, setATitle] = useState("")
    const [aType, setAType] = useState<MenuItemType>("text")
    const [aDesc, setADesc] = useState("")
    const [aOrder, setAOrder] = useState<number | "">("")
    const [aContent, setAContent] = useState<ContentFormState>(defaultContentForm())
    const { canPerformAction } = usePermissions()
    const canCreateItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.CREATE_MENU_ITEM)
    const canUpdateItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.UPDATE_MENU_ITEM)
    const canDeleteItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.DELETE_MENU_ITEM)

    // ── Real-time Validation ──
    const addErrors = useMemo(() => {
        const titleErr = validateTitle(aTitle)
        const contentErrors = validateContentForm(aType, aContent)
        if (titleErr) contentErrors._title = titleErr
        return contentErrors
    }, [aTitle, aType, aContent])

    const editErrors = useMemo(() => {
        if (!detail || !editMode) return {} as ValidationErrors
        const titleErr = validateTitle(eTitle)
        const contentErrors = validateContentForm(detail.type, eContent)
        if (titleErr) contentErrors._title = titleErr
        return contentErrors
    }, [eTitle, eContent, detail, editMode])

    const addHasErrors = hasErrors(addErrors)
    const editHasErrors = hasErrors(editErrors)

    useEffect(() => {
        menuService.listTemplates({ page: 1, limit: 100 })
            .then(r => setTemplates(r.data.templates || []))
            .catch(() => { })
    }, [])
    useEffect(() => { if (selectedTemplateId) setTid(selectedTemplateId) }, [selectedTemplateId])

    const fetchTree = useCallback(async () => {
        if (!tid) return
        setLoading(true); setError(null)
        try {
            const res = await menuService.getTemplateTree(tid, { include_inactive: true })
            setRootNode(res.data)
            if (res.data?.item?.id) setExpanded(prev => new Set([...prev, res.data.item.id]))
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "خطأ في تحميل الشجرة")
        } finally { setLoading(false) }
    }, [tid])
    useEffect(() => { fetchTree() }, [fetchTree])

    const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
    const expandAll = () => {
        if (!rootNode) return
        const s = new Set<string>()
        const w = (n: MenuTreeNode) => { s.add(n.item.id); n.children.forEach(w) }
        w(rootNode); setExpanded(s)
    }
    const collapseAll = () => setExpanded(new Set())
    const countDesc = (n: MenuTreeNode): number => { let c = n.children.length; n.children.forEach(ch => c += countDesc(ch)); return c }

    const selectNode = async (id: string) => {
        if (!tid) return
        setFetchingId(id); setEditMode(false)
        try {
            const r = await menuService.getItem(tid, id)
            setDetail(r.data); setSelectedId(id)
        } catch { setDetail(null); setSelectedId(null) } finally { setFetchingId(null) }
    }

    const openEdit = (item: MenuItem) => {
        setEditMode(true); setETitle(item.title); setEKey(item.key)
        setEDesc(item.description || ""); setEActive(item.is_active)
        setEOrder(item.order ?? "")
        setEContent(loadContentForm(item))
    }

    const handleSave = async () => {
        if (!tid || !detail || editHasErrors) return; setSaving(true)
        try {
            const p: UpdateMenuItemPayload = {}
            if (eTitle !== detail.title) p.title = eTitle
            if (eDesc !== (detail.description || "")) p.description = eDesc
            if (eActive !== detail.is_active) p.is_active = eActive
            if (eOrder !== "" && eOrder !== (detail.order ?? "")) p.order = eOrder as number
            p.content = buildContent(detail.type, eContent)
            await menuService.updateItem(tid, detail.id, p)
            setEditMode(false); fetchTree(); selectNode(detail.id)
        } catch (err: any) {
            console.error("Save error:", err)
            showToast({ type: "error", title: "فشل الحفظ", message: extractApiError(err) })
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!tid) return
        try {
            await menuService.deleteItem(tid, id)
            if (selectedId === id) { setDetail(null); setSelectedId(null) }
            setDeleteConfirmId(null); fetchTree()
        } catch (err: any) {
            console.error("Delete error:", err)
            showToast({ type: "error", title: "فشل الحذف", message: extractApiError(err) })
        }
    }

    const resetAdd = () => {
        setAddParentId(null); setATitle("")
        setAType("text"); setADesc(""); setAOrder(""); setAContent(defaultContentForm())
    }

    const handleAdd = async () => {
        if (!addParentId || !tid || !aTitle.trim() || addHasErrors) return
        setSubmitting(true)
        try {
            const content = buildContent(aType, aContent)
            const apiType = aType
            const p: CreateMenuItemPayload = {
                parent_id: addParentId,
                key: `item_${Date.now().toString(36)}`,
                type: apiType,
                title: aTitle.trim(),
                content: content || {},
            }
            if (aDesc.trim()) p.description = aDesc.trim()
            if (aOrder !== "") p.order = aOrder as number
            await menuService.createItem(tid, p); resetAdd(); fetchTree()
        } catch (err: any) {
            console.error("Add error:", err?.response?.data || err)
            showToast({ type: "error", title: "فشل الإضافة", message: extractApiError(err) })
        } finally { setSubmitting(false) }
    }

    const renderNode = (node: MenuTreeNode, depth = 0, isLast = true): React.ReactNode => {
        const { item } = node
        const isExpanded = expanded.has(item.id)
        const hasKids = node.children.length > 0
        const isSub = item.type === "submenu"
        const Icon = TYPE_ICONS[item.type] || FileText
        const tc = MENU_ITEM_TYPES.find(t => t.value === item.type)
        const isSel = selectedId === item.id
        const cnt = isSub ? countDesc(node) : 0

        return (
            <div key={item.id} style={{ position: "relative" }}>
                {depth > 0 && <div style={{ position: "absolute", right: 14 + (depth - 1) * 24 + 10, top: 0, bottom: isLast ? "50%" : 0, width: 1.5, background: "var(--t-border-light, #e0e0e0)" }} />}
                {depth > 0 && <div style={{ position: "absolute", right: 14 + (depth - 1) * 24 + 10, top: "50%", width: 14, height: 1.5, background: "var(--t-border-light, #e0e0e0)" }} />}
                <div
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 10px", paddingRight: 16 + depth * 24,
                        borderRadius: 10, cursor: "pointer", position: "relative",
                        background: isSel ? "rgba(27,80,145,0.06)" : "transparent",
                        borderRight: isSel ? "3px solid var(--t-accent)" : "3px solid transparent",
                        transition: "all 0.15s", marginBottom: 1,
                        opacity: item.is_active ? 1 : 0.45,
                    }}
                    onClick={() => selectNode(item.id)}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--t-surface, #f8f9fb)" }}
                    onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent" }}
                >
                    <div onClick={e => { e.stopPropagation(); if (isSub || hasKids) toggle(item.id) }}
                        style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 4 }}>
                        {(isSub || hasKids) && (
                            <div style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}>
                                <ChevronDown size={13} style={{ color: isExpanded ? "var(--t-accent)" : "var(--t-text-faint)" }} />
                            </div>
                        )}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${tc?.color || "var(--t-text-muted)"}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={13} style={{ color: tc?.color || "var(--t-text-muted)" }} />
                    </div>
                    <span style={{
                        fontSize: 13, fontWeight: isSel ? 600 : 500,
                        color: item.is_active ? "var(--t-text, #1f2937)" : "var(--t-text-muted, var(--t-text-faint))",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textDecoration: item.is_active ? "none" : "line-through",
                    }}>{item.title}</span>
                    {isSub && cnt > 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(27,80,145,0.08)", color: "var(--t-accent)", fontWeight: 700 }}>{cnt}</span>}
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: `${tc?.color || "var(--t-text-muted)"}10`, color: tc?.color || "var(--t-text-muted)", fontWeight: 600, flexShrink: 0 }}>
                        {tc?.label || item.type}
                    </span>
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {canCreateItem && isSub && <button onClick={() => setAddParentId(item.id)} style={iconBtn} title="إضافة"><Plus size={12} /></button>}
                        <button onClick={() => selectNode(item.id)} style={iconBtn} title="عرض">
                            {fetchingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                        </button>
                        {canDeleteItem && depth > 0 && <button onClick={() => setDeleteConfirmId(item.id)} style={{ ...iconBtn, color: "var(--t-danger)" }} title="حذف"><Trash2 size={12} /></button>}
                    </div>
                </div>
                {isExpanded && hasKids && (
                    <div style={{ position: "relative", animation: "treeSlide .2s ease" }}>
                        {[...node.children].sort((a, b) => a.item.order - b.item.order).map((ch, i) => renderNode(ch, depth + 1, i === node.children.length - 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", overflow: "hidden" }}>

            {/* ── Shared Top Bar: Template Selector ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--t-border-light, var(--t-border))", background: "var(--t-card, #fff)", flexShrink: 0 }}>
                <FolderTree size={16} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
                <select value={tid || ""} onChange={e => { setTid(e.target.value || null); setDetail(null); setSelectedId(null) }}
                    style={{ flex: 1, maxWidth: 360, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "var(--t-surface)", fontSize: 13, color: "var(--t-text, #1f2937)", outline: "none" }}>
                    <option value="">— اختر قالب —</option>
                    {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                </select>
                {tid && <span style={{ fontSize: 11, color: "var(--t-text-muted)" }}>يتحكم في الشجرة والمحاكي معاً</span>}
                <div style={{ flex: 1 }} />
                {/* Preview toggle */}
                <button
                    onClick={() => setPreviewVisible(v => !v)}
                    title={previewVisible ? "إخفاء المحاكي" : "إظهار المحاكي"}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: previewVisible ? "rgba(27,80,145,0.06)" : "transparent", color: previewVisible ? "var(--t-accent)" : "var(--t-text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                    <Phone size={13} />
                    {previewVisible ? "إخفاء المحاكي" : "إظهار المحاكي"}
                </button>
            </div>

            {/* ── Main Content (tree + preview side by side) ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* ── Tree Panel (always visible, expands when preview hidden) ── */}
                <div style={{
                    flex: previewVisible ? "0 0 66%" : "1",
                    minWidth: 400,
                    overflow: "hidden",
                    transition: "flex 0.3s cubic-bezier(0.4,0,0.2,1)",
                    display: "flex", flexDirection: "column",
                    borderLeft: "1px solid var(--t-border-light, var(--t-border))",
                }}>
                    {/* Tree Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0 }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>محرر الشجرة</span>
                            <span style={{ display: "block", fontSize: 11, color: "var(--t-text-muted)", marginTop: 1 }}>بناء وإدارة هيكل القائمة</span>
                        </div>
                        {rootNode && (
                            <div style={{ display: "flex", gap: 5 }}>
                                <button onClick={expandAll} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 500, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", cursor: "pointer" }}><ChevronsDown size={11} /> توسيع</button>
                                <button onClick={collapseAll} style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 500, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", cursor: "pointer" }}><ChevronsUp size={11} /> طي</button>
                            </div>
                        )}
                    </div>

                    {/* Tree Content */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
                        {!tid && (
                            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--t-text-muted)" }}>
                                <FolderTree size={36} style={{ margin: "0 auto 10px", opacity: 0.25 }} />
                                <p style={{ fontSize: 13, fontWeight: 600 }}>اختر قالباً من الأعلى</p>
                            </div>
                        )}
                        {tid && loading && (
                            <div style={{ textAlign: "center", padding: 40 }}>
                                <Loader2 size={24} className="animate-spin" style={{ color: "var(--t-accent)", margin: "0 auto 10px" }} />
                                <p style={{ fontSize: 12, color: "var(--t-text-muted)" }}>جاري التحميل...</p>
                            </div>
                        )}
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.06)", color: "var(--t-danger)", fontSize: 12 }}>
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        {rootNode && !loading && (
                            <div style={{ border: "1px solid var(--t-border-light)", borderRadius: 12, padding: 6, background: "var(--t-card, #fff)" }}>
                                {renderNode(rootNode)}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Preview Panel (collapsible) ── */}
                {previewVisible && (
                    <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--t-border-light)", transition: "all 0.3s" }}>
                        <PreviewTabEmbed templateId={tid} />
                    </div>
                )}
            </div>

            {/* ── Modal: View/Edit Detail ── */}
            {(detail || fetchingId) && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                    onClick={() => { setDetail(null); setSelectedId(null); setEditMode(false) }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", borderRadius: 18, background: "var(--t-card, #fff)", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden", display: "flex", flexDirection: "column", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)" }}>
                        {fetchingId && !detail ? (
                            <div style={{ padding: 60, textAlign: "center" }}>
                                <Loader2 size={24} className="animate-spin" style={{ color: "var(--t-accent)", margin: "0 auto 12px" }} />
                                <p style={{ fontSize: 13, color: "var(--t-text-muted)" }}>جاري الجلب...</p>
                            </div>
                        ) : detail && (
                            <>
                                <div style={{ background: "var(--t-gradient-accent)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                    {(() => { const I = TYPE_ICONS[detail.type]; return <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><I size={14} style={{ color: "#fff" }} /></div> })()}
                                    <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{editMode ? "تعديل العنصر" : "خصائص العنصر"}</span>
                                        <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{MENU_ITEM_TYPES.find(t => t.value === detail.type)?.label} — {detail.key}</span>
                                    </div>
                                    <button onClick={() => { setDetail(null); setSelectedId(null); setEditMode(false) }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 7, padding: 5, cursor: "pointer" }}><X size={14} style={{ color: "#fff" }} /></button>
                                </div>
                                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                                    {editMode ? (
                                        <>
                                            <div><label style={labelSt}>العنوان * <CharCounter value={eTitle} max={LIMITS.TITLE} /></label><input value={eTitle} onChange={e => setETitle(e.target.value)} style={editErrors._title ? { ...inputSt, ...errorBorder } : inputSt} maxLength={LIMITS.TITLE + 10} /><FieldError error={editErrors._title} /></div>
                                            <div><label style={labelSt}>المفتاح (key)</label><input value={eKey} onChange={e => setEKey(e.target.value)} style={inputSt} dir="ltr" /></div>
                                            <div><label style={labelSt}>الوصف <CharCounter value={eDesc} max={LIMITS.DESCRIPTION} /></label><textarea value={eDesc} onChange={e => setEDesc(e.target.value)} rows={2} style={{ ...inputSt, resize: "vertical" }} maxLength={LIMITS.DESCRIPTION + 20} /></div>
                                            <div><label style={labelSt}>الترتيب (order)</label><input type="number" min={0} value={eOrder} onChange={e => setEOrder(e.target.value === "" ? "" : Number(e.target.value))} placeholder="تلقائي" style={{ ...inputSt, direction: "ltr" }} /></div>
                                            <ContentFields type={detail.type} form={eContent} setForm={setEContent} mode="edit" errors={editErrors} templateId={tid} itemId={detail.id} />
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                                                <label style={{ ...labelSt, margin: 0 }}>مفعّل</label>
                                                <button onClick={() => setEActive(!eActive)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: eActive ? "var(--t-accent)" : "var(--t-border-medium)", position: "relative", transition: "all 0.2s" }}>
                                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, right: eActive ? 2 : 20, transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {([["المعرف", detail.id], ["المفتاح", detail.key], ["العنوان", detail.title], ["النوع", MENU_ITEM_TYPES.find(t => t.value === detail.type)?.label || detail.type], ["الترتيب", String(detail.order)], ["الحالة", detail.is_active ? "نشط ✅" : "معطل ❌"]] as [string, string][]).map(([l, v]) => (
                                                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--t-border-light, #f0f0f0)", fontSize: 12 }}>
                                                    <span style={{ color: "var(--t-text-muted)", fontWeight: 500 }}>{l}</span>
                                                    <span style={{ color: "#1f2937", fontWeight: 600, textAlign: "left", maxWidth: "60%", wordBreak: "break-all" }}>{v}</span>
                                                </div>
                                            ))}
                                            {detail.description && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-muted)" }}>الوصف:</span><p style={{ fontSize: 12, color: "#1f2937", margin: "4px 0 0", lineHeight: 1.6 }}>{detail.description}</p></div>}
                                            <DetailContentView item={detail} />
                                        </>
                                    )}
                                </div>
                                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--t-border-light)", display: "flex", gap: 8, flexShrink: 0 }}>
                                    {editMode ? (
                                        <>
                                            <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "8px 14px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                                            <button onClick={handleSave} disabled={saving || editHasErrors} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", cursor: (saving || editHasErrors) ? "default" : "pointer", background: editHasErrors ? "var(--t-border)" : "var(--t-gradient-accent)", color: editHasErrors ? "var(--t-text-faint)" : "#fff", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} حفظ
                                            </button>
                                        </>
                                    ) : (
                                        canUpdateItem && <button onClick={() => openEdit(detail)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: "var(--t-gradient-accent)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                                            <Edit3 size={13} /> تعديل
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Modal: Add Item ── */}
            {addParentId && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={resetAdd}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", borderRadius: 18, background: "var(--t-card, #fff)", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", overflow: "hidden", animation: "modalSlideIn .25s cubic-bezier(0.16,1,0.3,1)", display: "flex", flexDirection: "column" }}>
                        <div style={{ background: "linear-gradient(135deg, var(--t-accent), var(--t-accent-secondary), var(--t-accent-light))", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>إضافة عنصر جديد</span>
                            <button onClick={resetAdd} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer" }}><X size={14} style={{ color: "#fff" }} /></button>
                        </div>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", flex: 1 }}>
                            <div>
                                <label style={labelSt}>نوع العنصر</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 6 }}>
                                    {MENU_ITEM_TYPES.map(t => {
                                        const I = TYPE_ICONS[t.value]
                                        const sel = aType === t.value
                                        return (
                                            <button key={t.value} onClick={() => { setAType(t.value); setAContent(defaultContentForm()) }} style={{
                                                padding: "10px 6px", borderRadius: 10, fontSize: 11, fontWeight: 500,
                                                border: "2px solid", cursor: "pointer", transition: "all 0.15s",
                                                borderColor: sel ? t.color : "var(--t-border-light, var(--t-border))",
                                                background: sel ? `${t.color}10` : "transparent",
                                                color: sel ? t.color : "var(--t-text-secondary, var(--t-text-muted))",
                                                display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                            }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <I size={14} style={{ color: t.color }} />
                                                </div>
                                                {t.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <label style={labelSt}>العنوان * <CharCounter value={aTitle} max={LIMITS.TITLE} /></label>
                                <input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="عنوان العنصر" style={addErrors._title ? { ...inputSt, ...errorBorder } : inputSt} maxLength={LIMITS.TITLE + 10} />
                                <FieldError error={addErrors._title} />
                            </div>
                            <div><label style={labelSt}>الوصف (اختياري) <CharCounter value={aDesc} max={LIMITS.DESCRIPTION} /></label><input value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="وصف قصير..." style={inputSt} maxLength={LIMITS.DESCRIPTION + 20} /></div>
                            <div><label style={labelSt}>الترتيب (order)</label><input type="number" min={0} value={aOrder} onChange={e => setAOrder(e.target.value === "" ? "" : Number(e.target.value))} placeholder="تلقائي" style={{ ...inputSt, direction: "ltr" }} /></div>
                            <ContentFields type={aType} form={aContent} setForm={setAContent} mode="add" errors={addErrors} />
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                            <button onClick={resetAdd} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleAdd} disabled={submitting || !aTitle.trim() || addHasErrors} style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: (!aTitle.trim() || addHasErrors) ? "var(--t-border)" : "var(--t-gradient-accent)",
                                color: (!aTitle.trim() || addHasErrors) ? "var(--t-text-faint)" : "#fff",
                                fontSize: 13, fontWeight: 600, cursor: (!aTitle.trim() || addHasErrors) ? "default" : "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                                opacity: submitting ? 0.7 : 1,
                            }}>
                                {submitting && <Loader2 size={13} className="animate-spin" />} إضافة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Delete Confirm ── */}
            {deleteConfirmId && (
                <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDeleteConfirmId(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 400, borderRadius: 18, background: "var(--t-card,#fff)", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden", animation: "modalSlideIn .2s ease" }}>
                        <div style={{ padding: "20px 20px 8px", textAlign: "center" }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Trash2 size={22} style={{ color: "var(--t-danger)" }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: "0 0 6px" }}>تأكيد الحذف</h3>
                            <p style={{ fontSize: 13, color: "var(--t-text-muted)", margin: 0 }}>سيتم حذف هذا العنصر وجميع عناصره الفرعية نهائياً.</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, padding: "16px 20px 20px" }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={() => handleDelete(deleteConfirmId)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>حذف</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔔 Toast */}
            <Toast toast={toast} onClose={closeToast} />

            <style>{`
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes modalSlideIn { from { opacity:0; transform:translateY(24px) scale(.96) } to { opacity:1; transform:translateY(0) scale(1) } }
                @keyframes treeSlide { from { opacity:0; max-height:0 } to { opacity:1; max-height:3000px } }
                @keyframes fieldErrorIn { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:translateY(0) } }
                @keyframes toastSlideIn { from { opacity:0; transform:translateX(-50%) translateY(-20px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
            `}</style>
        </div>
    )
}
