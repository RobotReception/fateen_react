import { useState, useRef } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useSnippets, useCreateSnippet, useUpdateSnippet, useDeleteSnippet } from "../hooks/use-snippets"
import { useMutation } from "@tanstack/react-query"
import { uploadMedia } from "../services/snippets-service"
import type { Snippet, SnippetMessageType, SnippetContent } from "../types/teams-tags"
import {
    Plus, Trash2, Pencil, MessageSquare, X, Loader2, Search, Check,
    FileText, Image, Mic, Video, File, BookOpen, Upload, AlertTriangle,
    Eye, Play, Download,
} from "lucide-react"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"
import { toast } from "sonner"

const CSS = `
@keyframes snIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes snFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}

.sn-card{border-radius:12px;border:1px solid #ebeef2;background:#fff;padding:12px 14px;transition:all .15s;cursor:pointer}
.sn-card:hover{border-color:#004786;box-shadow:0 4px 16px rgba(0,71,134,.06)}
.sn-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid #ebeef2;background:#fafbfc;font-size:12px;color:#111827;outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit}
.sn-field:focus{border-color:#004786;box-shadow:0 0 0 3px rgba(0,71,134,.06);background:#fff}
.sn-field::placeholder{color:#b0b7c3}
.sn-label{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:4px}
.sn-btn-primary{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#004786,#0072b5);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .12s;font-family:inherit;box-shadow:0 2px 8px rgba(0,71,134,.15)}
.sn-btn-primary:hover:not(:disabled){opacity:.9;box-shadow:0 4px 12px rgba(0,71,134,.2)}
.sn-btn-primary:disabled{opacity:.5;cursor:not-allowed}
.sn-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1.5px solid #ebeef2;background:#fff;color:#111827;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;font-family:inherit}
.sn-btn-ghost:hover{border-color:#004786;color:#004786}
.sn-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sn-type-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:7px;font-size:10.5px;font-weight:700;cursor:pointer;transition:all .15s}
`

const TYPE_META: Record<SnippetMessageType, { icon: React.ElementType; label: string; color: string }> = {
    text: { icon: FileText, label: "نص", color: "#6366f1" },
    image: { icon: Image, label: "صورة", color: "#10b981" },
    audio: { icon: Mic, label: "صوت", color: "#f59e0b" },
    video: { icon: Video, label: "فيديو", color: "#ef4444" },
    file: { icon: File, label: "ملف", color: "#8b5cf6" },
    document: { icon: BookOpen, label: "مستند", color: "#3b82f6" },
}

function Modal({ title, width = 560, onClose, children }: { title: string; width?: number; onClose: () => void; children: React.ReactNode }) {
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{ borderRadius: 16, background: "#fff", border: "1px solid #ebeef2", width: "100%", maxWidth: width, margin: 16, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "snIn .15s ease-out", boxShadow: "0 20px 60px rgba(0,0,0,.12)" }}>
                <div style={{ height: 3, background: "linear-gradient(90deg, #004786, #0072b5)", borderRadius: "16px 16px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0f1f3", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0072b5)", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={12} style={{ color: "#fff" }} /></div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{title}</span>
                    </div>
                    <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, background: "#f5f6f8", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#ebeef2" }} onMouseLeave={e => { e.currentTarget.style.background = "#f5f6f8" }}><X size={12} /></button>
                </div>
                <div style={{ padding: "14px 16px", overflowY: "auto", flex: 1 }}>{children}</div>
            </div>
        </div>
    )
}

