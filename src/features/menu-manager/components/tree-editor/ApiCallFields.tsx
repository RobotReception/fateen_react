import React, { useState } from "react"
import { Plus, X, ChevronDown, ChevronUp, Globe, Send, Shield, Layers, FileText, Settings, Zap, Database, AlertCircle } from "lucide-react"
import { LIMITS } from "./validation"

/* ═══════════════════════════════════════════════════════════════
   Types — must match ContentFormState from index.tsx
   ═══════════════════════════════════════════════════════════════ */
export interface ApiInputState {
    key: string; label: string; type: string; required: boolean; order: number
    prompt_message: string; error_message: string; placeholder: string; default_value: string
    validation_regex: string; min_value: string; max_value: string; min_length: string; max_length: string; type_error: string
    options: { value: string; label: string }[]; display_as: string
    options_source: string; image_analysis: string; api_call_config: string
    trigger_after: string; depends_on: string; show_condition: string
    formula: string; accepted_types: string; max_size_mb: string
    display_in_summary: boolean; filter_options: boolean
    cross_validation: string; default_when: string
}

export interface ApiCallFormData {
    apiUrl: string; apiMethod: string; apiTimeout: number; apiRetryCount: number
    apiExecMode: string; apiCollectionStrategy: string; apiInitialMsg: string
    apiHeaders: string; apiBodyTemplate: string; apiQueryParams: string
    apiSuccessTemplate: string; apiErrorTemplate: string
    apiAuthType: string; apiAuthConfig: string
    apiRequiresConfirmation: boolean; apiConfirmationTemplate: string
    apiResponseType: string; apiResponseMapping: string
    apiConditionalResponses: { condition: string; template: string }[]
    apiMediaUrlPath: string; apiMediaType: string; apiMediaCaptionTemplate: string
    apiIntentDescription: string
    apiInputs: ApiInputState[]
    reply: string
}

/* ═══════════════════════════════════════════════════════════════
   Design Tokens
   ═══════════════════════════════════════════════════════════════ */
const T = {
    radius: 10,
    font: "'Inter', 'Segoe UI', system-ui, sans-serif",
    mono: "'Fira Code', 'Cascadia Code', monospace",
    bg: "var(--t-surface, var(--t-page, #f8fafc))",
    card: "var(--t-card, #fff)",
    border: "var(--t-border-light, var(--t-border, #e2e8f0))",
    text: "var(--t-text, #1e293b)",
    textSec: "var(--t-text-secondary, var(--t-text-muted, #64748b))",
    textFaint: "var(--t-text-faint, #94a3b8)",
    accent: "var(--t-accent, #6366f1)",
    danger: "#ef4444",
    success: "#22c55e",
}

const SECTION_THEMES: Record<string, { gradient: string; icon: string; color: string }> = {
    connection: { gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", icon: "#4f46e5", color: "#4f46e5" },
    execution: { gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", icon: "#7c3aed", color: "#7c3aed" },
    inputs: { gradient: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)", icon: "#0891b2", color: "#0891b2" },
    request: { gradient: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", icon: "#059669", color: "#059669" },
    response: { gradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", icon: "#2563eb", color: "#2563eb" },
    settings: { gradient: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", icon: "#64748b", color: "#64748b" },
}

const INPUT_TYPES: Record<string, { color: string; bg: string; label: string }> = {
    text: { color: "#059669", bg: "#ecfdf5", label: "نص" },
    number: { color: "#2563eb", bg: "#eff6ff", label: "رقم" },
    email: { color: "#7c3aed", bg: "#f5f3ff", label: "بريد" },
    phone: { color: "#0891b2", bg: "#ecfeff", label: "هاتف" },
    select: { color: "#c2410c", bg: "#fff7ed", label: "اختيار" },
    select_api: { color: "#9333ea", bg: "#faf5ff", label: "اختيار API" },
    date: { color: "#b45309", bg: "#fffbeb", label: "تاريخ" },
    image: { color: "#dc2626", bg: "#fef2f2", label: "صورة" },
    file: { color: "#4f46e5", bg: "#eef2ff", label: "ملف" },
    api_enrichment: { color: "#0d9488", bg: "#f0fdfa", label: "إثراء API" },
    computed: { color: "#64748b", bg: "#f8fafc", label: "محسوب" },
}

/* ═══════════════════════════════════════════════════════════════
   Shared UI Primitives
   ═══════════════════════════════════════════════════════════════ */
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11.5, fontWeight: 600,
    color: T.textSec, marginBottom: 4, userSelect: "none",
}
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.card, color: T.text,
    fontSize: 12.5, outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: T.font,
}
const monoInput: React.CSSProperties = { ...inputStyle, fontFamily: T.mono, fontSize: 12 }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer", appearance: "auto" as const }
const textareaStyle: React.CSSProperties = {
    ...inputStyle, resize: "vertical" as const, minHeight: 56, lineHeight: 1.6,
}

const Lbl = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
    <label style={labelStyle}>
        {children}
        {hint && <span style={{ fontWeight: 400, opacity: 0.6, marginRight: 4 }}> ({hint})</span>}
    </label>
)
const Row2 = ({ children, gap = 10 }: { children: React.ReactNode; gap?: number }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap, marginBottom: 10 }}>{children}</div>
)

