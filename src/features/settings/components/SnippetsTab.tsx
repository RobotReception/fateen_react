import { useState, useRef } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet } from "../hooks/use-teams-tags"
import { useMutation } from "@tanstack/react-query"
import { uploadMedia } from "../services/teams-tags-service"
import type { Snippet, SnippetMessageType, SnippetContent } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, MessageSquare, X, Loader2, Search, Check,
    FileText, Image, Mic, Video, File, BookOpen, Upload, AlertTriangle,
    Eye, Play, Download,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import { toast } from "sonner"

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
const CSS = `
.sn-card { border-radius:12px; border:1px solid var(--t-border); background:var(--t-card); padding:14px 16px; transition:box-shadow .15s,border-color .15s; cursor:pointer; }
.sn-card:hover { border-color:var(--t-accent); box-shadow:0 2px 10px rgba(0,0,0,.08); }
.sn-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; transition:border-color .15s; box-sizing:border-box; }
.sn-field:focus { border-color:var(--t-accent); }
.sn-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--t-text-faint); display:block; margin-bottom:5px; }
.sn-btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:9px; border:none; background:var(--t-accent); color:var(--t-text-on-accent); font-size:13px; font-weight:700; cursor:pointer; transition:opacity .15s; }
.sn-btn-primary:hover:not(:disabled) { opacity:.88; }
.sn-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:7px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:transparent; color:var(--t-text); font-size:12px; font-weight:600; cursor:pointer; }
.sn-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.sn-type-btn { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; transition:all .15s; }
@keyframes snIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

/* ─── Message type metadata ─── */
const TYPE_META: Record<SnippetMessageType, { icon: React.ElementType; label: string; color: string }> = {
    text: { icon: FileText, label: "نص", color: "#6366f1" },
    image: { icon: Image, label: "صورة", color: "#10b981" },
    audio: { icon: Mic, label: "صوت", color: "#f59e0b" },
    video: { icon: Video, label: "فيديو", color: "#ef4444" },
    file: { icon: File, label: "ملف", color: "#8b5cf6" },
    document: { icon: BookOpen, label: "مستند", color: "#3b82f6" },
}

/* ─── Modal ─── */
function Modal({ title, width = 560, onClose, children }: {
    title: string; width?: number; onClose: () => void; children: React.ReactNode
}) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: width, margin: 16, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "snIn .15s ease-out" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--t-border-light)", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)" }}>{title}</div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex" }}><X size={16} /></button>
                </div>
                <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

/* ════════════════════════════════════════
   PREVIEW MODAL
════════════════════════════════════════ */
function PreviewModal({ s, onClose }: { s: Snippet; onClose: () => void }) {
    const tm = TYPE_META[s.message_type] ?? TYPE_META.text
    const url = s.content?.url as string | undefined

    return (
        <Modal title={s.name} width={640} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Header info */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${tm.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <tm.icon size={18} style={{ color: tm.color }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{s.title || s.title_ar || s.name}</div>
                        {(s.title_ar || s.title_en) && (
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>
                                {[s.title_ar, s.title_en].filter(Boolean).join(" · ")}
                            </div>
                        )}
                        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${tm.color}14`, color: tm.color }}>{tm.label}</span>
                            {s.topic && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--t-surface)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-light)" }}>{s.topic}</span>}
                        </div>
                    </div>
                </div>

                {/* ── Content preview ── */}
                {s.message_type === "text" && (
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--t-surface)", border: "1px solid var(--t-border-light)", fontSize: 14, lineHeight: 1.8, color: "var(--t-text)", whiteSpace: "pre-wrap", direction: "rtl" }}>
                        {s.content?.text || s.message || "—"}
                    </div>
                )}

                {s.message_type === "image" && url && (
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--t-border-light)", background: "var(--t-surface)", textAlign: "center" }}>
                        <img src={url} alt={s.name} style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", display: "block", margin: "0 auto" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        {s.content?.caption && <div style={{ padding: "8px 14px", fontSize: 12, color: "var(--t-text-faint)" }}>{s.content.caption as string}</div>}
                    </div>
                )}

                {s.message_type === "audio" && url && (
                    <div style={{ padding: 16, borderRadius: 12, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <audio controls src={url} style={{ width: "100%" }} />
                        {s.content?.transcript && (
                            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 9, background: "var(--t-card)", border: "1px solid var(--t-border-light)", fontSize: 12, color: "var(--t-text-faint)", lineHeight: 1.6 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, display: "block", marginBottom: 4, color: "var(--t-text-faint)", textTransform: "uppercase" }}>النص المكتوب</span>
                                {s.content.transcript as string}
                            </div>
                        )}
                    </div>
                )}

                {s.message_type === "video" && url && (
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--t-border-light)", background: "#000" }}>
                        <video controls src={url} style={{ width: "100%", maxHeight: 320, display: "block" }} />
                        {s.content?.caption && <div style={{ padding: "6px 14px", fontSize: 12, color: "var(--t-text-faint)", background: "var(--t-surface)" }}>{s.content.caption as string}</div>}
                    </div>
                )}

                {(s.message_type === "file" || s.message_type === "document") && url && (
                    <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--t-surface)", border: "1px solid var(--t-border-light)", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${tm.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <tm.icon size={22} style={{ color: tm.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", wordBreak: "break-all" }}>{s.content?.filename as string || s.name}</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2, wordBreak: "break-all", direction: "ltr" }}>{url}</div>
                        </div>
                        <a href={url} target="_blank" rel="noreferrer" className="sn-btn-primary" style={{ textDecoration: "none", flexShrink: 0 }}>
                            <Play size={13} /> فتح
                        </a>
                    </div>
                )}

                {/* localised content */}
                {(s.content_ar || s.content_en) && (
                    <div className="sn-grid-2">
                        {s.content_ar && (
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)", fontSize: 12, color: "var(--t-text-faint)", direction: "rtl" }}>
                                <span style={{ fontSize: 9, fontWeight: 800, display: "block", marginBottom: 4, textTransform: "uppercase" }}>العربية</span>
                                {s.content_ar}
                            </div>
                        )}
                        {s.content_en && (
                            <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)", fontSize: 12, color: "var(--t-text-faint)", direction: "ltr" }}>
                                <span style={{ fontSize: 9, fontWeight: 800, display: "block", marginBottom: 4, textTransform: "uppercase" }}>English</span>
                                {s.content_en}
                            </div>
                        )}
                    </div>
                )}

                {/* field_id + created_by + download */}
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--t-text-faint)", padding: "8px 0", borderTop: "1px solid var(--t-border-light)", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", flex: 1 }}>{s.field_id}</span>
                    {s.created_by && <span>· {s.created_by}</span>}
                    {s.created_at && <span>· {new Date(s.created_at).toLocaleDateString("ar-SA", { timeZone: "Asia/Aden" })}</span>}
                    {url && (
                        <a href={url} download={s.content?.filename as string || s.name}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, border: "1.5px solid var(--t-border)", background: "var(--t-surface)", color: "var(--t-text)", textDecoration: "none", fontSize: 11, fontWeight: 700 }}
                            onClick={e => e.stopPropagation()}>
                            <Download size={12} /> تنزيل
                        </a>
                    )}
                </div>
            </div>
        </Modal>
    )
}

