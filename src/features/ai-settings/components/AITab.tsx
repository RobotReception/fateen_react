import { useState } from "react"
import {
    Loader2, Plus, Trash2, Eye, EyeOff, ChevronDown, X,
    Sparkles, Heart, Tags, FileText, RefreshCw,
    AlertTriangle, WifiOff, Server,
    Copy, Power, Settings2, Layers, Save, RotateCcw,
} from "lucide-react"
import {
    useAISettings, useUpdateAISettings,
    useUpdateProvider, useCreateProvider, useDeleteProvider,
    useAddModel, useDeleteModel,
    useAIFeatures, useUpdateAIFeatures,
} from "../hooks/use-ai-settings"
import type { LLMProvider } from "../types"
import { toast } from "sonner"

/* ─────────────────── CSS ─────────────────── */
const CSS = `
@keyframes aiFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes aiShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes aiSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
.ai2-field{width:100%;padding:8px 11px;border-radius:8px;border:1.5px solid #e5e7eb;background:#fff;font-size:12.5px;color:#111827;outline:none;transition:border-color .15s,box-shadow .15s;font-family:inherit;box-sizing:border-box}
.ai2-field:focus{border-color:#004786;box-shadow:0 0 0 3px rgba(0,71,134,.06)}
.ai2-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;cursor:pointer;background:linear-gradient(135deg,#004786,#0072b5);color:#fff;font-size:11px;font-weight:700;transition:all .15s;font-family:inherit;box-shadow:0 1px 5px rgba(0,71,134,.13)}
.ai2-btn:hover{box-shadow:0 3px 12px rgba(0,71,134,.2)}.ai2-btn:disabled{opacity:.5;cursor:default;box-shadow:none}
.ai2-ghost{display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;cursor:pointer;border:1.5px solid #e5e7eb;background:#fff;color:#6b7280;font-size:11px;font-weight:600;font-family:inherit;transition:all .12s}
.ai2-ghost:hover{border-color:#d1d5db;color:#374151}
.ai2-lbl{font-size:10px;font-weight:700;color:#9ca3af;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
`

