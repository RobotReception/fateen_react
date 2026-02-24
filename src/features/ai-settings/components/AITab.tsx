import { useState } from "react"
import {
    Loader2, Plus, Trash2, Eye, EyeOff, ChevronDown, X,
    Sparkles, Heart, Tags, FileText, Zap, RefreshCw,
    AlertTriangle, WifiOff, Bot, Server, Thermometer, Gauge, Timer,
} from "lucide-react"
import {
    useAISettings, useUpdateAISettings,
    useUpdateProvider, useCreateProvider, useDeleteProvider,
    useAddModel, useDeleteModel,
    useAIFeatures, useUpdateAIFeatures,
} from "../hooks/use-ai-settings"
import type { LLMProvider } from "../types"

/* ─────────────────── shared primitives ─────────────────── */
const CSS = `
@keyframes aiFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes aiShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes aiSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}

.ai-card {
    border-radius:14px; background:var(--t-card);
    border:1px solid var(--t-border); margin-bottom:14px;
}
.ai-section-title {
    font-size:11px; font-weight:800; letter-spacing:.08em;
    text-transform:uppercase; color:var(--t-text-faint);
    margin-bottom:10px;
}
.ai-field {
    width:100%; padding:9px 12px; border-radius:9px;
    border:1.5px solid var(--t-border); background:var(--t-surface);
    font-size:13px; color:var(--t-text); outline:none;
    transition:border-color .15s;
}
.ai-field:focus { border-color:var(--t-accent); }
.ai-btn-primary {
    display:inline-flex; align-items:center; gap:6px;
    padding:9px 18px; border-radius:9px; border:none; cursor:pointer;
    background:var(--t-accent); color:var(--t-text-on-accent);
    font-size:12px; font-weight:700; transition:opacity .15s;
}
.ai-btn-primary:disabled { opacity:.5; cursor:default; }
.ai-btn-ghost {
    display:inline-flex; align-items:center; gap:5px;
    padding:8px 14px; border-radius:9px; cursor:pointer;
    border:1.5px solid var(--t-border); background:transparent;
    color:var(--t-text-faint); font-size:12px; font-weight:600;
}
`

/* Toggle switch */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    const W = 44, H = 24, D = 18, P = 3
    return (
        <button onClick={onToggle} style={{
            width: W, height: H, borderRadius: H, border: "none", flexShrink: 0,
            position: "relative", cursor: "pointer",
            background: on ? "var(--t-accent)" : "var(--t-border)",
            transition: "background .2s",
        }}>
            <span style={{
                position: "absolute", top: P,
                left: on ? W - D - P : P,
                width: D, height: D, borderRadius: "50%",
                background: "white", boxShadow: "0 1px 4px rgba(0,0,0,.18)",
                transition: "left .2s",
            }} />
        </button>
    )
}

/* Stat tile */
function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color || "var(--t-text)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
        </div>
    )
}

/* Feature toggle row */
function FeatureRow({ icon: Icon, title, desc, on, onChange }: { icon: any; title: string; desc: string; on: boolean; onChange: () => void }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 16px", borderRadius: 11,
            border: `1px solid ${on ? "var(--t-accent)" : "var(--t-border-light)"}`,
            background: on ? "var(--t-accent-muted)" : "var(--t-surface)",
            transition: "all .15s",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: on ? "var(--t-accent)" : "var(--t-border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                }}>
                    <Icon size={15} style={{ color: on ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t-text)" }}>{title}</div>
                    <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 1 }}>{desc}</div>
                </div>
            </div>
            <Toggle on={on} onToggle={onChange} />
        </div>
    )
}

/* Shimmer skeleton */
const sk = (w: string, h = 12, r = 6) => ({
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(110deg,var(--t-border) 30%,var(--t-border-light) 50%,var(--t-border) 70%)",
    backgroundSize: "200% 100%", animation: "aiShimmer 1.6s ease-in-out infinite", flexShrink: 0,
} as React.CSSProperties)