/* ── Collapsible Section ── */
function Section({ id, icon, title, children, defaultOpen = true, badge, extra }: {
    id: string; icon: React.ReactNode; title: string; children: React.ReactNode
    defaultOpen?: boolean; badge?: string; extra?: React.ReactNode
}) {
    const [open, setOpen] = useState(defaultOpen)
    const theme = SECTION_THEMES[id] || SECTION_THEMES.settings
    return (
        <div style={{
            borderRadius: T.radius + 2, overflow: "hidden",
            border: `1px solid ${T.border}`,
            boxShadow: open ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
            transition: "box-shadow 0.3s",
            marginBottom: 8,
        }}>
            <button onClick={() => setOpen(!open)} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "11px 16px", border: "none", cursor: "pointer",
                background: open ? theme.gradient : T.card,
                borderBottom: open ? `1px solid ${T.border}` : "none",
                transition: "all 0.25s ease",
            }}>
                <span style={{ display: "flex", alignItems: "center", color: theme.icon }}>{icon}</span>
                <span style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{title}</span>
                {badge && <span style={{
                    fontSize: 10, padding: "2px 10px", borderRadius: 12,
                    background: theme.color, color: "#fff", fontWeight: 700,
                }}>{badge}</span>}
                {extra}
                {open ? <ChevronUp size={14} color={T.textSec} /> : <ChevronDown size={14} color={T.textSec} />}
            </button>
            <div style={{
                maxHeight: open ? 5000 : 0, overflow: "hidden",
                transition: "max-height 0.35s ease",
            }}>
                <div style={{ padding: 16 }}>{children}</div>
            </div>
        </div>
    )
}

/* ── Key-Value Pair Editor ── */
function KVEditor({ value, onChange, keyPlaceholder, valuePlaceholder, label, hint }: {
    value: string; onChange: (v: string) => void
    keyPlaceholder?: string; valuePlaceholder?: string; label: string; hint?: string
}) {
    const parsePairs = (raw: string): { k: string; v: string }[] => {
        try {
            const obj = JSON.parse(raw || "{}")
            return Object.entries(obj).map(([k, v]) => ({ k, v: String(v) }))
        } catch { return [] }
    }

    const [pairs, setPairs] = React.useState<{ k: string; v: string }[]>(() => parsePairs(value))

    // Sync from parent when value changes externally
    React.useEffect(() => {
        const parsed = parsePairs(value)
        // Only sync if the serialized forms differ (avoid loops)
        const currentJson = serializeToJson(pairs)
        const newJson = serializeToJson(parsed)
        if (currentJson !== newJson && !pairs.some(p => p.k === "")) {
            setPairs(parsed)
        }
    }, [value])

    const serializeToJson = (p: { k: string; v: string }[]): string => {
        const obj: Record<string, string> = {}
        p.forEach(({ k, v }) => { if (k.trim()) obj[k.trim()] = v })
        return Object.keys(obj).length ? JSON.stringify(obj, null, 2) : ""
    }

    const commitToParent = (p: { k: string; v: string }[]) => {
        onChange(serializeToJson(p))
    }

    const updatePair = (index: number, field: "k" | "v", val: string) => {
        const n = [...pairs]
        n[index] = { ...n[index], [field]: val }
        setPairs(n)
        // Commit on every change so parent stays in sync (but we keep local state for display)
        commitToParent(n)
    }

    const deletePair = (index: number) => {
        const n = pairs.filter((_, j) => j !== index)
        setPairs(n)
        commitToParent(n)
    }

    const addPair = () => {
        setPairs([...pairs, { k: "", v: "" }])
        // Don't commit yet — the key is empty so nothing to serialize
    }

    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Lbl hint={hint}>{label}</Lbl>
            </div>
            {pairs.map((pair, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                    <input value={pair.k} onChange={e => updatePair(i, "k", e.target.value)}
                        placeholder={keyPlaceholder || "key"} dir="ltr"
                        style={{ ...monoInput, width: "35%", padding: "6px 10px", fontSize: 11.5 }} />
                    <input value={pair.v} onChange={e => updatePair(i, "v", e.target.value)}
                        placeholder={valuePlaceholder || "value"} dir="ltr"
                        style={{ ...monoInput, flex: 1, padding: "6px 10px", fontSize: 11.5 }} />
                    <button onClick={() => deletePair(i)}
                        style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: T.danger, opacity: 0.6 }}>
                        <X size={13} />
                    </button>
                </div>
            ))}
            <button onClick={addPair}
                style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 11, color: T.accent, background: "none",
                    border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600,
                }}>
                <Plus size={12} /> إضافة
            </button>
        </div>
    )
}

