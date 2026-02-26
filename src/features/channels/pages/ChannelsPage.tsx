import { useState, useMemo } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
    Search, X, Plus, Radio, Trash2, Settings2, Loader2,
    AlertTriangle, Copy, Clock, Wifi, WifiOff,
    Bot, Globe, ToggleLeft, ToggleRight, Zap,
} from "lucide-react"

import { toast } from "sonner"
import { useAllChannels, useDeleteChannel, useToggleChannel, useTogglePlatform, usePlatformsStatus } from "../hooks/use-channels"
import { PLATFORM_META, PLATFORMS } from "../types"
import type { Channel, Platform } from "../types"
import { AddChannelDialog } from "../components/AddChannelDialog"
import { ChannelDetailModal } from "../components/ChannelDetailModal"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ─────────────────────────────────────────── CSS ─── */
const CSS = `
@keyframes chFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes chShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes chSweep{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
@keyframes chModalIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
`

/* ─── Platform icon ─── */
function PIcon({ platform, size = 40 }: { platform: Platform; size?: number }) {
    const m = PLATFORM_META[platform]
    return (
        <div style={{
            width: size, height: size, borderRadius: size * .28, flexShrink: 0,
            background: m.color, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: size * .44, color: "#fff",
        }}>
            {m.icon}
        </div>
    )
}