/* ─── File Upload Zone ─── */
function FileUploadField({ onUploaded, tenantId, accept, uploaded }: {
    onUploaded: (url: string, filename: string) => void
    tenantId: string
    accept?: string
    uploaded: boolean
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const uploadMut = useMutation({
        mutationFn: (file: File) => uploadMedia(file, tenantId, { context: "snippet" }),
        onSuccess: r => {
            if (r.success && r.data) {
                onUploaded(r.data.public_url, r.data.filename)
                toast.success("تم رفع الملف")
            } else toast.error(r.message)
        },
        onError: () => toast.error("فشل رفع الملف"),
    })

    return (
        <div>
            <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f) }} />
            <button type="button" onClick={() => inputRef.current?.click()}
                className="sn-btn-ghost"
                style={{ width: "100%", justifyContent: "center", padding: "12px 0", border: `1.5px dashed ${uploaded ? "#10b981" : "var(--t-border)"}`, background: uploaded ? "rgba(16,185,129,.06)" : undefined }}>
                {uploadMut.isPending
                    ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</>
                    : uploaded
                        ? <><Check size={14} style={{ color: "#10b981" }} /> <span style={{ color: "#10b981" }}>تم الرفع — انقر لاستبدال</span></>
                        : <><Upload size={14} /> رفع ملف (حتى 100 MB)</>}
            </button>
        </div>
    )
}

