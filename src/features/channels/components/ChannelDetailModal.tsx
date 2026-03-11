import { useState, useRef, useCallback } from "react"
import {
    X, Eye, EyeOff, Loader2, Save, Globe, Bot, Copy,
    ToggleLeft, ToggleRight, Settings2, Wifi, WifiOff,
    Flag, ImageIcon, Trash2,
} from "lucide-react"
import { useUpdateChannel, useToggleChannel, useChannelFlags, useUpdateChannelFlags } from "../hooks/use-channels"
import { useAuthStore } from "@/stores/auth-store"
import { PLATFORM_META } from "../types"
import type { Channel, ChannelFlagsData } from "../types"
import { toast } from "sonner"
import { AgentMultiSelect } from "./AgentMultiSelect"
import { uploadMedia } from "@/features/inbox/services/inbox-service"

const CSS = `
@keyframes mdlIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes mdlFade{from{opacity:0}to{opacity:1}}
.mdl-field{width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--t-border);background:var(--t-card-hover);font-size:13px;color:var(--t-text,var(--t-text));outline:none;transition:border-color .15s,box-shadow .15s;box-sizing:border-box;font-family:inherit;}
.mdl-field:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06);}
.mdl-label{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t-text-muted);display:block;margin-bottom:5px;}
.mdl-tab{padding:9px 18px;border-radius:8px;border:1.5px solid transparent;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;background:transparent;font-family:inherit;}
.mdl-tab.active{background:var(--t-accent);color:#fff;border-color:var(--t-accent);box-shadow:0 1px 3px rgba(27,80,145,.15);}
.mdl-tab:not(.active){color:var(--t-text-faint);}
.mdl-tab:not(.active):hover{border-color:var(--t-border);background:var(--t-surface);}
`

function Toggle({ on, onToggle, loading }: { on: boolean; onToggle: () => void; loading?: boolean }) {
    if (loading) return <Loader2 size={18} style={{ color: "var(--t-accent)", animation: "spin 1s linear infinite" }} />
    return (
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: on ? "#16a34a" : "var(--t-text-faint)", display: "flex", padding: 0 }}>
            {on ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
    )
}

function SecretField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const [show, setShow] = useState(false)
    return (
        <div>
            <label className="mdl-label">{label}</label>
            <div style={{ display: "flex", gap: 6 }}>
                <input type={show ? "text" : "password"} className="mdl-field" dir="ltr" style={{ flex: 1, fontFamily: "monospace" }}
                    value={value} onChange={e => onChange(e.target.value)} />
                <button type="button" onClick={() => setShow(!show)} style={{
                    width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                    background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--t-text-faint)", transition: "all .12s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    )
}

/* ─── Icon Upload (edit mode) ─── */
function IconUploadEdit({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string>(value || "")

    const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) { toast.error("يرجى اختيار ملف صورة"); return }
        if (file.size > 5 * 1024 * 1024) { toast.error("الحد الأقصى 5MB"); return }
        const localUrl = URL.createObjectURL(file)
        setPreview(localUrl)
        setUploading(true)
        try {
            const res = await uploadMedia(file, { platform: "webchat", source: "channel_icon" })
            const url = res.public_url || res.proxy_url
            onChange(url)
            setPreview(url)
            toast.success("تم رفع الأيقونة")
        } catch {
            toast.error("فشل رفع الأيقونة")
            setPreview(value || "")
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }, [onChange, value])

    const remove = useCallback(() => {
        onChange("")
        setPreview("")
    }, [onChange])

    return (
        <div>
            <label className="mdl-label">أيقونة الويدجت</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            {preview ? (
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 10px", borderRadius: 9, border: "1.5px solid var(--t-border)", background: "var(--t-card-hover)",
                }}>
                    <img src={preview} alt="icon" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", border: "1px solid var(--t-border)" }} />
                    <span style={{ flex: 1, fontSize: 11, color: "var(--t-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>
                        {uploading ? "جاري الرفع..." : "✓"}
                    </span>
                    {uploading ? (
                        <Loader2 size={14} style={{ color: "var(--t-accent)", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    ) : (
                        <>
                            <button type="button" onClick={() => fileRef.current?.click()} style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 26, height: 26, borderRadius: 6, border: "none",
                                background: "rgba(27,80,145,0.06)", cursor: "pointer", color: "var(--t-accent)", flexShrink: 0,
                            }}>
                                <ImageIcon size={12} />
                            </button>
                            <button type="button" onClick={remove} style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 26, height: 26, borderRadius: 6, border: "none",
                                background: "rgba(220,38,38,0.06)", cursor: "pointer", color: "var(--t-danger)", flexShrink: 0,
                            }}>
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "10px 12px", borderRadius: 9,
                    border: "1.5px dashed var(--t-border-medium)", background: "var(--t-card-hover)",
                    cursor: "pointer", color: "var(--t-text-faint)", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    transition: "all .15s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border-medium)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                >
                    <ImageIcon size={16} />
                    اختر صورة الأيقونة
                </button>
            )}
        </div>
    )
}

