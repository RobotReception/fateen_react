import { useState } from "react"
import {
    Loader2, Volume2, ChevronDown, Eye, EyeOff,
    RefreshCw, AlertTriangle, WifiOff, Mic, Globe,
    Cpu, KeyRound, AudioWaveform, Power, Settings2,
} from "lucide-react"
import { useTTSSettings, useUpdateTTSSettings, useToggleTTS, useUpdateTTSProvider } from "../hooks/use-ai-settings"
import type { TTSProvider } from "../types"

const CSS = `
@keyframes ttsFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes ttsShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ttsSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.tts2-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid var(--t-border);background:#fff;font-size:12px;color:var(--t-text);outline:none;font-family:monospace;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
.tts2-field:focus{border-color:var(--t-accent);box-shadow:0 0 0 3px rgba(27,80,145,.06)}
.tts2-lbl{font-size:10px;font-weight:700;color:var(--t-text-faint);display:flex;align-items:center;gap:3px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
.tts2-seg{flex:1;padding:7px 0;border-radius:8px;border:1.5px solid var(--t-border);cursor:pointer;font-size:11px;font-weight:600;transition:all .12s;background:#fff;color:var(--t-text-muted);font-family:inherit}
.tts2-seg:hover{border-color:var(--t-border-medium)}
.tts2-seg.on{background:var(--t-brand-orange);border-color:var(--t-accent);color:#fff;box-shadow:0 1px 4px rgba(27,80,145,.12)}
`