/* ── Toggle ── */
function Toggle({ on, onToggle, size = "md" }: { on: boolean; onToggle: () => void; size?: "sm" | "md" }) {
    const W = size === "sm" ? 34 : 40, H = size === "sm" ? 18 : 22, D = size === "sm" ? 13 : 16, P = size === "sm" ? 2.5 : 3
    return (
        <button onClick={onToggle} style={{
            width: W, height: H, borderRadius: H, border: "none", flexShrink: 0,
            position: "relative", cursor: "pointer",
            background: on ? "linear-gradient(135deg, #004786, #0072b5)" : "#e5e7eb",
            transition: "background .2s", boxShadow: on ? "0 1px 5px rgba(0,71,134,.15)" : "none",
        }}>
            <span style={{ position: "absolute", top: P, left: on ? W - D - P : P, width: D, height: D, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,.18)", transition: "left .2s" }} />
        </button>
    )
}

/* ── Skeleton ── */
const sk = (w: string, h = 12, r = 6) => ({ width: w, height: h, borderRadius: r, background: "linear-gradient(110deg,#f0f1f3 30%,#f9fafb 50%,#f0f1f3 70%)", backgroundSize: "200% 100%", animation: "aiShimmer 1.6s ease-in-out infinite", flexShrink: 0 } as React.CSSProperties)

function Skeleton() {
    return (
        <div style={{ animation: "aiFade .3s ease-out" }}>
            <style>{CSS}</style>
            {/* Header skeleton */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, border: "1px solid #ebeef2", background: "#fff", marginBottom: 14 }}>
                <div style={sk("36px", 36, 10)} /><div style={{ flex: 1 }}><div style={sk("140px", 14)} /><div style={{ ...sk("200px", 10), marginTop: 6 }} /></div><div style={sk("44px", 22, 11)} />
            </div>
            {/* Grid skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[0, 1].map(i => <div key={i} style={{ borderRadius: 12, border: "1px solid #ebeef2", background: "#fff", padding: 16 }}><div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}><div style={sk("34px", 34, 8)} /><div><div style={sk("90px", 12)} /><div style={{ ...sk("60px", 9), marginTop: 4 }} /></div></div><div style={sk("100%", 60, 8)} /></div>)}
            </div>
        </div>
    )
}

/* ── Error ── */
function ErrorState({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
    const ax = error as any
    const isNet = ax?.code === "ERR_NETWORK" || ax?.code === "ECONNABORTED"
    return (
        <div style={{ borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1px solid #ebeef2", background: "#fff", animation: "aiFade .3s ease-out" }}>
            <style>{CSS}</style>
            <div style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isNet ? <WifiOff size={22} style={{ color: "#dc2626" }} /> : <AlertTriangle size={22} style={{ color: "#dc2626" }} />}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{isNet ? "لا يمكن الاتصال" : "خطأ في التحميل"}</div>
            <button className="ai2-btn" onClick={onRetry} style={{ opacity: retrying ? .7 : 1, marginTop: 8 }}>{retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} إعادة المحاولة</button>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROVIDER CARD — compact, side-by-side in grid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ProviderCard({ name, prov, agentId }: { name: string; prov: LLMProvider; agentId: string }) {
    const [open, setOpen] = useState(false)
    const [showKey, setShowKey] = useState(false)
    const [newModel, setNewModel] = useState("")
    const [addingModel, setAddingModel] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)

    /* ── Form state ── */
    const [formKey, setFormKey] = useState(prov.api_key || "")
    const [formModel, setFormModel] = useState(prov.selected_model || "")
    const [formTemp, setFormTemp] = useState(String(prov.config?.temperature ?? 0.9))
    const [formMaxTok, setFormMaxTok] = useState(String(prov.config?.max_tokens ?? 2000))
    const [formTimeout, setFormTimeout] = useState(String(prov.config?.timeout ?? 30))

    const dirty = formKey !== (prov.api_key || "")
        || formModel !== (prov.selected_model || "")
        || formTemp !== String(prov.config?.temperature ?? 0.9)
        || formMaxTok !== String(prov.config?.max_tokens ?? 2000)
        || formTimeout !== String(prov.config?.timeout ?? 30)

    const resetForm = () => {
        setFormKey(prov.api_key || "")
        setFormModel(prov.selected_model || "")
        setFormTemp(String(prov.config?.temperature ?? 0.9))
        setFormMaxTok(String(prov.config?.max_tokens ?? 2000))
        setFormTimeout(String(prov.config?.timeout ?? 30))
    }

    const updateP = useUpdateProvider(agentId)
    const deleteP = useDeleteProvider(agentId)
    const addM = useAddModel(agentId)
    const delM = useDeleteModel(agentId)

    const displayName = name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    const models = prov.available_models || []

    const handleSaveAll = () => {
        const payload: Record<string, any> = {}
        if (formKey !== (prov.api_key || "")) payload.api_key = formKey
        if (formModel !== (prov.selected_model || "")) payload.selected_model = formModel
        const temp = parseFloat(formTemp)
        const maxTok = parseInt(formMaxTok)
        const timeout = parseInt(formTimeout)
        const configChanged = temp !== (prov.config?.temperature ?? 0.9) || maxTok !== (prov.config?.max_tokens ?? 2000) || timeout !== (prov.config?.timeout ?? 30)
        if (configChanged) {
            payload.config = {
                ...prov.config,
                temperature: isNaN(temp) ? 0.9 : temp,
                max_tokens: isNaN(maxTok) ? 2000 : maxTok,
                timeout: isNaN(timeout) ? 30 : timeout,
            }
        }
        if (Object.keys(payload).length > 0) {
            updateP.mutate({ name, payload })
        }
    }

    return (
        <div style={{
            borderRadius: 12, border: `1px solid ${dirty ? "rgba(0,71,134,.25)" : open ? "rgba(0,71,134,.15)" : "#ebeef2"}`, background: "#fff",
            overflow: "hidden", transition: "all .2s",
            boxShadow: dirty ? "0 0 0 3px rgba(0,71,134,.04)" : open ? "0 4px 20px rgba(0,0,0,.05)" : "none",
        }}>
            {/* Top accent when dirty */}
            {dirty && <div style={{ height: 2, background: "linear-gradient(90deg, #004786, #0072b5)" }} />}

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: prov.enabled ? "linear-gradient(135deg, #004786, #0072b5)" : "#f0f1f3",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                    }}>
                        <Server size={14} style={{ color: prov.enabled ? "#fff" : "#9ca3af" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{displayName}</span>
                            <span style={{
                                fontSize: 8.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                                background: prov.enabled ? "rgba(22,163,74,.06)" : "#f5f6f8",
                                color: prov.enabled ? "#16a34a" : "#9ca3af",
                            }}>{prov.enabled ? "مُفعَّل" : "معطّل"}</span>
                            {dirty && <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "rgba(0,71,134,.06)", color: "#004786" }}>غير محفوظ</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {prov.selected_model ? <code style={{ fontFamily: "monospace", fontSize: 9.5, background: "#f5f6f8", padding: "0 4px", borderRadius: 3 }}>{prov.selected_model}</code> : "–"}
                            <span style={{ marginRight: 5 }}>· {models.length} موديل</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <Toggle on={prov.enabled} size="sm" onToggle={() => updateP.mutate({ name, payload: { enabled: !prov.enabled } })} />
                    <ChevronDown size={13} style={{ color: "#9ca3af", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none", cursor: "pointer" }} onClick={() => setOpen(!open)} />
                </div>
            </div>

            {/* Expanded Form */}
            {open && (
                <div style={{ borderTop: "1px solid #ebeef2", padding: "14px", animation: "aiFade .12s ease-out" }}>
                    {/* API Key */}
                    <div style={{ marginBottom: 12 }}>
                        <div className="ai2-lbl">مفتاح API</div>
                        <div style={{ display: "flex", gap: 4 }}>
                            <input className="ai2-field" type={showKey ? "text" : "password"} dir="ltr" style={{ flex: 1, fontFamily: "monospace", fontSize: 11 }}
                                value={formKey} onChange={e => setFormKey(e.target.value)} placeholder="sk-..." />
                            <button onClick={() => setShowKey(!showKey)} className="ai2-ghost" style={{ padding: "0 8px" }}>{showKey ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                            {prov.api_key && <button onClick={() => { navigator.clipboard.writeText(prov.api_key); toast.success("تم نسخ المفتاح") }} className="ai2-ghost" style={{ padding: "0 8px" }}><Copy size={12} /></button>}
                        </div>
                    </div>

                    {/* Model + Config */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                            <div className="ai2-lbl">الموديل النشط</div>
                            <select className="ai2-field" style={{ fontFamily: "inherit", appearance: "auto" as any, fontSize: 11 }}
                                value={formModel} onChange={e => setFormModel(e.target.value)}>
                                <option value="">— اختر —</option>
                                {models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <div className="ai2-lbl">درجة الحرارة</div>
                            <input type="number" step={0.1} min={0} max={2} dir="ltr" className="ai2-field" style={{ fontFamily: "monospace", fontSize: 11 }}
                                value={formTemp} onChange={e => setFormTemp(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                            <div className="ai2-lbl">أقصى رموز</div>
                            <input type="number" step={1} min={1} dir="ltr" className="ai2-field" style={{ fontFamily: "monospace", fontSize: 11 }}
                                value={formMaxTok} onChange={e => setFormMaxTok(e.target.value)} />
                        </div>
                        <div>
                            <div className="ai2-lbl">المهلة (ث)</div>
                            <input type="number" step={1} min={1} max={300} dir="ltr" className="ai2-field" style={{ fontFamily: "monospace", fontSize: 11 }}
                                value={formTimeout} onChange={e => setFormTimeout(e.target.value)} />
                        </div>
                    </div>

                    {/* Models */}
                    <div style={{ marginBottom: 12 }}>
                        <div className="ai2-lbl">الموديلات</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {models.map(m => (
                                <span key={m} style={{
                                    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                                    fontFamily: "monospace", background: prov.selected_model === m ? "rgba(0,71,134,.06)" : "#f5f6f8",
                                    color: prov.selected_model === m ? "#004786" : "#6b7280", border: `1px solid ${prov.selected_model === m ? "rgba(0,71,134,.15)" : "#ebeef2"}`,
                                }}>
                                    {m}
                                    <button onClick={() => delM.mutate({ provider: name, modelId: m })} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "#dc2626", display: "flex", lineHeight: 1 }}><X size={8} /></button>
                                </span>
                            ))}
                            {addingModel ? (
                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                    <input className="ai2-field" dir="ltr" value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="gpt-4o" autoFocus
                                        style={{ fontFamily: "monospace", width: 120, padding: "3px 8px", fontSize: 10 }}
                                        onKeyDown={e => { if (e.key === "Enter" && newModel.trim()) { addM.mutate({ provider: name, payload: { model_id: newModel.trim() } }); setNewModel(""); setAddingModel(false) } }} />
                                    <button className="ai2-btn" style={{ padding: "3px 8px", fontSize: 9 }} disabled={!newModel.trim()}
                                        onClick={() => { addM.mutate({ provider: name, payload: { model_id: newModel.trim() } }); setNewModel(""); setAddingModel(false) }}>+</button>
                                    <button className="ai2-ghost" style={{ padding: "3px 6px" }} onClick={() => { setAddingModel(false); setNewModel("") }}><X size={10} /></button>
                                </div>
                            ) : (
                                <button onClick={() => setAddingModel(true)} style={{
                                    display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 6, border: "1.5px dashed #d1d5db",
                                    background: "transparent", color: "#9ca3af", fontSize: 10, cursor: "pointer", fontFamily: "inherit", transition: "all .1s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af" }}>
                                    <Plus size={9} /> إضافة
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Save / Reset / Delete bar ── */}
                    <div style={{ paddingTop: 10, borderTop: "1px solid #f0f1f3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                            {dirty && (
                                <>
                                    <button onClick={handleSaveAll} disabled={updateP.isPending} className="ai2-btn" style={{ padding: "6px 14px", fontSize: 11, opacity: updateP.isPending ? .7 : 1 }}>
                                        {updateP.isPending ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} حفظ التعديلات
                                    </button>
                                    <button onClick={resetForm} className="ai2-ghost" style={{ padding: "6px 12px", fontSize: 11 }}>
                                        <RotateCcw size={10} /> إلغاء
                                    </button>
                                </>
                            )}
                        </div>
                        {!confirmDel ? (
                            <button onClick={() => setConfirmDel(true)} style={{
                                display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, cursor: "pointer",
                                border: "1px solid rgba(239,68,68,.15)", background: "rgba(239,68,68,.03)", color: "#dc2626", fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                            }}><Trash2 size={10} /> حذف المزود</button>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>حذف "{displayName}"؟</span>
                                <button onClick={() => deleteP.mutate(name)} className="ai2-btn" style={{ background: "#dc2626", padding: "4px 10px", fontSize: 10, boxShadow: "0 1px 4px rgba(220,38,38,.15)" }}>حذف</button>
                                <button onClick={() => setConfirmDel(false)} className="ai2-ghost" style={{ padding: "4px 8px", fontSize: 10 }}>إلغاء</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ━━━━ ADD PROVIDER ━━━━ */
function AddProviderForm({ agentId }: { agentId: string }) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(""); const [key, setKey] = useState("")
    const createP = useCreateProvider(agentId)

    if (!open) return (
        <button onClick={() => setOpen(true)} style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: "1.5px dashed #d1d5db", background: "transparent",
            color: "#9ca3af", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all .15s", fontFamily: "inherit",
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af" }}>
            <Plus size={13} /> إضافة مزود جديد
        </button>
    )

    return (
        <div style={{ borderRadius: 12, border: "1.5px solid rgba(0,71,134,.2)", background: "#fff", padding: "14px 16px", boxShadow: "0 2px 12px rgba(0,71,134,.05)", gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>مزود LLM جديد</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><div className="ai2-lbl">اسم المزود</div><input className="ai2-field" dir="ltr" value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))} placeholder="anthropic" /></div>
                <div><div className="ai2-lbl">مفتاح API</div><input className="ai2-field" dir="ltr" type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-..." /></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
                <button className="ai2-btn" disabled={!name.trim() || createP.isPending}
                    onClick={() => { createP.mutate({ name: name.trim(), payload: { enabled: true, api_key: key, available_models: [], selected_model: "", config: {} } }); setName(""); setKey(""); setOpen(false) }}>
                    {createP.isPending ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} إنشاء
                </button>
                <button className="ai2-ghost" onClick={() => { setOpen(false); setName(""); setKey("") }}>إلغاء</button>
            </div>
        </div>
    )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function AITab({ agentId }: { agentId: string }) {
    const aiQuery = useAISettings(agentId)
    const featQ = useAIFeatures(agentId)
    const updateAI = useUpdateAISettings(agentId)
    const updateAIF = useUpdateAIFeatures(agentId)

    const { data: ai, isLoading: loadAI, isError: errAI, error: aiErr, refetch: rAI, isRefetching: rAIng } = aiQuery
    const { data: feat, isLoading: loadFeat, isRefetching: rFeatng } = featQ

    if (loadAI || loadFeat) return <Skeleton />
    if (errAI && !ai) return <ErrorState error={aiErr} onRetry={() => rAI()} retrying={rAIng} />

    const hasAI = ai && Object.keys(ai).length > 0
    const hasFeat = feat && Object.keys(feat).length > 0
    const providers = hasAI ? Object.keys(ai!.llm_providers || {}) : []
    const enabledCount = providers.filter(n => ai!.llm_providers[n].enabled).length

    return (
        <div style={{ animation: "aiFade .25s ease-out" }}>
            <style>{CSS}</style>

            {/* Loading sweep */}
            {(rAIng || rFeatng) && (
                <div style={{ height: 2, borderRadius: 1, marginBottom: 12, overflow: "hidden", background: "#ebeef2", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,#004786,transparent)", animation: "aiSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ─── Section 1: Status Strip ─── */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
                borderRadius: 12, border: "1px solid #ebeef2", background: "#fff", marginBottom: 12, position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: hasAI && ai!.enabled ? "linear-gradient(90deg, #004786, #0072b5)" : "#e5e7eb" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: hasAI && ai!.enabled ? "linear-gradient(135deg, #004786, #0072b5)" : "#f0f1f3",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Power size={15} style={{ color: hasAI && ai!.enabled ? "#fff" : "#9ca3af" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>محرك الذكاء الاصطناعي</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: hasAI && ai!.enabled ? "#16a34a" : "#d1d5db" }} />
                                {!hasAI ? "غير مُهيَّأ" : ai!.enabled ? "يعمل" : "متوقف"}
                            </span>
                            {hasAI && <>
                                <span>·</span>
                                <span>{enabledCount}/{providers.length} مزود</span>
                                {ai!.default_llm && <><span>·</span><code style={{ fontFamily: "monospace", fontSize: 10, background: "#f5f6f8", padding: "0 4px", borderRadius: 3 }}>{ai!.default_llm}</code></>}
                            </>}
                        </div>
                    </div>
                </div>
                {hasAI && <Toggle on={ai!.enabled} onToggle={() => updateAI.mutate({ enabled: !ai!.enabled })} />}
            </div>

            {/* ─── Section 2: Default LLM ─── */}
            {hasAI && providers.length > 0 && (
                <div style={{ marginBottom: 12, padding: "10px 16px", borderRadius: 12, border: "1px solid #ebeef2", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Settings2 size={13} style={{ color: "#9ca3af" }} />
                        <span className="ai2-lbl" style={{ margin: 0 }}>المزود الافتراضي</span>
                        <select className="ai2-field" style={{ fontFamily: "inherit", appearance: "auto" as any, flex: 1, maxWidth: 200, padding: "5px 8px", fontSize: 11 }}
                            value={ai!.default_llm || ""} onChange={e => updateAI.mutate({ default_llm: e.target.value })}>
                            <option value="">— اختر —</option>
                            {providers.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* ─── Section 3: Providers Grid ─── */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Layers size={13} style={{ color: "#004786" }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>المزودون</span>
                    {providers.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "rgba(0,71,134,.06)", color: "#004786" }}>{providers.length}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: providers.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
                    {providers.map(n => <ProviderCard key={n} name={n} prov={ai!.llm_providers[n]} agentId={agentId} />)}
                    <AddProviderForm agentId={agentId} />
                </div>
            </div>

            {/* ─── Section 4: Smart Features ─── */}
            {hasFeat && (
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <Sparkles size={13} style={{ color: "#7c3aed" }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>ميزات ذكية</span>
                    </div>
                    <div style={{ borderRadius: 12, border: "1px solid #ebeef2", background: "#fff", overflow: "hidden" }}>
                        {[
                            { icon: Heart, title: "تحليل المشاعر", desc: "تحليل مشاعر المحادثات تلقائياً", on: feat!.enable_sentiment_analysis, toggle: () => updateAIF.mutate({ enable_sentiment_analysis: !feat!.enable_sentiment_analysis }) },
                            { icon: Tags, title: "التصنيف التلقائي", desc: "تصنيف الرسائل والمواضيع تلقائياً", on: feat!.enable_auto_classification, toggle: () => updateAIF.mutate({ enable_auto_classification: !feat!.enable_auto_classification }) },
                            { icon: FileText, title: "التلخيص الذكي", desc: "تلخيص المحادثات الطويلة", on: feat!.enable_summarization, toggle: () => updateAIF.mutate({ enable_summarization: !feat!.enable_summarization }) },
                        ].map((f, i, arr) => (
                            <div key={f.title} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px",
                                borderBottom: i < arr.length - 1 ? "1px solid #f0f1f3" : "none",
                                background: f.on ? "rgba(0,71,134,.015)" : "transparent", transition: "background .12s",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 7,
                                        background: f.on ? "linear-gradient(135deg, #004786, #0072b5)" : "#f5f6f8",
                                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s",
                                    }}>
                                        <f.icon size={13} style={{ color: f.on ? "#fff" : "#9ca3af" }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{f.title}</div>
                                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{f.desc}</div>
                                    </div>
                                </div>
                                <Toggle on={f.on} size="sm" onToggle={f.toggle} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