/* ─── Toggle button ─── */
function Toggle({ on, onToggle, loading }: { on: boolean; onToggle: () => void; loading?: boolean }) {
    if (loading) return <Loader2 size={18} style={{ color: "var(--t-text-faint)", animation: "spin 1s linear infinite" }} />
    return (
        <button onClick={onToggle} title={on ? "إيقاف القناة" : "تفعيل القناة"} style={{
            background: "none", border: "none", cursor: "pointer", color: on ? "var(--t-success)" : "var(--t-text-faint)",
            display: "flex", alignItems: "center", padding: 0, transition: "color .15s",
        }}>
            {on ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
    )
}

/* ─── Skeleton ─── */
const sk = (w: string, h = 12, r = 6) => ({
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(110deg,var(--t-border) 30%,var(--t-border-light) 50%,var(--t-border) 70%)",
    backgroundSize: "200% 100%", animation: "chShimmer 1.6s ease-in-out infinite",
} as React.CSSProperties)

function SkeletonCard({ delay }: { delay: number }) {
    return (
        <div style={{ borderRadius: 14, border: "1px solid var(--t-border)", background: "var(--t-card)", padding: 20, animation: `chFade .4s ease-out ${delay}ms both` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={sk("40px", 40, 11)} />
                <div><div style={sk("130px", 14)} /><div style={{ ...sk("80px", 10), marginTop: 6 }} /></div>
            </div>
            <div style={{ ...sk("100%", 10), marginBottom: 6 }} />
            <div style={sk("60%", 10)} />
        </div>
    )
}

/* ─── Delete modal ─── */
function DeleteModal({ channel, onClose, onConfirm, loading }: {
    channel: Channel; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
    const m = PLATFORM_META[channel.platform]
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ borderRadius: 18, background: "var(--t-card)", border: "1px solid var(--t-border)", width: "100%", maxWidth: 420, margin: 16, animation: "chModalIn .18s ease-out" }}>
                <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={24} style={{ color: "var(--t-danger)" }} />
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--t-text)", marginBottom: 8 }}>حذف القناة</div>
                    <div style={{ fontSize: 13, color: "var(--t-text-faint)", lineHeight: 1.7, marginBottom: 16 }}>
                        هل أنت متأكد من حذف قناة <strong style={{ color: m.color }}>{m.labelAr}</strong>
                        {channel.name ? ` — ${channel.name}` : ""}؟
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", textAlign: "right" }}>
                        <AlertTriangle size={14} style={{ color: "var(--t-warning)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "var(--t-warning)", lineHeight: 1.7 }}>سيتم حذف القناة نهائياً من جميع Collections وإلغاء Redis cache — لا يمكن التراجع</span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "16px 28px", borderTop: "1px solid var(--t-border-light)", justifyContent: "flex-end" }}>
                    <button disabled={loading} onClick={onClose} style={{ padding: "8px 18px", borderRadius: 9, border: "1.5px solid var(--t-border)", background: "transparent", color: "var(--t-text)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>إلغاء</button>
                    <button disabled={loading} onClick={onConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "none", background: "var(--t-danger)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        حذف نهائي
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─── Channel card ─── */
function ChannelCard({ channel, idx, onView, onDelete }: {
    channel: Channel; idx: number; onView: (c: Channel) => void; onDelete: (c: Channel) => void
}) {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""
    const toggle = useToggleChannel(tenantId)
    const m = PLATFORM_META[channel.platform]

    const copyId = () => { navigator.clipboard.writeText(channel.identifier); toast.success("تم نسخ المعرّف") }
    const created = channel.created_at
        ? new Date(channel.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Aden" })
        : null

    return (
        <div style={{
            borderRadius: 14, border: `1px solid var(--t-border)`,
            background: "var(--t-card)", padding: 20, position: "relative",
            transition: "box-shadow .2s, transform .2s", animation: `chFade .35s ease-out ${idx * 55}ms both`,
            borderTopColor: channel.enabled ? m.color : "var(--t-border)",
            borderTopWidth: 2,
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <PIcon platform={channel.platform} size={42} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--t-text)", marginBottom: 3 }}>
                            {channel.name || m.labelAr}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${m.color}18`, color: m.color }}>
                            {m.label}
                        </span>
                    </div>
                </div>
                <Toggle
                    on={channel.enabled ?? false}
                    loading={toggle.isPending}
                    onToggle={() => toggle.mutate({ platform: channel.platform, identifier: channel.identifier, payload: { enabled: !(channel.enabled ?? false) } })}
                />
            </div>

            {/* Info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <code style={{ fontSize: 11, fontFamily: "monospace", background: "var(--t-surface)", border: "1px solid var(--t-border-light)", padding: "2px 8px", borderRadius: 6, color: "var(--t-text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {channel.identifier}
                    </code>
                    <button onClick={copyId} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex", padding: 0 }}>
                        <Copy size={12} />
                    </button>
                </div>
                {channel.platform === "webchat" && channel.script_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--t-text-faint)" }}>
                        <Globe size={11} />
                        <a href={channel.script_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--t-accent)", textDecoration: "none", fontFamily: "monospace", fontSize: 10 }}>
                            {channel.script_url.length > 40 ? channel.script_url.slice(0, 40) + "…" : channel.script_url}
                        </a>
                    </div>
                )}
                {channel.agent_ids && channel.agent_ids.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--t-text-faint)" }}>
                        <Bot size={11} />
                        <span>{channel.agent_ids.length} وكيل مرتبط</span>
                    </div>
                )}
                {created && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--t-text-faint)" }}>
                        <Clock size={11} />
                        <span>{created}</span>
                    </div>
                )}
                {/* Status badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {channel.enabled
                        ? <><Wifi size={11} style={{ color: "var(--t-success)" }} /><span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-success)" }}>نشطة</span></>
                        : <><WifiOff size={11} style={{ color: "var(--t-text-faint)" }} /><span style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)" }}>موقوفة</span></>
                    }
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 7, paddingTop: 12, borderTop: "1px solid var(--t-border-light)" }}>
                <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.GET_CHANNEL}>
                    <button onClick={() => onView(channel)} style={{
                        flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "8px 0", borderRadius: 9, border: "1.5px solid var(--t-border)",
                        background: "transparent", color: "var(--t-text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all .15s",
                    }}>
                        <Settings2 size={13} /> الإعدادات
                    </button>
                </ActionGuard>
                <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.TOGGLE_CHANNEL}>
                    <button onClick={() => onDelete(channel)} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 36, height: 36, borderRadius: 9, border: "1.5px solid var(--t-border)",
                        background: "transparent", color: "var(--t-text-faint)", cursor: "pointer",
                        transition: "all .15s",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-danger)"; e.currentTarget.style.color = "var(--t-danger)"; e.currentTarget.style.background = "rgba(239,68,68,.05)" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)"; e.currentTarget.style.background = "transparent" }}>
                        <Trash2 size={14} />
                    </button>
                </ActionGuard>
            </div>
        </div>
    )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export function ChannelsPage() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all")
    const [search, setSearch] = useState("")
    const [showAdd, setShowAdd] = useState(false)
    const [viewChannel, setViewChannel] = useState<Channel | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)

    const { data: channels = [], isLoading, isFetching } = useAllChannels(tenantId)
    const deleteMut = useDeleteChannel(tenantId)
    const togglePlatformMut = useTogglePlatform(tenantId)
    const { data: platStatusRes, refetch: refetchPlatStatus } = usePlatformsStatus(tenantId)

    /* Filtered */
    const filtered = useMemo(() => {
        let list = channels
        if (selectedPlatform !== "all") list = list.filter(c => c.platform === selectedPlatform)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(c => (c.name || "").toLowerCase().includes(q) || c.identifier.toLowerCase().includes(q) || c.platform.includes(q))
        }
        return list
    }, [channels, selectedPlatform, search])

    /* Counts */
    const counts = useMemo(() => {
        const r: Record<string, number> = { all: channels.length }
        for (const p of PLATFORMS) r[p] = 0
        for (const c of channels) r[c.platform] = (r[c.platform] || 0) + 1
        return r
    }, [channels])

    const enabledCount = channels.filter(c => c.enabled).length
    const activePlats = PLATFORMS.filter(p => counts[p] > 0).length

    const handleDelete = () => {
        if (!deleteTarget) return
        deleteMut.mutate(
            { platform: deleteTarget.platform, identifier: deleteTarget.identifier },
            { onSuccess: r => { if (r.success) setDeleteTarget(null) } }
        )
    }

    return (
        <div style={{ padding: "24px 28px", direction: "rtl", maxWidth: 1400, margin: "0 auto" }}>
            <style>{CSS}</style>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Radio size={20} style={{ color: "#fff" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em" }}>القنوات</div>
                        <div style={{ fontSize: 12, color: "var(--t-text-faint)", marginTop: 1 }}>إدارة قنوات التواصل والمراسلة</div>
                    </div>
                </div>
                <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.LIST_CHANNELS}>
                    <button onClick={() => setShowAdd(true)} style={{
                        display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 11,
                        background: "var(--t-accent)", color: "var(--t-text-on-accent)", border: "none",
                        fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 12px rgba(99,102,241,.3)",
                    }}>
                        <Plus size={15} /> إضافة قناة
                    </button>
                </ActionGuard>
            </div>
            {/* ── Platform toggle bar ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
                {PLATFORMS.map(p => {
                    const m = PLATFORM_META[p]
                    const platEnabled = platStatusRes?.data?.platforms?.[p] ?? false
                    const isTogglingThis = togglePlatformMut.isPending && togglePlatformMut.variables?.platform === p
                    return (
                        <div key={p} style={{
                            borderRadius: 13, border: `1.5px solid ${platEnabled ? m.color + "55" : "var(--t-border)"}`,
                            background: platEnabled ? `${m.color}0d` : "var(--t-card)",
                            padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                            transition: "all .2s",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{m.icon}</div>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t-text)", lineHeight: 1.2 }}>{m.labelAr}</div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: platEnabled ? m.color : "var(--t-text-faint)", marginTop: 1 }}>
                                        {platEnabled ? "نشطة" : "موقوفة"}
                                    </div>
                                </div>
                            </div>
                            {isTogglingThis
                                ? <Loader2 size={16} style={{ color: "var(--t-text-faint)", animation: "spin 1s linear infinite" }} />
                                : <button
                                    title={platEnabled ? `إيقاف ${m.labelAr}` : `تفعيل ${m.labelAr}`}
                                    onClick={() => togglePlatformMut.mutate(
                                        { platform: p, payload: { enabled: !platEnabled } },
                                        { onSuccess: () => refetchPlatStatus() }
                                    )}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: platEnabled ? m.color : "var(--t-text-faint)", display: "flex", padding: 0, transition: "color .15s" }}
                                >
                                    {platEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                </button>
                            }
                        </div>
                    )
                })}
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
                {[
                    { label: "إجمالي القنوات", value: isLoading ? "—" : channels.length, icon: Radio, color: "#6366f1" },
                    { label: "القنوات النشطة", value: isLoading ? "—" : enabledCount, icon: Wifi, color: "#10b981" },
                    { label: "المنصات المفعّلة", value: isLoading ? "—" : activePlats, icon: Zap, color: "#f59e0b" },
                ].map(s => (
                    <div key={s.label} style={{ borderRadius: 13, border: "1px solid var(--t-border)", background: "var(--t-card)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--t-text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--t-text)", letterSpacing: "-0.02em" }}>{s.value}</div>
                        </div>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <s.icon size={19} style={{ color: s.color }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Platform pill tabs + search ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {/* All */}
                    <button onClick={() => setSelectedPlatform("all")} style={{
                        display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 20,
                        border: "1.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                        borderColor: selectedPlatform === "all" ? "var(--t-accent)" : "var(--t-border)",
                        background: selectedPlatform === "all" ? "var(--t-accent)" : "var(--t-card)",
                        color: selectedPlatform === "all" ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                    }}>
                        <Radio size={12} /> الكل
                        <span style={{ background: "rgba(255,255,255,.25)", borderRadius: 20, padding: "0 6px", fontSize: 10 }}>{counts.all}</span>
                    </button>
                    {PLATFORMS.map(p => {
                        const m = PLATFORM_META[p]
                        const active = selectedPlatform === p
                        return (
                            <button key={p} onClick={() => setSelectedPlatform(p)} style={{
                                display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 20,
                                border: "1.5px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                                borderColor: active ? m.color : "var(--t-border)",
                                background: active ? m.color : "var(--t-card)",
                                color: active ? "#fff" : "var(--t-text-faint)",
                            }}>
                                <span>{m.icon}</span> {m.labelAr}
                                {counts[p] > 0 && (
                                    <span style={{ background: active ? "rgba(255,255,255,.25)" : "var(--t-surface)", borderRadius: 20, padding: "0 6px", fontSize: 10, color: active ? "#fff" : "var(--t-text-faint)" }}>
                                        {counts[p]}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
                {/* Search */}
                <div style={{ position: "relative", minWidth: 230 }}>
                    <Search size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--t-text-faint)" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في القنوات..."
                        style={{ width: "100%", padding: "9px 36px 9px 36px", borderRadius: 10, border: "1.5px solid var(--t-border)", background: "var(--t-card)", color: "var(--t-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    {search && (
                        <button onClick={() => setSearch("")} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--t-text-faint)", display: "flex" }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Fetching bar */}
            {isFetching && !isLoading && (
                <div style={{ height: 2, borderRadius: 2, overflow: "hidden", background: "var(--t-border-light)", marginBottom: 16, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg,transparent,var(--t-accent),transparent)`, animation: "chSweep 1.3s ease-in-out infinite" }} />
                </div>
            )}

            {/* ── Content ── */}
            {isLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                    {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} delay={i * 70} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 24px", animation: "chFade .4s ease-out" }}>
                    <div style={{ width: 80, height: 80, borderRadius: 22, margin: "0 auto 20px", background: "var(--t-surface)", border: "1px solid var(--t-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Radio size={36} style={{ color: "var(--t-text-faint)", opacity: .4 }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--t-text)", marginBottom: 8 }}>
                        {search ? "لا توجد نتائج" : selectedPlatform !== "all" ? `لا توجد قنوات ${PLATFORM_META[selectedPlatform].labelAr}` : "لم تضف أي قناة بعد"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--t-text-faint)", marginBottom: 24, lineHeight: 1.7 }}>
                        {search ? "جرّب كلمة بحث مختلفة" : "أضف قنوات التواصل لبدء استقبال الرسائل وإدارتها من مكان واحد"}
                    </div>
                    {!search && (
                        <button onClick={() => setShowAdd(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, background: "var(--t-accent)", color: "var(--t-text-on-accent)", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                            <Plus size={15} /> إضافة قناة جديدة
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                    {filtered.map((ch, i) => (
                        <ChannelCard key={ch.identifier} channel={ch} idx={i} onView={setViewChannel} onDelete={setDeleteTarget} />
                    ))}
                    {/* Add card */}
                    <button onClick={() => setShowAdd(true)} style={{
                        borderRadius: 14, border: "2px dashed var(--t-border)", background: "transparent",
                        minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                        cursor: "pointer", transition: "all .15s", color: "var(--t-text-faint)",
                        animation: `chFade .35s ease-out ${filtered.length * 55}ms both`,
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--t-accent)"; e.currentTarget.style.color = "var(--t-accent)"; e.currentTarget.style.background = "rgba(99,102,241,.03)" }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--t-border)"; e.currentTarget.style.color = "var(--t-text-faint)"; e.currentTarget.style.background = "transparent" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 13, border: "1.5px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={22} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>إضافة قناة جديدة</div>
                        <div style={{ fontSize: 11 }}>اربط منصة تواصل أخرى</div>
                    </button>
                </div>
            )}

            {/* ── Platform overview ── */}



            {/* ── Modals ── */}
            {showAdd && (
                <AddChannelDialog
                    defaultPlatform={selectedPlatform !== "all" ? selectedPlatform : undefined}
                    onClose={() => setShowAdd(false)}
                />
            )}
            {viewChannel && (
                <ChannelDetailModal channel={viewChannel} onClose={() => setViewChannel(null)} />
            )}
            {deleteTarget && (
                <DeleteModal
                    channel={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    loading={deleteMut.isPending}
                />
            )}
        </div>
    )
}