/* ─── Snippet Form ─── */
function SnippetForm({ snippet, tenantId, onClose }: { snippet?: Snippet; tenantId: string; onClose: () => void }) {
    const createMut = useCreateSnippet(tenantId)
    const updateMut = useUpdateSnippet(tenantId)
    const isEdit = !!snippet

    const [name, setName] = useState(snippet?.name ?? "")
    const [titleAr, setTitleAr] = useState(snippet?.title_ar ?? "")
    const [titleEn, setTitleEn] = useState(snippet?.title_en ?? "")
    const [msgType, setMsgType] = useState<SnippetMessageType>(snippet?.message_type ?? "text")
    const [topic, setTopic] = useState(snippet?.topic ?? "")
    const [contentAr, setContentAr] = useState(snippet?.content_ar ?? "")
    const [contentEn, setContentEn] = useState(snippet?.content_en ?? "")

    // Media content — stored internally, never shown as input
    const [text, setText] = useState(snippet?.content?.text ?? snippet?.message ?? "")
    const [mediaUrl, setMediaUrl] = useState(snippet?.content?.url ?? "")
    const [caption, setCaption] = useState(snippet?.content?.caption ?? "")
    const [filename, setFilename] = useState(snippet?.content?.filename ?? "")
    const [transcript, setTranscript] = useState(snippet?.content?.transcript ?? "")
    const [duration, setDuration] = useState(String(snippet?.content?.duration ?? ""))

    const isText = msgType === "text"
    const isMedia = !isText

    const buildContent = (): SnippetContent => {
        switch (msgType) {
            case "text": return { text }
            case "image": return { url: mediaUrl, caption: caption || undefined }
            case "audio": return { url: mediaUrl, transcript: transcript || undefined, duration: duration ? Number(duration) : undefined }
            case "video": return { url: mediaUrl, caption: caption || undefined, duration: duration ? Number(duration) : undefined }
            case "file":
            case "document": return { url: mediaUrl, filename: filename || undefined }
        }
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isMedia && !mediaUrl && !isEdit) {
            toast.error("الرجاء رفع الملف أولاً")
            return
        }
        const base = {
            name,
            title_ar: titleAr || undefined,
            title_en: titleEn || undefined,
            topic: topic || undefined,
            content_ar: contentAr || undefined,
            content_en: contentEn || undefined,
            message_type: msgType,
            content: buildContent(),
        }
        if (isEdit) {
            updateMut.mutate({ fieldId: snippet.field_id, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        } else {
            createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
        }
    }

    const isPending = createMut.isPending || updateMut.isPending

    // accept attr per type
    const acceptMap: Partial<Record<SnippetMessageType, string>> = {
        image: ".png,.jpg,.jpeg,.gif",
        audio: ".mp3,.ogg,.wav",
        video: ".mp4",
        file: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv",
        document: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv",
    }

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {/* Name + Topic */}
            <div className="sn-grid-2">
                <div>
                    <label className="sn-label">الاسم *</label>
                    <input className="sn-field" value={name} onChange={e => setName(e.target.value)} placeholder="welcome_greeting" required />
                </div>
                <div>
                    <label className="sn-label">التصنيف</label>
                    <input className="sn-field" value={topic} onChange={e => setTopic(e.target.value)} placeholder="عام، دعم..." />
                </div>
            </div>

            {/* Bilingual titles */}
            <div className="sn-grid-2">
                <div>
                    <label className="sn-label">العنوان بالعربية</label>
                    <input className="sn-field" dir="rtl" value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="مرحباً" />
                </div>
                <div>
                    <label className="sn-label">العنوان بالإنجليزية</label>
                    <input className="sn-field" dir="ltr" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Hello" />
                </div>
            </div>

            {/* Type selector */}
            <div>
                <label className="sn-label">نوع الرسالة</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(Object.keys(TYPE_META) as SnippetMessageType[]).map(t => {
                        const m = TYPE_META[t]
                        const active = msgType === t
                        return (
                            <button key={t} type="button" onClick={() => setMsgType(t)} className="sn-type-btn"
                                style={{ border: `1.5px solid ${active ? m.color : "var(--t-border)"}`, background: active ? `${m.color}14` : "var(--t-surface)", color: active ? m.color : "var(--t-text-faint)" }}>
                                <m.icon size={11} /> {m.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            {isText ? (
                <>
                    <div>
                        <label className="sn-label">نص الرسالة *</label>
                        <textarea className="sn-field" rows={4} value={text} onChange={e => setText(e.target.value)}
                            placeholder="أهلاً وسهلاً..." style={{ resize: "vertical" }} required={!isEdit} />
                    </div>
                    <div className="sn-grid-2">
                        <div>
                            <label className="sn-label">بالعربية</label>
                            <textarea className="sn-field" rows={2} dir="rtl" value={contentAr} onChange={e => setContentAr(e.target.value)} placeholder="أهلاً..." style={{ resize: "vertical" }} />
                        </div>
                        <div>
                            <label className="sn-label">بالإنجليزية</label>
                            <textarea className="sn-field" rows={2} dir="ltr" value={contentEn} onChange={e => setContentEn(e.target.value)} placeholder="Welcome!" style={{ resize: "vertical" }} />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* File upload — URL handled internally */}
                    <div>
                        <label className="sn-label">الملف *</label>
                        <FileUploadField
                            tenantId={tenantId}
                            accept={acceptMap[msgType]}
                            uploaded={!!mediaUrl}
                            onUploaded={(u, fn) => { setMediaUrl(u); if (!filename) setFilename(fn) }} />
                    </div>

                    {/* Type-specific extras */}
                    {(msgType === "image" || msgType === "video") && (
                        <div>
                            <label className="sn-label">تعليق (Caption)</label>
                            <input className="sn-field" value={caption} onChange={e => setCaption(e.target.value)} placeholder="وصف..." />
                        </div>
                    )}
                    {msgType === "audio" && (
                        <div>
                            <label className="sn-label">النص المكتوب</label>
                            <textarea className="sn-field" rows={2} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="نص الصوت..." style={{ resize: "vertical" }} />
                        </div>
                    )}
                    {(msgType === "audio" || msgType === "video") && (
                        <div>
                            <label className="sn-label">المدة (ثانية)</label>
                            <input className="sn-field" type="number" min={0} dir="ltr" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" />
                        </div>
                    )}
                    {(msgType === "file" || msgType === "document") && (
                        <div>
                            <label className="sn-label">اسم الملف</label>
                            <input className="sn-field" dir="ltr" value={filename} onChange={e => setFilename(e.target.value)} placeholder="report.pdf" />
                        </div>
                    )}
                </>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" className="sn-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="sn-btn-primary" disabled={isPending}>
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {isEdit ? "حفظ التغييرات" : "إنشاء الـ Snippet"}
                </button>
            </div>
        </form>
    )
}

/* ─── Snippet Card ─── */
function SnippetCard({ s, onPreview, onEdit, onDelete }: {
    s: Snippet
    onPreview: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    const tm = TYPE_META[s.message_type] ?? TYPE_META.text
    const Icon = tm.icon
    const preview = s.content?.text || s.message || (s.content?.filename as string) || "—"
    const hasImage = s.message_type === "image" && s.content?.url

    return (
        <div className="sn-card" onClick={onPreview} style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative" }}>
            {/* Image thumbnail OR type icon */}
            {hasImage ? (
                <div style={{ width: 52, height: 52, borderRadius: 11, overflow: "hidden", flexShrink: 0, border: "1px solid var(--t-border-light)", background: "var(--t-surface)", position: "relative" }}>
                    <img src={s.content!.url as string} alt={s.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.target as HTMLImageElement).src = "" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Eye size={13} style={{ color: "#fff" }} />
                    </div>
                </div>
            ) : (
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${tm.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} style={{ color: tm.color }} />
                </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{s.name}</span>
                    {(s.title || s.title_ar) && (
                        <span style={{ fontSize: 11, color: "var(--t-text-faint)" }}>({s.title || s.title_ar})</span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${tm.color}14`, color: tm.color }}>{tm.label}</span>
                    {s.topic && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--t-surface)", color: "var(--t-text-faint)", border: "1px solid var(--t-border-light)" }}>{s.topic}</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {preview}
                </div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "var(--t-text-faint)", marginTop: 2, opacity: .5 }}>{s.field_id}</div>
            </div>

            {/* Actions — stop propagation so card click doesn't fire */}
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.UPDATE_SNIPPET}>
                    <button className="sn-btn-ghost" onClick={onEdit} style={{ padding: "5px 8px" }}>
                        <Pencil size={12} />
                    </button>
                </ActionGuard>
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.DELETE_SNIPPET}>
                    <button onClick={onDelete} style={{ display: "inline-flex", alignItems: "center", padding: "5px 8px", borderRadius: 9, border: "none", background: "rgba(239,68,68,.1)", color: "var(--t-danger)", cursor: "pointer" }}>
                        <Trash2 size={12} />
                    </button>
                </ActionGuard>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════
   Main Component
═══════════════════════════════════════ */
export function SnippetsTab() {
    const { user } = useAuthStore()
    const tid = user?.tenant_id ?? ""

    const [topicFilter, setTopicFilter] = useState<string | undefined>()
    const [search, setSearch] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [editSnippet, setEditSnippet] = useState<Snippet | undefined>()
    const [previewSnip, setPreviewSnip] = useState<Snippet | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Snippet | null>(null)

    const { data: snippets = [], isLoading } = useSnippets(tid, topicFilter)
    const deleteMut = useDeleteSnippet(tid)

    const topics = [...new Set(snippets.map((s: Snippet) => s.topic).filter(Boolean) as string[])]
    const filtered = snippets.filter((s: Snippet) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.topic ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (s.title ?? "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* ── Toolbar ── */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)", pointerEvents: "none" }} />
                    <input className="sn-field" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="بحث في الـ Snippets..." style={{ paddingRight: 36 }} />
                </div>
                {topics.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <button className="sn-btn-ghost" onClick={() => setTopicFilter(undefined)}
                            style={{ padding: "5px 12px", background: !topicFilter ? "var(--t-accent)" : undefined, color: !topicFilter ? "var(--t-text-on-accent)" : undefined, borderColor: !topicFilter ? "var(--t-accent)" : undefined, fontSize: 11 }}>
                            الكل
                        </button>
                        {topics.map(t => (
                            <button key={t} className="sn-btn-ghost" onClick={() => setTopicFilter(topicFilter === t ? undefined : t)}
                                style={{ padding: "5px 12px", background: topicFilter === t ? "var(--t-accent)" : undefined, color: topicFilter === t ? "var(--t-text-on-accent)" : undefined, borderColor: topicFilter === t ? "var(--t-accent)" : undefined, fontSize: 11 }}>
                                {t}
                            </button>
                        ))}
                    </div>
                )}
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.CREATE_SNIPPET}>
                    <button className="sn-btn-primary" onClick={() => { setEditSnippet(undefined); setShowForm(true) }}>
                        <Plus size={14} /> Snippet جديد
                    </button>
                </ActionGuard>
            </div>

            {/* Type summary chips */}
            {!isLoading && snippets.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {(Object.keys(TYPE_META) as SnippetMessageType[]).map(t => {
                        const count = snippets.filter((s: Snippet) => s.message_type === t).length
                        if (!count) return null
                        const { label, color } = TYPE_META[t]
                        return <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: `${color}14`, color }}>{label} ({count})</span>
                    })}
                </div>
            )}

            {/* ── Content ── */}
            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--t-text-faint)" }}>
                    <Loader2 size={18} className="animate-spin" /> جاري تحميل الـ Snippets...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <MessageSquare size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .2 }} />
                    <div style={{ fontSize: 14, color: "var(--t-text-faint)", fontWeight: 600, marginBottom: 16 }}>
                        {search || topicFilter ? "لا توجد نتائج" : "لا توجد Snippets بعد"}
                    </div>
                    {!search && !topicFilter && (
                        <button className="sn-btn-primary" onClick={() => { setEditSnippet(undefined); setShowForm(true) }}>
                            <Plus size={14} /> أضف أول Snippet
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {filtered.map((s: Snippet) => (
                        <SnippetCard
                            key={s.id ?? s.field_id}
                            s={s}
                            onPreview={() => setPreviewSnip(s)}
                            onEdit={() => { setEditSnippet(s); setShowForm(true) }}
                            onDelete={() => setDeleteTarget(s)}
                        />
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            {previewSnip && <PreviewModal s={previewSnip} onClose={() => setPreviewSnip(null)} />}

            {showForm && (
                <Modal title={editSnippet ? `تعديل: ${editSnippet.name}` : "إنشاء Snippet جديد"} onClose={() => setShowForm(false)}>
                    <SnippetForm snippet={editSnippet} tenantId={tid} onClose={() => setShowForm(false)} />
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={400} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "8px 0 8px" }}>
                        <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(239,68,68,.1)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>حذف «{deleteTarget.name}»؟</div>
                        <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 20 }}>لا يمكن التراجع عن هذا الإجراء</div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="sn-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button disabled={deleteMut.isPending}
                                onClick={() => deleteMut.mutate(deleteTarget.field_id, { onSuccess: r => { if (r.success) setDeleteTarget(null) } })}
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 9, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                {deleteMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
