import { useState } from "react"
import { Loader2, Plus, Trash2, Eye, EyeOff, ChevronDown, X, Sparkles, Heart, Tags, FileText, Zap, RefreshCw, AlertTriangle, WifiOff, Bot, Server, Thermometer, Gauge, Timer } from "lucide-react"
import { useAISettings, useUpdateAISettings, useUpdateProvider, useCreateProvider, useDeleteProvider, useAddModel, useDeleteModel, useAIFeatures, useUpdateAIFeatures } from "../hooks/use-ai-settings"
import type { LLMProvider } from "../types"

/* ══════════════════════════════════════════════════════════════
   CSS — keyframes
   ══════════════════════════════════════════════════════════════ */
const CSS = `
@keyframes aiFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes aiShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes aiSlide{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
`

/* ══════════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════════ */
function sk(w: string, h = 14, r = 8) {
    return { width: w, height: h, borderRadius: r, background: "linear-gradient(110deg, var(--t-border) 30%, var(--t-border-light) 50%, var(--t-border) 70%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.6s ease-in-out infinite" } as React.CSSProperties
}

function SkeletonLoading() {
    return (
        <div style={{ animation: "aiFadeUp .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ borderRadius: 14, padding: 22, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("42px", 42, 11)} />
                    <div><div style={sk("150px", 15)} /><div style={{ ...sk("200px", 10), marginTop: 6 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ borderRadius: 10, padding: 14, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ ...sk("60px", 9), marginBottom: 7 }} /><div style={sk("70px", 18)} /></div>)}
                </div>
            </div>
            {[0, 1].map(i => (
                <div key={i} style={{ borderRadius: 12, padding: 16, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={sk("38px", 38, 10)} /><div><div style={sk("100px", 13)} /><div style={{ ...sk("60px", 9), marginTop: 4 }} /></div>
                        </div>
                        <div style={sk("42px", 22, 11)} />
                    </div>
                </div>
            ))}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   ERROR
   ══════════════════════════════════════════════════════════════ */
function ErrorPanel({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    const status = ax?.response?.status
    const msg = ax?.response?.data?.message || ax?.response?.data?.detail || ax?.message || ""
    return (
        <div style={{
            borderRadius: 14, border: "1px solid", textAlign: "center", padding: "32px 24px",
            borderColor: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
            animation: "aiFadeUp .3s ease-out",
        }}>
            <style>{CSS}</style>
            <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 14",
                background: isNet ? "var(--t-warning-soft)" : "var(--t-danger-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                {isNet ? <WifiOff size={22} style={{ color: "var(--t-warning)" }} /> : <AlertTriangle size={22} style={{ color: "var(--t-danger)" }} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t-text)", marginBottom: 5 }}>{isNet ? "لا يمكن الاتصال بالخادم" : "خطأ في تحميل البيانات"}</div>
            <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginBottom: 6, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 6px" }}>{isNet ? "تحقق من اتصال الشبكة وأعد المحاولة" : msg || "تعذر جلب البيانات من الخادم"}</div>
            {status && <div style={{ fontSize: 10, color: "var(--t-text-faint)", fontFamily: "monospace", marginBottom: 14, opacity: 0.5 }}>HTTP {status}</div>}
            {!status && <div style={{ height: 12 }} />}
            <button onClick={onRetry} style={{
                padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer",
                background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
                opacity: retrying ? 0.7 : 1, pointerEvents: retrying ? "none" : "auto",
            }}>
                {retrying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {retrying ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   STAT MINI CARD
   ══════════════════════════════════════════════════════════════ */
function StatMini({ label, value, variant }: { label: string; value: string | number; variant?: "success" | "danger" | "default" }) {
    const colorMap = { success: "var(--t-success)", danger: "var(--t-danger)", default: "var(--t-text)" }
    return (
        <div style={{
            borderRadius: 10, padding: "10px 14px", background: "var(--t-surface)",
            border: "1px solid var(--t-border-light)",
        }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: colorMap[variant || "default"], letterSpacing: "-0.02em" }}>{value}</div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   TOGGLE SWITCH
   ══════════════════════════════════════════════════════════════ */
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
   FEATURE TOGGLE ROW
   ══════════════════════════════════════════════════════════════ */
function FeatureRow({ icon: Icon, title, desc, on, onChange }: { icon: any; title: string; desc: string; on: boolean; onChange: () => void }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: 12,
            border: "1px solid var(--t-border)", background: "var(--t-card)",
            transition: "all .15s ease",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: on ? "var(--t-accent-muted)" : "var(--t-surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                }}>
                    <Icon size={16} style={{ color: on ? "var(--t-accent)" : "var(--t-text-faint)" }} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-text)" }}>{title}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>{desc}</div>
                </div>
            </div>
            <Toggle on={on} onToggle={onChange} size="sm" />
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   PROVIDER CARD
   ══════════════════════════════════════════════════════════════ */
function ProviderCard({ name, prov }: { name: string; prov: LLMProvider }) {
    const [open, setOpen] = useState(false)
    const [showKey, setShowKey] = useState(false)
    const [editKey, setEditKey] = useState("")
    const [addModelOpen, setAddModelOpen] = useState(false)
    const [newModelId, setNewModelId] = useState("")
    const [confirmDelete, setConfirmDelete] = useState(false)

    const updateP = useUpdateProvider()
    const deleteP = useDeleteProvider()
    const addM = useAddModel()
    const delM = useDeleteModel()

    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const modelCount = prov.available_models?.length || 0

    const field: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: 9,
        border: "1px solid var(--t-border)", background: "var(--t-surface)",
        fontSize: 13, color: "var(--t-text)", outline: "none", fontFamily: "monospace",
    }

    return (
        <div style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid var(--t-border)", background: "var(--t-card)",
            marginBottom: 8, transition: "all .15s ease",
            boxShadow: open ? "0 2px 12px var(--t-shadow)" : "none",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer" }}
                onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: prov.enabled ? "var(--t-success-soft)" : "var(--t-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Server size={17} style={{ color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)" }} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{displayName}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                                background: prov.enabled ? "var(--t-success-soft)" : "var(--t-surface)",
                                color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)",
                            }}>{prov.enabled ? "مُفعّل" : "مُعطّل"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2, display: "flex", gap: 8 }}>
                            {prov.selected_model && <span style={{ fontFamily: "monospace" }}>{prov.selected_model}</span>}
                            <span>{modelCount} {modelCount === 1 ? "موديل" : "موديلات"}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Toggle on={prov.enabled} onToggle={() => updateP.mutate({ name, payload: { enabled: !prov.enabled } })} size="sm" />
                    <ChevronDown size={15} style={{ color: "var(--t-text-faint)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }} />
                </div>
            </div>

            {/* Body */}
            {open && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--t-border-light)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 14 }}>

                        {/* API Key */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>مفتاح API</label>
                            <div style={{ display: "flex", gap: 6 }}>
                                <input type={showKey ? "text" : "password"} style={{ ...field, flex: 1 }} dir="ltr"
                                    defaultValue={prov.api_key || ""} onChange={e => setEditKey(e.target.value)} placeholder="sk-..." />
                                <button onClick={() => setShowKey(!showKey)} style={{
                                    width: 38, height: 38, borderRadius: 9, border: "1px solid var(--t-border)",
                                    background: "var(--t-surface)", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t-text-faint)",
                                }}>{showKey ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                {editKey && editKey !== prov.api_key && (
                                    <button onClick={() => { updateP.mutate({ name, payload: { api_key: editKey } }); setEditKey("") }} style={{
                                        padding: "8px 16px", borderRadius: 9, border: "none",
                                        background: "var(--t-accent)", color: "var(--t-text-on-accent)",
                                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}>حفظ</button>
                                )}
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>الموديل النشط</label>
                            <select style={{ ...field, fontFamily: "inherit", appearance: "auto" as any }} value={prov.selected_model || ""} onChange={e => updateP.mutate({ name, payload: { selected_model: e.target.value } })}>
                                <option value="">— اختر موديلاً —</option>
                                {(prov.available_models || []).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Config */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 7 }}>إعدادات التوليد</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                {[
                                    { icon: Thermometer, label: "الحرارة", key: "temperature", val: prov.config?.temperature ?? 0.9, step: 0.1, min: 0, max: 2, parse: parseFloat },
                                    { icon: Gauge, label: "أقصى رموز", key: "max_tokens", val: prov.config?.max_tokens ?? 2000, step: 1, min: 1, max: 999999, parse: parseInt },
                                    { icon: Timer, label: "المهلة (ث)", key: "timeout", val: prov.config?.timeout ?? 30, step: 1, min: 1, max: 300, parse: parseInt },
                                ].map(cfg => (
                                    <div key={cfg.key} style={{ borderRadius: 10, padding: "10px 12px", background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                            <cfg.icon size={11} style={{ color: "var(--t-text-faint)" }} />
                                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)" }}>{cfg.label}</span>
                                        </div>
                                        <input type="number" step={cfg.step} min={cfg.min} max={cfg.max}
                                            style={{ ...field, padding: "5px 6px", fontSize: 14, fontWeight: 700, background: "transparent", border: "none", width: "100%" }}
                                            dir="ltr" defaultValue={cfg.val}
                                            onBlur={e => { const v = cfg.parse(e.target.value); updateP.mutate({ name, payload: { config: { ...prov.config, [cfg.key]: v } } }) }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Available Models */}
                        <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 7 }}>الموديلات المتاحة</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {(prov.available_models || []).map(m => (
                                    <span key={m} style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20,
                                        background: prov.selected_model === m ? "var(--t-accent-muted)" : "var(--t-surface)",
                                        color: prov.selected_model === m ? "var(--t-text)" : "var(--t-text-muted)",
                                        border: "1px solid var(--t-border-light)",
                                    }}>
                                        {m}
                                        <button onClick={() => delM.mutate({ provider: name, modelId: m })} style={{
                                            border: "none", background: "none", cursor: "pointer", padding: 0,
                                            color: "var(--t-danger)", lineHeight: 1, opacity: 0.5, transition: "opacity .1s",
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.opacity = "1" }}
                                            onMouseLeave={e => { e.currentTarget.style.opacity = "0.5" }}>
                                            <X size={11} />
                                        </button>
                                    </span>
                                ))}
                                {!addModelOpen ? (
                                    <button onClick={() => setAddModelOpen(true)} style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20,
                                        background: "transparent", color: "var(--t-text-muted)",
                                        border: "1px dashed var(--t-border)", cursor: "pointer",
                                    }}>
                                        <Plus size={11} /> إضافة
                                    </button>
                                ) : (
                                    <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", marginTop: 4 }}>
                                        <input style={{ ...field, flex: 1, fontSize: 12, padding: "7px 10px" }} dir="ltr"
                                            value={newModelId} onChange={e => setNewModelId(e.target.value)} placeholder="مثال: gpt-4-turbo" autoFocus />
                                        <button disabled={!newModelId.trim()} onClick={() => { addM.mutate({ provider: name, payload: { model_id: newModelId.trim() } }); setNewModelId(""); setAddModelOpen(false) }} style={{
                                            padding: "7px 14px", borderRadius: 9, border: "none",
                                            background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                        }}>إضافة</button>
                                        <button onClick={() => { setAddModelOpen(false); setNewModelId("") }} style={{
                                            padding: "7px 10px", borderRadius: 9, border: "1px solid var(--t-border)",
                                            background: "transparent", color: "var(--t-text-faint)", fontSize: 12, cursor: "pointer",
                                        }}>✕</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delete */}
                        <div style={{ borderTop: "1px solid var(--t-border-light)", paddingTop: 12 }}>
                            {!confirmDelete ? (
                                <button onClick={() => setConfirmDelete(true)} style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                                    border: "1px solid var(--t-danger-soft)", background: "var(--t-danger-soft)",
                                    color: "var(--t-danger)", fontSize: 12, fontWeight: 600,
                                }}>
                                    <Trash2 size={12} /> حذف المزود
                                </button>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, color: "var(--t-danger)", fontWeight: 600 }}>تأكيد حذف "{name}"؟</span>
                                    <button onClick={() => deleteP.mutate(name)} style={{
                                        padding: "6px 14px", borderRadius: 8, border: "none",
                                        background: "var(--t-danger)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}>نعم، حذف</button>
                                    <button onClick={() => setConfirmDelete(false)} style={{
                                        padding: "6px 12px", borderRadius: 8, border: "1px solid var(--t-border)",
                                        background: "transparent", color: "var(--t-text)", fontSize: 12, cursor: "pointer",
                                    }}>إلغاء</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   CREATE PROVIDER
   ══════════════════════════════════════════════════════════════ */
function CreateProviderForm() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [apiKey, setApiKey] = useState("")
    const createP = useCreateProvider()

    const field: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: 9,
        border: "1px solid var(--t-border)", background: "var(--t-surface)",
        fontSize: 13, color: "var(--t-text)", outline: "none", fontFamily: "monospace",
    }

    if (!open) return (
        <button onClick={() => setOpen(true)} style={{
            width: "100%", padding: "11px 0", borderRadius: 10,
            border: "1px dashed var(--t-border)", background: "transparent",
            color: "var(--t-text-faint)", fontSize: 13, fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all .15s",
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-text-muted)"; e.currentTarget.style.color = "var(--t-text-muted)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}>
            <Plus size={14} /> إضافة مزود جديد
        </button>
    )

    return (
        <div style={{ borderRadius: 12, padding: 16, border: "1px dashed var(--t-border)", background: "var(--t-card)", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 12 }}>مزود جديد</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>اسم المزود</label>
                    <input style={field} dir="ltr" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="anthropic" />
                </div>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5 }}>مفتاح API</label>
                    <input style={field} dir="ltr" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." />
                </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button disabled={!name.trim()} onClick={() => {
                    createP.mutate({ name: name.trim(), payload: { enabled: true, api_key: apiKey, available_models: [], selected_model: "", config: {} } })
                    setName(""); setApiKey(""); setOpen(false)
                }} style={{
                    padding: "8px 18px", borderRadius: 9, border: "none",
                    background: "var(--t-accent)", color: "var(--t-text-on-accent)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>إنشاء</button>
                <button onClick={() => { setOpen(false); setName(""); setApiKey("") }} style={{
                    padding: "8px 14px", borderRadius: 9, border: "1px solid var(--t-border)",
                    background: "transparent", color: "var(--t-text)", fontSize: 12, cursor: "pointer",
                }}>إلغاء</button>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════════════════════
   MAIN AI TAB
   ══════════════════════════════════════════════════════════════ */
export function AITab() {
    const aiQuery = useAISettings()
    const featuresQuery = useAIFeatures()
    const updateAI = useUpdateAISettings()
    const updateAIF = useUpdateAIFeatures()

    const { data: settings, isLoading: loadingAI, isError: errorAI, error: aiError, refetch: refetchAI, isRefetching: refetchingAI } = aiQuery
    const { data: aiFeatures, isLoading: loadingFeatures, isError: errorFeatures, error: featError, refetch: refetchFeatures, isRefetching: refetchingFeatures } = featuresQuery

    const isLoading = loadingAI || loadingFeatures
    const isRefetching = refetchingAI || refetchingFeatures
    const hasError = errorAI || errorFeatures
    const firstError = aiError || featError

    if (isLoading) return <SkeletonLoading />
    if (hasError && !settings) return <ErrorPanel error={firstError} onRetry={() => { refetchAI(); refetchFeatures() }} retrying={isRefetching} />

    const hasSettings = settings && Object.keys(settings).length > 0
    const hasFeatures = aiFeatures && Object.keys(aiFeatures).length > 0
    const providerNames = hasSettings ? Object.keys(settings!.llm_providers || {}) : []
    const enabledCount = providerNames.filter(n => settings!.llm_providers[n].enabled).length

    return (
        <div style={{ animation: "aiFadeUp .3s ease-out" }}>
            <style>{CSS}</style>

            {/* Refetch bar */}
            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 12, overflow: "hidden", background: "var(--t-border-light)" }}>
                    <div style={{ height: "100%", width: "40%", borderRadius: 1, background: "var(--t-accent)", animation: "aiSlide 1s ease-in-out infinite" }} />
                </div>
            )}

            {/* ═══════ HERO CARD ═══════ */}
            <div style={{ borderRadius: 14, padding: 20, background: "var(--t-card)", border: "1px solid var(--t-border)", marginBottom: 16 }}>
                {!hasSettings ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 12", background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bot size={24} style={{ color: "var(--t-text-faint)" }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 4 }}>لم يتم إعداد الذكاء الاصطناعي</div>
                        <div style={{ fontSize: 12, color: "var(--t-text-faint)" }}>سيتم عرض الإعدادات عند تهيئتها من الخادم</div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 11,
                                    background: settings!.enabled ? "var(--t-accent)" : "var(--t-surface)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all .2s",
                                }}>
                                    <Bot size={20} style={{ color: settings!.enabled ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>الذكاء الاصطناعي</div>
                                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                                        {settings!.enabled ? "النظام يعمل بكفاءة" : "النظام مُعطّل حالياً"}
                                    </div>
                                </div>
                            </div>
                            <Toggle on={settings!.enabled} onToggle={() => updateAI.mutate({ enabled: !settings!.enabled })} />
                        </div>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                            <StatMini label="المزودين النشطين" value={`${enabledCount}/${providerNames.length}`} />
                            <StatMini label="المزود الافتراضي" value={settings!.default_llm || "–"} />
                            <StatMini label="الحالة" value={settings!.enabled ? "يعمل ✓" : "مُعطّل"} variant={settings!.enabled ? "success" : "danger"} />
                        </div>

                        {/* Default LLM + Test URL */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>المزود الافتراضي</label>
                                <select style={{
                                    width: "100%", padding: "9px 12px", borderRadius: 9,
                                    border: "1px solid var(--t-border)", background: "var(--t-surface)",
                                    fontSize: 13, color: "var(--t-text)", outline: "none", appearance: "auto" as any,
                                }} value={settings!.default_llm || ""} onChange={e => updateAI.mutate({ default_llm: e.target.value })}>
                                    <option value="">— اختر —</option>
                                    {providerNames.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: "var(--t-text-faint)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>رابط الاختبار</label>
                                <input style={{
                                    width: "100%", padding: "9px 12px", borderRadius: 9,
                                    border: "1px solid var(--t-border)", background: "var(--t-surface)",
                                    fontSize: 12, color: "var(--t-text)", outline: "none", fontFamily: "monospace",
                                }} dir="ltr" defaultValue={settings!.test_url || ""}
                                    onBlur={e => { if (e.target.value !== (settings!.test_url || "")) updateAI.mutate({ test_url: e.target.value }) }}
                                    placeholder="https://..." />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ═══════ PROVIDERS ═══════ */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <Zap size={15} style={{ color: "var(--t-text-muted)" }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>المزودون</span>
                    </div>
                    {providerNames.length > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t-text-faint)", background: "var(--t-surface)", padding: "3px 10px", borderRadius: 20 }}>
                            {providerNames.length}
                        </span>
                    )}
                </div>
                {providerNames.map(n => <ProviderCard key={n} name={n} prov={settings!.llm_providers[n]} />)}
                <CreateProviderForm />
            </div>

            {/* ═══════ AI FEATURES ═══════ */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                    <Sparkles size={15} style={{ color: "var(--t-text-muted)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>ميزات ذكية</span>
                </div>

                {!hasFeatures ? (
                    <div style={{ borderRadius: 12, padding: "24px 0", textAlign: "center", border: "1px dashed var(--t-border)", color: "var(--t-text-faint)" }}>
                        <Sparkles size={18} style={{ margin: "0 auto 8px", display: "block" }} />
                        <div style={{ fontSize: 13, fontWeight: 600 }}>لا توجد ميزات مُعدّة</div>
                        <div style={{ fontSize: 11, marginTop: 2 }}>ستظهر الميزات عند تفعيلها</div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <FeatureRow icon={Heart} title="تحليل المشاعر" desc="تحليل مشاعر المحادثات تلقائياً"
                            on={aiFeatures!.enable_sentiment_analysis} onChange={() => updateAIF.mutate({ enable_sentiment_analysis: !aiFeatures!.enable_sentiment_analysis })} />
                        <FeatureRow icon={Tags} title="التصنيف التلقائي" desc="تصنيف الرسائل والمواضيع تلقائياً"
                            on={aiFeatures!.enable_auto_classification} onChange={() => updateAIF.mutate({ enable_auto_classification: !aiFeatures!.enable_auto_classification })} />
                        <FeatureRow icon={FileText} title="التلخيص الذكي" desc="تلخيص المحادثات الطويلة تلقائياً"
                            on={aiFeatures!.enable_summarization} onChange={() => updateAIF.mutate({ enable_summarization: !aiFeatures!.enable_summarization })} />
                    </div>
                )}
            </div>
        </div>
    )
}
