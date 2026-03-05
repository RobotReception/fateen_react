import { useState, useRef, useCallback } from "react"
import { X, Plus, Loader2, Eye, EyeOff, Bot, ImageIcon, Trash2 } from "lucide-react"
import { useCreateChannel, usePlatformsStatus } from "../hooks/use-channels"
import { useAuthStore } from "@/stores/auth-store"
import { PLATFORM_META, PLATFORMS } from "../types"
import type { Platform, CreateChannelPayload } from "../types"
import { AgentMultiSelect } from "./AgentMultiSelect"
import { uploadMedia } from "@/features/inbox/services/inbox-service"
import { toast } from "sonner"

/* ──────────── CSS ──────────── */
const CSS = `
@keyframes dlgIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.dlg-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid #e0e3e7; background:#fafafa; font-size:13px; color:var(--t-text,#111827); outline:none; transition:border-color .15s,box-shadow .15s; box-sizing:border-box; font-family:inherit; }
.dlg-field:focus { border-color:#004786; box-shadow:0 0 0 3px rgba(0,71,134,.06); }
.dlg-field[dir=ltr],.dlg-field.mono { font-family:monospace; }
.dlg-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:#6b7280; display:block; margin-bottom:5px; }
`

interface FormState {
    name: string
    phone_number_id: string; waba_id: string
    page_id: string; ig_account_id: string
    access_token: string; META_APP_SECRET: string
    app_id: string
    icon: string; color: string
    allowed_origins: string
    agent_ids: string[]
}

const EMPTY: FormState = {
    name: "", phone_number_id: "", waba_id: "", page_id: "", ig_account_id: "",
    access_token: "", META_APP_SECRET: "", app_id: "",
    icon: "", color: "#4A90E2", allowed_origins: "", agent_ids: [],
}

/* ── Platform picker ── */
function PlatformPicker({ value, onChange, platforms }: { value: Platform; onChange: (p: Platform) => void; platforms: Platform[] }) {
    const cols = Math.min(platforms.length, 5)
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8, marginBottom: 20 }}>
            {platforms.map(p => {
                const m = PLATFORM_META[p]
                const active = value === p
                return (
                    <button key={p} type="button" onClick={() => onChange(p)} style={{
                        padding: "12px 6px", borderRadius: 11, border: `2px solid ${active ? m.color : "#eaedf0"}`,
                        background: active ? `${m.color}0d` : "#fafafa",
                        cursor: "pointer", textAlign: "center", transition: "all .15s",
                        fontFamily: "inherit",
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 9, margin: "0 auto 4px",
                            background: active ? `linear-gradient(135deg, ${m.color}, ${m.color}cc)` : "#e8ebef",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 15, filter: active ? "none" : "grayscale(.3)",
                            boxShadow: active ? `0 2px 6px ${m.color}30` : "none", transition: "all .15s",
                        }}>{m.icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? m.color : "#9ca3af" }}>{m.labelAr}</div>
                    </button>
                )
            })}
        </div>
    )
}

/* ── Secret input ── */
function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [show, setShow] = useState(false)
    return (
        <div style={{ display: "flex", gap: 6 }}>
            <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} dir="ltr" className="dlg-field mono" style={{ flex: 1 }} />
            <button type="button" onClick={() => setShow(!show)} style={{
                width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e0e3e7", flexShrink: 0,
                background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#9ca3af", transition: "all .12s",
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e3e7"; e.currentTarget.style.color = "#9ca3af" }}
            >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    )
}