/* ─── Settings Tab ─── */
function SettingsTab({ channel, tenantId }: { channel: Channel; tenantId: string }) {
    const updateMut = useUpdateChannel(tenantId)

    const [name, setName] = useState(channel.name || "")
    const [token, setToken] = useState(channel.access_token || "")
    const [secret, setSecret] = useState(channel.META_APP_SECRET || "")
    const [agentIds, setAgentIds] = useState<string[]>(channel.agent_ids || [])
    const [icon, setIcon] = useState(channel.icon || "")
    const [color, setColor] = useState(channel.color || "#4A90E2")
    const [originsRaw, setOriginsRaw] = useState((channel.allowed_origins || []).join(", "))
    const [phoneNumberId, setPhoneNumberId] = useState(channel.phone_number_id || channel.identifier || "")
    const [wabaId, setWabaId] = useState(channel.waba_id || "")
    const [pageId, setPageId] = useState(channel.page_id || channel.identifier || "")
    const [igAccountId, setIgAccountId] = useState(channel.ig_account_id || "")
    const [appId, setAppId] = useState(channel.app_id || channel.identifier || "")

    const isDirty = name !== (channel.name || "") || token !== (channel.access_token || "") ||
        secret !== (channel.META_APP_SECRET || "") ||
        JSON.stringify([...agentIds].sort()) !== JSON.stringify([...(channel.agent_ids || [])].sort()) ||
        icon !== (channel.icon || "") || color !== (channel.color || "#4A90E2") ||
        originsRaw !== (channel.allowed_origins || []).join(", ") ||
        phoneNumberId !== (channel.phone_number_id || channel.identifier || "") ||
        wabaId !== (channel.waba_id || "") ||
        pageId !== (channel.page_id || channel.identifier || "") ||
        igAccountId !== (channel.ig_account_id || "") ||
        appId !== (channel.app_id || channel.identifier || "")

    const save = () => {
        const origins = originsRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
        updateMut.mutate({
            platform: channel.platform, identifier: channel.identifier,
            payload: {
                name: name || undefined,
                access_token: token || undefined,
                META_APP_SECRET: secret || undefined,
                agent_ids: agentIds.length ? agentIds : undefined,
                icon: icon || undefined,
                color: color || undefined,
                allowed_origins: origins.length ? origins : undefined,
                phone_number_id: channel.platform === "whatsapp" ? (phoneNumberId || undefined) : undefined,
                waba_id: channel.platform === "whatsapp" ? (wabaId || undefined) : undefined,
                page_id: (channel.platform === "facebook" || channel.platform === "instagram") ? (pageId || undefined) : undefined,
                ig_account_id: channel.platform === "instagram" ? (igAccountId || undefined) : undefined,
            }
        })
    }

    const hasToken = channel.platform !== "appchat" && channel.platform !== "webchat"
    const hasOrigins = channel.platform === "appchat" || channel.platform === "webchat"

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
                <label className="mdl-label">الاسم</label>
                <input className="mdl-field" dir="rtl" value={name} onChange={e => setName(e.target.value)} placeholder="اسم القناة" />
            </div>

            {channel.platform === "whatsapp" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label className="mdl-label">Phone Number ID</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            <input className="mdl-field" dir="ltr" value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} style={{ fontFamily: "monospace" }} />
                            <button type="button" onClick={() => { navigator.clipboard.writeText(phoneNumberId); toast.success("تم النسخ") }} style={{
                                width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                                background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-faint)", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="mdl-label">WABA ID</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            <input className="mdl-field" dir="ltr" value={wabaId} onChange={e => setWabaId(e.target.value)} style={{ fontFamily: "monospace" }} />
                            <button type="button" onClick={() => { navigator.clipboard.writeText(wabaId); toast.success("تم النسخ") }} style={{
                                width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                                background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-faint)", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(channel.platform === "facebook" || channel.platform === "instagram") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <label className="mdl-label">Page ID</label>
                        <div style={{ display: "flex", gap: 6 }}>
                            <input className="mdl-field" dir="ltr" value={pageId} onChange={e => setPageId(e.target.value)} style={{ fontFamily: "monospace" }} />
                            <button type="button" onClick={() => { navigator.clipboard.writeText(pageId); toast.success("تم النسخ") }} style={{
                                width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                                background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--t-text-faint)", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                            >
                                <Copy size={14} />
                            </button>
                        </div>
                    </div>
                    {channel.platform === "instagram" && (
                        <div>
                            <label className="mdl-label">IG Account ID</label>
                            <div style={{ display: "flex", gap: 6 }}>
                                <input className="mdl-field" dir="ltr" value={igAccountId} onChange={e => setIgAccountId(e.target.value)} style={{ fontFamily: "monospace" }} />
                                <button type="button" onClick={() => { navigator.clipboard.writeText(igAccountId); toast.success("تم النسخ") }} style={{
                                    width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                                    background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "var(--t-text-faint)", transition: "all .12s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {channel.platform === "appchat" && (
                <div>
                    <label className="mdl-label">App ID</label>
                    <div style={{ display: "flex", gap: 6 }}>
                        <input className="mdl-field" dir="ltr" value={appId} onChange={e => setAppId(e.target.value)} style={{ fontFamily: "monospace" }} />
                        <button type="button" onClick={() => { navigator.clipboard.writeText(appId); toast.success("تم النسخ") }} style={{
                            width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0,
                            background: "var(--t-card-hover)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: "var(--t-text-faint)", transition: "all .12s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            )}

            {hasToken && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <SecretField label="Access Token" value={token} onChange={setToken} />
                    <SecretField label="META App Secret" value={secret} onChange={setSecret} />
                </div>
            )}

            {channel.platform === "webchat" && channel.script_url && (() => {
                const embedCode = `<script src="${channel.script_url}" async><\/script>`
                return (
                    <div>
                        <label className="mdl-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={10} /> كود التضمين (Embed Code)</label>
                        <div style={{
                            position: "relative", borderRadius: 10, overflow: "hidden",
                            border: "1.5px solid var(--t-border)", background: "#1e293b",
                        }}>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "6px 12px", background: "#334155", borderBottom: "1px solid #475569",
                            }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-muted)", letterSpacing: ".03em" }}>HTML</span>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(embedCode); toast.success("تم نسخ كود التضمين") }} style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    padding: "3px 10px", borderRadius: 6, border: "1px solid #475569",
                                    background: "transparent", cursor: "pointer",
                                    fontSize: 10, fontWeight: 700, color: "var(--t-text-muted)", transition: "all .12s",
                                    fontFamily: "inherit",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#475569"; e.currentTarget.style.color = "#e2e8f0" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--t-text-muted)" }}
                                >
                                    <Copy size={10} /> نسخ
                                </button>
                            </div>
                            <pre dir="ltr" style={{
                                margin: 0, padding: "12px 14px", fontSize: 11.5, lineHeight: 1.6,
                                fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                                color: "#e2e8f0", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all",
                            }}>
                                <span style={{ color: "var(--t-text-muted)" }}>&lt;</span>
                                <span style={{ color: "#f472b6" }}>script</span>
                                {" "}<span style={{ color: "#7dd3fc" }}>src</span>
                                <span style={{ color: "var(--t-text-muted)" }}>=</span>
                                <span style={{ color: "#a5f3fc" }}>"{channel.script_url}"</span>
                                {" "}<span style={{ color: "#7dd3fc" }}>async</span>
                                <span style={{ color: "var(--t-text-muted)" }}>&gt;&lt;/</span>
                                <span style={{ color: "#f472b6" }}>script</span>
                                <span style={{ color: "var(--t-text-muted)" }}>&gt;</span>
                            </pre>
                        </div>
                        <p style={{ marginTop: 6, fontSize: 10, color: "var(--t-text-faint)" }}>الصق هذا الكود في صفحة HTML الخاصة بك قبل إغلاق &lt;/body&gt;</p>
                    </div>
                )
            })()}

            {channel.platform === "webchat" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                    <IconUploadEdit value={icon} onChange={setIcon} />
                    <div>
                        <label className="mdl-label">اللون</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", padding: 2, cursor: "pointer" }} />
                    </div>
                </div>
            )}

            {hasOrigins && (
                <div>
                    <label className="mdl-label">النطاقات المسموحة (مفصولة بفاصلة)</label>
                    <input className="mdl-field" dir="ltr" value={originsRaw} onChange={e => setOriginsRaw(e.target.value)} placeholder="https://site1.com, https://site2.com" />
                </div>
            )}

            <div>
                <label className="mdl-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Bot size={10} /> الوكلاء المرتبطون</label>
                <AgentMultiSelect value={agentIds} onChange={setAgentIds} />
            </div>

            {isDirty && (
                <button type="button" onClick={save} disabled={updateMut.isPending} style={{
                    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    border: "none", background: "var(--t-brand-orange)", color: "#fff",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: updateMut.isPending ? 0.7 : 1,
                    alignSelf: "flex-start", fontFamily: "inherit",
                    boxShadow: "0 1px 3px rgba(27,80,145,.15)",
                }}>
                    {updateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    حفظ التغييرات
                </button>
            )}
        </div>
    )
}

/* ─── Flags Tab ─── */
function FlagRow({ label, effective, override, onToggle }: { label: string; effective: boolean; override: boolean | null; onToggle: () => void }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0f1f3" }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>{label}</div>
                <div style={{ fontSize: 10, color: override !== null ? "var(--t-warning)" : "var(--t-text-faint)" }}>
                    {override !== null ? `مخصص: ${override ? "مفعّل" : "معطّل"}` : "يرث من الإعدادات العامة"}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                    background: effective ? "rgba(22,163,74,.06)" : "rgba(220,38,38,.06)",
                    color: effective ? "#16a34a" : "var(--t-danger)",
                }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: effective ? "#16a34a" : "var(--t-danger)" }} />
                    {effective ? "مفعّل" : "معطّل"}
                </span>
                <button type="button" onClick={onToggle} style={{
                    padding: "4px 10px", borderRadius: 7, border: "1px solid var(--t-border)",
                    background: "var(--t-card-hover)", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    color: "var(--t-text-muted)", fontFamily: "inherit", transition: "all .12s",
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-muted)" }}
                >
                    {override !== null ? "إعادة" : "تخصيص"}
                </button>
            </div>
        </div>
    )
}

