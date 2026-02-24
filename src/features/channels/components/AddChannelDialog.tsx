import { useState } from "react"
import { X, Plus, Loader2, Eye, EyeOff, Bot } from "lucide-react"
import { useCreateChannel } from "../hooks/use-channels"
import { useAuthStore } from "@/stores/auth-store"
import { PLATFORM_META, PLATFORMS } from "../types"
import type { Platform, CreateChannelPayload } from "../types"
import { AgentMultiSelect } from "./AgentMultiSelect"

/* ──────────── CSS ──────────── */
const CSS = `
@keyframes dlgIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
.dlg-field { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; transition:border-color .15s; box-sizing:border-box; }
.dlg-field:focus { border-color:var(--t-accent); }
.dlg-field[dir=ltr],.dlg-field.mono { font-family:monospace; }
.dlg-label { font-size:10px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--t-text-faint); display:block; margin-bottom:5px; }
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
function PlatformPicker({ value, onChange }: { value: Platform; onChange: (p: Platform) => void }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 20 }}>
            {PLATFORMS.map(p => {
                const m = PLATFORM_META[p]
                const active = value === p
                return (
                    <button key={p} type="button" onClick={() => onChange(p)} style={{
                        padding: "12px 6px", borderRadius: 11, border: `2px solid ${active ? m.color : "var(--t-border)"}`,
                        background: active ? `${m.color}14` : "var(--t-surface)",
                        cursor: "pointer", textAlign: "center", transition: "all .15s",
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? m.color : "var(--t-text-faint)" }}>{m.labelAr}</div>
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
                width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)",
            }}>
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
                <button type="button" onClick={add} style={{ padding: "0 14px", borderRadius: 9, border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    <Plus size={14} />
                </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {origins.map((o, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: "var(--t-surface)", border: "1px solid var(--t-border-light)", fontSize: 11, fontFamily: "monospace", color: "var(--t-text-muted)" }}>
                        {o}
                        <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-danger)", display: "flex", padding: 0, lineHeight: 1 }}>
                            <X size={10} />
                        </button>
                    </span>
                ))}
            </div>
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

    const [platform, setPlatform] = useState<Platform>(defaultPlatform || "whatsapp")
    const [form, setForm] = useState<FormState>(EMPTY)

    /* Generic string field setter */
    const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const payload = buildPayload(platform, form)
        createMut.mutate({ platform, payload }, { onSuccess: r => { if (r.success) onClose() } })
    }

    /* ── Shared inline field renderers (no sub-component → no focus loss) ── */
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

    /* ── Platform-specific fields ── */
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
                {textField("App ID *", "app_id", "my_app_v1")}
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                    {textField("أيقونة الويدجت (اختياري)", "icon", "https://cdn.example.com/icon.png")}
                    <div>
                        <FieldLabel>لون الويدجت</FieldLabel>
                        <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
                            style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", padding: 2, cursor: "pointer", background: "var(--t-surface)" }} />
                    </div>
                </div>
                {textField("الاسم (اختياري)", "name", "Site Chat", "rtl")}
            </div>
        )
        return null
    }

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{CSS}</style>
            <div onClick={e => e.stopPropagation()} style={{ borderRadius: 18, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: 540, margin: 16, maxHeight: "90vh", display: "flex", flexDirection: "column", animation: "dlgIn .18s ease-out" }} dir="rtl">
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid var(--t-border-light)" }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>إضافة قناة جديدة</div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>اختر المنصة وأدخل بيانات الاتصال</div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {/* Platform picker */}
                    <FieldLabel>المنصة</FieldLabel>
                    <PlatformPicker value={platform} onChange={p => { setPlatform(p); setForm(EMPTY) }} />

                    {/* Platform fields */}
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
                        <button type="button" onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, border: "1.5px solid var(--t-border)", background: "transparent", color: "var(--t-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            إلغاء
                        </button>
                        <button type="submit" disabled={createMut.isPending} style={{
                            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 9,
                            border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: createMut.isPending ? 0.7 : 1,
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
    /* webchat — no site_id */     return { ...base, allowed_origins: origins, icon: form.icon || undefined, color: form.color || undefined }
}
