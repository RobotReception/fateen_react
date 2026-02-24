import { useState } from "react"
import {
    Loader2, Volume2, ChevronDown, Eye, EyeOff,
    RefreshCw, AlertTriangle, WifiOff, Mic, Globe,
    Cpu, KeyRound, AudioWaveform,
} from "lucide-react"
import { useTTSSettings, useUpdateTTSSettings, useToggleTTS, useUpdateTTSProvider } from "../hooks/use-ai-settings"
import type { TTSProvider } from "../types"

const CSS = `
@keyframes ttsFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ttsShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ttsSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.tts-card { border-radius:13px; border:1px solid var(--t-border); background:var(--t-card); overflow:hidden; margin-bottom:10px; transition:box-shadow .2s; }
.tts-card.open { box-shadow:0 4px 20px rgba(0,0,0,.08); }
.tts-input { width:100%; padding:9px 12px; border-radius:9px; border:1.5px solid var(--t-border); background:var(--t-surface); font-size:13px; color:var(--t-text); outline:none; font-family:monospace; transition:border-color .15s; box-sizing:border-box; }
.tts-input:focus { border-color:var(--t-accent); }
.tts-seg-btn { flex:1; padding:9px 0; border-radius:8px; border:1.5px solid var(--t-border); cursor:pointer; font-size:12px; font-weight:600; transition:all .12s; background:var(--t-surface); color:var(--t-text-faint); }
.tts-seg-btn.active { background:var(--t-accent); border-color:var(--t-accent); color:var(--t-text-on-accent); }
`

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    const W = 44, H = 24, D = 18, P = 3
    return (
        <button onClick={onToggle} style={{ width: W, height: H, borderRadius: H, border: "none", position: "relative", cursor: "pointer", background: on ? "var(--t-accent)" : "var(--t-border)", transition: "background .2s", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: P, left: on ? W - D - P : P, width: D, height: D, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,.18)", transition: "left .2s" }} />
        </button>
    )
}

const sk = (w: string, h = 12, r = 6) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg,var(--t-border) 30%,var(--t-border-light) 50%,var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "ttsShimmer 1.6s ease-in-out infinite" } as React.CSSProperties)