/* ── Context Variables Helper ── */
function ContextVarsBanner() {
    const [show, setShow] = useState(false)
    const vars = [
        { name: "{{sender_id}}", desc: "رقم هاتف العميل" },
        { name: "{{platform}}", desc: "المنصة (whatsapp)" },
        { name: "{{platform_id}}", desc: "معرف حساب الأعمال" },
        { name: "{{tenant_id}}", desc: "معرف المستأجر" },
    ]
    return (
        <div style={{
            margin: "0 0 10px", padding: "8px 12px", borderRadius: 8,
            background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
            border: "1px solid #fde68a", fontSize: 11,
        }}>
            <button onClick={() => setShow(!show)} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: 0, color: "#92400e", fontWeight: 600, fontSize: 11,
            }}>
                <Zap size={12} />
                <span>متغيرات السياق المتاحة</span>
                {show ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {show && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {vars.map(v => (
                        <span key={v.name} style={{
                            padding: "3px 8px", borderRadius: 6, fontSize: 10.5,
                            background: "#fff", border: "1px solid #fde68a", color: "#78350f",
                            fontFamily: T.mono, whiteSpace: "nowrap",
                        }}>
                            {v.name} <span style={{ color: "#a16207", fontFamily: T.font }}>— {v.desc}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ── Auth Config Fields ── */
function AuthFields({ authType, authConfig, onChange }: {
    authType: string; authConfig: string; onChange: (v: string) => void
}) {
    let cfg: Record<string, string> = {}
    try { cfg = JSON.parse(authConfig || "{}") } catch { /* */ }
    const set = (patch: Record<string, string>) => onChange(JSON.stringify({ ...cfg, ...patch }, null, 2))

    if (authType === "bearer") return (
        <div>
            <Lbl hint="Token">الرمز المميز</Lbl>
            <input value={cfg.token || ""} onChange={e => set({ token: e.target.value })}
                placeholder="sk-xxxx... أو {{env_var}}" dir="ltr" type="password"
                style={{ ...monoInput, letterSpacing: 1 }} />
        </div>
    )
    if (authType === "api_key") return (
        <Row2>
            <div>
                <Lbl hint="Header Name">اسم المفتاح</Lbl>
                <input value={cfg.key_name || "X-API-Key"} onChange={e => set({ key_name: e.target.value })}
                    placeholder="X-API-Key" dir="ltr" style={monoInput} />
            </div>
            <div>
                <Lbl>قيمة المفتاح</Lbl>
                <input value={cfg.key_value || ""} onChange={e => set({ key_value: e.target.value })}
                    placeholder="sk-xxxx..." dir="ltr" type="password" style={{ ...monoInput, letterSpacing: 1 }} />
            </div>
        </Row2>
    )
    if (authType === "basic") return (
        <Row2>
            <div>
                <Lbl>اسم المستخدم</Lbl>
                <input value={cfg.username || ""} onChange={e => set({ username: e.target.value })}
                    placeholder="admin" dir="ltr" style={inputStyle} />
            </div>
            <div>
                <Lbl>كلمة المرور</Lbl>
                <input value={cfg.password || ""} onChange={e => set({ password: e.target.value })}
                    placeholder="••••••" dir="ltr" type="password" style={inputStyle} />
            </div>
        </Row2>
    )
    return null
}

/* ═══════════════════════════════════════════════════════════════
   Input Field Card (collect_data mode)
   ═══════════════════════════════════════════════════════════════ */
function InputFieldCard({ inp, index, total, onUpdate, onDelete }: {
    inp: ApiInputState; index: number; total: number
    onUpdate: (patch: Partial<ApiInputState>) => void; onDelete: () => void
}) {
    const [showAdv, setShowAdv] = useState(false)
    const badge = INPUT_TYPES[inp.type] || INPUT_TYPES.text
    return (
        <div style={{
            border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: "hidden",
            background: T.card, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                borderBottom: `1px solid ${T.border}`,
                background: `linear-gradient(135deg, ${badge.bg}, ${T.card})`,
            }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.color}22`,
                }}>{badge.label}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>
                    {inp.label || inp.key || `حقل ${index + 1}`}
                </span>
                <span style={{ fontSize: 10, color: T.textFaint }}>#{index + 1}/{total}</span>
                <button onClick={onDelete} style={{
                    padding: 3, border: "none", background: "none", cursor: "pointer", color: T.danger, opacity: 0.5,
                }}><X size={13} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px", gap: 8, marginBottom: 8 }}>
                    <div>
                        <Lbl hint="key">المفتاح</Lbl>
                        <input value={inp.key} onChange={e => onUpdate({ key: e.target.value })} placeholder="field_key" dir="ltr" style={monoInput} />
                    </div>
                    <div>
                        <Lbl>التسمية</Lbl>
                        <input value={inp.label} onChange={e => onUpdate({ label: e.target.value })} placeholder="اسم الحقل" style={inputStyle} />
                    </div>
                    <div>
                        <Lbl>النوع</Lbl>
                        <select value={inp.type} onChange={e => onUpdate({ type: e.target.value })} style={selectStyle}>
                            {Object.entries(INPUT_TYPES).map(([v, b]) => <option key={v} value={v}>{b.label}</option>)}
                        </select>
                    </div>
                </div>
                <Row2>
                    <div><Lbl>رسالة السؤال</Lbl><input value={inp.prompt_message} onChange={e => onUpdate({ prompt_message: e.target.value })} placeholder="أدخل رقم هاتفك..." style={inputStyle} /></div>
                    <div><Lbl>رسالة الخطأ</Lbl><input value={inp.error_message} onChange={e => onUpdate({ error_message: e.target.value })} placeholder="القيمة غير صحيحة" style={inputStyle} /></div>
                </Row2>
                <Row2>
                    <div><Lbl>نص توضيحي</Lbl><input value={inp.placeholder} onChange={e => onUpdate({ placeholder: e.target.value })} placeholder="placeholder" style={inputStyle} /></div>
                    <div><Lbl>قيمة افتراضية</Lbl><input value={inp.default_value} onChange={e => onUpdate({ default_value: e.target.value })} placeholder="default" dir="ltr" style={inputStyle} /></div>
                </Row2>
                {/* Checkboxes */}
                <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer" }}>
                        <input type="checkbox" checked={inp.required} onChange={e => onUpdate({ required: e.target.checked })} style={{ accentColor: T.accent }} /> مطلوب
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer" }}>
                        <input type="checkbox" checked={inp.display_in_summary} onChange={e => onUpdate({ display_in_summary: e.target.checked })} style={{ accentColor: T.accent }} /> إظهار في الملخص
                    </label>
                </div>
                {/* Type-specific: validation */}
                {["text", "number", "email", "phone", "date"].includes(inp.type) && (
                    <div style={{ padding: 8, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.textSec, marginBottom: 6 }}>🔒 التحقق</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 6 }}>
                            {inp.type === "text" && <>
                                <div><Lbl hint="min">أقل طول</Lbl><input type="number" value={inp.min_length} onChange={e => onUpdate({ min_length: e.target.value })} dir="ltr" style={inputStyle} /></div>
                                <div><Lbl hint="max">أقصى طول</Lbl><input type="number" value={inp.max_length} onChange={e => onUpdate({ max_length: e.target.value })} dir="ltr" style={inputStyle} /></div>
                            </>}
                            {["number", "date"].includes(inp.type) && <>
                                <div><Lbl>الحد الأدنى</Lbl><input value={inp.min_value} onChange={e => onUpdate({ min_value: e.target.value })} dir="ltr" style={inputStyle} /></div>
                                <div><Lbl>الحد الأقصى</Lbl><input value={inp.max_value} onChange={e => onUpdate({ max_value: e.target.value })} dir="ltr" style={inputStyle} /></div>
                            </>}
                            <div><Lbl hint="regex">نمط التحقق</Lbl><input value={inp.validation_regex} onChange={e => onUpdate({ validation_regex: e.target.value })} placeholder="^[0-9]+$" dir="ltr" style={monoInput} /></div>
                        </div>
                    </div>
                )}
                {/* Select options */}
                {inp.type === "select" && (
                    <div style={{ padding: 8, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: T.textSec }}>📋 الخيارات</span>
                            <select value={inp.display_as} onChange={e => onUpdate({ display_as: e.target.value })} style={{ ...selectStyle, width: 140, fontSize: 10, padding: "3px 6px" }}>
                                <option value="interactive_list">أزرار تفاعلية</option>
                                <option value="numbered_list">قائمة مرقمة</option>
                            </select>
                        </div>
                        {inp.options.map((opt, j) => (
                            <div key={j} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                                <input value={opt.value} onChange={e => { const opts = [...inp.options]; opts[j] = { ...opts[j], value: e.target.value }; onUpdate({ options: opts }) }}
                                    placeholder="value" dir="ltr" style={{ ...monoInput, width: 90, padding: "4px 8px", fontSize: 11 }} />
                                <input value={opt.label} onChange={e => { const opts = [...inp.options]; opts[j] = { ...opts[j], label: e.target.value }; onUpdate({ options: opts }) }}
                                    placeholder="التسمية" style={{ ...inputStyle, flex: 1, padding: "4px 8px", fontSize: 11 }} />
                                <button onClick={() => onUpdate({ options: inp.options.filter((_, k) => k !== j) })}
                                    style={{ padding: 2, border: "none", background: "none", cursor: "pointer", color: T.danger }}><X size={12} /></button>
                            </div>
                        ))}
                        <button onClick={() => onUpdate({ options: [...inp.options, { value: "", label: "" }] })}
                            style={{ fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer" }}>+ إضافة خيار</button>
                    </div>
                )}
                {/* select_api */}
                {inp.type === "select_api" && (
                    <div style={{ marginBottom: 8 }}><Lbl hint="JSON">إعدادات مصدر الخيارات</Lbl>
                        <textarea value={inp.options_source} onChange={e => onUpdate({ options_source: e.target.value })}
                            rows={3} placeholder='{"url":"...","response_path":"$.data","label_field":"name","value_field":"id"}' dir="ltr" style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11 }} /></div>
                )}
                {/* image */}
                {inp.type === "image" && (
                    <div style={{ marginBottom: 8 }}><Lbl hint="JSON">إعدادات تحليل الصورة</Lbl>
                        <textarea value={inp.image_analysis} onChange={e => onUpdate({ image_analysis: e.target.value })}
                            rows={3} placeholder='{"enabled":true,"analysis_prompt":"...","extract_fields":["name"]}' dir="ltr" style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11 }} /></div>
                )}
                {/* api_enrichment */}
                {inp.type === "api_enrichment" && (
                    <div style={{ marginBottom: 8 }}>
                        <Lbl>الحقول المسببة للتنفيذ</Lbl>
                        <input value={inp.trigger_after} onChange={e => onUpdate({ trigger_after: e.target.value })} placeholder="phone, email" dir="ltr" style={{ ...inputStyle, marginBottom: 6 }} />
                        <Lbl hint="JSON">إعدادات استدعاء الإثراء</Lbl>
                        <textarea value={inp.api_call_config} onChange={e => onUpdate({ api_call_config: e.target.value })}
                            rows={3} placeholder='{"url":"...","body":{"phone":"{{phone}}"},"auto_fill_fields":{"name":"$.data.name"}}' dir="ltr" style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11 }} />
                    </div>
                )}
                {/* computed */}
                {inp.type === "computed" && (
                    <div style={{ marginBottom: 8 }}><Lbl hint="formula">الصيغة الحسابية</Lbl>
                        <input value={inp.formula} onChange={e => onUpdate({ formula: e.target.value })} placeholder="{{amount}} * 0.15" dir="ltr" style={monoInput} /></div>
                )}
                {/* file */}
                {inp.type === "file" && (
                    <Row2><div><Lbl>أنواع مقبولة</Lbl><input value={inp.accepted_types} onChange={e => onUpdate({ accepted_types: e.target.value })} placeholder="pdf, doc" dir="ltr" style={inputStyle} /></div>
                        <div><Lbl hint="MB">حجم أقصى</Lbl><input type="number" value={inp.max_size_mb} onChange={e => onUpdate({ max_size_mb: e.target.value })} dir="ltr" style={inputStyle} /></div></Row2>
                )}
                {/* Advanced toggle */}
                <button onClick={() => setShowAdv(!showAdv)} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "4px 0",
                    border: "none", background: "none", cursor: "pointer",
                    fontSize: 10.5, color: T.accent, fontWeight: 600,
                }}>
                    <Settings size={11} />
                    {showAdv ? "إخفاء المتقدمة" : "إعدادات متقدمة"}
                    {showAdv ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                {showAdv && (
                    <div style={{ padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.border}`, marginTop: 4 }}>
                        <Row2>
                            <div><Lbl hint="depends_on">يعتمد على</Lbl><input value={inp.depends_on} onChange={e => onUpdate({ depends_on: e.target.value })} placeholder="field1, field2" dir="ltr" style={inputStyle} /></div>
                            <div><Lbl hint="show_condition">شرط الإظهار</Lbl><input value={inp.show_condition} onChange={e => onUpdate({ show_condition: e.target.value })} placeholder="type == 'premium'" dir="ltr" style={monoInput} /></div>
                        </Row2>
                        <div style={{ marginBottom: 6 }}><Lbl hint="JSON">التحقق المتقاطع</Lbl>
                            <textarea value={inp.cross_validation} onChange={e => onUpdate({ cross_validation: e.target.value })}
                                rows={2} placeholder='[{"rule":"amount > 0","error_message":"المبلغ يجب أن يكون أكبر من صفر"}]' dir="ltr" style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11, minHeight: 40 }} /></div>
                        <div><Lbl hint="JSON">قيم افتراضية شرطية</Lbl>
                            <textarea value={inp.default_when} onChange={e => onUpdate({ default_when: e.target.value })}
                                rows={2} placeholder='{"type=premium":"100","type=basic":"50"}' dir="ltr" style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11, minHeight: 40 }} /></div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function ApiCallFields<T extends ApiCallFormData>({ form, setForm }: {
    form: T; setForm: (f: T) => void
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

            {/* Context Variables Banner */}
            <ContextVarsBanner />

            {/* ─── 1. Connection & Endpoint ─── */}
            <Section id="connection" icon={<Globe size={15} />} title="الاتصال ونقطة النهاية">
                {/* URL + Method */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 10, marginBottom: 10 }}>
                    <div>
                        <Lbl hint="URL">عنوان API *</Lbl>
                        <input value={form.apiUrl} onChange={e => setForm({ ...form, apiUrl: e.target.value })}
                            placeholder="https://api.example.com/v1/endpoint" dir="ltr"
                            style={{
                                ...monoInput,
                                ...(form.apiUrl.trim() ? {} : { borderColor: "#ef4444", boxShadow: "0 0 0 1px #ef444433" })
                            }} maxLength={LIMITS.API_URL} />
                        {!form.apiUrl.trim() && (
                            <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3, fontWeight: 600 }}>⚠️ رابط API مطلوب — لن يعمل زر الإضافة بدونه</div>
                        )}
                    </div>
                    <div>
                        <Lbl>الطريقة</Lbl>
                        <select value={form.apiMethod} onChange={e => setForm({ ...form, apiMethod: e.target.value })} style={selectStyle}>
                            {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                {/* Auth Section */}
                <div style={{
                    padding: 12, borderRadius: T.radius, marginBottom: 10,
                    background: "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
                    border: "1px solid #e9d5ff",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Shield size={13} color="#7c3aed" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>المصادقة</span>
                    </div>
                    <div style={{ marginBottom: form.apiAuthType !== "none" ? 10 : 0 }}>
                        <Lbl>نوع المصادقة</Lbl>
                        <select value={form.apiAuthType} onChange={e => setForm({ ...form, apiAuthType: e.target.value, apiAuthConfig: "" })} style={selectStyle}>
                            <option value="none">🔓 بدون مصادقة</option>
                            <option value="bearer">🔑 Bearer Token</option>
                            <option value="api_key">🗝️ API Key</option>
                            <option value="basic">👤 Basic Auth</option>
                        </select>
                    </div>
                    <AuthFields authType={form.apiAuthType} authConfig={form.apiAuthConfig}
                        onChange={v => setForm({ ...form, apiAuthConfig: v })} />
                </div>

                {/* Timeout + Retry */}
                <Row2>
                    <div>
                        <Lbl hint="ثانية">المهلة الزمنية</Lbl>
                        <input type="number" value={form.apiTimeout} onChange={e => setForm({ ...form, apiTimeout: parseInt(e.target.value) || 30 })}
                            min={1} max={300} dir="ltr" style={inputStyle} />
                    </div>
                    <div>
                        <Lbl hint="0-5">إعادة المحاولة</Lbl>
                        <input type="number" value={form.apiRetryCount} onChange={e => setForm({ ...form, apiRetryCount: parseInt(e.target.value) || 0 })}
                            min={0} max={5} dir="ltr" style={inputStyle} />
                    </div>
                </Row2>
            </Section>

            {/* ─── 2. Execution Mode ─── */}
            <Section id="execution" icon={<Layers size={15} />} title="وضع التنفيذ">
                <Row2>
                    <div>
                        <Lbl>وضع التنفيذ</Lbl>
                        <select value={form.apiExecMode} onChange={e => setForm({ ...form, apiExecMode: e.target.value })} style={selectStyle}>
                            <option value="immediate">⚡ فوري — تنفيذ مباشر</option>
                            <option value="collect_data">📝 جمع بيانات — سؤال المستخدم</option>
                        </select>
                    </div>
                    {form.apiExecMode === "collect_data" && (
                        <div>
                            <Lbl>استراتيجية الجمع</Lbl>
                            <select value={form.apiCollectionStrategy} onChange={e => setForm({ ...form, apiCollectionStrategy: e.target.value })} style={selectStyle}>
                                <option value="sequential">تسلسلي</option>
                                <option value="ai_managed">ذكاء اصطناعي</option>
                            </select>
                        </div>
                    )}
                </Row2>
                {form.apiExecMode === "collect_data" && (
                    <div>
                        <Lbl>الرسالة الأولية</Lbl>
                        <textarea value={form.apiInitialMsg} onChange={e => setForm({ ...form, apiInitialMsg: e.target.value })}
                            rows={2} placeholder="مرحباً! سأساعدك في إتمام العملية. سأحتاج بعض المعلومات..." style={textareaStyle} maxLength={LIMITS.API_INITIAL_MSG} />
                    </div>
                )}
                {/* Intent Description */}
                <div style={{ marginTop: 6 }}>
                    <Lbl hint="للذكاء الاصطناعي">وصف النية</Lbl>
                    <input value={form.apiIntentDescription} onChange={e => setForm({ ...form, apiIntentDescription: e.target.value })}
                        placeholder="مثال: تحويل أموال بين حسابات" style={inputStyle} />
                </div>
            </Section>

            {/* ─── 3. Inputs (collect_data only) ─── */}
            {form.apiExecMode === "collect_data" && (
                <Section id="inputs" icon={<Database size={15} />} title="المدخلات" badge={String(form.apiInputs.length)}>
                    {form.apiInputs.map((inp, i) => (
                        <InputFieldCard key={i} inp={inp} index={i} total={form.apiInputs.length}
                            onUpdate={patch => {
                                const n = [...form.apiInputs]; n[i] = { ...n[i], ...patch }; setForm({ ...form, apiInputs: n })
                            }}
                            onDelete={() => setForm({ ...form, apiInputs: form.apiInputs.filter((_, j) => j !== i) })} />
                    ))}
                    <button onClick={() => setForm({
                        ...form, apiInputs: [...form.apiInputs, {
                            key: "", label: "", type: "text", required: true, order: form.apiInputs.length,
                            prompt_message: "", error_message: "", placeholder: "", default_value: "",
                            validation_regex: "", min_value: "", max_value: "", min_length: "", max_length: "", type_error: "",
                            options: [], display_as: "interactive_list",
                            options_source: "", image_analysis: "", api_call_config: "",
                            trigger_after: "", depends_on: "", show_condition: "",
                            formula: "", accepted_types: "", max_size_mb: "",
                            display_in_summary: true, filter_options: false,
                            cross_validation: "", default_when: "",
                        }]
                    })} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        width: "100%", padding: 12, borderRadius: T.radius,
                        border: `2px dashed ${T.border}`, background: "transparent",
                        color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>
                        <Plus size={14} /> إضافة مُدخل جديد
                    </button>
                </Section>
            )}

            {/* ─── 4. Request Templates ─── */}
            <Section id="request" icon={<Send size={15} />} title="قوالب الطلب" defaultOpen={false}>
                <KVEditor value={form.apiHeaders} onChange={v => setForm({ ...form, apiHeaders: v })}
                    label="🔖 Headers" hint="ترويسات الطلب"
                    keyPlaceholder="Content-Type" valuePlaceholder="application/json" />

                <div style={{ marginBottom: 10 }}>
                    <Lbl hint="JSON">قالب الجسم (Body)</Lbl>
                    <textarea value={form.apiBodyTemplate} onChange={e => setForm({ ...form, apiBodyTemplate: e.target.value })}
                        rows={3} placeholder={'{"customer_phone": "{{sender_id}}", "platform": "{{platform}}"}'} dir="ltr"
                        style={{ ...textareaStyle, fontFamily: T.mono, fontSize: 11.5 }} />
                </div>

                <KVEditor value={form.apiQueryParams} onChange={v => setForm({ ...form, apiQueryParams: v })}
                    label="🔍 Query Params" hint="معاملات الاستعلام"
                    keyPlaceholder="phone_number" valuePlaceholder="{{sender_id}}" />
            </Section>

            {/* ─── 5. Response Handling ─── */}
            <Section id="response" icon={<FileText size={15} />} title="معالجة الاستجابة" defaultOpen={false}>
                <div style={{ marginBottom: 10 }}>
                    <Lbl>نوع الاستجابة</Lbl>
                    <select value={form.apiResponseType} onChange={e => setForm({ ...form, apiResponseType: e.target.value })} style={selectStyle}>
                        <option value="text">📝 نص فقط</option>
                        <option value="text_with_media">🖼️ نص + وسائط</option>
                        <option value="conditional">🔀 استجابة شرطية</option>
                    </select>
                </div>

                {/* Response Mapping */}
                <KVEditor value={form.apiResponseMapping} onChange={v => setForm({ ...form, apiResponseMapping: v })}
                    label="🗺️ تعيين الاستجابة (Response Mapping)" hint="ربط المتغيرات بمسارات JSON"
                    keyPlaceholder="order_id" valuePlaceholder="data.order.id" />

                {/* Success + Error templates */}
                <Row2>
                    <div>
                        <Lbl>✅ قالب النجاح</Lbl>
                        <textarea value={form.apiSuccessTemplate} onChange={e => setForm({ ...form, apiSuccessTemplate: e.target.value })}
                            rows={4} placeholder={"✅ تم تأكيد طلبك\n\n📦 رقم الطلب: {{order_id}}\n💰 المبلغ: {{total}}"} style={textareaStyle}
                            maxLength={LIMITS.API_SUCCESS_TEMPLATE} />
                    </div>
                    <div>
                        <Lbl>❌ قالب الخطأ</Lbl>
                        <textarea value={form.apiErrorTemplate} onChange={e => setForm({ ...form, apiErrorTemplate: e.target.value })}
                            rows={4} placeholder={"❌ عذراً، حدث خطأ أثناء تنفيذ العملية\n{{error_message}}"} style={textareaStyle}
                            maxLength={LIMITS.API_ERROR_TEMPLATE} />
                    </div>
                </Row2>

                {/* Media settings */}
                {form.apiResponseType === "text_with_media" && (
                    <div style={{ padding: 10, borderRadius: T.radius, background: T.bg, border: `1px solid ${T.border}`, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 8 }}>🖼️ إعدادات الوسائط</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, marginBottom: 8 }}>
                            <div><Lbl>مسار رابط الوسائط</Lbl><input value={form.apiMediaUrlPath} onChange={e => setForm({ ...form, apiMediaUrlPath: e.target.value })} placeholder="image_url أو data.media.url" dir="ltr" style={monoInput} /></div>
                            <div>
                                <Lbl>نوع الوسائط</Lbl>
                                <select value={form.apiMediaType} onChange={e => setForm({ ...form, apiMediaType: e.target.value })} style={selectStyle}>
                                    <option value="">— اختر —</option>
                                    <option value="image">🖼️ صورة</option>
                                    <option value="video">🎬 فيديو</option>
                                    <option value="document">📄 مستند</option>
                                </select>
                            </div>
                        </div>
                        <div><Lbl>قالب التعليق</Lbl><input value={form.apiMediaCaptionTemplate} onChange={e => setForm({ ...form, apiMediaCaptionTemplate: e.target.value })} placeholder="{{title}} - {{description}}" style={inputStyle} /></div>
                    </div>
                )}

                {/* Conditional responses */}
                {form.apiResponseType === "conditional" && (
                    <div style={{ padding: 10, borderRadius: T.radius, background: T.bg, border: `1px solid ${T.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <AlertCircle size={12} color="#f59e0b" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec }}>استجابات شرطية</span>
                        </div>
                        {form.apiConditionalResponses.map((cr, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                                <input value={cr.condition} onChange={e => {
                                    const n = [...form.apiConditionalResponses]; n[i] = { ...n[i], condition: e.target.value }; setForm({ ...form, apiConditionalResponses: n })
                                }} placeholder="status == 'success'" dir="ltr" style={{ ...monoInput, width: "40%", padding: "6px 10px", fontSize: 11 }} />
                                <input value={cr.template} onChange={e => {
                                    const n = [...form.apiConditionalResponses]; n[i] = { ...n[i], template: e.target.value }; setForm({ ...form, apiConditionalResponses: n })
                                }} placeholder="✅ العملية ناجحة: {{ref}}" style={{ ...inputStyle, flex: 1, padding: "6px 10px", fontSize: 11 }} />
                                <button onClick={() => setForm({ ...form, apiConditionalResponses: form.apiConditionalResponses.filter((_, j) => j !== i) })}
                                    style={{ padding: 3, border: "none", background: "none", cursor: "pointer", color: T.danger }}><X size={12} /></button>
                            </div>
                        ))}
                        <button onClick={() => setForm({ ...form, apiConditionalResponses: [...form.apiConditionalResponses, { condition: "", template: "" }] })}
                            style={{ fontSize: 10, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>+ إضافة شرط</button>
                    </div>
                )}
            </Section>

            {/* ─── 6. Confirmation & Settings ─── */}
            <Section id="settings" icon={<Settings size={15} />} title="التأكيد والإعدادات" defaultOpen={false}>
                <div style={{ marginBottom: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", fontWeight: 600, color: T.text }}>
                        <input type="checkbox" checked={form.apiRequiresConfirmation} onChange={e => setForm({ ...form, apiRequiresConfirmation: e.target.checked })}
                            style={{ accentColor: T.accent, width: 15, height: 15 }} />
                        طلب تأكيد قبل الإرسال
                    </label>
                </div>
                {form.apiRequiresConfirmation && (
                    <div style={{ marginBottom: 10 }}>
                        <Lbl>قالب التأكيد</Lbl>
                        <textarea value={form.apiConfirmationTemplate} onChange={e => setForm({ ...form, apiConfirmationTemplate: e.target.value })}
                            rows={3} placeholder={"📋 ملخص العملية:\n💰 المبلغ: {{amount}}\n📱 المستلم: {{recipient}}\n\nهل تؤكد؟"} style={textareaStyle}
                            maxLength={LIMITS.API_CONFIRMATION_TEMPLATE} />
                    </div>
                )}
            </Section>

            {/* ─── 7. Reply text ─── */}
            <div style={{ marginTop: 4 }}>
                <Lbl>نص الرد (اختياري)</Lbl>
                <textarea value={form.reply} onChange={e => setForm({ ...form, reply: e.target.value })}
                    rows={2} placeholder="رسالة ترسل للمستخدم عند اختيار هذا العنصر..." style={textareaStyle} />
            </div>
        </div>
    )
}
