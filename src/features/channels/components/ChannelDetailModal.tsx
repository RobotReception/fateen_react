import { useState } from "react"
import {
    X, Eye, EyeOff, Loader2, Save, Globe, Bot, Copy,
    ToggleLeft, ToggleRight, Settings2, Wifi, WifiOff,
    Flag,
} from "lucide-react"
import { useUpdateChannel, useToggleChannel, useChannelFlags, useUpdateChannelFlags } from "../hooks/use-channels"
import { useAuthStore } from "@/stores/auth-store"
import { PLATFORM_META } from "../types"
import type { Channel, ChannelFlagsData } from "../types"
import { toast } from "sonner"
import { AgentMultiSelect } from "./AgentMultiSelect"

const CSS = `
@keyframes mdlIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes mdlFade{from{opacity:0}to{opacity:1}}
.mdl-field{width:100%;padding:9px 12px;border-radius:9px;border:1.5px solid var(--t-border);background:var(--t-surface);font-size:13px;color:var(--t-text);outline:none;transition:border-color .15s;box-sizing:border-box;}
.mdl-field:focus{border-color:var(--t-accent);}
.mdl-label{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t-text-faint);display:block;margin-bottom:5px;}
.mdl-tab{padding:9px 18px;border-radius:8px;border:1.5px solid transparent;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;background:transparent;}
.mdl-tab.active{background:var(--t-accent);color:var(--t-text-on-accent);border-color:var(--t-accent);}
.mdl-tab:not(.active){color:var(--t-text-faint);}
.mdl-tab:not(.active):hover{border-color:var(--t-border);background:var(--t-surface);}
`