function Skeleton() {
    return (
        <div style={{ animation: "ttsFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 13, border: "1px solid var(--t-border)", background: "var(--t-card)", padding: 22, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("44px", 44, 12)} /><div><div style={sk("160px", 16)} /><div style={{ ...sk("200px", 10), marginTop: 7 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ borderRadius: 10, padding: 14, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ ...sk("60px", 9), marginBottom: 7 }} /><div style={sk("70px", 20)} /></div>)}
                </div>
            </div>
            {[0, 1].map(i => (
                <div key={i} className="tts-card" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={sk("40px", 40, 10)} /><div><div style={sk("100px", 14)} /><div style={{ ...sk("140px", 10), marginTop: 5 }} /></div>
                        </div>
                        <div style={sk("44px", 24, 12)} />
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ━━━━ PROVIDER CARD ━━━━ */
function TTSProviderCard({ name, prov, agentId }: { name: string; prov: TTSProvider; agentId: string }) {
    const [open, setOpen] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const updateTP = useUpdateTTSProvider(agentId)

    const patch = (field: string, value: unknown) => updateTP.mutate({ name, payload: { [field]: value } })
    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

    return (
        <div className={`tts-card ${open ? "open" : ""}`}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: prov.enabled ? "rgba(16,185,129,.12)" : "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                        <Mic size={17} style={{ color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)" }} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{displayName}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: prov.enabled ? "rgba(16,185,129,.12)" : "var(--t-border-light)", color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)" }}>
                                {prov.enabled ? "مُفعَّل" : "مُعطَّل"}
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                            {prov.engine || "standard"} · {prov.output_format || "mp3"}{prov.voice_id ? ` · ${prov.voice_id}` : ""}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={e => e.stopPropagation()}>
                    <Toggle on={prov.enabled} onToggle={() => patch("enabled", !prov.enabled)} />
                    <ChevronDown size={15} style={{ color: "var(--t-text-faint)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", cursor: "pointer" }} onClick={() => setOpen(!open)} />
                </div>
            </div>

            {/* Body */}
            {open && (
                <div style={{ borderTop: "1px solid var(--t-border-light)", padding: "18px 18px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                        {/* Region */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                <Globe size={10} /> المنطقة
                            </label>
                            <input className="tts-input" dir="ltr" defaultValue={prov.region_name || ""}
                                onBlur={e => { if (e.target.value !== (prov.region_name || "")) patch("region_name", e.target.value) }}
                                placeholder="us-east-1" />
                        </div>

                        {/* Voice ID */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                <Mic size={10} /> معرّف الصوت
                            </label>
                            <input className="tts-input" dir="ltr" defaultValue={prov.voice_id || ""}
                                onBlur={e => { if (e.target.value !== (prov.voice_id || "")) patch("voice_id", e.target.value) }}
                                placeholder="Joanna" />
                        </div>

                        {/* Engine */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                <Cpu size={10} /> المحرك
                            </label>
                            <div style={{ display: "flex", gap: 6 }}>
                                {(["standard", "neural"] as const).map(eng => (
                                    <button key={eng} onClick={() => patch("engine", eng)}
                                        className={`tts-seg-btn ${prov.engine === eng ? "active" : ""}`}>
                                        {eng === "neural" ? "🧠 Neural" : "⚡ Standard"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Output format */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                صيغة الإخراج
                            </label>
                            <select className="tts-input" style={{ appearance: "auto" as any, fontFamily: "inherit" }}
                                value={prov.output_format || "mp3"} onChange={e => patch("output_format", e.target.value)}>
                                <option value="mp3">MP3</option>
                                <option value="ogg_vorbis">OGG Vorbis</option>
                                <option value="pcm">PCM</option>
                            </select>
                        </div>

                        {/* Access key */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                <KeyRound size={10} /> مفتاح الوصول
                            </label>
                            <input className="tts-input" dir="ltr" defaultValue={prov.access_key_id || ""}
                                onBlur={e => { if (e.target.value !== (prov.access_key_id || "")) patch("access_key_id", e.target.value) }}
                                placeholder="AKIA..." />
                        </div>

                        {/* Secret key */}
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                                <KeyRound size={10} /> المفتاح السري
                            </label>
                            <div style={{ display: "flex", gap: 6 }}>
                                <input type={showSecret ? "text" : "password"} className="tts-input" dir="ltr" style={{ flex: 1 }}
                                    defaultValue={prov.secret_access_key || ""}
                                    onBlur={e => { if (e.target.value !== (prov.secret_access_key || "")) patch("secret_access_key", e.target.value) }}
                                    placeholder="●●●●●●" />
                                <button onClick={() => setShowSecret(!showSecret)} style={{ width: 40, height: 40, borderRadius: 9, border: "1.5px solid var(--t-border)", background: "var(--t-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)", flexShrink: 0 }}>
                                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ━━━━ MAIN EXPORT ━━━━ */
export function TTSTab({ agentId }: { agentId: string }) {
    const { data: tts, isLoading, isError, error, refetch, isRefetching } = useTTSSettings(agentId)
    const updateTTS = useUpdateTTSSettings(agentId)
    const toggleTTSMut = useToggleTTS(agentId)

    if (isLoading) return <Skeleton />
    if (isError && !tts) {
        const ax = error as any
        const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
        return (
            <div style={{ borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px solid var(--t-border)", background: "var(--t-card)" }}>
                <style>{CSS}</style>
                <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px", background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isNet ? <WifiOff size={22} style={{ color: "var(--t-danger)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", marginBottom: 12 }}>خطأ في تحميل TTS</div>
                <button onClick={() => refetch()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 9, border: "none", background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: isRefetching ? 0.7 : 1 }}>
                    {isRefetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    إعادة المحاولة
                </button>
            </div>
        )
    }

    if (!tts || Object.keys(tts).length === 0) return (
        <div style={{ borderRadius: 14, padding: "48px 24px", textAlign: "center", border: "1px dashed var(--t-border)" }}>
            <style>{CSS}</style>
            <Volume2 size={32} style={{ display: "block", margin: "0 auto 12px", opacity: 0.25 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>لم يتم إعداد TTS</div>
            <div style={{ fontSize: 12, color: "var(--t-text-faint)" }}>ستظهر الإعدادات بعد تهيئة الخادم</div>
        </div>
    )

    const providers = tts.providers || {}
    const providerNames = Object.keys(providers)
    const enabledCount = providerNames.filter(n => providers[n].enabled).length

    return (
        <div style={{ animation: "ttsFade .25s ease-out" }}>
            <style>{CSS}</style>

            {/* Loading bar */}
            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 16, overflow: "hidden", background: "var(--t-border-light)", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,var(--t-accent),transparent)", animation: "ttsSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ─── Overview card ─── */}
            <div style={{ borderRadius: 13, border: "1px solid var(--t-border)", background: "var(--t-card)", padding: "20px 22px", marginBottom: 14 }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: tts.enabled ? "var(--t-accent)" : "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                            <AudioWaveform size={20} style={{ color: tts.enabled ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>تحويل النص إلى كلام</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>{tts.enabled ? "الخدمة تعمل بكفاءة" : "الخدمة مُعطَّلة حالياً"}</div>
                        </div>
                    </div>
                    <Toggle on={tts.enabled} onToggle={() => toggleTTSMut.mutate(!tts.enabled)} />
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                        { label: "المزودون النشطون", value: `${enabledCount} / ${providerNames.length}` },
                        { label: "المزود الافتراضي", value: tts.default_provider || "–" },
                        { label: "الحالة", value: tts.enabled ? "يعمل ✓" : "مُعطَّل", color: tts.enabled ? "var(--t-success)" : "var(--t-danger)" },
                    ].map(s => (
                        <div key={s.label} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{s.label}</div>
                            <div style={{ fontSize: 17, fontWeight: 800, color: (s as any).color || "var(--t-text)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Default provider */}
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>المزود الافتراضي</label>
                    <select className="tts-input" style={{ appearance: "auto" as any, fontFamily: "inherit" }}
                        value={tts.default_provider || ""} onChange={e => updateTTS.mutate({ default_provider: e.target.value })}>
                        <option value="">— اختر مزوداً —</option>
                        {providerNames.map(n => <option key={n} value={n}>{n.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                </div>
            </div>

            {/* ─── Provider cards ─── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Mic size={14} style={{ color: "var(--t-accent)" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>مزودو الصوت</span>
                {providerNames.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--t-accent-muted)", color: "var(--t-accent)" }}>{providerNames.length}</span>
                )}
            </div>

            {providerNames.length === 0 ? (
                <div style={{ borderRadius: 12, padding: "28px 0", textAlign: "center", border: "1px dashed var(--t-border)", color: "var(--t-text-faint)" }}>
                    <Volume2 size={20} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>لا يوجد مزودون</div>
                </div>
            ) : (
                providerNames.map(name => <TTSProviderCard key={name} name={name} prov={providers[name]} agentId={agentId} />)
            )}
        </div>
    )
}
