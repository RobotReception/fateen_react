import { useState } from "react"
import { Loader2, Volume2, ChevronDown, Eye, EyeOff, RefreshCw, AlertTriangle, WifiOff, Mic, Globe, Cpu, KeyRound, AudioWaveform } from "lucide-react"
import { useTTSSettings, useUpdateTTSSettings, useToggleTTS, useUpdateTTSProvider } from "../hooks/use-ai-settings"
import type { TTSProvider } from "../types"

/* ── CSS ── */
const CSS = `
@keyframes ttsFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes ttsShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes ttsSlide{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
`

/* ── Skeleton ── */
function sk(w: string, h = 14, r = 8) {
    return { width: w, height: h, borderRadius: r, background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "ttsShimmer 1.6s ease-in-out infinite" } as React.CSSProperties
}

function Skeleton() {
    return (
        <div style={{ animation: "ttsFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 14, padding: 22, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("42px", 42, 11)} />
                    <div><div style={sk("140px", 16)} /><div style={{ ...sk("180px", 11), marginTop: 6 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ borderRadius: 10, padding: 12, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ ...sk("60px", 10), marginBottom: 6 }} /><div style={sk("100%", 18, 9)} /></div>)}
                </div>
            </div>
            {[0, 1].map(i => (
                <div key={i} style={{ borderRadius: 12, padding: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={sk("40px", 40, 10)} /><div><div style={sk("90px", 14)} /><div style={{ ...sk("120px", 10), marginTop: 4 }} /></div>
                    </div>
                    <div style={sk("42px", 22, 11)} />
                </div>
            ))}
        </div>
    )
}

/* ── Error ── */
function ErrorPanel({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    const status = ax?.response?.status
    const msg = ax?.response?.data?.message || ax?.response?.data?.detail || ax?.message || ""
    return (
        <div style={{
            borderRadius: 14, border: "1px solid", textAlign: "center", padding: "36px 24px",
            borderColor: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            animation: "ttsFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16",
                background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {isNet ? <WifiOff size={24} style={{ color: "var(--t-warning)" }} /> : <AlertTriangle size={24} style={{ color: "var(--t-danger)" }} />}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t-text)", marginBottom: 6 }}>{isNet ? "لا يمكن الاتصال بالخادم" : "خطأ في تحميل البيانات"}</div>
            <div style={{ fontSize: 13, color: "var(--t-text-faint)", marginBottom: 6, lineHeight: 1.6 }}>{isNet ? "تحقق من اتصال الشبكة" : msg || "تعذر جلب البيانات"}</div>
            {status && <div style={{ fontSize: 11, color: "var(--t-text-faint)", fontFamily: "monospace", marginBottom: 16, opacity: 0.5 }}>HTTP {status}</div>}
            {!status && <div style={{ height: 12 }} />}
            <button onClick={onRetry} style={{
                padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 13, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
                opacity: retrying ? 0.7 : 1, pointerEvents: retrying ? "none" : "auto",
            }}>
                {retrying ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {retrying ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

/* ── Toggle ── */
function Toggle({ on, onToggle, size = "md" }: { on: boolean; onToggle: () => void; size?: "sm" | "md" }) {
    const w = size === "sm" ? 36 : 44
    const h = size === "sm" ? 20 : 24
    const d = size === "sm" ? 14 : 18
    const pad = 3
    return (
        <button onClick={onToggle} style={{
            width: w, height: h, borderRadius: h, border: "none", position: "relative", cursor: "pointer",
            background: on ? "var(--t-accent)" : "var(--t-border)",
            transition: "background .2s ease", flexShrink: 0,
        }}>
            <span style={{
                position: "absolute", top: pad, left: on ? w - d - pad : pad,
                width: d, height: d, borderRadius: "50%", background: on ? "var(--t-text-on-accent)" : "#fff",
                transition: "left .2s ease", boxShadow: "0 1px 3px rgba(0,0,0,.12)",
            }} />
        </button>
    )
}

/* ══════════════════════════════════════════════════════════════
   TTS PROVIDER CARD
   ══════════════════════════════════════════════════════════════ */
function TTSProviderCard({ name, prov }: { name: string; prov: TTSProvider }) {
    const [open, setOpen] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const updateTP = useUpdateTTSProvider()

    function patch(field: string, value: unknown) {
        updateTP.mutate({ name, payload: { [field]: value } })
    }

    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: 9,
        border: "1px solid var(--t-border)", background: "var(--t-surface)",
        fontSize: 13, color: "var(--t-text)", outline: "none", fontFamily: "monospace",
    }

    return (
        <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid var(--t-border)", background: "var(--t-card)",
            marginBottom: 10, transition: "all .15s",
            boxShadow: open ? "0 2px 12px var(--t-shadow)" : "none",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }}
                onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 11,
                        background: prov.enabled ? "var(--t-success-soft)" : "var(--t-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                    }}>
                        <Mic size={18} style={{ color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)" }} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{displayName}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                background: prov.enabled ? "var(--t-success-soft)" : "var(--t-surface)",
                                color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)",
                            }}>{prov.enabled ? "مُفعّل" : "مُعطّل"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                            {prov.engine || "standard"} • {prov.output_format || "mp3"} {prov.voice_id ? `• ${prov.voice_id}` : ""}
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Toggle on={prov.enabled} onToggle={() => patch("enabled", !prov.enabled)} size="sm" />
                    <ChevronDown size={16} style={{ color: "var(--t-text-faint)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
                </div>
            </div>

            {/* Body */}
            {open && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--t-border-light)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 16 }}>
                        {/* Region & Voice */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                <Globe size={11} /> المنطقة والصوت
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>المنطقة</label>
                                    <input style={inputStyle} dir="ltr" defaultValue={prov.region_name || ""}
                                        onBlur={e => { if (e.target.value !== (prov.region_name || "")) patch("region_name", e.target.value) }} placeholder="us-east-1" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>معرّف الصوت</label>
                                    <input style={inputStyle} dir="ltr" defaultValue={prov.voice_id || ""}
                                        onBlur={e => { if (e.target.value !== (prov.voice_id || "")) patch("voice_id", e.target.value) }} placeholder="Joanna" />
                                </div>
                            </div>
                        </div>

                        {/* Engine & Format */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                <Cpu size={11} /> المحرك والصيغة
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>المحرك</label>
                                    <div style={{ display: "flex", gap: 4 }}>
                                        {(["standard", "neural"] as const).map(eng => (
                                            <button key={eng} onClick={() => patch("engine", eng)} style={{
                                                flex: 1, padding: "9px 0", borderRadius: 9,
                                                border: "1px solid", cursor: "pointer", fontSize: 12, fontWeight: 600,
                                                transition: "all .12s",
                                                borderColor: prov.engine === eng ? "var(--t-accent)" : "var(--t-border)",
                                                background: prov.engine === eng ? "var(--t-accent)" : "var(--t-surface)",
                                                color: prov.engine === eng ? "var(--t-text-on-accent)" : "var(--t-text-muted)",
                                            }}>
                                                {eng === "neural" ? "🧠 Neural" : "⚡ Standard"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>صيغة الإخراج</label>
                                    <select style={{ ...inputStyle, fontFamily: "inherit", appearance: "auto" as any }}
                                        value={prov.output_format || "mp3"} onChange={e => patch("output_format", e.target.value)}>
                                        <option value="mp3">MP3</option>
                                        <option value="ogg_vorbis">OGG Vorbis</option>
                                        <option value="pcm">PCM</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Credentials */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                <KeyRound size={11} /> بيانات الاعتماد
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>مفتاح الوصول</label>
                                    <input style={inputStyle} dir="ltr" defaultValue={prov.access_key_id || ""}
                                        onBlur={e => { if (e.target.value !== (prov.access_key_id || "")) patch("access_key_id", e.target.value) }} placeholder="AKIA..." />
                                </div>
                                <div>
                                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>المفتاح السري</label>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <input type={showSecret ? "text" : "password"} style={{ ...inputStyle, flex: 1 }} dir="ltr"
                                            defaultValue={prov.secret_access_key || ""}
                                            onBlur={e => { if (e.target.value !== (prov.secret_access_key || "")) patch("secret_access_key", e.target.value) }} placeholder="●●●●●●" />
                                        <button onClick={() => setShowSecret(!showSecret)} style={{
                                            width: 38, height: 38, borderRadius: 9, border: "1px solid var(--t-border)",
                                            background: "var(--t-surface)", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)",
                                        }}>
                                            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN TTS TAB
   ══════════════════════════════════════════════════════════════ */
export function TTSTab() {
    const { data: tts, isLoading, isError, error, refetch, isRefetching } = useTTSSettings()
    const updateTTS = useUpdateTTSSettings()
    const toggleTTSMut = useToggleTTS()

    if (isLoading) return <Skeleton />
    if (isError && !tts) return <ErrorPanel error={error} onRetry={() => refetch()} retrying={isRefetching} />

    if (!tts || Object.keys(tts).length === 0) return (
        <div style={{
            borderRadius: 14, padding: "40px 24px", textAlign: "center",
            border: "1px dashed var(--t-border)", color: "var(--t-text-faint)",
            animation: "ttsFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 14",
                background: "var(--t-surface)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <Volume2 size={26} style={{ color: "var(--t-text-faint)" }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>لم يتم إعداد TTS</div>
            <div style={{ fontSize: 12 }}>سيتم عرض الإعدادات عند تهيئتها من الخادم</div>
        </div>
    )

    const providers = tts.providers || {}
    const providerNames = Object.keys(providers)
    const enabledCount = providerNames.filter(n => providers[n].enabled).length

    return (
        <div style={{ animation: "ttsFadeUp .3s ease-out" }}>
            <style>{CSS}</style>

            {/* Refetching */}
            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 14, overflow: "hidden", background: "var(--t-border-light)" }}>
                    <div style={{ height: "100%", width: "40%", borderRadius: 1, background: "var(--t-accent)", animation: "ttsSlide 1s ease-in-out infinite" }} />
                </div>
            )}

            {/* ═══════ HERO CARD ═══════ */}
            <div style={{
                borderRadius: 14, padding: 22, marginBottom: 20,
                background: "var(--t-card)", border: "1px solid var(--t-border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 11,
                            background: tts.enabled ? "var(--t-accent)" : "var(--t-surface)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s",
                        }}>
                            <AudioWaveform size={20} style={{ color: tts.enabled ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>تحويل النص إلى كلام</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                                {tts.enabled ? "الخدمة تعمل بكفاءة" : "الخدمة مُعطّلة حالياً"}
                            </div>
                        </div>
                    </div>
                    <Toggle on={tts.enabled} onToggle={() => toggleTTSMut.mutate(!tts.enabled)} />
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ borderRadius: 10, padding: "10px 14px", background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>المزودين النشطين</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em" }}>{enabledCount}/{providerNames.length}</div>
                    </div>
                    <div style={{ borderRadius: 10, padding: "10px 14px", background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>المزود الافتراضي</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em" }}>{tts.default_provider || "–"}</div>
                    </div>
                    <div style={{ borderRadius: 10, padding: "10px 14px", background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>الحالة</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: tts.enabled ? "var(--t-success)" : "var(--t-danger)", letterSpacing: "-0.02em" }}>{tts.enabled ? "يعمل ✓" : "مُعطّل"}</div>
                    </div>
                </div>

                {/* Default provider picker */}
                <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>المزود الافتراضي</label>
                    <select style={{
                        width: "100%", padding: "9px 12px", borderRadius: 9,
                        border: "1px solid var(--t-border)", background: "var(--t-surface)",
                        fontSize: 13, color: "var(--t-text)", outline: "none", appearance: "auto" as any,
                    }} value={tts.default_provider || ""} onChange={e => updateTTS.mutate({ default_provider: e.target.value })}>
                        <option value="">— اختر مزوداً —</option>
                        {providerNames.map(n => <option key={n} value={n}>{n.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                </div>
            </div>

            {/* ═══════ PROVIDERS ═══════ */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mic size={15} style={{ color: "var(--t-text-muted)" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>مزودي الصوت</span>
                    </div>
                    {providerNames.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "3px 10px", borderRadius: 20 }}>
                            {providerNames.length}
                        </span>
                    )}
                </div>

                {providerNames.length === 0 ? (
                    <div style={{ borderRadius: 12, padding: "28px 0", textAlign: "center", border: "1px dashed var(--t-border)", color: "var(--t-text-faint)" }}>
                        <Volume2 size={20} style={{ margin: "0 auto 8px", display: "block" }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>لا يوجد مزودون</div>
                    </div>
                ) : (
                    providerNames.map(name => <TTSProviderCard key={name} name={name} prov={providers[name]} />)
                )}
            </div>
        </div>
    )
}
