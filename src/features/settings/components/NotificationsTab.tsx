import { useState, useCallback } from "react"
import {
    Bell, Volume2, VolumeX, Zap, Play, Check, Music,
} from "lucide-react"
import {
    isSoundEnabled, setSoundEnabled,
    getSoundVolume, setSoundVolume,
    getSelectedTone, setSelectedTone,
    playTonePreset, TONE_PRESETS,
} from "@/features/notifications/hooks/use-notification-sound"

const CSS = `@keyframes notifFade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`

const card: React.CSSProperties = {
    borderRadius: 12, background: "var(--t-card, #fff)",
    border: "1px solid var(--t-border-light, #eaedf0)",
}

const sectionHeader: React.CSSProperties = {
    padding: "14px 22px",
    borderBottom: "1px solid var(--t-border-light, #eaedf0)",
    display: "flex", alignItems: "center", gap: 8,
}

export function NotificationsTab() {
    const [soundOn, setSoundOn] = useState(isSoundEnabled)
    const [volume, setVolume] = useState(getSoundVolume)
    const [tone, setTone] = useState(getSelectedTone)

    const toggleSound = useCallback(() => {
        const next = !soundOn
        setSoundOn(next)
        setSoundEnabled(next)
    }, [soundOn])

    const handleVolume = useCallback((val: number) => {
        setVolume(val)
        setSoundVolume(val)
    }, [])

    const selectTone = useCallback((id: string) => {
        setTone(id)
        setSelectedTone(id)
        playTonePreset(id)
    }, [])

    const testSound = useCallback(() => {
        playTonePreset(tone, volume)
    }, [tone, volume])

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "notifFade .3s ease-out" }}>
            <style>{CSS}</style>

            {/* ═══ 1. SOUND TOGGLE ═══ */}
            <div style={card}>
                <div style={sectionHeader}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: soundOn ? "rgba(27,80,145,0.06)" : "rgba(107,114,128,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {soundOn ? <Volume2 size={14} style={{ color: "var(--t-accent)" }} /> : <VolumeX size={14} style={{ color: "var(--t-text-faint)" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>إعدادات الصوت</span>
                    <span style={{
                        fontSize: 9, fontWeight: 600,
                        color: soundOn ? "#16a34a" : "var(--t-text-faint)",
                        background: soundOn ? "rgba(34,197,94,0.06)" : "rgba(107,114,128,0.06)",
                        padding: "2px 8px", borderRadius: 4,
                    }}>{soundOn ? "مفعّل" : "معطّل"}</span>
                </div>
                <div style={{ padding: "14px 22px" }}>
                    {/* Toggle */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: 10,
                        background: "var(--t-surface, var(--t-page))",
                        marginBottom: soundOn ? 14 : 0,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: soundOn ? "rgba(27,80,145,0.08)" : "rgba(107,114,128,0.06)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {soundOn ? <Volume2 size={15} style={{ color: "var(--t-accent)" }} /> : <VolumeX size={15} style={{ color: "var(--t-text-faint)" }} />}
                            </div>
                            <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>أصوات الإشعارات</div>
                                <div style={{ fontSize: 10.5, color: "var(--t-text-faint)", marginTop: 1 }}>تشغيل صوت عند وصول رسالة أو إشعار جديد</div>
                            </div>
                        </div>
                        <button onClick={toggleSound} style={{
                            width: 42, height: 22, borderRadius: 22,
                            background: soundOn ? "var(--t-accent)" : "var(--t-border-medium)",
                            border: "none", cursor: "pointer",
                            position: "relative", transition: "background .2s", flexShrink: 0,
                        }}>
                            <div style={{
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                position: "absolute", top: 2,
                                left: soundOn ? 22 : 2,
                                transition: "left .2s",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            }} />
                        </button>
                    </div>

                    {/* Volume slider */}
                    {soundOn && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: "var(--t-surface, var(--t-page))",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-text, #1f2937)" }}>مستوى الصوت</span>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: "var(--t-accent)",
                                    background: "rgba(27,80,145,0.06)", padding: "2px 10px", borderRadius: 6,
                                }}>{volume}%</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <VolumeX size={13} style={{ color: "var(--t-text-faint)", flexShrink: 0 }} />
                                <input type="range" min={0} max={100} step={5} value={volume}
                                    onChange={e => handleVolume(Number(e.target.value))}
                                    style={{ flex: 1, height: 4, cursor: "pointer", accentColor: "var(--t-accent)" }}
                                />
                                <Volume2 size={13} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ 2. TONE SELECTION ═══ */}
            {soundOn && (
                <div style={card}>
                    <div style={sectionHeader}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: "linear-gradient(135deg, rgba(27,80,145,0.08), rgba(77,166,232,0.06))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Music size={14} style={{ color: "var(--t-accent)" }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text, var(--t-text))" }}>نغمة الإشعار</span>
                        <span style={{ flex: 1 }} />
                        <button onClick={testSound} style={{
                            padding: "4px 12px", borderRadius: 6, cursor: "pointer",
                            border: "1px solid rgba(27,80,145,0.12)",
                            background: "rgba(27,80,145,0.03)",
                            color: "var(--t-accent)", fontSize: 10.5, fontWeight: 600,
                            display: "flex", alignItems: "center", gap: 4,
                            transition: "all .12s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(27,80,145,0.07)" }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(27,80,145,0.03)" }}
                        >
                            <Play size={10} /> تجربة
                        </button>
                    </div>
                    <div style={{ padding: "14px 22px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            {TONE_PRESETS.map(preset => {
                                const isSelected = tone === preset.id
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => selectTone(preset.id)}
                                        style={{
                                            padding: "12px 10px", borderRadius: 10, cursor: "pointer",
                                            border: isSelected
                                                ? "2px solid var(--t-accent)"
                                                : "1.5px solid var(--t-border-light, #eaedf0)",
                                            background: isSelected
                                                ? "rgba(27,80,145,0.03)"
                                                : "var(--t-surface, #fafbfc)",
                                            transition: "all .15s",
                                            position: "relative",
                                            textAlign: "center",
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) e.currentTarget.style.borderColor = "rgba(27,80,145,0.3)"
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) e.currentTarget.style.borderColor = "var(--t-border-light, #eaedf0)"
                                        }}
                                    >
                                        {/* Selected check */}
                                        {isSelected && (
                                            <div style={{
                                                position: "absolute", top: 6, left: 6,
                                                width: 16, height: 16, borderRadius: "50%",
                                                background: "var(--t-brand-orange)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Check size={10} style={{ color: "#fff" }} />
                                            </div>
                                        )}
                                        {/* Tone icon — visual representation */}
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: isSelected
                                                ? "rgba(27,80,145,0.08)"
                                                : "rgba(107,114,128,0.04)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto 6px",
                                        }}>
                                            <ToneVisual notes={preset.notes.length} selected={isSelected} />
                                        </div>
                                        <div style={{
                                            fontSize: 12, fontWeight: isSelected ? 700 : 600,
                                            color: isSelected ? "var(--t-accent)" : "var(--t-text, #1f2937)",
                                        }}>{preset.name}</div>
                                        <div style={{
                                            fontSize: 9.5, color: "var(--t-text-faint)", marginTop: 2,
                                        }}>{preset.desc}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ 3. COMING SOON ═══ */}
            <div style={{ ...card, padding: "36px 24px", textAlign: "center" }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(27,80,145,0.06), rgba(77,166,232,0.06))",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                }}>
                    <Bell size={20} style={{ color: "var(--t-accent)" }} />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text, #1f2937)", margin: "0 0 3px" }}>
                    تفضيلات الإشعارات المتقدمة
                </h4>
                <p style={{ fontSize: 12, color: "var(--t-text-faint, var(--t-text-faint))", margin: 0, maxWidth: 280, marginInline: "auto" }}>
                    التحكم في أنواع الإشعارات عبر البريد والتطبيق
                </p>
                <div style={{
                    marginTop: 10, display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 14px", borderRadius: 6,
                    background: "rgba(27,80,145,0.04)", border: "1px solid rgba(27,80,145,0.08)",
                    fontSize: 11, fontWeight: 600, color: "var(--t-accent)",
                }}>
                    <Zap size={9} style={{ color: "var(--t-accent-light)" }} />
                    قريباً
                </div>
            </div>
        </div>
    )
}

/* ── Visual representation of tone notes ── */
function ToneVisual({ notes, selected }: { notes: number; selected: boolean }) {
    const color = selected ? "var(--t-accent)" : "var(--t-text-faint)"
    return (
        <div style={{ display: "flex", alignItems: "end", gap: 2, height: 16 }}>
            {Array.from({ length: notes }).map((_, i) => (
                <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: 6 + (i * 3),
                    background: color,
                    opacity: 0.5 + (i * 0.15),
                    transition: "all .15s",
                }} />
            ))}
        </div>
    )
}
