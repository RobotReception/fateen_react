import React, { useState, useCallback, useEffect } from "react"
import { PreviewTab } from "../PreviewTab"
import {
    ChevronDown, Plus, Trash2, Edit3,
    Folder, FileText, Zap, Image, File, Video, MousePointerClick, List, Reply,
    Loader2, AlertCircle, FolderTree, X, ChevronsDown, ChevronsUp,
    Save, Link2, Paperclip, Phone,
} from "lucide-react"
import * as menuService from "../../services/menu-manager-service"
import type { Template, MenuTreeNode, MenuItem, MenuItemType, CreateMenuItemPayload, UpdateMenuItemPayload, MenuItemContent } from "../../types"
import { MENU_ITEM_TYPES } from "../../types"
import { usePermissions } from "@/lib/usePermissions"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

const TYPE_ICONS: Record<MenuItemType, typeof Folder> = {
    submenu: Folder, text: FileText, action: Zap, images: Image,
    files: File, videos: Video, buttons: MousePointerClick, list: List, quick_reply: Reply,
}

// �"?�"? Reusable Styles �"?�"?
const labelSt: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--t-text-secondary, #6b7280)", marginBottom: 5 }
const inputSt: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-surface, #f9fafb)", fontSize: 13, outline: "none", color: "var(--t-text, #1f2937)" }
const iconBtn: React.CSSProperties = { background: "transparent", border: "none", borderRadius: 5, padding: 4, cursor: "pointer", color: "var(--t-text-muted, #9ca3af)", transition: "all 0.15s", display: "flex", alignItems: "center" }
const sectionBox: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 10, background: "var(--t-surface, #f9fafb)", border: "1px solid var(--t-border-light, #e5e7eb)" }

// �"?�"? Content Form for a specific type (shared between Add & Edit) �"?�"?
interface UploadingFile { file: File; progress: number; mediaId?: string; error?: string }
interface ContentFormState {
    reply: string; format: string
    presHeader: string; presFooter: string; presButton: string
    actionType: string; actionParams: string
    assetIds: string[]; replyAfterMedia: string
    caption: string
    buttonItems: { type: string; title: string; value: string }[]
    listSections: string
    quickReplies: string
}

const defaultContentForm = (): ContentFormState => ({
    reply: "", format: "plain",
    presHeader: "", presFooter: "", presButton: "",
    actionType: "", actionParams: "",
    assetIds: [], replyAfterMedia: "",
    caption: "",
    buttonItems: [],
    listSections: "",
    quickReplies: "",
})

function loadContentForm(item: MenuItem): ContentFormState {
    const c = item.content || {}
    return {
        reply: c.reply || "",
        format: c.format || "plain",
        presHeader: c.presentation?.header || "",
        presFooter: c.presentation?.footer || "",
        presButton: c.presentation?.button || "",
        actionType: c.action?.type || "",
        actionParams: c.action?.params ? JSON.stringify(c.action.params, null, 2) : "",
        assetIds: c.asset_ids || [],
        replyAfterMedia: c.reply_after_media || "",
        caption: c.caption || "",
        buttonItems: c.buttons?.map(b => ({ type: b.type, title: b.title, value: b.value })) || [],
        listSections: c.sections ? JSON.stringify(c.sections, null, 2) : "",
        quickReplies: c.quick_replies ? JSON.stringify(c.quick_replies, null, 2) : "",
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
            return { action: { type: f.actionType || "handoff", params }, reply: f.reply || undefined }
        }
        case "images": {
            return { asset_ids: f.assetIds.length ? f.assetIds : undefined, reply_after_media: f.replyAfterMedia || undefined, caption: f.caption || undefined }
        }
        case "files": {
            return { asset_ids: f.assetIds.length ? f.assetIds : undefined, reply_after_media: f.replyAfterMedia || undefined }
        }
        case "videos": {
            return { asset_ids: f.assetIds.length ? f.assetIds : undefined, reply_after_media: f.replyAfterMedia || undefined }
        }
        case "buttons":
            return { buttons: f.buttonItems.length ? f.buttonItems.map(b => ({ type: b.type as "url" | "reply", title: b.title, value: b.value })) : undefined }
        case "list":
            try { return f.listSections ? { sections: JSON.parse(f.listSections) } : undefined } catch { return undefined }
        case "quick_reply":
            try { return f.quickReplies ? { quick_replies: JSON.parse(f.quickReplies) } : undefined } catch { return undefined }
        default: return undefined
    }
}