function Skeleton() {
    return (
        <div style={{ animation: "aiFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div className="ai-card" style={{ padding: 22, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={sk("44px", 44, 12)} />
                    <div><div style={sk("160px", 16)} /><div style={{ ...sk("220px", 10), marginTop: 7 }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ borderRadius: 10, padding: 14, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                        <div style={{ ...sk("60px", 9), marginBottom: 7 }} /><div style={sk("70px", 20)} /></div>)}
                </div>
            </div>
            {[0, 1].map(i => (
                <div key={i} className="ai-card" style={{ padding: 16, marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={sk("40px", 40, 10)} />
                            <div><div style={sk("110px", 14)} /><div style={{ ...sk("70px", 10), marginTop: 5 }} /></div>
                        </div>
                        <div style={sk("44px", 24, 12)} />
                    </div>
                </div>
            ))}
        </div>
    )
}

function ErrorState({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    const msg = ax?.response?.data?.message || ax?.response?.data?.detail || ax?.message || ""
    return (
        <div style={{ borderRadius: 14, padding: "40px 24px", textAlign: "center", border: "1px solid var(--t-border)", background: "var(--t-card)", animation: "aiFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", border: "1px solid var(--t-border)", background: "var(--t-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isNet ? <WifiOff size={24} style={{ color: "var(--t-danger)" }} /> : <AlertTriangle size={24} style={{ color: "var(--t-danger)" }} />}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", marginBottom: 6 }}>{isNet ? "لا يمكن الاتصال بالخادم" : "خطأ في تحميل البيانات"}</div>
            <div style={{ fontSize: 13, color: "var(--t-text-faint)", marginBottom: 20, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 20px" }}>{msg || (isNet ? "تحقق من اتصال الشبكة وأعد المحاولة" : "تعذر جلب البيانات من الخادم")}</div>
            <button className="ai-btn-primary" onClick={onRetry} style={{ opacity: retrying ? 0.7 : 1 }}>
                {retrying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {retrying ? "جاري المحاولة..." : "إعادة المحاولة"}
            </button>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROVIDER CARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ProviderCard({ name, prov, agentId }: { name: string; prov: LLMProvider; agentId: string }) {
    const [open, setOpen] = useState(false)
    const [showKey, setShowKey] = useState(false)
    const [editKey, setEditKey] = useState("")
    const [newModel, setNewModel] = useState("")
    const [addingModel, setAddingModel] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)

    const updateP = useUpdateProvider(agentId)
    const deleteP = useDeleteProvider(agentId)
    const addM = useAddModel(agentId)
    const delM = useDeleteModel(agentId)

    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const models = prov.available_models || []

    return (
        <div className="ai-card" style={{ marginBottom: 10, overflow: "hidden", boxShadow: open ? "0 4px 20px rgba(0,0,0,.08)" : "none", transition: "box-shadow .2s" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                        background: prov.enabled ? "linear-gradient(135deg,var(--t-accent),var(--t-accent))" : "var(--t-surface)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .2s",
                    }}>
                        <Server size={17} style={{ color: prov.enabled ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)" }}>{displayName}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                background: prov.enabled ? "rgba(16,185,129,.12)" : "var(--t-border-light)",
                                color: prov.enabled ? "var(--t-success)" : "var(--t-text-faint)",
                            }}>{prov.enabled ? "مُفعَّل" : "مُعطَّل"}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                            {prov.selected_model ? <code style={{ fontFamily: "monospace", fontSize: 10 }}>{prov.selected_model}</code> : "لم يُحدَّد موديل"}
                            <span style={{ marginRight: 8 }}>· {models.length} موديل</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={e => e.stopPropagation()}>
                    <Toggle on={prov.enabled} onToggle={() => updateP.mutate({ name, payload: { enabled: !prov.enabled } })} />
                    <ChevronDown size={15} style={{ color: "var(--t-text-faint)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", cursor: "pointer" }} onClick={() => setOpen(!open)} />
                </div>
            </div>

            {/* Expanded body */}
            {open && (
                <div style={{ borderTop: "1px solid var(--t-border-light)", padding: "18px 18px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                        {/* API Key */}
                        <div>
                            <div className="ai-section-title">مفتاح API</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input className="ai-field"
                                    type={showKey ? "text" : "password"} dir="ltr"
                                    style={{ flex: 1, fontFamily: "monospace" }}
                                    defaultValue={prov.api_key || ""}
                                    onChange={e => setEditKey(e.target.value)}
                                    placeholder="sk-..." />
                                <button onClick={() => setShowKey(!showKey)} className="ai-btn-ghost" style={{ flexShrink: 0, padding: "0 12px" }}>
                                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                {editKey && editKey !== prov.api_key && (
                                    <button onClick={() => { updateP.mutate({ name, payload: { api_key: editKey } }); setEditKey("") }} className="ai-btn-primary" style={{ flexShrink: 0 }}>
                                        حفظ
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active model */}
                        <div>
                            <div className="ai-section-title">الموديل النشط</div>
                            <select className="ai-field" style={{ fontFamily: "monospace", appearance: "auto" as any }}
                                value={prov.selected_model || ""}
                                onChange={e => updateP.mutate({ name, payload: { selected_model: e.target.value } })}>
                                <option value="">— اختر موديلاً —</option>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Config sliders */}
                        <div>
                            <div className="ai-section-title">معاملات التوليد</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                {[
                                    { icon: Thermometer, label: "درجة الحرارة", key: "temperature", val: prov.config?.temperature ?? 0.9, step: 0.1, min: 0, max: 2, parse: parseFloat },
                                    { icon: Gauge, label: "أقصى رموز", key: "max_tokens", val: prov.config?.max_tokens ?? 2000, step: 1, min: 1, max: 999999, parse: parseInt },
                                    { icon: Timer, label: "المهلة (ث)", key: "timeout", val: prov.config?.timeout ?? 30, step: 1, min: 1, max: 300, parse: parseInt },
                                ].map(cfg => (
                                    <div key={cfg.key} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--t-surface)", border: "1px solid var(--t-border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                                            <cfg.icon size={11} style={{ color: "var(--t-text-faint)" }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)" }}>{cfg.label}</span>
                                        </div>
                                        <input type="number" step={cfg.step} min={cfg.min} max={cfg.max}
                                            defaultValue={cfg.val} dir="ltr"
                                            style={{ width: "100%", border: "none", background: "transparent", fontSize: 16, fontWeight: 800, color: "var(--t-text)", outline: "none", fontVariantNumeric: "tabular-nums" }}
                                            onBlur={e => { const v = cfg.parse(e.target.value); if (!isNaN(v)) updateP.mutate({ name, payload: { config: { ...prov.config, [cfg.key]: v } } }) }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Models list */}
                        <div>
                            <div className="ai-section-title">الموديلات المتاحة</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {models.map(m => (
                                    <span key={m} style={{
                                        display: "inline-flex", alignItems: "center", gap: 6,
                                        padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                        fontFamily: "monospace",
                                        background: prov.selected_model === m ? "var(--t-accent-muted)" : "var(--t-surface)",
                                        color: prov.selected_model === m ? "var(--t-accent)" : "var(--t-text-faint)",
                                        border: `1px solid ${prov.selected_model === m ? "var(--t-accent)" : "var(--t-border-light)"}`,
                                    }}>
                                        {m}
                                        <button onClick={() => delM.mutate({ provider: name, modelId: m })}
                                            style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--t-danger)", lineHeight: 1, display: "flex" }}>
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                {addingModel ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                                        <input className="ai-field" dir="ltr" value={newModel} onChange={e => setNewModel(e.target.value)}
                                            placeholder="gpt-4o" autoFocus
                                            style={{ fontFamily: "monospace", width: 180, padding: "5px 10px", fontSize: 12 }}
                                            onKeyDown={e => { if (e.key === "Enter" && newModel.trim()) { addM.mutate({ provider: name, payload: { model_id: newModel.trim() } }); setNewModel(""); setAddingModel(false) } }} />
                                        <button className="ai-btn-primary" style={{ padding: "5px 12px", fontSize: 11 }}
                                            disabled={!newModel.trim()}
                                            onClick={() => { addM.mutate({ provider: name, payload: { model_id: newModel.trim() } }); setNewModel(""); setAddingModel(false) }}>
                                            إضافة
                                        </button>
                                        <button className="ai-btn-ghost" style={{ padding: "5px 10px" }} onClick={() => { setAddingModel(false); setNewModel("") }}><X size={12} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => setAddingModel(true)} style={{
                                        display: "inline-flex", alignItems: "center", gap: 4,
                                        padding: "5px 11px", borderRadius: 20, border: "1.5px dashed var(--t-border)",
                                        background: "transparent", color: "var(--t-text-faint)", fontSize: 11, cursor: "pointer",
                                    }}>
                                        <Plus size={11} /> إضافة
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Delete provider */}
                        <div style={{ paddingTop: 4, borderTop: "1px solid var(--t-border-light)" }}>
                            {!confirmDel ? (
                                <button onClick={() => setConfirmDel(true)} style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                                    border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.06)",
                                    color: "var(--t-danger)", fontSize: 12, fontWeight: 600,
                                }}>
                                    <Trash2 size={12} /> حذف المزود
                                </button>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 12, color: "var(--t-danger)", fontWeight: 600 }}>تأكيد حذف "{displayName}"؟</span>
                                    <button onClick={() => deleteP.mutate(name)} className="ai-btn-primary" style={{ background: "var(--t-danger)", padding: "6px 14px", fontSize: 12 }}>حذف</button>
                                    <button onClick={() => setConfirmDel(false)} className="ai-btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}>إلغاء</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ADD PROVIDER FORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function AddProviderForm({ agentId }: { agentId: string }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [key, setKey] = useState("")
    const createP = useCreateProvider(agentId)

    if (!open) return (
        <button onClick={() => setOpen(true)} style={{
            width: "100%", padding: "13px 0", borderRadius: 12,
            border: "1.5px dashed var(--t-border)", background: "transparent",
            color: "var(--t-text-faint)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            transition: "all .15s",
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)" }}>
            <Plus size={15} /> إضافة مزود جديد
        </button>
    )

    return (
        <div className="ai-card" style={{ padding: "18px 20px", border: "1.5px solid var(--t-accent)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t-text)", marginBottom: 14 }}>مزود LLM جديد</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                    <div className="ai-section-title">اسم المزود</div>
                    <input className="ai-field" dir="ltr" style={{ fontFamily: "monospace" }}
                        value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="anthropic" />
                </div>
                <div>
                    <div className="ai-section-title">مفتاح API</div>
                    <input className="ai-field" dir="ltr" type="password" style={{ fontFamily: "monospace" }}
                        value={key} onChange={e => setKey(e.target.value)} placeholder="sk-..." />
                </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <button className="ai-btn-primary" disabled={!name.trim() || createP.isPending}
                    onClick={() => { createP.mutate({ name: name.trim(), payload: { enabled: true, api_key: key, available_models: [], selected_model: "", config: {} } }); setName(""); setKey(""); setOpen(false) }}>
                    {createP.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    إنشاء
                </button>
                <button className="ai-btn-ghost" onClick={() => { setOpen(false); setName(""); setKey("") }}>إلغاء</button>
            </div>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN AI TAB EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function AITab({ agentId }: { agentId: string }) {
    const aiQuery = useAISettings(agentId)
    const featQ = useAIFeatures(agentId)
    const updateAI = useUpdateAISettings(agentId)
    const updateAIF = useUpdateAIFeatures(agentId)

    const { data: ai, isLoading: loadAI, isError: errAI, error: aiErr, refetch: rAI, isRefetching: rAIng } = aiQuery
    const { data: feat, isLoading: loadFeat, isRefetching: rFeatng } = featQ

    const isLoading = loadAI || loadFeat
    const isRefetching = rAIng || rFeatng

    if (isLoading) return <Skeleton />
    if (errAI && !ai) return <ErrorState error={aiErr} onRetry={() => rAI()} retrying={rAIng} />

    const hasAI = ai && Object.keys(ai).length > 0
    const hasFeat = feat && Object.keys(feat).length > 0
    const providers = hasAI ? Object.keys(ai!.llm_providers || {}) : []
    const enabledCount = providers.filter(n => ai!.llm_providers[n].enabled).length

    return (
        <div style={{ animation: "aiFade .25s ease-out" }}>
            <style>{CSS}</style>

            {/* Loading sweep */}
            {isRefetching && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 16, overflow: "hidden", background: "var(--t-border-light)", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,var(--t-accent),transparent)", animation: "aiSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ─── Overview card ─── */}
            <div className="ai-card" style={{ padding: "20px 22px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasAI ? 18 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: hasAI && ai!.enabled ? "var(--t-accent)" : "var(--t-surface)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all .2s",
                        }}>
                            <Bot size={20} style={{ color: hasAI && ai!.enabled ? "var(--t-text-on-accent)" : "var(--t-text-faint)" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.01em" }}>إعدادات الذكاء الاصطناعي</div>
                            <div style={{ fontSize: 11, color: "var(--t-text-faint)", marginTop: 2 }}>
                                {!hasAI ? "لم يتم الإعداد بعد" : ai!.enabled ? "النظام يعمل بكفاءة" : "النظام مُعطَّل حالياً"}
                            </div>
                        </div>
                    </div>
                    {hasAI && <Toggle on={ai!.enabled} onToggle={() => updateAI.mutate({ enabled: !ai!.enabled })} />}
                </div>

                {hasAI && (
                    <>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                            <Stat label="المزودون النشطون" value={`${enabledCount} / ${providers.length}`} />
                            <Stat label="المزود الافتراضي" value={ai!.default_llm || "–"} />
                            <Stat label="الحالة" value={ai!.enabled ? "يعمل ✓" : "مُعطَّل"} color={ai!.enabled ? "var(--t-success)" : "var(--t-danger)"} />
                        </div>

                        {/* Default LLM */}
                        <div>
                            <div className="ai-section-title">المزود الافتراضي</div>
                            <select className="ai-field" style={{ fontFamily: "inherit", appearance: "auto" as any }}
                                value={ai!.default_llm || ""} onChange={e => updateAI.mutate({ default_llm: e.target.value })}>
                                <option value="">— اختر —</option>
                                {providers.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                            </select>
                        </div>
                    </>
                )}
            </div>

            {/* ─── LLM Providers ─── */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Zap size={14} style={{ color: "var(--t-accent)" }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>المزودون</span>
                    {providers.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--t-accent-muted)", color: "var(--t-accent)" }}>{providers.length}</span>
                    )}
                </div>
                {providers.map(n => <ProviderCard key={n} name={n} prov={ai!.llm_providers[n]} agentId={agentId} />)}
                <AddProviderForm agentId={agentId} />
            </div>

            {/* ─── AI Features ─── */}
            {hasFeat && (
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <Sparkles size={14} style={{ color: "var(--t-accent)" }} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)" }}>ميزات ذكية</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        <FeatureRow icon={Heart} title="تحليل المشاعر" desc="تحليل مشاعر المحادثات تلقائياً"
                            on={feat!.enable_sentiment_analysis} onChange={() => updateAIF.mutate({ enable_sentiment_analysis: !feat!.enable_sentiment_analysis })} />
                        <FeatureRow icon={Tags} title="التصنيف التلقائي" desc="تصنيف الرسائل والمواضيع تلقائياً"
                            on={feat!.enable_auto_classification} onChange={() => updateAIF.mutate({ enable_auto_classification: !feat!.enable_auto_classification })} />
                        <FeatureRow icon={FileText} title="التلخيص الذكي" desc="تلخيص المحادثات الطويلة"
                            on={feat!.enable_summarization} onChange={() => updateAIF.mutate({ enable_summarization: !feat!.enable_summarization })} />
                    </div>
                </div>
            )}
        </div>
    )
}