/* ── Origins editor ── */
function OriginsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [input, setInput] = useState("")
    const origins = value ? value.split(",").filter(Boolean) : []
    const add = () => {
        if (!input.trim()) return
        onChange([...origins, input.trim()].join(","))
        setInput("")
    }
    const remove = (i: number) => onChange(origins.filter((_, idx) => idx !== i).join(","))
    return (
        <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://example.com"
                    dir="ltr" className="dlg-field mono" style={{ flex: 1 }}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} />
                <button type="button" onClick={add} style={{
                    padding: "0 14px", borderRadius: 9, border: "none",
                    background: "#004786", color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                }}>
                    <Plus size={14} />
                </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {origins.map((o, i) => (
                    <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20,
                        background: "rgba(0,71,134,.04)", border: "1px solid rgba(0,71,134,.1)",
                        fontSize: 11, fontFamily: "monospace", color: "#004786",
                    }}>
                        {o}
                        <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", display: "flex", padding: 0, lineHeight: 1 }}>
                            <X size={10} />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ═══ Icon Upload ═══ */
function IconUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string>(value || "")

    const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة"); return }
        if (file.size > 5 * 1024 * 1024) { toast.error("الحد الأقصى 5MB"); return }

        // Show local preview immediately
        const localUrl = URL.createObjectURL(file)
        setPreview(localUrl)
        setUploading(true)

        try {
            const res = await uploadMedia(file, { platform: "webchat", source: "channel_icon" })
            const url = res.public_url || res.proxy_url
            onChange(url)
            setPreview(url)
            toast.success("تم رفع الأيقونة بنجاح")
        } catch {
            toast.error("فشل رفع الأيقونة")
            setPreview("")
            onChange("")
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }, [onChange])

    const remove = useCallback(() => {
        onChange("")
        setPreview("")
        if (fileRef.current) fileRef.current.value = ""
    }, [onChange])

    return (
        <div>
            <FieldLabel>أيقونة الويدجت (اختياري)</FieldLabel>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            {preview ? (
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 10px", borderRadius: 9, border: "1.5px solid #e0e3e7", background: "#fafafa",
                }}>
                    <img src={preview} alt="icon" style={{
                        width: 32, height: 32, borderRadius: 7, objectFit: "cover",
                        border: "1px solid #e0e3e7",
                    }} />
                    <span style={{ flex: 1, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
                        {uploading ? "جاري الرفع..." : value || "uploaded"}
                    </span>
                    {uploading ? (
                        <Loader2 size={14} style={{ color: "#004786", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    ) : (
                        <button type="button" onClick={remove} style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 26, height: 26, borderRadius: 6, border: "none",
                            background: "rgba(220,38,38,0.06)", cursor: "pointer", color: "#dc2626",
                            flexShrink: 0, transition: "all .12s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.12)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)" }}
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "10px 12px", borderRadius: 9,
                    border: "1.5px dashed #d1d5db", background: "#fafafa",
                    cursor: "pointer", transition: "all .15s", color: "#9ca3af",
                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af" }}
                >
                    <ImageIcon size={16} />
                    اختر صورة الأيقونة
                </button>
            )}
        </div>
    )
}

/* ═══ Field label wrapper ═══ */
function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="dlg-label">{children}</label>
}