// �"?�"? Media Upload Zone �"?�"?
// ── Media Upload Zone ──
function MediaUploadZone({ form, setForm, accept, label, icon }: {
    form: ContentFormState; setForm: (f: ContentFormState) => void; accept: string; label: string; icon: string
}) {
    const [uploading, setUploading] = useState<UploadingFile[]>([])
    const [dragOver, setDragOver] = useState(false)

    const handleFiles = async (files: FileList | null) => {
        if (!files) return
        const newFiles = Array.from(files)
        setUploading(prev => [...prev, ...newFiles.map(f => ({ file: f, progress: 0 }))])
        for (const file of newFiles) {
            try {
                const res = await menuService.uploadMedia(file)
                const mediaId = res.data.media_id
                setForm({ ...form, assetIds: [...form.assetIds, mediaId] })
                setUploading(prev => prev.map(u => u.file === file ? { ...u, progress: 100, mediaId } : u))
                setTimeout(() => setUploading(prev => prev.filter(u => u.file !== file)), 1500)
            } catch {
                setUploading(prev => prev.map(u => u.file === file ? { ...u, error: "فشل الرفع" } : u))
            }
        }
    }

    return (
        <div>
            <label style={labelSt}>{label} ({form.assetIds.length})</label>
            {form.assetIds.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                    {form.assetIds.map((id, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                            <span style={{ fontSize: 13 }}>{icon}</span>
                            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#6b7280", flex: 1, wordBreak: "break-all" }}>{id}</span>
                            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "rgba(34,197,94,0.08)", color: "#22c55e", fontWeight: 600 }}>مرفوع</span>
                            <button onClick={() => setForm({ ...form, assetIds: form.assetIds.filter((_, j) => j !== i) })} style={{ ...iconBtn, color: "#ef4444" }}><X size={13} /></button>
                        </div>
                    ))}
                </div>
            )}
            {uploading.map((u, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: u.error ? "rgba(239,68,68,0.04)" : "rgba(0,71,134,0.04)", border: "1px solid var(--t-border-light)", marginBottom: 4 }}>
                    {u.error ? <AlertCircle size={13} style={{ color: "#ef4444" }} /> : <Loader2 size={13} className="animate-spin" style={{ color: "#004786" }} />}
                    <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>{u.file.name}</span>
                    <span style={{ fontSize: 10, color: u.error ? "#ef4444" : "#004786", fontWeight: 600 }}>{u.error || (u.mediaId ? "تم الرفع" : "جاري الرفع...")}</span>
                </div>
            ))}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; inp.multiple = true; inp.onchange = () => handleFiles(inp.files); inp.click() }}
                style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "16px 12px", borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                    border: `2px dashed ${dragOver ? "#004786" : "var(--t-border-light, #d1d5db)"}`,
                    background: dragOver ? "rgba(0,71,134,0.04)" : "transparent",
                }}
            >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,71,134,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={16} style={{ color: "#004786" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#004786" }}>اسحب الملفات هنا أو انقر للاختيار</span>
                <span style={{ fontSize: 10, color: "#9ca3af" }}>{accept}</span>
            </div>
        </div>
    )
}

