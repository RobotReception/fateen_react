import { useState } from "react"
import {
    Palette, RotateCcw, Sun, Moon, Check, Copy,
    Sparkles, ShieldAlert, AlertTriangle, Info, Droplets,
} from "lucide-react"
import {
    useThemeStore, DEFAULT_COLORS, DEFAULT_COLORS_DARK,
    type ThemeColorKey,
} from "@/stores/theme-store"

/* ── CSS ── */
const CSS = `
@keyframes thFadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`

/* ── Color groups ── */
const COLOR_GROUPS = [
    {
        title: "اللون الأساسي",
        desc: "اللون الرئيسي للأزرار والعناصر النشطة والتبديلات",
        icon: Palette,
        keys: [
            { key: "accent" as ThemeColorKey, label: "الأساسي", showPicker: true },
            { key: "accent-hover" as ThemeColorKey, label: "عند التمرير", showPicker: true },
            { key: "text-on-accent" as ThemeColorKey, label: "نص فوق الأساسي", showPicker: true },
        ],
    },
    {
        title: "ألوان الحالات",
        desc: "ألوان النجاح والتحذير والخطأ والمعلومات",
        icon: Sparkles,
        keys: [
            { key: "success" as ThemeColorKey, label: "نجاح", showPicker: true },
            { key: "warning" as ThemeColorKey, label: "تحذير", showPicker: true },
            { key: "danger" as ThemeColorKey, label: "خطأ", showPicker: true },
            { key: "info" as ThemeColorKey, label: "معلومات", showPicker: true },
        ],
    },
] as const

/* ── Hex validation ── */
function isValidHex(v: string) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