function Toggle({ on, onToggle, loading }: { on: boolean; onToggle: () => void; loading?: boolean }) {
    if (loading) return <Loader2 size={18} style={{ color: "var(--t-text-faint)", animation: "spin 1s linear infinite" }} />
    return (
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: on ? "var(--t-success)" : "var(--t-text-faint)", display: "flex", padding: 0 }}>
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
                <button type="button" onClick={() => setShow(!show)} style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0, background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)" }}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
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

    const isDirty = name !== (channel.name || "") || token !== (channel.access_token || "") ||
        secret !== (channel.META_APP_SECRET || "") ||
        JSON.stringify([...agentIds].sort()) !== JSON.stringify([...(channel.agent_ids || [])].sort()) ||
        icon !== (channel.icon || "") || color !== (channel.color || "#4A90E2") ||
        originsRaw !== (channel.allowed_origins || []).join(", ")

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
            }
        })
    }

    const hasToken = channel.platform !== "appchat" && channel.platform !== "webchat"
    const hasOrigins = channel.platform === "appchat" || channel.platform === "webchat"

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
                <label className="mdl-label">الاسم</label>
                <input className="mdl-field" dir="rtl" value={name} onChange={e => setName(e.target.value)} placeholder="اسم القناة" />
            </div>

            {/* Identifier (readonly) */}
            <div>
                <label className="mdl-label">المعرّف (identifier)</label>
                <div style={{ display: "flex", gap: 6 }}>
                    <input className="mdl-field" dir="ltr" value={channel.identifier} readOnly style={{ fontFamily: "monospace", opacity: 0.7, cursor: "default" }} />
                    <button type="button" onClick={() => { navigator.clipboard.writeText(channel.identifier); toast.success("تم النسخ") }} style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0, background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)" }}>
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            {/* Credentials */}
            {hasToken && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <SecretField label="Access Token" value={token} onChange={setToken} />
                    <SecretField label="META App Secret" value={secret} onChange={setSecret} />
                </div>
            )}

            {/* Webchat-specific */}
            {channel.platform === "webchat" && channel.script_url && (
                <div>
                    <label className="mdl-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Globe size={10} /> رابط التضمين (Script URL)</label>
                    <div style={{ display: "flex", gap: 6 }}>
                        <input className="mdl-field" dir="ltr" value={channel.script_url} readOnly style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.7 }} />
                        <button type="button" onClick={() => { navigator.clipboard.writeText(channel.script_url!); toast.success("تم نسخ الرابط") }} style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", flexShrink: 0, background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)" }}>
                            <Copy size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Icon + Color for webchat */}
            {channel.platform === "webchat" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                    <div>
                        <label className="mdl-label">أيقونة الويدجت</label>
                        <input className="mdl-field" dir="ltr" value={icon} onChange={e => setIcon(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="mdl-label">اللون</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 38, height: 38, borderRadius: 9, border: "1.5px solid var(--t-border)", padding: 2, cursor: "pointer" }} />
                    </div>
                </div>
            )}

            {/* Allowed origins */}
            {hasOrigins && (
                <div>
                    <label className="mdl-label">النطاقات المسموحة (مفصولة بفاصلة)</label>
                    <input className="mdl-field" dir="ltr" value={originsRaw} onChange={e => setOriginsRaw(e.target.value)} placeholder="https://site1.com, https://site2.com" />
                </div>
            )}

            {/* Agents multi-select */}
            <div>
                <label className="mdl-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Bot size={10} /> الوكلاء المرتبطون</label>
                <AgentMultiSelect value={agentIds} onChange={setAgentIds} />
            </div>

            {/* Save */}
            {isDirty && (
                <button type="button" onClick={save} disabled={updateMut.isPending} style={{
                    display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9,
                    border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: updateMut.isPending ? 0.7 : 1, alignSelf: "flex-start",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--t-border-light)" }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t-text)" }}>{label}</div>
                <div style={{ fontSize: 10, color: override !== null ? "var(--t-warning)" : "var(--t-text-faint)" }}>
                    {override !== null ? `مخصص: ${override ? "مفعّل" : "معطّل"}` : "يرث من الإعدادات العامة"}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: effective ? "var(--t-success)" : "var(--t-danger)" }}>
                    {effective ? "✓ مفعّل" : "✗ معطّل"}
                </span>
                <button type="button" onClick={onToggle} style={{
                    padding: "4px 10px", borderRadius: 7, border: "1px solid var(--t-border)",
                    background: "var(--t-surface)", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--t-text-faint)",
                }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10, color: "var(--t-text-faint)" }}>
            <Loader2 size={18} className="animate-spin" /> جاري التحميل...
        </div>
    )

    const flags: ChannelFlagsData | null = flagsRes?.data || null
    if (!flags) return (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t-text-faint)" }}>
            <Flag size={24} style={{ margin: "0 auto 10px", display: "block", opacity: 0.3 }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>لا تتوفر بيانات Flags</div>
        </div>
    )

    const { communication_flags, global_flags, effective_flags } = flags
    const overrides = communication_flags.overrides || {}

    // Merge global + effective for display keys
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--t-text)" }}>وراثة الإعدادات العامة</div>
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
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>أنواع الرسائل</div>
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
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>أنواع الردود</div>
                    {Object.entries(allResTypes).map(([key]) => (
                        <FlagRow key={key} label={key}
                            effective={!!effective_flags.response_types?.[key]}
                            override={(overrides.response_types?.[key] as boolean | undefined) ?? null}
                            onToggle={() => toggleBoolFlag("response_types", key)} />
                    ))}
                </div>
            )}

            {/* Response capabilities (ai_generation, tts) */}
            {Object.keys(allResCaps).length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>القدرات</div>
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
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <style>{CSS}</style>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 18, background: "var(--t-card)", border: "1px solid var(--t-border)",
                width: "100%", maxWidth: 560, margin: 16, maxHeight: "90vh",
                display: "flex", flexDirection: "column", animation: "mdlIn .18s ease-out",
            }}>
                {/* Header */}
                <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--t-border-light)", paddingBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                                {m.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)" }}>{channel.name || m.labelAr}</div>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${m.color}18`, color: m.color }}>{m.label}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Toggle on={channel.enabled ?? false} loading={toggleMut.isPending}
                                onToggle={() => toggleMut.mutate({ platform: channel.platform, identifier: channel.identifier, payload: { enabled: !(channel.enabled ?? false) } })} />
                            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", padding: 4 }}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Status row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, fontSize: 11 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: channel.enabled ? "var(--t-success)" : "var(--t-danger)", fontWeight: 700 }}>
                            {channel.enabled ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {channel.enabled ? "نشطة" : "موقوفة"}
                        </span>
                        {channel.agent_ids?.length ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--t-text-faint)" }}>
                                <Bot size={11} /> {channel.agent_ids.length} وكيل
                            </span>
                        ) : null}
                    </div>

                    {/* Tab bar */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className={`mdl-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
                            <Settings2 size={12} style={{ display: "inline", marginLeft: 5 }} /> الإعدادات
                        </button>
                        <button className={`mdl-tab ${tab === "flags" ? "active" : ""}`} onClick={() => setTab("flags")}>
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