function FlagsTab({ channel, tenantId }: { channel: Channel; tenantId: string }) {
    const { data: flagsRes, isLoading, refetch } = useChannelFlags(tenantId, channel.platform, channel.identifier)
    const updateFlags = useUpdateChannelFlags(tenantId)

    if (isLoading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10, color: "var(--t-accent)" }}>
            <Loader2 size={18} className="animate-spin" /> جاري التحميل...
        </div>
    )

    const flags: ChannelFlagsData | null = flagsRes?.data || null
    if (!flags) return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(27,80,145,.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 10px",
            }}>
                <Flag size={20} style={{ color: "var(--t-accent)" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text-faint)" }}>لا تتوفر بيانات Flags</div>
        </div>
    )

    const { communication_flags, global_flags, effective_flags } = flags
    const overrides = communication_flags.overrides || {}

    const allMsgTypes = { ...(global_flags.message_types || {}), ...(effective_flags.message_types || {}) }
    const allResTypes = { ...(global_flags.response_types || {}), ...(effective_flags.response_types || {}) }
    const allResCaps = { ...(global_flags.response_capabilities || {}), ...(effective_flags.response_capabilities || {}) }

    const mutate = (newOverrides: typeof overrides) =>
        updateFlags.mutate({
            platform: channel.platform, identifier: channel.identifier,
            payload: { inherit: communication_flags.inherit, overrides: newOverrides },
        }, { onSuccess: () => refetch() })

    const toggleBoolFlag = (section: "message_types" | "response_types", key: string) => {
        const cur = (overrides[section]?.[key] as boolean | undefined)
        const globalVal = section === "message_types" ? global_flags.message_types?.[key] : global_flags.response_types?.[key]
        const newOverrides = { ...overrides, [section]: { ...(overrides[section] as Record<string, boolean> || {}), [key]: cur === undefined ? !globalVal : !cur } }
        mutate(newOverrides)
    }

    const toggleCapability = (key: string) => {
        const caps = (overrides.response_capabilities || {}) as Record<string, { enabled: boolean }>
        const cur = caps[key]?.enabled
        const globalEnabled = global_flags.response_capabilities?.[key]?.enabled
        mutate({ ...overrides, response_capabilities: { ...caps, [key]: { enabled: cur === undefined ? !globalEnabled : !cur } } })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Inherit toggle */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(27,80,145,.03)", border: "1px solid rgba(27,80,145,.08)",
            }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-text, var(--t-text))" }}>وراثة الإعدادات العامة</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                        {communication_flags.inherit ? "الإعدادات تُدمج مع الـ global flags" : "الإعدادات المخصصة فقط"}
                    </div>
                </div>
                <Toggle on={communication_flags.inherit} loading={updateFlags.isPending}
                    onToggle={() => mutate({ ...overrides })} />
            </div>

            {/* Message types */}
            {Object.keys(allMsgTypes).length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-accent)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>أنواع الرسائل</div>
                    {Object.entries(allMsgTypes).map(([key]) => (
                        <FlagRow key={key} label={key}
                            effective={!!effective_flags.message_types?.[key]}
                            override={(overrides.message_types?.[key] as boolean | undefined) ?? null}
                            onToggle={() => toggleBoolFlag("message_types", key)} />
                    ))}
                </div>
            )}

            {/* Response types */}
            {Object.keys(allResTypes).length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-accent)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>أنواع الردود</div>
                    {Object.entries(allResTypes).map(([key]) => (
                        <FlagRow key={key} label={key}
                            effective={!!effective_flags.response_types?.[key]}
                            override={(overrides.response_types?.[key] as boolean | undefined) ?? null}
                            onToggle={() => toggleBoolFlag("response_types", key)} />
                    ))}
                </div>
            )}

            {/* Response capabilities */}
            {Object.keys(allResCaps).length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-accent)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>القدرات</div>
                    {Object.entries(allResCaps).map(([key]) => {
                        const effEnabled = !!effective_flags.response_capabilities?.[key]?.enabled
                        const overrideVal = (overrides.response_capabilities as Record<string, { enabled: boolean }> | undefined)?.[key]?.enabled
                        return (
                            <FlagRow key={key} label={key === "ai_generation" ? "توليد AI" : key === "tts" ? "تحويل نص لصوت (TTS)" : key}
                                effective={effEnabled}
                                override={overrideVal ?? null}
                                onToggle={() => toggleCapability(key)} />
                        )
                    })}
                </div>
            )}
        </div>
    )
}