function Toggle({ on, onToggle, size = "md" }: { on: boolean; onToggle: () => void; size?: "sm" | "md" }) {
    const W = size === "sm" ? 34 : 40, H = size === "sm" ? 18 : 22, D = size === "sm" ? 13 : 16, P = size === "sm" ? 2.5 : 3
    return (
        <button onClick={onToggle} style={{
            width: W, height: H, borderRadius: H, border: "none", position: "relative",
            cursor: "pointer", background: on ? "var(--t-gradient-accent)" : "var(--t-border)",
            transition: "background .2s", flexShrink: 0,
            boxShadow: on ? "0 1px 5px rgba(27,80,145,.15)" : "none",
        }}>
            <span style={{ position: "absolute", top: P, left: on ? W - D - P : P, width: D, height: D, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.18)", transition: "left .2s" }} />
        </button>
    )
}

const sk = (w: string, h = 12, r = 6) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg,#f0f1f3 30%,var(--t-page) 50%,#f0f1f3 70%)", backgroundSize: "200% 100%", animation: "ttsShimmer 1.6s ease-in-out infinite" } as React.CSSProperties)

/* ━━━━ PROVIDER CARD ━━━━ */
function TTSProviderCard({ name, prov, agentId }: { name: string; prov: TTSProvider; agentId: string }) {
    const [open, setOpen] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const updateTP = useUpdateTTSProvider(agentId)
    const patch = (field: string, value: unknown) => updateTP.mutate({ name, payload: { [field]: value } })
    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

    return (
        <div style={{
            borderRadius: 12, border: `1px solid ${open ? "rgba(27,80,145,.15)" : "var(--t-border)"}`, background: "#fff",
            overflow: "hidden", transition: "all .2s", boxShadow: open ? "0 4px 20px rgba(0,0,0,.05)" : "none",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: prov.enabled ? "var(--t-gradient-accent)" : "#f0f1f3",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                    }}>
                        <Mic size={14} style={{ color: prov.enabled ? "#fff" : "var(--t-text-faint)" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{displayName}</span>
                            <span style={{ fontSize: 8.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: prov.enabled ? "rgba(22,163,74,.06)" : "var(--t-surface)", color: prov.enabled ? "#16a34a" : "var(--t-text-faint)" }}>
                                {prov.enabled ? "مُفعَّل" : "معطّل"}
                            </span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--t-text-faint)", marginTop: 1 }}>
                            {prov.engine || "standard"} · {prov.output_format || "mp3"}{prov.voice_id ? ` · ${prov.voice_id}` : ""}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <Toggle on={prov.enabled} size="sm" onToggle={() => patch("enabled", !prov.enabled)} />
                    <ChevronDown size={13} style={{ color: "var(--t-text-faint)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", cursor: "pointer" }} onClick={() => setOpen(!open)} />
                </div>
            </div>

            {/* Body */}
            {open && (
                <div style={{ borderTop: "1px solid var(--t-border)", padding: "14px", animation: "ttsFade .12s ease-out" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div><div className="tts2-lbl"><Globe size={9} /> المنطقة</div><input className="tts2-field" dir="ltr" defaultValue={prov.region_name || ""} onBlur={e => { if (e.target.value !== (prov.region_name || "")) patch("region_name", e.target.value) }} placeholder="us-east-1" /></div>
                        <div><div className="tts2-lbl"><Mic size={9} /> معرّف الصوت</div><input className="tts2-field" dir="ltr" defaultValue={prov.voice_id || ""} onBlur={e => { if (e.target.value !== (prov.voice_id || "")) patch("voice_id", e.target.value) }} placeholder="Joanna" /></div>
                        <div><div className="tts2-lbl"><Cpu size={9} /> المحرك</div><div style={{ display: "flex", gap: 4 }}>{(["standard", "neural"] as const).map(eng => <button key={eng} onClick={() => patch("engine", eng)} className={`tts2-seg ${prov.engine === eng ? "on" : ""}`}>{eng === "neural" ? "🧠 Neural" : "⚡ Standard"}</button>)}</div></div>
                        <div><div className="tts2-lbl">صيغة الإخراج</div><select className="tts2-field" style={{ appearance: "auto" as any, fontFamily: "inherit" }} value={prov.output_format || "mp3"} onChange={e => patch("output_format", e.target.value)}><option value="mp3">MP3</option><option value="ogg_vorbis">OGG</option><option value="pcm">PCM</option></select></div>
                        <div><div className="tts2-lbl"><KeyRound size={9} /> مفتاح الوصول</div><input className="tts2-field" dir="ltr" defaultValue={prov.access_key_id || ""} onBlur={e => { if (e.target.value !== (prov.access_key_id || "")) patch("access_key_id", e.target.value) }} placeholder="AKIA..." /></div>
                        <div>
                            <div className="tts2-lbl"><KeyRound size={9} /> المفتاح السري</div>
                            <div style={{ display: "flex", gap: 4 }}>
                                <input type={showSecret ? "text" : "password"} className="tts2-field" dir="ltr" style={{ flex: 1 }}
                                    defaultValue={prov.secret_access_key || ""} onBlur={e => { if (e.target.value !== (prov.secret_access_key || "")) patch("secret_access_key", e.target.value) }} placeholder="●●●●●●" />
                                <button onClick={() => setShowSecret(!showSecret)} style={{
                                    width: 34, height: 34, borderRadius: 8, border: "1.5px solid var(--t-border)", background: "#fff",
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-muted)", flexShrink: 0,
                                }}>{showSecret ? <EyeOff size={12} /> : <Eye size={12} />}</button>
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

    if (isLoading) return (
        <div style={{ animation: "ttsFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", marginBottom: 12 }}>
                <div style={sk("34px", 34, 9)} /><div style={{ flex: 1 }}><div style={sk("130px", 13)} /><div style={{ ...sk("180px", 9), marginTop: 5 }} /></div><div style={sk("40px", 20, 10)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[0, 1].map(i => <div key={i} style={{ borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", padding: 14 }}><div style={{ display: "flex", gap: 8, alignItems: "center" }}><div style={sk("34px", 34, 8)} /><div><div style={sk("80px", 12)} /><div style={{ ...sk("100px", 9), marginTop: 4 }} /></div></div></div>)}
            </div>
        </div>
    )

    if (isError && !tts) {
        const ax = error as any; const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
        return (
            <div style={{ borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1px solid var(--t-border)", background: "#fff" }}>
                <style>{CSS}</style>
                <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isNet ? <WifiOff size={22} style={{ color: "var(--t-danger)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", marginBottom: 12 }}>خطأ في التحميل</div>
                <button onClick={() => refetch()} style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 8,
                    border: "none", background: "var(--t-brand-orange)", color: "#fff",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: isRefetching ? .7 : 1, fontFamily: "inherit",
                }}>{isRefetching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} إعادة المحاولة</button>
            </div>
        )
    }

    if (!tts || Object.keys(tts).length === 0) return (
        <div style={{ borderRadius: 12, padding: "48px 24px", textAlign: "center", border: "1.5px dashed var(--t-border-medium)" }}>
            <style>{CSS}</style>
            <Volume2 size={28} style={{ margin: "0 auto 10px", display: "block", color: "var(--t-border-medium)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)", marginBottom: 3 }}>لم يتم إعداد TTS</div>
            <div style={{ fontSize: 11, color: "var(--t-text-faint)" }}>ستظهر الإعدادات بعد تهيئة الخادم</div>
        </div>
    )

    const providers = tts.providers || {}
    const providerNames = Object.keys(providers)
    const enabledCount = providerNames.filter(n => providers[n].enabled).length

    return (
        <div style={{ animation: "ttsFade .25s ease-out" }}>
            <style>{CSS}</style>

            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 12, overflow: "hidden", background: "var(--t-border)", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,var(--t-accent),transparent)", animation: "ttsSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ─── Status Strip ─── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
                borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff", marginBottom: 12, position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: tts.enabled ? "linear-gradient(90deg, var(--t-accent), var(--t-accent-secondary))" : "var(--t-border)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: tts.enabled ? "var(--t-gradient-accent)" : "#f0f1f3",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Power size={15} style={{ color: tts.enabled ? "#fff" : "var(--t-text-faint)" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>تحويل النص إلى كلام</div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: tts.enabled ? "#16a34a" : "var(--t-border-medium)" }} />
                                {tts.enabled ? "يعمل" : "متوقف"}
                            </span>
                            <span>·</span>
                            <span>{enabledCount}/{providerNames.length} مزود</span>
                            {tts.default_provider && <><span>·</span><code style={{ fontFamily: "monospace", fontSize: 10, background: "var(--t-surface)", padding: "0 4px", borderRadius: 3 }}>{tts.default_provider}</code></>}
                        </div>
                    </div>
                </div>
                <Toggle on={tts.enabled} onToggle={() => toggleTTSMut.mutate(!tts.enabled)} />
            </div>

            {/* ─── Default Provider ─── */}
            {providerNames.length > 0 && (
                <div style={{ marginBottom: 12, padding: "10px 16px", borderRadius: 12, border: "1px solid var(--t-border)", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Settings2 size={13} style={{ color: "var(--t-text-faint)" }} />
                        <span className="tts2-lbl" style={{ margin: 0 }}>المزود الافتراضي</span>
                        <select className="tts2-field" style={{ appearance: "auto" as any, fontFamily: "inherit", flex: 1, maxWidth: 200, padding: "5px 8px", fontSize: 11 }}
                            value={tts.default_provider || ""} onChange={e => updateTTS.mutate({ default_provider: e.target.value })}>
                            <option value="">— اختر —</option>
                            {providerNames.map(n => <option key={n} value={n}>{n.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* ─── Provider Cards ─── */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <AudioWaveform size={13} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--t-text)" }}>مزودو الصوت</span>
                    {providerNames.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "rgba(27,80,145,.06)", color: "var(--t-accent)" }}>{providerNames.length}</span>}
                </div>

                {providerNames.length === 0 ? (
                    <div style={{ borderRadius: 12, padding: "28px 0", textAlign: "center", border: "1.5px dashed var(--t-border-medium)", color: "var(--t-text-faint)" }}>
                        <Volume2 size={18} style={{ margin: "0 auto 6px", display: "block", opacity: .4 }} />
                        <div style={{ fontSize: 12, fontWeight: 600 }}>لا يوجد مزودون</div>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: providerNames.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                        {providerNames.map(name => <TTSProviderCard key={name} name={name} prov={providers[name]} agentId={agentId} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