/* ══════════ MAIN EXPORT ══════════ */
export function AddChannelDialog({ defaultPlatform, onClose }: { defaultPlatform?: Platform; onClose: () => void }) {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""
    const createMut = useCreateChannel(tenantId)
    const { data: platStatusRes } = usePlatformsStatus(tenantId)

    // Only show enabled platforms
    const enabledPlatforms = PLATFORMS.filter(p => platStatusRes?.data?.platforms?.[p] ?? false)
    const availablePlatforms = enabledPlatforms.length > 0 ? enabledPlatforms : PLATFORMS

    const [platform, setPlatform] = useState<Platform>(defaultPlatform || availablePlatforms[0] || "whatsapp")
    const [form, setForm] = useState<FormState>(EMPTY)

    const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = buildPayload(platform, form)
        createMut.mutate({ platform, payload }, { onSuccess: r => { if (r.success) onClose() } })
    }

    const textField = (label: string, key: keyof FormState, placeholder?: string, dir: "ltr" | "rtl" = "ltr") => (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <input className="dlg-field" dir={dir} value={form[key] as string}
                onChange={e => set(key, e.target.value)} placeholder={placeholder} />
        </div>
    )

    const secretField = (label: string, key: keyof FormState, placeholder?: string) => (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <SecretInput value={form[key] as string} onChange={v => set(key, v)} placeholder={placeholder} />
        </div>
    )

    const renderFields = () => {
        if (platform === "whatsapp") return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {textField("Phone Number ID *", "phone_number_id", "632301183293582")}
                    {textField("WABA ID *", "waba_id", "104261489012345")}
                </div>
                {secretField("Access Token *", "access_token", "EAABwz...")}
                {secretField("META App Secret *", "META_APP_SECRET", "abc123secret")}
                {textField("الاسم (اختياري)", "name", "Support Bot", "rtl")}
            </div>
        )
        if (platform === "facebook") return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {textField("Page ID *", "page_id", "123456789")}
                {secretField("Access Token *", "access_token", "EAABwz...")}
                {secretField("META App Secret *", "META_APP_SECRET", "abc123secret")}
                {textField("الاسم (اختياري)", "name", "My Page", "rtl")}
            </div>
        )
        if (platform === "instagram") return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {textField("Page ID *", "page_id", "123456789")}
                    {textField("IG Account ID *", "ig_account_id", "987654321")}
                </div>
                {secretField("Access Token *", "access_token", "EAABwz...")}
                {secretField("META App Secret *", "META_APP_SECRET", "abc123secret")}
                {textField("الاسم (اختياري)", "name", "My IG", "rtl")}
            </div>
        )
        if (platform === "appchat") return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                    <FieldLabel>النطاقات المسموحة (Allowed Origins) *</FieldLabel>
                    <OriginsEditor value={form.allowed_origins} onChange={v => set("allowed_origins", v)} />
                </div>
                {textField("الاسم (اختياري)", "name", "Mobile Chat", "rtl")}
            </div>
        )
        if (platform === "webchat") return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                    <FieldLabel>النطاقات المسموحة (Allowed Origins) *</FieldLabel>
                    <OriginsEditor value={form.allowed_origins} onChange={v => set("allowed_origins", v)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                    <IconUpload value={form.icon} onChange={v => set("icon", v)} />
                    <div>
                        <FieldLabel>لون الويدجت</FieldLabel>
                        <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
                            style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid #e0e3e7", padding: 2, cursor: "pointer", background: "#fafafa" }} />
                    </div>
                </div>
                {textField("الاسم (اختياري)", "name", "Site Chat", "rtl")}
            </div>
        )
        return null
    }

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{CSS}</style>
            <div onClick={e => e.stopPropagation()} style={{
                borderRadius: 18, background: "#fff", overflow: "hidden",
                width: "100%", maxWidth: 540, margin: 16, maxHeight: "90vh",
                display: "flex", flexDirection: "column", animation: "dlgIn .18s ease-out",
                boxShadow: "0 12px 40px rgba(0,0,0,.12)",
            }} dir="rtl">
                {/* Gradient Header */}
                <div style={{
                    background: "linear-gradient(135deg, #004786, #0072b5)",
                    padding: "18px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>إضافة قناة جديدة</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginTop: 2 }}>اختر المنصة وأدخل بيانات الاتصال</div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "rgba(255,255,255,.12)", border: "none", cursor: "pointer",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .12s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.25)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)" }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {defaultPlatform ? (
                        /* Show selected platform badge only */
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 12px", borderRadius: 9, background: `${PLATFORM_META[platform].color}08`, border: `1px solid ${PLATFORM_META[platform].color}18` }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: `linear-gradient(135deg, ${PLATFORM_META[platform].color}, ${PLATFORM_META[platform].color}cc)`,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                boxShadow: `0 1px 4px ${PLATFORM_META[platform].color}25`,
                            }}>{PLATFORM_META[platform].icon}</div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#111827" }}>{PLATFORM_META[platform].labelAr}</div>
                                <div style={{ fontSize: 9.5, color: "#9ca3af" }}>{PLATFORM_META[platform].label}</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <FieldLabel>المنصة</FieldLabel>
                            <PlatformPicker value={platform} onChange={p => { setPlatform(p); setForm(EMPTY) }} platforms={availablePlatforms} />
                        </>
                    )}

                    {renderFields()}

                    {/* Agents */}
                    <div style={{ marginTop: 12 }}>
                        <label className="dlg-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <Bot size={11} /> الوكلاء (اختياري)
                        </label>
                        <AgentMultiSelect
                            value={form.agent_ids}
                            onChange={ids => setForm(f => ({ ...f, agent_ids: ids }))}
                        />
                    </div>

                    {/* Submit */}
                    <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{
                            padding: "9px 18px", borderRadius: 9, border: "1.5px solid #e0e3e7",
                            background: "transparent", color: "var(--t-text, #374151)", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                        }}>
                            إلغاء
                        </button>
                        <button type="submit" disabled={createMut.isPending} style={{
                            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9,
                            border: "none", background: "#004786", color: "#fff",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: createMut.isPending ? 0.7 : 1,
                            fontFamily: "inherit", boxShadow: "0 1px 3px rgba(0,71,134,.15)",
                        }}>
                            {createMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            إنشاء القناة
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ── Build API payload ── */
function buildPayload(platform: Platform, form: FormState): CreateChannelPayload {
    const agents = form.agent_ids
    const origins = form.allowed_origins.split(",").map(s => s.trim()).filter(Boolean)
    const base = { name: form.name || undefined, agent_ids: agents.length ? agents : undefined }

    if (platform === "whatsapp") return { ...base, phone_number_id: form.phone_number_id, waba_id: form.waba_id, access_token: form.access_token, META_APP_SECRET: form.META_APP_SECRET }
    if (platform === "facebook") return { ...base, page_id: form.page_id, access_token: form.access_token, META_APP_SECRET: form.META_APP_SECRET }
    if (platform === "instagram") return { ...base, page_id: form.page_id, ig_account_id: form.ig_account_id, access_token: form.access_token, META_APP_SECRET: form.META_APP_SECRET }
    if (platform === "appchat") return { ...base, app_id: form.app_id, allowed_origins: origins }
    /* webchat */     return { ...base, allowed_origins: origins, icon: form.icon || undefined, color: form.color || undefined }
}