/* ── Compute soft variant from hex ── */
function hexToSoft(hex: string, opacity = 0.08): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/* ── Compute a slightly lighter/darker shade ── */
function shadeHex(hex: string, amount: number): string {
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    r = Math.min(255, Math.max(0, r + amount))
    g = Math.min(255, Math.max(0, g + amount))
    b = Math.min(255, Math.max(0, b + amount))
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

/* ── Determine readable text color ── */
function contrastText(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.5 ? "#111827" : "#ffffff"
}

/* ══════════════════════════════════════
   COLOR SWATCH EDITOR
   ══════════════════════════════════════ */
function ColorEditor({ colorKey, label, showPicker }: {
    colorKey: ThemeColorKey; label: string; showPicker: boolean
}) {
    const { theme, customColors, customColorsDark, setColor, setColorDark } = useThemeStore()
    const isDark = theme === "dark"
    const defaults = isDark ? DEFAULT_COLORS_DARK : DEFAULT_COLORS
    const overrides = isDark ? customColorsDark : customColors
    const setFn = isDark ? setColorDark : setColor

    const currentValue = (overrides[colorKey] || defaults[colorKey]) as string
    const isOverridden = !!overrides[colorKey]
    const [editing, setEditing] = useState(false)
    const [hexInput, setHexInput] = useState(currentValue)
    const [copied, setCopied] = useState(false)

    function handleColorChange(hex: string) {
        setFn(colorKey, hex)
        setHexInput(hex)

        // Auto-derive related tokens
        if (colorKey === "accent") {
            setFn("accent-hover", shadeHex(hex, isDark ? -15 : 20))
            setFn("accent-muted", hexToSoft(hex, 0.08))
            setFn("text-on-accent", contrastText(hex))
        }
        if (colorKey === "success") setFn("success-soft", hexToSoft(hex, isDark ? 0.12 : 0.08))
        if (colorKey === "warning") setFn("warning-soft", hexToSoft(hex, isDark ? 0.12 : 0.08))
        if (colorKey === "danger") setFn("danger-soft", hexToSoft(hex, isDark ? 0.1 : 0.06))
        if (colorKey === "info") setFn("info-soft", hexToSoft(hex, isDark ? 0.12 : 0.08))
    }

    function handleHexSubmit() {
        if (isValidHex(hexInput)) {
            handleColorChange(hexInput)
        }
        setEditing(false)
    }

    function copyHex() {
        navigator.clipboard.writeText(currentValue)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
    }

    function resetToDefault() {
        // Remove override for this key (and related soft variants)
        const current = isDark ? { ...customColorsDark } : { ...customColors }
        delete current[colorKey]
        if (colorKey === "accent") {
            delete current["accent-hover"]
            delete current["accent-muted"]
            delete current["text-on-accent"]
        }
        if (colorKey === "success") delete current["success-soft"]
        if (colorKey === "warning") delete current["warning-soft"]
        if (colorKey === "danger") delete current["danger-soft"]
        if (colorKey === "info") delete current["info-soft"]
        // We need to apply through the store
        if (isDark) {
            useThemeStore.setState({ customColorsDark: current })
        } else {
            useThemeStore.setState({ customColors: current })
        }
        // Re-apply
        const root = document.documentElement
        const keysToReset = [colorKey] as ThemeColorKey[]
        if (colorKey === "accent") keysToReset.push("accent-hover", "accent-muted", "text-on-accent")
        if (colorKey === "success") keysToReset.push("success-soft")
        if (colorKey === "warning") keysToReset.push("warning-soft")
        if (colorKey === "danger") keysToReset.push("danger-soft")
        if (colorKey === "info") keysToReset.push("info-soft")
        for (const k of keysToReset) {
            root.style.removeProperty(`--t-${k}`)
        }
        setHexInput(defaults[colorKey] as string)
    }

    if (!showPicker) return null

    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 10,
            border: "1px solid var(--t-border)", background: "var(--t-card)",
            transition: "all .12s",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Color swatch + native picker */}
                <label style={{
                    width: 36, height: 36, borderRadius: 9, cursor: "pointer",
                    background: currentValue, border: "2px solid var(--t-border)",
                    position: "relative", overflow: "hidden",
                    boxShadow: `0 0 0 1px var(--t-card), 0 2px 6px ${hexToSoft(currentValue.startsWith("#") ? currentValue : "#111827", 0.25)}`,
                    transition: "all .12s",
                }}>
                    <input
                        type="color"
                        value={currentValue.startsWith("#") ? currentValue : "#111827"}
                        onChange={e => handleColorChange(e.target.value)}
                        style={{
                            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                            opacity: 0, cursor: "pointer",
                        }}
                    />
                </label>

                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {editing ? (
                            <input
                                autoFocus
                                value={hexInput}
                                onChange={e => setHexInput(e.target.value)}
                                onBlur={handleHexSubmit}
                                onKeyDown={e => { if (e.key === "Enter") handleHexSubmit() }}
                                dir="ltr"
                                style={{
                                    width: 80, padding: "2px 6px", borderRadius: 5,
                                    border: "1px solid", fontSize: 11, fontFamily: "monospace",
                                    borderColor: isValidHex(hexInput) ? "var(--t-accent)" : "var(--t-danger)",
                                    background: "var(--t-surface)", color: "var(--t-text)",
                                    outline: "none",
                                }}
                            />
                        ) : (
                            <button onClick={() => { setHexInput(currentValue); setEditing(true) }} style={{
                                fontSize: 11, fontFamily: "monospace", color: "var(--t-text-faint)",
                                background: "none", border: "none", cursor: "pointer", padding: 0,
                                transition: "color .1s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = "var(--t-text)" }}
                                onMouseLeave={e => { e.currentTarget.style.color = "var(--t-text-faint)" }}>
                                {currentValue}
                            </button>
                        )}
                        <button onClick={copyHex} title="نسخ" style={{
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            color: copied ? "var(--t-success)" : "var(--t-text-faint)",
                            lineHeight: 1, transition: "color .1s",
                        }}>
                            {copied ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {isOverridden && (
                    <button onClick={resetToDefault} title="استعادة الافتراضي" style={{
                        width: 28, height: 28, borderRadius: 7, border: "1px solid var(--t-border)",
                        background: "var(--t-surface)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--t-text-faint)", transition: "all .1s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)"; e.currentTarget.style.color = "var(--t-text)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--t-surface)"; e.currentTarget.style.color = "var(--t-text-faint)" }}>
                        <RotateCcw size={11} />
                    </button>
                )}
                {isOverridden && (
                    <span style={{
                        fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                        background: "var(--t-accent-muted)", color: "var(--t-text-muted)",
                    }}>مخصّص</span>
                )}
            </div>
        </div>
    )
}

/* ══════════════════════════════════════
   PRESET PALETTE
   ══════════════════════════════════════ */
const PRESETS = [
    { name: "الافتراضي", accent: "#111827", accentDark: "#e2e8f0" },
    { name: "أزرق كلاسيكي", accent: "#2563eb", accentDark: "#60a5fa" },
    { name: "بنفسجي أنيق", accent: "#7c3aed", accentDark: "#a78bfa" },
    { name: "وردي حيوي", accent: "#db2777", accentDark: "#f472b6" },
    { name: "سماوي", accent: "#0891b2", accentDark: "#22d3ee" },
    { name: "أخضر طبيعي", accent: "#059669", accentDark: "#34d399" },
    { name: "برتقالي دافئ", accent: "#ea580c", accentDark: "#fb923c" },
    { name: "أحمر جريء", accent: "#dc2626", accentDark: "#f87171" },
]

/* ══════════════════════════════════════
   LIVE PREVIEW
   ══════════════════════════════════════ */
function LivePreview() {
    return (
        <div style={{
            borderRadius: 12, padding: 16,
            background: "var(--t-surface)", border: "1px solid var(--t-border-light)",
        }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                معاينة مباشرة
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Button preview */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                        fontSize: 12, fontWeight: 600, cursor: "default",
                    }}>زر أساسي</button>
                    <button style={{
                        padding: "8px 18px", borderRadius: 8,
                        border: "1px solid var(--t-border)", background: "var(--t-card)",
                        color: "var(--t-text)", fontSize: 12, fontWeight: 500, cursor: "default",
                    }}>زر ثانوي</button>
                </div>

                {/* Status badges */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                        { label: "نجاح", bg: "var(--t-success-soft)", color: "var(--t-success)", icon: Check },
                        { label: "تحذير", bg: "var(--t-warning-soft)", color: "var(--t-warning)", icon: AlertTriangle },
                        { label: "خطأ", bg: "var(--t-danger-soft)", color: "var(--t-danger)", icon: ShieldAlert },
                        { label: "معلومات", bg: "var(--t-info-soft)", color: "var(--t-info)", icon: Info },
                    ].map(s => (
                        <span key={s.label} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "4px 10px", borderRadius: 6,
                            background: s.bg, color: s.color, fontSize: 11, fontWeight: 600,
                        }}>
                            <s.icon size={10} /> {s.label}
                        </span>
                    ))}
                </div>

                {/* Toggle preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 20, borderRadius: 20, position: "relative",
                        background: "var(--t-accent)",
                    }}>
                        <span style={{
                            position: "absolute", top: 3, left: 19,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "var(--t-text-on-accent)",
                            boxShadow: "0 1px 3px rgba(0,0,0,.12)",
                        }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>مُفعّل</span>

                    <div style={{
                        width: 36, height: 20, borderRadius: 20, position: "relative",
                        background: "var(--t-border)",
                    }}>
                        <span style={{
                            position: "absolute", top: 3, left: 3,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,.12)",
                        }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--t-text-muted)" }}>مُعطّل</span>
                </div>

                {/* Input preview */}
                <div style={{
                    padding: "8px 12px", borderRadius: 8,
                    border: "2px solid var(--t-accent)",
                    background: "var(--t-surface)", fontSize: 12, color: "var(--t-text)",
                    boxShadow: "0 0 0 3px var(--t-accent-muted)",
                }}>
                    حقل إدخال نشط
                </div>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════
   MAIN THEME TAB
   ══════════════════════════════════════ */