// ── Content Fields Component ──
function ContentFields({ type, form, setForm, mode }: { type: MenuItemType; form: ContentFormState; setForm: (f: ContentFormState) => void; mode: "add" | "edit" }) {
    const sectionTitle = (icon: string, title: string) => (
        <p style={{ fontSize: 12, fontWeight: 700, color: "#004786", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>{icon} {title}</p>
    )
    switch (type) {
        case "submenu":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🗂️", "إعدادات العرض (Presentation)")}
                    <div><label style={labelSt}>العنوان (Header) — يظهر أعلى القائمة</label>
                        <input value={form.presHeader} onChange={e => setForm({ ...form, presHeader: e.target.value })} placeholder="بنك القاسمي للتمويل..." style={inputSt} /></div>
                    <div><label style={labelSt}>التذييل (Footer) — يظهر أسفل القائمة</label>
                        <input value={form.presFooter} onChange={e => setForm({ ...form, presFooter: e.target.value })} placeholder="اختر الخدمة المطلوبة" style={inputSt} /></div>
                    <div><label style={labelSt}>زر الرجوع (Button) — نص زر القائمة</label>
                        <input value={form.presButton} onChange={e => setForm({ ...form, presButton: e.target.value })} placeholder="اختر من التالي" style={inputSt} /></div>
                </div>
            )
        case "text":
            return (
                <div style={sectionBox}>
                    {sectionTitle("💬", "الرد النصي")}
                    <div><label style={labelSt}>نص الرد *</label>
                        <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })} rows={mode === "edit" ? 6 : 3} placeholder="النص الذي سيُرسل كرد للمستخدم..." style={{ ...inputSt, resize: "vertical", lineHeight: 1.7 }} /></div>
                    <div><label style={labelSt}>التنسيق</label>
                        <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} style={inputSt}>
                            <option value="plain">نص عادي (Plain)</option>
                            <option value="markdown">Markdown</option>
                        </select></div>
                </div>
            )
        case "action":
            return (
                <div style={sectionBox}>
                    {sectionTitle("⚡", "إعدادات الإجراء (Action)")}
                    <div><label style={labelSt}>نوع الإجراء *</label>
                        <select value={form.actionType} onChange={e => setForm({ ...form, actionType: e.target.value })} style={inputSt}>
                            <option value="">— اختر نوع الإجراء —</option>
                            <option value="handoff">🤝 تحويل لموظف (Handoff)</option>
                            <option value="callback_request">📞 طلب اتصال (Callback)</option>
                            <option value="close_conversation">🔒 إغلاق المحادثة</option>
                            <option value="custom">⚙️ إجراء مخصص</option>
                        </select></div>
                    <div><label style={labelSt}>المعاملات (Parameters) — JSON</label>
                        <textarea value={form.actionParams} onChange={e => setForm({ ...form, actionParams: e.target.value })} rows={3}
                            placeholder='{"team_id": "support", "priority": "high"}'
                            style={{ ...inputSt, fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: 12, resize: "vertical", direction: "ltr", textAlign: "left" }} /></div>
                    <div><label style={labelSt}>رسالة الرد — تُرسل عند تنفيذ الإجراء</label>
                        <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })} rows={2} placeholder="جاري تحويلك لموظف الخدمة..." style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }} /></div>
                </div>
            )
        case "images":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🖼️", "إعدادات الصور")}
                    <MediaUploadZone form={form} setForm={setForm} accept="image/*" label="الصور" icon="🖼️" />
                    <div><label style={labelSt}>النص التوضيحي (Caption)</label>
                        <textarea value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} rows={2} placeholder="وصف يُرسل مع الصورة" style={{ ...inputSt, resize: "vertical" }} /></div>
                    <div><label style={labelSt}>رسالة بعد الوسائط</label>
                        <textarea value={form.replyAfterMedia} onChange={e => setForm({ ...form, replyAfterMedia: e.target.value })} rows={2} placeholder="نص يُرسل بعد إرسال الصور" style={{ ...inputSt, resize: "vertical" }} /></div>
                </div>
            )
        case "files":
            return (
                <div style={sectionBox}>
                    {sectionTitle("📎", "إعدادات الملفات")}
                    <MediaUploadZone form={form} setForm={setForm} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip" label="الملفات" icon="📎" />
                    <div><label style={labelSt}>رسالة بعد الملف</label>
                        <textarea value={form.replyAfterMedia} onChange={e => setForm({ ...form, replyAfterMedia: e.target.value })} rows={2} placeholder="نص يُرسل بعد إرسال الملف" style={{ ...inputSt, resize: "vertical" }} /></div>
                </div>
            )
        case "videos":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🎬", "إعدادات الفيديوهات")}
                    <MediaUploadZone form={form} setForm={setForm} accept="video/*" label="الفيديوهات" icon="🎬" />
                    <div><label style={labelSt}>رسالة بعد الفيديو</label>
                        <textarea value={form.replyAfterMedia} onChange={e => setForm({ ...form, replyAfterMedia: e.target.value })} rows={2} placeholder="نص يُرسل بعد إرسال الفيديو" style={{ ...inputSt, resize: "vertical" }} /></div>
                </div>
            )
        case "buttons":
            return (
                <div style={sectionBox}>
                    {sectionTitle("🔘", "إعدادات الأزرار")}
                    {form.buttonItems.map((b, i) => (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", padding: 8, borderRadius: 8, background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light)" }}>
                            <select value={b.type} onChange={e => { const n = [...form.buttonItems]; n[i] = { ...n[i], type: e.target.value }; setForm({ ...form, buttonItems: n }) }} style={{ ...inputSt, width: 90, fontSize: 11, padding: "6px 8px" }}>
                                <option value="url">🔗 رابط</option>
                                <option value="reply">↩️ رد</option>
                            </select>
                            <input value={b.title} onChange={e => { const n = [...form.buttonItems]; n[i] = { ...n[i], title: e.target.value }; setForm({ ...form, buttonItems: n }) }} placeholder="نص الزر" style={{ ...inputSt, flex: 1, fontSize: 12, padding: "6px 10px" }} />
                            <input value={b.value} onChange={e => { const n = [...form.buttonItems]; n[i] = { ...n[i], value: e.target.value }; setForm({ ...form, buttonItems: n }) }} placeholder={b.type === "url" ? "https://..." : "القيمة"} style={{ ...inputSt, flex: 1, fontSize: 12, padding: "6px 10px" }} dir="ltr" />
                            <button onClick={() => { const n = form.buttonItems.filter((_, j) => j !== i); setForm({ ...form, buttonItems: n }) }} style={{ ...iconBtn, color: "#ef4444" }}><X size={14} /></button>
                        </div>
                    ))}
                    <button onClick={() => setForm({ ...form, buttonItems: [...form.buttonItems, { type: "reply", title: "", value: "" }] })}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px dashed var(--t-border-light)", background: "transparent", color: "#004786", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                        <Plus size={13} /> إضافة زر {form.buttonItems.length > 0 && `(${form.buttonItems.length})`}
                    </button>
                    {form.buttonItems.length >= 3 && <p style={{ fontSize: 10, color: "#f59e0b", margin: 0 }}>⚠️ الحد الأقصى لواتساب 3 أزرار</p>}
                </div>
            )
        case "list":
            return (
                <div style={sectionBox}>
                    {sectionTitle("📋", "إعدادات القائمة (List)")}
                    <div><label style={labelSt}>الأقسام (Sections) — JSON</label>
                        <textarea value={form.listSections} onChange={e => setForm({ ...form, listSections: e.target.value })} rows={6}
                            placeholder={'[\n  {\n    "title": "القسم الأول",\n    "rows": [\n      { "id": "1", "title": "عنصر", "description": "وصف" }\n    ]\n  }\n]'}
                            style={{ ...inputSt, fontFamily: "'Fira Code', monospace", fontSize: 11, resize: "vertical", direction: "ltr", textAlign: "left" }} /></div>
                    <div><label style={labelSt}>نص الزر</label>
                        <input value={form.presButton} onChange={e => setForm({ ...form, presButton: e.target.value })} placeholder="عرض القائمة" style={inputSt} /></div>
                </div>
            )
        case "quick_reply":
            return (
                <div style={sectionBox}>
                    {sectionTitle("⚡↩️", "الردود السريعة (Quick Replies)")}
                    <div><label style={labelSt}>نص الرسالة</label>
                        <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })} rows={2} placeholder="سؤال أو نص يُعرض مع الأزرار..." style={{ ...inputSt, resize: "vertical" }} /></div>
                    <div><label style={labelSt}>الردود السريعة — JSON</label>
                        <textarea value={form.quickReplies} onChange={e => setForm({ ...form, quickReplies: e.target.value })} rows={4}
                            placeholder={'[\n  { "id": "yes", "title": "نعم" },\n  { "id": "no", "title": "لا" }\n]'}
                            style={{ ...inputSt, fontFamily: "'Fira Code', monospace", fontSize: 11, resize: "vertical", direction: "ltr", textAlign: "left" }} /></div>
                </div>
            )
        default:
            return <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>لا توجد حقول إضافية لهذا النوع</p>
    }
}