/* ══════════════ MAIN EXPORT ══════════════ */
export function ChannelDetailModal({ channel, onClose }: { channel: Channel; onClose: () => void }) {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""
    const toggleMut = useToggleChannel(tenantId)
    const m = PLATFORM_META[channel.platform]

    const [tab, setTab] = useState<"settings" | "flags">("settings")

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{CSS}</style>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 18, background: "#fff", overflow: "hidden",
                width: "100%", maxWidth: 560, margin: 16, maxHeight: "90vh",
                display: "flex", flexDirection: "column", animation: "mdlIn .18s ease-out",
                boxShadow: "0 12px 40px rgba(0,0,0,.12)",
            }}>
                {/* Gradient Header */}
                <div style={{
                    background: "var(--t-brand-orange)",
                    padding: "18px 24px 0",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                                background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                            }}>
                                {m.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{channel.name || m.labelAr}</div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                    background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)",
                                }}>{m.label}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Toggle on={channel.enabled ?? false} loading={toggleMut.isPending}
                                onToggle={() => toggleMut.mutate({ platform: channel.platform, identifier: channel.identifier, payload: { enabled: !(channel.enabled ?? false) } })} />
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
                    </div>

                    {/* Status row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, fontSize: 11 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: channel.enabled ? "#4ade80" : "rgba(255,255,255,.5)", fontWeight: 700 }}>
                            {channel.enabled ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {channel.enabled ? "نشطة" : "موقوفة"}
                        </span>
                        {channel.agent_ids?.length ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,.6)" }}>
                                <Bot size={11} /> {channel.agent_ids.length} وكيل
                            </span>
                        ) : null}
                    </div>

                    {/* Tab bar */}
                    <div style={{ display: "flex", gap: 6, paddingBottom: 14 }}>
                        <button className={`mdl-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}
                            style={tab === "settings" ? { background: "rgba(255,255,255,.2)", color: "#fff", borderColor: "rgba(255,255,255,.2)" } : { color: "rgba(255,255,255,.6)" }}
                        >
                            <Settings2 size={12} style={{ display: "inline", marginLeft: 5 }} /> الإعدادات
                        </button>
                        <button className={`mdl-tab ${tab === "flags" ? "active" : ""}`} onClick={() => setTab("flags")}
                            style={tab === "flags" ? { background: "rgba(255,255,255,.2)", color: "#fff", borderColor: "rgba(255,255,255,.2)" } : { color: "rgba(255,255,255,.6)" }}
                        >
                            <Flag size={12} style={{ display: "inline", marginLeft: 5 }} /> الـ Flags
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                    {tab === "settings"
                        ? <SettingsTab channel={channel} tenantId={tenantId} />
                        : <FlagsTab channel={channel} tenantId={tenantId} />
                    }
                </div>
            </div>
        </div>
    )
}