export function ThemeTab() {
    const { theme, setColor, setColorDark, resetColors, resetColorsDark } = useThemeStore()
    const isDark = theme === "dark"

    function applyPreset(preset: typeof PRESETS[0]) {
        const accent = isDark ? preset.accentDark : preset.accent
        const hover = shadeHex(accent, isDark ? -15 : 20)
        const muted = hexToSoft(accent, 0.08)
        const textOn = contrastText(accent)

        const setFn = isDark ? setColorDark : setColor
        setFn("accent", accent)
        setFn("accent-hover", hover)
        setFn("accent-muted", muted)
        setFn("text-on-accent", textOn)
    }

    function handleResetAll() {
        if (isDark) resetColorsDark()
        else resetColors()
    }

    return (
        <div style={{ animation: "thFadeUp .3s ease-out" }}>
            <style>{CSS}</style>

            {/* ── Header card ── */}
            <div style={{
                borderRadius: 14, padding: 22, marginBottom: 18,
                background: "var(--t-card)", border: "1px solid var(--t-border)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 11,
                            background: "var(--t-accent)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Palette size={20} style={{ color: "var(--t-text-on-accent)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>
                                تخصيص المظهر
                            </div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                                غيّر ألوان الواجهة لتتناسب مع هوية شركتك • {isDark ? "الوضع الداكن" : "الوضع الفاتح"}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleResetAll} style={{
                        padding: "8px 16px", borderRadius: 9,
                        border: "1px solid var(--t-border)", background: "var(--t-card)",
                        color: "var(--t-text-muted)", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                        transition: "all .12s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = "var(--t-card-hover)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "var(--t-card)" }}>
                        <RotateCcw size={12} /> استعادة الافتراضي
                    </button>
                </div>

                {/* Mode indicator */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 8,
                    background: "var(--t-surface)", fontSize: 11, fontWeight: 600,
                    color: "var(--t-text-muted)",
                }}>
                    {isDark ? <Moon size={12} /> : <Sun size={12} />}
                    أنت تعدّل ألوان {isDark ? "الوضع الداكن" : "الوضع الفاتح"} — بدّل الوضع لتعديل الآخر
                </div>
            </div>

            {/* ── Quick presets ── */}
            <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <Droplets size={14} style={{ color: "var(--t-text-muted)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>ألوان سريعة</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PRESETS.map(p => {
                        const previewColor = isDark ? p.accentDark : p.accent
                        return (
                            <button key={p.name} onClick={() => applyPreset(p)} style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "8px 14px", borderRadius: 9,
                                border: "1px solid var(--t-border)", background: "var(--t-card)",
                                cursor: "pointer", fontSize: 12, fontWeight: 500,
                                color: "var(--t-text)", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = previewColor; e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToSoft(previewColor, 0.2)}` }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.boxShadow = "none" }}>
                                <span style={{
                                    width: 16, height: 16, borderRadius: 5,
                                    background: previewColor,
                                    border: "1px solid rgba(0,0,0,0.08)",
                                }} />
                                {p.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Color groups ── */}
            {COLOR_GROUPS.map(group => (
                <div key={group.title} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                        <group.icon size={14} style={{ color: "var(--t-text-muted)" }} />
                        <div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{group.title}</span>
                            <span style={{ fontSize: 11, color: "var(--t-text-faint)", marginRight: 8 }}> — {group.desc}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {group.keys.map(k => (
                            <ColorEditor key={k.key} colorKey={k.key} label={k.label} showPicker={k.showPicker} />
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Live preview ── */}
            <LivePreview />
        </div>
    )
}