// ── Media Preview Component ──
function MediaPreview({ assetIds, type }: { assetIds: string[]; type: "images" | "files" | "videos" }) {
    const [urls, setUrls] = useState<Record<string, { url: string; filename: string; loading: boolean; error?: string }>>({})
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!assetIds.length) return
        const init: typeof urls = {}
        assetIds.forEach(id => { init[id] = { url: "", filename: "", loading: true } })
        setUrls(init)
        assetIds.forEach(async (id) => {
            try {
                const res = await menuService.getMediaPublicUrl(id)
                setUrls(prev => ({ ...prev, [id]: { url: res.data.url, filename: id, loading: false } }))
            } catch {
                setUrls(prev => ({ ...prev, [id]: { url: "", filename: "", loading: false, error: "فشل التحميل" } }))
            }
        })
    }, [assetIds])

    return (
        <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                {assetIds.map(id => {
                    const entry = urls[id]
                    if (!entry || entry.loading) return (
                        <div key={id} style={{ width: type === "images" ? 100 : "100%", height: type === "images" ? 100 : 48, borderRadius: 10, background: "var(--t-surface, #f3f4f6)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--t-border-light, #e5e7eb)" }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: "#9ca3af" }} />
                        </div>
                    )
                    if (entry.error) return (
                        <div key={id} style={{ width: type === "images" ? 100 : "100%", height: type === "images" ? 100 : 48, borderRadius: 10, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "#ef4444" }}>
                            <AlertCircle size={14} /> {entry.error}
                        </div>
                    )
                    if (type === "images") return (
                        <div key={id} onClick={() => setLightboxUrl(entry.url)} style={{ width: 100, height: 100, borderRadius: 10, overflow: "hidden", border: "1px solid var(--t-border-light, #e5e7eb)", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "scale(1.05)" }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "scale(1)" }}>
                            <img src={entry.url} alt={entry.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                    )
                    if (type === "videos") return (
                        <div key={id} style={{ width: "100%", borderRadius: 10, overflow: "hidden", border: "1px solid var(--t-border-light)" }}>
                            <video src={entry.url} controls style={{ width: "100%", maxHeight: 200, display: "block", background: "#000" }} />
                        </div>
                    )
                    return (
                        <a key={id} href={entry.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, textDecoration: "none", background: "var(--t-card, #fff)", border: "1px solid var(--t-border-light)", transition: "all 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(156,39,176,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Paperclip size={14} style={{ color: "#9c27b0" }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #1f2937)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.filename || id}</span>
                                <span style={{ fontSize: 10, color: "#9ca3af" }}>انقر للتحميل</span>
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
                <span style={{ fontWeight: 700, color: "#004786", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>🗂️ إعدادات العرض</span>
                {c.presentation.header && <div style={{ fontSize: 12 }}>📌 <strong>العنوان:</strong> {c.presentation.header}</div>}
                {c.presentation.footer && <div style={{ fontSize: 12 }}>📄 <strong>التذييل:</strong> {c.presentation.footer}</div>}
                {c.presentation.button && <div style={{ fontSize: 12 }}>🔘 <strong>الزر:</strong> {c.presentation.button}</div>}
            </div>
        )
    }
    if (item.type === "text" && c.reply) {
        return (
            <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>الرد:</span>
                <div style={{ padding: 10, borderRadius: 8, background: "var(--t-surface, #f9fafb)", fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.7, marginTop: 4 }}>{c.reply}</div>
                {c.format && c.format !== "plain" && <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, display: "block" }}>التنسيق: {c.format}</span>}
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
                {c.reply && <div style={{ fontSize: 12, color: "#374151" }}>↩️ {c.reply}</div>}
            </div>
        )
    }
    if ((item.type === "images" || item.type === "files" || item.type === "videos") && (c.asset_ids?.length || c.reply_after_media)) {
        const icons: Record<string, string> = { images: "🖼️", files: "📎", videos: "🎬" }
        const labels: Record<string, string> = { images: "صور", files: "ملفات", videos: "فيديوهات" }
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>{icons[item.type]} {labels[item.type]} {c.asset_ids?.length ? `(${c.asset_ids.length})` : ""}</span>
                {c.asset_ids && c.asset_ids.length > 0 && <MediaPreview assetIds={c.asset_ids} type={item.type as "images" | "files" | "videos"} />}
                {c.caption && <div style={{ fontSize: 12, color: "#374151" }}>📌 {c.caption}</div>}
                {c.reply_after_media && <div style={{ fontSize: 12, color: "#374151" }}>↩️ {c.reply_after_media}</div>}
            </div>
        )
    }
    if (item.type === "buttons" && c.buttons?.length) {
        return (
            <div style={{ ...sectionBox, marginTop: 10, gap: 6 }}>
                <span style={{ fontWeight: 700, color: "#7b1fa2", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>🔘 أزرار ({c.buttons.length})</span>
                {c.buttons.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, background: "var(--t-card, #fff)" }}>
                        {b.type === "url" ? <Link2 size={13} style={{ color: "#004786", flexShrink: 0 }} /> : <MousePointerClick size={13} style={{ color: "#10b981", flexShrink: 0 }} />}
                        <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{b.title}</span>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 6, background: b.type === "url" ? "rgba(0,71,134,0.08)" : "rgba(16,185,129,0.08)", color: b.type === "url" ? "#004786" : "#10b981", fontWeight: 600 }}>
                            {b.type === "url" ? "رابط" : "رد"}
                        </span>
                    </div>
                ))}
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
    const [eTitle, setETitle] = useState("")
    const [eKey, setEKey] = useState("")
    const [eDesc, setEDesc] = useState("")
    const [eActive, setEActive] = useState(true)
    const [eContent, setEContent] = useState<ContentFormState>(defaultContentForm())
    const [aKey, setAKey] = useState("")
    const [aTitle, setATitle] = useState("")
    const [aType, setAType] = useState<MenuItemType>("text")
    const [aDesc, setADesc] = useState("")
    const [aContent, setAContent] = useState<ContentFormState>(defaultContentForm())
    const { canPerformAction } = usePermissions()
    const canCreateItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.CREATE_MENU_ITEM)
    const canUpdateItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.UPDATE_MENU_ITEM)
    const canDeleteItem = canPerformAction(PAGE_BITS.MENU_MANAGER, ACTION_BITS.DELETE_MENU_ITEM)

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
        setEContent(loadContentForm(item))
    }

    const handleSave = async () => {
        if (!tid || !detail) return; setSaving(true)
        try {
            const p: UpdateMenuItemPayload = {}
            if (eTitle !== detail.title) p.title = eTitle
            if (eKey !== detail.key) p.key = eKey
            if (eDesc !== (detail.description || "")) p.description = eDesc
            if (eActive !== detail.is_active) p.is_active = eActive
            p.content = buildContent(detail.type, eContent)
            await menuService.updateItem(tid, detail.id, p)
            setEditMode(false); fetchTree(); selectNode(detail.id)
        } catch { } finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        if (!tid) return
        try {
            await menuService.deleteItem(tid, id)
            if (selectedId === id) { setDetail(null); setSelectedId(null) }
            setDeleteConfirmId(null); fetchTree()
        } catch { }
    }

    const resetAdd = () => {
        setAddParentId(null); setAKey(""); setATitle("")
        setAType("text"); setADesc(""); setAContent(defaultContentForm())
    }

    const handleAdd = async () => {
        if (!addParentId || !tid || !aKey.trim() || !aTitle.trim()) return
        setSubmitting(true)
        try {
            const p: CreateMenuItemPayload = { parent_id: addParentId, key: aKey.trim(), type: aType, title: aTitle.trim() }
            if (aDesc.trim()) p.description = aDesc.trim()
            const content = buildContent(aType, aContent)
            if (content) p.content = content
            await menuService.createItem(tid, p); resetAdd(); fetchTree()
        } catch { } finally { setSubmitting(false) }
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
                        background: isSel ? "rgba(0,71,134,0.06)" : "transparent",
                        borderRight: isSel ? "3px solid #004786" : "3px solid transparent",
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
                                <ChevronDown size={13} style={{ color: isExpanded ? "#004786" : "#9ca3af" }} />
                            </div>
                        )}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${tc?.color || "#6b7280"}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={13} style={{ color: tc?.color || "#6b7280" }} />
                    </div>
                    <span style={{
                        fontSize: 13, fontWeight: isSel ? 600 : 500,
                        color: item.is_active ? "var(--t-text, #1f2937)" : "var(--t-text-muted, #9ca3af)",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textDecoration: item.is_active ? "none" : "line-through",
                    }}>{item.title}</span>
                    {isSub && cnt > 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: "rgba(0,71,134,0.08)", color: "#004786", fontWeight: 700 }}>{cnt}</span>}
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 10, background: `${tc?.color || "#6b7280"}10`, color: tc?.color || "#6b7280", fontWeight: 600, flexShrink: 0 }}>
                        {tc?.label || item.type}
                    </span>
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {canCreateItem && isSub && <button onClick={() => setAddParentId(item.id)} style={iconBtn} title="إضافة"><Plus size={12} /></button>}
                        <button onClick={() => selectNode(item.id)} style={iconBtn} title="عرض">
                            {fetchingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Edit3 size={12} />}
                        </button>
                        {canDeleteItem && depth > 0 && <button onClick={() => setDeleteConfirmId(item.id)} style={{ ...iconBtn, color: "#ef4444" }} title="حذف"><Trash2 size={12} /></button>}
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--t-border-light, #e5e7eb)", background: "var(--t-card, #fff)", flexShrink: 0 }}>
                <FolderTree size={16} style={{ color: "#004786", flexShrink: 0 }} />
                <select value={tid || ""} onChange={e => { setTid(e.target.value || null); setDetail(null); setSelectedId(null) }}
                    style={{ flex: 1, maxWidth: 360, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "var(--t-surface)", fontSize: 13, color: "var(--t-text, #1f2937)", outline: "none" }}>
                    <option value="">— اختر قالب —</option>
                    {templates.map(t => <option key={t.template_id} value={t.template_id}>{t.name}</option>)}
                </select>
                {tid && <span style={{ fontSize: 11, color: "#6b7280" }}>يتحكم في الشجرة والمحاكي معاً</span>}
                <div style={{ flex: 1 }} />
                {/* Preview toggle */}
                <button
                    onClick={() => setPreviewVisible(v => !v)}
                    title={previewVisible ? "إخفاء المحاكي" : "إظهار المحاكي"}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: previewVisible ? "rgba(0,71,134,0.06)" : "transparent", color: previewVisible ? "#004786" : "var(--t-text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
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
                    borderLeft: "1px solid var(--t-border-light, #e5e7eb)",
                }}>
                    {/* Tree Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0 }}>
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, #1f2937)" }}>محرر الشجرة</span>
                            <span style={{ display: "block", fontSize: 11, color: "#6b7280", marginTop: 1 }}>بناء وإدارة هيكل القائمة</span>
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
                                <Loader2 size={24} className="animate-spin" style={{ color: "#004786", margin: "0 auto 10px" }} />
                                <p style={{ fontSize: 12, color: "#6b7280" }}>جاري التحميل...</p>
                            </div>
                        )}
                        {error && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.06)", color: "#ef4444", fontSize: 12 }}>
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
                                <Loader2 size={24} className="animate-spin" style={{ color: "#004786", margin: "0 auto 12px" }} />
                                <p style={{ fontSize: 13, color: "#6b7280" }}>جاري الجلب...</p>
                            </div>
                        ) : detail && (
                            <>
                                <div style={{ background: "linear-gradient(135deg, #004786, #0098d6)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
                                            <div><label style={labelSt}>العنوان *</label><input value={eTitle} onChange={e => setETitle(e.target.value)} style={inputSt} /></div>
                                            <div><label style={labelSt}>المفتاح (key)</label><input value={eKey} onChange={e => setEKey(e.target.value)} style={inputSt} dir="ltr" /></div>
                                            <div><label style={labelSt}>الوصف</label><textarea value={eDesc} onChange={e => setEDesc(e.target.value)} rows={2} style={{ ...inputSt, resize: "vertical" }} /></div>
                                            <ContentFields type={detail.type} form={eContent} setForm={setEContent} mode="edit" />
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                                                <label style={{ ...labelSt, margin: 0 }}>مفعّل</label>
                                                <button onClick={() => setEActive(!eActive)} style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: eActive ? "#004786" : "#d1d5db", position: "relative", transition: "all 0.2s" }}>
                                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, right: eActive ? 2 : 20, transition: "right 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {([["المعرف", detail.id], ["المفتاح", detail.key], ["العنوان", detail.title], ["النوع", MENU_ITEM_TYPES.find(t => t.value === detail.type)?.label || detail.type], ["الترتيب", String(detail.order)], ["الحالة", detail.is_active ? "نشط ✅" : "معطل ❌"]] as [string, string][]).map(([l, v]) => (
                                                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--t-border-light, #f0f0f0)", fontSize: 12 }}>
                                                    <span style={{ color: "#6b7280", fontWeight: 500 }}>{l}</span>
                                                    <span style={{ color: "#1f2937", fontWeight: 600, textAlign: "left", maxWidth: "60%", wordBreak: "break-all" }}>{v}</span>
                                                </div>
                                            ))}
                                            {detail.description && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>الوصف:</span><p style={{ fontSize: 12, color: "#1f2937", margin: "4px 0 0", lineHeight: 1.6 }}>{detail.description}</p></div>}
                                            <DetailContentView item={detail} />
                                        </>
                                    )}
                                </div>
                                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--t-border-light)", display: "flex", gap: 8, flexShrink: 0 }}>
                                    {editMode ? (
                                        <>
                                            <button onClick={() => setEditMode(false)} style={{ flex: 1, padding: "8px 14px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                                            <button onClick={handleSave} disabled={saving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} حفظ
                                            </button>
                                        </>
                                    ) : (
                                        canUpdateItem && <button onClick={() => openEdit(detail)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #004786, #0098d6)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
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
                        <div style={{ background: "linear-gradient(135deg, #004786, #0072b5, #0098d6)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
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
                                                borderColor: sel ? t.color : "var(--t-border-light, #e5e7eb)",
                                                background: sel ? `${t.color}10` : "transparent",
                                                color: sel ? t.color : "var(--t-text-secondary, #6b7280)",
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
                            <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ flex: 1 }}><label style={labelSt}>المفتاح (key) *</label><input value={aKey} onChange={e => setAKey(e.target.value)} placeholder="مثال: new_item" style={inputSt} dir="ltr" /></div>
                                <div style={{ flex: 1 }}><label style={labelSt}>العنوان *</label><input value={aTitle} onChange={e => setATitle(e.target.value)} placeholder="عنوان العنصر" style={inputSt} /></div>
                            </div>
                            <div><label style={labelSt}>الوصف (اختياري)</label><input value={aDesc} onChange={e => setADesc(e.target.value)} placeholder="وصف قصير..." style={inputSt} /></div>
                            <ContentFields type={aType} form={aContent} setForm={setAContent} mode="add" />
                        </div>
                        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-border-light)", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0 }}>
                            <button onClick={resetAdd} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={handleAdd} disabled={submitting || !aKey.trim() || !aTitle.trim()} style={{
                                padding: "8px 20px", borderRadius: 8, border: "none",
                                background: aKey.trim() && aTitle.trim() ? "linear-gradient(135deg, #004786, #0098d6)" : "#e5e7eb",
                                color: aKey.trim() && aTitle.trim() ? "#fff" : "#9ca3af",
                                fontSize: 13, fontWeight: 600, cursor: aKey.trim() && aTitle.trim() ? "pointer" : "default",
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
                                <Trash2 size={22} style={{ color: "#ef4444" }} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", margin: "0 0 6px" }}>تأكيد الحذف</h3>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>سيتم حذف هذا العنصر وجميع عناصره الفرعية نهائياً.</p>
                        </div>
                        <div style={{ display: "flex", gap: 8, padding: "16px 20px 20px" }}>
                            <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "1px solid var(--t-border-light)", background: "transparent", color: "var(--t-text-secondary)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
                            <button onClick={() => handleDelete(deleteConfirmId)} style={{ flex: 1, padding: "9px 16px", borderRadius: 9, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>حذف</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes modalSlideIn { from { opacity:0; transform:translateY(24px) scale(.96) } to { opacity:1; transform:translateY(0) scale(1) } }
                @keyframes treeSlide { from { opacity:0; max-height:0 } to { opacity:1; max-height:3000px } }
            `}</style>
        </div>
    )
}