function PreviewModal({ s, onClose }: { s: Snippet; onClose: () => void }) {
    const tm = TYPE_META[s.message_type] ?? TYPE_META.text
    const url = s.content?.url as string | undefined
    return (
        <Modal title={s.name} width={640} onClose={onClose}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tm.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${tm.color}18` }}><tm.icon size={16} style={{ color: tm.color }} /></div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.title || s.title_ar || s.name}</div>
                        {(s.title_ar || s.title_en) && <div style={{ fontSize: 10, color: "#b0b7c3" }}>{[s.title_ar, s.title_en].filter(Boolean).join(" · ")}</div>}
                        <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: `${tm.color}10`, color: tm.color }}>{tm.label}</span>
                            {s.topic && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "#f5f6f8", color: "#9ca3af", border: "1px solid #ebeef2" }}>{s.topic}</span>}
                        </div>
                    </div>
                </div>

                {s.message_type === "text" && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fafbfc", border: "1px solid #ebeef2", fontSize: 13, lineHeight: 1.8, color: "#111827", whiteSpace: "pre-wrap", direction: "rtl" }}>{s.content?.text || s.message || "—"}</div>}
                {s.message_type === "image" && url && (
                    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebeef2", background: "#fafbfc", textAlign: "center" }}>
                        <img src={url} alt={s.name} style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", display: "block", margin: "0 auto" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        {s.content?.caption && <div style={{ padding: "7px 14px", fontSize: 11, color: "#9ca3af" }}>{s.content.caption as string}</div>}
                    </div>
                )}
                {s.message_type === "audio" && url && (
                    <div style={{ padding: 14, borderRadius: 10, background: "#fafbfc", border: "1px solid #ebeef2" }}>
                        <audio controls src={url} style={{ width: "100%" }} />
                        {s.content?.transcript && <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#fff", border: "1px solid #ebeef2", fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }}><span style={{ fontSize: 9, fontWeight: 800, display: "block", marginBottom: 3, textTransform: "uppercase" }}>النص المكتوب</span>{s.content.transcript as string}</div>}
                    </div>
                )}
                {s.message_type === "video" && url && (
                    <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #ebeef2", background: "#000" }}>
                        <video controls src={url} style={{ width: "100%", maxHeight: 320, display: "block" }} />
                        {s.content?.caption && <div style={{ padding: "6px 14px", fontSize: 11, color: "#9ca3af", background: "#fafbfc" }}>{s.content.caption as string}</div>}
                    </div>
                )}
                {(s.message_type === "file" || s.message_type === "document") && url && (
                    <div style={{ padding: "14px 16px", borderRadius: 10, background: "#fafbfc", border: "1px solid #ebeef2", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${tm.color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}><tm.icon size={20} style={{ color: tm.color }} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, color: "#111827", wordBreak: "break-all" }}>{s.content?.filename as string || s.name}</div><div style={{ fontSize: 10, color: "#b0b7c3", marginTop: 2, wordBreak: "break-all", direction: "ltr" }}>{url}</div></div>
                        <a href={url} target="_blank" rel="noreferrer" className="sn-btn-primary" style={{ textDecoration: "none", flexShrink: 0 }}><Play size={11} /> فتح</a>
                    </div>
                )}
                {(s.content_ar || s.content_en) && <div className="sn-grid-2">{s.content_ar && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fafbfc", border: "1px solid #ebeef2", fontSize: 11, color: "#9ca3af", direction: "rtl" }}><span style={{ fontSize: 9, fontWeight: 800, display: "block", marginBottom: 3, textTransform: "uppercase" }}>العربية</span>{s.content_ar}</div>}{s.content_en && <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fafbfc", border: "1px solid #ebeef2", fontSize: 11, color: "#9ca3af", direction: "ltr" }}><span style={{ fontSize: 9, fontWeight: 800, display: "block", marginBottom: 3, textTransform: "uppercase" }}>English</span>{s.content_en}</div>}</div>}
                <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#b0b7c3", padding: "6px 0", borderTop: "1px solid #f0f1f3", alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", flex: 1 }}>{s.field_id}</span>
                    {s.created_by && <span>· {s.created_by}</span>}
                    {s.created_at && <span>· {new Date(s.created_at).toLocaleDateString("ar-SA", { timeZone: "Asia/Aden" })}</span>}
                    {url && <a href={url} download={s.content?.filename as string || s.name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1.5px solid #ebeef2", background: "#fff", color: "#111827", textDecoration: "none", fontSize: 10, fontWeight: 700 }} onClick={e => e.stopPropagation()}><Download size={10} /> تنزيل</a>}
                </div>
            </div>
        </Modal>
    )
}

function FileUploadField({ onUploaded, tenantId, accept, uploaded }: { onUploaded: (url: string, filename: string) => void; tenantId: string; accept?: string; uploaded: boolean }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const uploadMut = useMutation({ mutationFn: (file: File) => uploadMedia(file, tenantId, { context: "snippet" }), onSuccess: r => { if (r.success && r.data) { onUploaded(r.data.public_url, r.data.filename); toast.success("تم رفع الملف") } else toast.error(r.message) }, onError: () => toast.error("فشل رفع الملف") })
    return (
        <div>
            <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadMut.mutate(f) }} />
            <button type="button" onClick={() => inputRef.current?.click()} className="sn-btn-ghost"
                style={{ width: "100%", justifyContent: "center", padding: "12px 0", border: `1.5px dashed ${uploaded ? "#16a34a" : "#ebeef2"}`, background: uploaded ? "rgba(22,163,74,.04)" : undefined }}>
                {uploadMut.isPending ? <><Loader2 size={13} className="animate-spin" /> جاري الرفع...</> : uploaded ? <><Check size={13} style={{ color: "#16a34a" }} /> <span style={{ color: "#16a34a" }}>تم الرفع — انقر لاستبدال</span></> : <><Upload size={13} /> رفع ملف (حتى 100 MB)</>}
            </button>
        </div>
    )
}

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
            case "file": case "document": return { url: mediaUrl, filename: filename || undefined }
        }
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isMedia && !mediaUrl && !isEdit) { toast.error("الرجاء رفع الملف أولاً"); return }
        const base = { name, title_ar: titleAr || undefined, title_en: titleEn || undefined, topic: topic || undefined, content_ar: contentAr || undefined, content_en: contentEn || undefined, message_type: msgType, content: buildContent() }
        if (isEdit) updateMut.mutate({ fieldId: snippet.field_id, payload: base }, { onSuccess: r => { if (r.success) onClose() } })
        else createMut.mutate(base, { onSuccess: r => { if (r.success) onClose() } })
    }

    const isPending = createMut.isPending || updateMut.isPending
    const acceptMap: Partial<Record<SnippetMessageType, string>> = { image: ".png,.jpg,.jpeg,.gif", audio: ".mp3,.ogg,.wav", video: ".mp4", file: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv", document: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv" }

    return (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="sn-grid-2">
                <div><label className="sn-label">الاسم *</label><input className="sn-field" value={name} onChange={e => setName(e.target.value)} placeholder="welcome_greeting" required /></div>
                <div><label className="sn-label">التصنيف</label><input className="sn-field" value={topic} onChange={e => setTopic(e.target.value)} placeholder="عام، دعم..." /></div>
            </div>
            <div className="sn-grid-2">
                <div><label className="sn-label">العنوان بالعربية</label><input className="sn-field" dir="rtl" value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="مرحباً" /></div>
                <div><label className="sn-label">العنوان بالإنجليزية</label><input className="sn-field" dir="ltr" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Hello" /></div>
            </div>
            <div>
                <label className="sn-label">نوع الرسالة</label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {(Object.keys(TYPE_META) as SnippetMessageType[]).map(t => {
                        const m = TYPE_META[t]; const active = msgType === t
                        return <button key={t} type="button" onClick={() => setMsgType(t)} className="sn-type-btn" style={{ border: `1.5px solid ${active ? m.color : "#ebeef2"}`, background: active ? `${m.color}10` : "#fafbfc", color: active ? m.color : "#9ca3af" }}><m.icon size={10} /> {m.label}</button>
                    })}
                </div>
            </div>
            {isText ? (
                <>
                    <div><label className="sn-label">نص الرسالة *</label><textarea className="sn-field" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="أهلاً وسهلاً..." style={{ resize: "vertical" }} required={!isEdit} /></div>
                    <div className="sn-grid-2">
                        <div><label className="sn-label">بالعربية</label><textarea className="sn-field" rows={2} dir="rtl" value={contentAr} onChange={e => setContentAr(e.target.value)} placeholder="أهلاً..." style={{ resize: "vertical" }} /></div>
                        <div><label className="sn-label">بالإنجليزية</label><textarea className="sn-field" rows={2} dir="ltr" value={contentEn} onChange={e => setContentEn(e.target.value)} placeholder="Welcome!" style={{ resize: "vertical" }} /></div>
                    </div>
                </>
            ) : (
                <>
                    <div><label className="sn-label">الملف *</label><FileUploadField tenantId={tenantId} accept={acceptMap[msgType]} uploaded={!!mediaUrl} onUploaded={(u, fn) => { setMediaUrl(u); if (!filename) setFilename(fn) }} /></div>
                    {(msgType === "image" || msgType === "video") && <div><label className="sn-label">تعليق (Caption)</label><input className="sn-field" value={caption} onChange={e => setCaption(e.target.value)} placeholder="وصف..." /></div>}
                    {msgType === "audio" && <div><label className="sn-label">النص المكتوب</label><textarea className="sn-field" rows={2} value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="نص الصوت..." style={{ resize: "vertical" }} /></div>}
                    {(msgType === "audio" || msgType === "video") && <div><label className="sn-label">المدة (ثانية)</label><input className="sn-field" type="number" min={0} dir="ltr" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" /></div>}
                    {(msgType === "file" || msgType === "document") && <div><label className="sn-label">اسم الملف</label><input className="sn-field" dir="ltr" value={filename} onChange={e => setFilename(e.target.value)} placeholder="report.pdf" /></div>}
                </>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 8, borderTop: "1px solid #f0f1f3" }}>
                <button type="button" className="sn-btn-ghost" onClick={onClose}>إلغاء</button>
                <button type="submit" className="sn-btn-primary" disabled={isPending}>{isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {isEdit ? "حفظ التغييرات" : "إنشاء الـ Snippet"}</button>
            </div>
        </form>
    )
}

function SnippetCard({ s, onPreview, onEdit, onDelete }: { s: Snippet; onPreview: () => void; onEdit: () => void; onDelete: () => void }) {
    const tm = TYPE_META[s.message_type] ?? TYPE_META.text
    const Icon = tm.icon
    const preview = s.content?.text || s.message || (s.content?.filename as string) || "—"
    const hasImage = s.message_type === "image" && s.content?.url
    return (
        <div className="sn-card" onClick={onPreview} style={{ display: "flex", alignItems: "flex-start", gap: 10, position: "relative", animation: "snFade .2s ease-out" }}>
            {hasImage ? (
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid #ebeef2", background: "#fafbfc", position: "relative" }}>
                    <img src={s.content!.url as string} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><Eye size={12} style={{ color: "#fff" }} /></div>
                </div>
            ) : (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tm.color}08`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${tm.color}15` }}>
                    <Icon size={16} style={{ color: tm.color }} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{s.name}</span>
                    {(s.title || s.title_ar) && <span style={{ fontSize: 10, color: "#b0b7c3" }}>({s.title || s.title_ar})</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: `${tm.color}10`, color: tm.color }}>{tm.label}</span>
                    {s.topic && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "#f5f6f8", color: "#9ca3af", border: "1px solid #ebeef2" }}>{s.topic}</span>}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "#d1d5db", marginTop: 2 }}>{s.field_id}</div>
            </div>
            <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.UPDATE_SNIPPET}>
                    <button className="sn-btn-ghost" onClick={onEdit} style={{ padding: "5px 7px" }}><Pencil size={11} /></button>
                </ActionGuard>
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.DELETE_SNIPPET}>
                    <button onClick={onDelete} style={{ display: "inline-flex", alignItems: "center", padding: "5px 7px", borderRadius: 7, border: "1px solid rgba(239,68,68,.15)", background: "rgba(239,68,68,.04)", color: "#ef4444", cursor: "pointer" }}><Trash2 size={11} /></button>
                </ActionGuard>
            </div>
        </div>
    )
}

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
    const filtered = snippets.filter((s: Snippet) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.topic ?? "").toLowerCase().includes(search.toLowerCase()) || (s.title ?? "").toLowerCase().includes(search.toLowerCase()))

    return (
        <div style={{ direction: "rtl" }}>
            <style>{CSS}</style>

            {/* Status strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#fafbfc", border: "1px solid #ebeef2" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #004786, #0072b5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MessageSquare size={12} style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>قوالب رسائل جاهزة يمكن استخدامها بسرعة أثناء المحادثات مع العملاء.</span>
                <div style={{ textAlign: "center", flexShrink: 0 }}><div style={{ fontSize: 16, fontWeight: 800, color: "#004786" }}>{snippets.length}</div><div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>قالب</div></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                    <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#b0b7c3", pointerEvents: "none" }} />
                    <input className="sn-field" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القوالب..." style={{ paddingRight: 32, fontSize: 11 }} />
                </div>
                {topics.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button className="sn-btn-ghost" onClick={() => setTopicFilter(undefined)} style={{ padding: "4px 10px", background: !topicFilter ? "linear-gradient(135deg,#004786,#0072b5)" : undefined, color: !topicFilter ? "#fff" : undefined, borderColor: !topicFilter ? "#004786" : undefined, fontSize: 10 }}>الكل</button>
                        {topics.map(t => <button key={t} className="sn-btn-ghost" onClick={() => setTopicFilter(topicFilter === t ? undefined : t)} style={{ padding: "4px 10px", background: topicFilter === t ? "linear-gradient(135deg,#004786,#0072b5)" : undefined, color: topicFilter === t ? "#fff" : undefined, borderColor: topicFilter === t ? "#004786" : undefined, fontSize: 10 }}>{t}</button>)}
                    </div>
                )}
                <ActionGuard pageBit={PAGE_BITS.SNIPPETS} actionBit={ACTION_BITS.CREATE_SNIPPET}>
                    <button className="sn-btn-primary" onClick={() => { setEditSnippet(undefined); setShowForm(true) }}><Plus size={13} /> Snippet جديد</button>
                </ActionGuard>
            </div>

            {!isLoading && snippets.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                    {(Object.keys(TYPE_META) as SnippetMessageType[]).map(t => {
                        const count = snippets.filter((s: Snippet) => s.message_type === t).length
                        if (!count) return null
                        const { label, color } = TYPE_META[t]
                        return <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: `${color}08`, color, border: `1px solid ${color}15` }}>{label} ({count})</span>
                    })}
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#9ca3af", fontSize: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2.5px solid #ebeef2", borderTopColor: "#004786", animation: "spin .7s linear infinite" }} /> جاري التحميل...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f5f6f8", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={22} style={{ color: "#d1d5db" }} /></div>
                    <div style={{ fontSize: 14, color: "#111827", fontWeight: 700, marginBottom: 3 }}>{search || topicFilter ? "لا توجد نتائج" : "لا توجد قوالب بعد"}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>{search ? "حاول تغيير كلمات البحث" : "أنشئ قوالب رسائل لاستخدامها أثناء المحادثات"}</div>
                    {!search && !topicFilter && <button className="sn-btn-primary" onClick={() => { setEditSnippet(undefined); setShowForm(true) }}><Plus size={13} /> أضف أول قالب</button>}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filtered.map((s: Snippet) => <SnippetCard key={s.id ?? s.field_id} s={s} onPreview={() => setPreviewSnip(s)} onEdit={() => { setEditSnippet(s); setShowForm(true) }} onDelete={() => setDeleteTarget(s)} />)}
                </div>
            )}

            {previewSnip && <PreviewModal s={previewSnip} onClose={() => setPreviewSnip(null)} />}
            {showForm && <Modal title={editSnippet ? `تعديل: ${editSnippet.name}` : "إنشاء Snippet جديد"} onClose={() => setShowForm(false)}><SnippetForm snippet={editSnippet} tenantId={tid} onClose={() => setShowForm(false)} /></Modal>}
            {deleteTarget && (
                <Modal title="تأكيد الحذف" width={400} onClose={() => setDeleteTarget(null)}>
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,.06)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}><AlertTriangle size={22} style={{ color: "#ef4444" }} /></div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>حذف «{deleteTarget.name}»؟</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>لا يمكن التراجع عن هذا الإجراء</div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button className="sn-btn-ghost" onClick={() => setDeleteTarget(null)}>إلغاء</button>
                            <button disabled={deleteMut.isPending} onClick={() => deleteMut.mutate(deleteTarget.field_id, { onSuccess: r => { if (r.success) setDeleteTarget(null) } })}
                                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 18px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(239,68,68,.2)" }}>
                                {deleteMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}
