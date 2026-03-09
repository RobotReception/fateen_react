import { useState, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import { useAuthStore } from "@/stores/auth-store"
import {
    Search, X, Plus, Radio, Trash2, Settings2, Loader2,
    Copy, Globe, ExternalLink, MoreHorizontal, ChevronLeft,
} from "lucide-react"

import { toast } from "sonner"
import { useAllChannels, useDeleteChannel, useToggleChannel, useTogglePlatform, usePlatformsStatus } from "../hooks/use-channels"
import { useAgents } from "../../ai-settings/hooks/use-ai-settings"
import { PLATFORM_META, PLATFORMS } from "../types"
import type { Channel, Platform } from "../types"
import { AddChannelDialog } from "../components/AddChannelDialog"
import { ChannelDetailModal } from "../components/ChannelDetailModal"
import { ActionGuard } from "@/components/guards/ActionGuard"
import { PAGE_BITS, ACTION_BITS } from "@/lib/permissions"

/* ════════════════════════════════════════════
   CSS
════════════════════════════════════════════ */
const CSS = `
@keyframes chIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes chSlide{from{opacity:0;max-height:0}to{opacity:1;max-height:800px}}
@keyframes chModal{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes chShim{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes chPulse{0%,100%{opacity:1}50%{opacity:.4}}

/* Platform card */
.pcard{
    position:relative;border-radius:14px;border:2px solid #ebeef2;background:#fff;
    padding:18px;cursor:pointer;transition:all .18s;overflow:hidden;
}
.pcard::before{
    content:'';position:absolute;top:0;right:0;left:0;height:3px;
    background:var(--pc,#d1d5db);opacity:0;transition:opacity .18s;
}
.pcard:hover{border-color:#d1d5db;box-shadow:0 2px 12px rgba(0,0,0,.04)}
.pcard.selected{border-color:var(--pc);box-shadow:0 4px 20px color-mix(in srgb,var(--pc) 12%,transparent)}
.pcard.selected::before{opacity:1}
.pcard.active .pcard-status{color:var(--pc)}
.pcard.inactive .pcard-status{color:#d1d5db}

/* Toggle switch */
.ch-sw{
    width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;
    position:relative;transition:background .15s;padding:0;flex-shrink:0;
}
.ch-sw::after{
    content:'';position:absolute;top:2px;width:18px;height:18px;border-radius:50%;
    background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.15);transition:all .15s;
}
.ch-sw.on{background:#16a34a}
.ch-sw.on::after{right:2px}
.ch-sw.off{background:#d1d5db}
.ch-sw.off::after{right:20px}

/* Small toggle for platform cards */
.ch-sw-sm{
    width:34px;height:18px;border-radius:9px;border:none;cursor:pointer;
    position:relative;transition:background .15s;padding:0;flex-shrink:0;
}
.ch-sw-sm::after{
    content:'';position:absolute;top:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.15);transition:all .15s;
}
.ch-sw-sm.on{background:#16a34a}
.ch-sw-sm.on::after{right:2px}
.ch-sw-sm.off{background:#d1d5db}
.ch-sw-sm.off::after{right:18px}

/* Channel table */
.ch-tbl{width:100%;border-collapse:separate;border-spacing:0}
.ch-tbl thead th{
    padding:0 14px;height:34px;font-size:10px;font-weight:800;color:#9ca3af;
    text-align:right;white-space:nowrap;text-transform:uppercase;letter-spacing:.05em;
    border-bottom:1px solid #ebeef2;vertical-align:middle;
}
.ch-tbl tbody tr{transition:background .08s;cursor:pointer}
.ch-tbl tbody tr:hover{background:rgba(0,71,134,.015)}
.ch-tbl tbody td{
    padding:10px 14px;font-size:12.5px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:middle;
}
.ch-tbl tbody tr:last-child td{border-bottom:none}

/* Actions dropdown */
.ch-menu{
    position:absolute;left:0;top:100%;margin-top:4px;z-index:30;
    background:#fff;border:1px solid #ebeef2;border-radius:10px;
    box-shadow:0 8px 28px rgba(0,0,0,.08);min-width:150px;padding:4px;
    animation:chIn .1s ease-out;
}
.ch-menu button{
    width:100%;padding:7px 10px;border:none;background:transparent;cursor:pointer;
    display:flex;align-items:center;gap:7px;border-radius:7px;
    font-size:11.5px;font-weight:600;color:#374151;transition:background .08s;
    font-family:inherit;text-align:right;
}
.ch-menu button:hover{background:#f5f6f8}
.ch-menu .danger{color:#dc2626}
.ch-menu .danger:hover{background:rgba(239,68,68,.04)}
`

/* ── Platform SVG Logos (dynamic fill color) ── */
function PlatformLogo({ platform, fill = "#fff", size = 18 }: { platform: Platform; fill?: string; size?: number }) {
    const s = platform === "whatsapp" ? size + 2 : size
    const paths: Record<Platform, string> = {
        whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
        facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
        instagram: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z",
        appchat: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-4.2-5.78v1.75l3.2-2.99L12.8 9v1.7c-3.18.02-5.16 1.04-6.8 3.3 .6-3.13 2.38-5.48 6.8-5.78z",
        webchat: "M12 2C6.477 2 2 6.477 2 12c0 1.82.487 3.53 1.338 5.002L2.04 21.96l4.958-1.298A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8a7.96 7.96 0 01-4.266-1.234l-.298-.186-3.078.806.806-3.078-.186-.298A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8zm-3 6a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 100 2 1 1 0 000-2z",
    }
    return <svg viewBox="0 0 24 24" width={s} height={s} fill={fill}><path d={paths[platform]} /></svg>
}

/* Helpers */
function fmtDate(d?: string) {
    if (!d) return "—"
    try { return new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Aden" }).format(new Date(d)) } catch { return d }
}

/* ═══ PlatformCard ═══ */
function PlatformCard({ platform, on, count, selected, toggling, onToggle, onSelect }: {
    platform: Platform; on: boolean; count: number; selected: boolean; toggling: boolean
    onToggle: () => void; onSelect: () => void
}) {
    const m = PLATFORM_META[platform]
    return (
        <div
            className={`pcard ${selected ? "selected" : ""} ${on ? "active" : "inactive"}`}
            style={{ "--pc": m.color } as React.CSSProperties}
            onClick={onSelect}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: on ? `linear-gradient(135deg, ${m.color}, ${m.color}cc)` : "#e8ebef",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .18s",
                    boxShadow: on ? `0 2px 8px ${m.color}30` : "none",
                    filter: on ? "none" : "grayscale(.3)",
                }}>
                    <PlatformLogo platform={platform} fill={on ? "#fff" : m.color} />
                </div>
                {/* Toggle */}
                <div onClick={e => e.stopPropagation()}>
                    {toggling ? (
                        <Loader2 size={14} style={{ color: "#004786", animation: "chPulse .8s infinite" }} />
                    ) : (
                        <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.TOGGLE_PLATFORM}>
                            <button className={`ch-sw-sm ${on ? "on" : "off"}`}
                                onClick={onToggle}
                                title={on ? `إيقاف ${m.labelAr}` : `تفعيل ${m.labelAr}`} />
                        </ActionGuard>
                    )}
                </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#111827", marginBottom: 2 }}>{m.labelAr}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 10, lineHeight: 1.5 }}>{m.description}</div>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 10, borderTop: "1px solid #f1f3f5",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: on ? "#16a34a" : "#d1d5db",
                    }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? "#16a34a" : "#9ca3af" }}>
                        {on ? "مفعّلة" : "موقوفة"}
                    </span>
                </div>
                <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                    background: count > 0 ? `${m.color}0a` : "#f5f6f8",
                    color: count > 0 ? m.color : "#ccc",
                }}>
                    {count} قناة
                </span>
            </div>
        </div>
    )
}

/* ═══ Channel Row Actions ═══ */
function RowActions({ onView, onDelete }: { onView: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (btnRef.current) {
            const r = btnRef.current.getBoundingClientRect()
            setPos({ top: r.bottom + 4, left: r.left - 120 })
        }
        setOpen(v => !v)
    }

    return (
        <>
            <button ref={btnRef} onClick={handleOpen} style={{
                width: 28, height: 28, borderRadius: 7, border: "1px solid #eaedf0", background: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#9ca3af", transition: "all .12s",
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#eaedf0"; e.currentTarget.style.color = "#9ca3af" }}
            >
                <MoreHorizontal size={14} />
            </button>
            {open && createPortal(
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
                    <div dir="rtl" style={{
                        position: "fixed", top: pos.top, left: pos.left, zIndex: 9999,
                        background: "#fff", border: "1px solid #ebeef2", borderRadius: 10,
                        boxShadow: "0 8px 28px rgba(0,0,0,.12)", minWidth: 150, padding: 4,
                        animation: "chIn .1s ease-out",
                    }}>
                        <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.GET_CHANNEL}>
                            <button onClick={() => { onView(); setOpen(false) }} style={{
                                width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 8, borderRadius: 7,
                                fontSize: 12, fontWeight: 600, color: "#374151", transition: "background .08s", fontFamily: "inherit", textAlign: "right",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "#f5f6f8" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                            ><Settings2 size={13} /> الإعدادات</button>
                        </ActionGuard>
                        <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.DELETE_CHANNEL}>
                            <button onClick={() => { onDelete(); setOpen(false) }} style={{
                                width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 8, borderRadius: 7,
                                fontSize: 12, fontWeight: 600, color: "#dc2626", transition: "background .08s", fontFamily: "inherit", textAlign: "right",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.04)" }}
                                onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
                            ><Trash2 size={13} /> حذف</button>
                        </ActionGuard>
                    </div>
                </>,
                document.body
            )}
        </>
    )
}

/* ═══ Delete Modal ═══ */
function DeleteModal({ channel, onClose, onConfirm, loading }: {
    channel: Channel; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
    const m = PLATFORM_META[channel.platform]
    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.4)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} dir="rtl" style={{
                borderRadius: 16, background: "#fff", width: "100%", maxWidth: 380, margin: 16,
                animation: "chModal .15s ease-out", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,.1)",
            }}>
                <div style={{ padding: "24px 24px 18px", textAlign: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px", background: "rgba(239,68,68,.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={20} style={{ color: "#dc2626" }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 4 }}>حذف القناة</div>
                    <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>
                        حذف <strong style={{ color: m.color }}>{channel.name || m.labelAr}</strong>؟ لا يمكن التراجع.
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, padding: "12px 24px", borderTop: "1px solid #f1f3f5", justifyContent: "flex-end" }}>
                    <button disabled={loading} onClick={onClose} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e0e3e7", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>إلغاء</button>
                    <button disabled={loading} onClick={onConfirm} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: loading ? .6 : 1 }}>
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} حذف
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ═══ Skeleton ═══ */
function SkRow({ d }: { d: number }) {
    const b = (w: string, h = 12) => ({ width: w, height: h, borderRadius: 5, background: "linear-gradient(110deg,#ebeef2 30%,#f7f8fa 50%,#ebeef2 70%)", backgroundSize: "200% 100%", animation: "chShim 1.4s ease-in-out infinite" } as React.CSSProperties)
    return (
        <tr style={{ animation: `chIn .3s ease-out ${d}ms both` }}>
            <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={b("28px", 28)} /><div style={b("90px", 12)} /></div></td>
            <td><div style={b("120px", 11)} /></td>
            <td><div style={b("40px", 18)} /></td>
            <td><div style={b("30px", 11)} /></td>
            <td><div style={b("70px", 11)} /></td>
            <td><div style={b("20px", 20)} /></td>
        </tr>
    )
}

/* ════════════════════════════════════════════
   MAIN
════════════════════════════════════════════ */
export function ChannelsPage() {
    const { user } = useAuthStore()
    const tenantId = user?.tenant_id || ""

    const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
    const [search, setSearch] = useState("")
    const [showAdd, setShowAdd] = useState(false)
    const [viewChannel, setViewChannel] = useState<Channel | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null)
    const [searchFocused, setSearchFocused] = useState(false)

    const { data: channels = [], isLoading } = useAllChannels(tenantId)
    const deleteMut = useDeleteChannel(tenantId)
    const toggleCh = useToggleChannel(tenantId)
    const togglePlat = useTogglePlatform(tenantId)
    const { data: platStatusRes, refetch: rps } = usePlatformsStatus(tenantId)
    const { data: allAgents = [] } = useAgents()

    // Counts per platform
    const counts = useMemo(() => {
        const r: Record<string, number> = {}
        for (const p of PLATFORMS) r[p] = 0
        for (const c of channels) r[c.platform] = (r[c.platform] || 0) + 1
        return r
    }, [channels])

    // Channels for selected platform
    const platformChannels = useMemo(() => {
        if (!activePlatform) return []
        let list = channels.filter(c => c.platform === activePlatform)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(c => (c.name || "").toLowerCase().includes(q) || c.identifier.toLowerCase().includes(q))
        }
        return list
    }, [channels, activePlatform, search])

    const am = activePlatform ? PLATFORM_META[activePlatform] : null
    const platOn = activePlatform ? (platStatusRes?.data?.platforms?.[activePlatform] ?? false) : false

    return (
        <div style={{ padding: "0 28px 28px", direction: "rtl", maxWidth: 1200, margin: "0 auto" }}>
            <style>{CSS}</style>

            {/* ══ Platforms Grid ══ */}
            <div style={{ marginBottom: activePlatform ? 0 : 20, paddingTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
                    المنصات المتاحة
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
                    {PLATFORMS.map(p => {
                        const on = platStatusRes?.data?.platforms?.[p] ?? false
                        const toggling = togglePlat.isPending && togglePlat.variables?.platform === p
                        return (
                            <PlatformCard
                                key={p}
                                platform={p}
                                on={on}
                                count={counts[p]}
                                selected={activePlatform === p}
                                toggling={toggling}
                                onToggle={() => togglePlat.mutate({ platform: p, payload: { enabled: !on } }, { onSuccess: () => rps() })}
                                onSelect={() => { setActivePlatform(activePlatform === p ? null : p); setSearch("") }}
                            />
                        )
                    })}
                </div>
            </div>

            {/* ══ Platform Detail Panel ══ */}
            {activePlatform && am && (
                <div style={{
                    marginTop: 16,
                    borderRadius: 14, border: `1.5px solid ${am.color}25`,
                    background: "#fff", overflow: "visible",
                    animation: "chIn .2s ease-out",
                }}>
                    {/* Colored accent bar */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${am.color}, ${am.color}80)` }} />
                    {/* Detail Header */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 18px",
                        background: `linear-gradient(to left, ${am.color}05, ${am.color}0a)`,
                        borderBottom: `1px solid ${am.color}15`,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button onClick={() => setActivePlatform(null)} style={{
                                width: 28, height: 28, borderRadius: 7, border: "1px solid #ebeef2",
                                background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#9ca3af", transition: "all .12s",
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#004786"; e.currentTarget.style.color = "#004786" }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "#ebeef2"; e.currentTarget.style.color = "#9ca3af" }}
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <div style={{
                                width: 32, height: 32, borderRadius: 9,
                                background: `linear-gradient(135deg, ${am.color}, ${am.color}cc)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: `0 2px 6px ${am.color}25`,
                            }}><PlatformLogo platform={activePlatform} fill="#fff" size={15} /></div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                                    قنوات {am.labelAr}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
                                    <span style={{
                                        display: "inline-flex", alignItems: "center", gap: 3,
                                        fontSize: 10, fontWeight: 700,
                                        color: platOn ? "#16a34a" : "#9ca3af",
                                    }}>
                                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: platOn ? "#16a34a" : "#d1d5db" }} />
                                        المنصة {platOn ? "مفعّلة" : "موقوفة"}
                                    </span>
                                    <span style={{ fontSize: 10, color: "#d1d5db" }}>·</span>
                                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{platformChannels.length} قناة</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Search */}
                            <div style={{ position: "relative", width: 180 }}>
                                <Search size={12} style={{
                                    position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                                    color: searchFocused ? "#004786" : "#c9cdd4", transition: "color .12s",
                                }} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                                    placeholder="بحث..."
                                    style={{
                                        width: "100%", padding: "6px 28px 6px 24px", borderRadius: 7,
                                        border: `1.5px solid ${searchFocused ? "#004786" : "#e0e3e7"}`,
                                        background: "#fff", fontSize: 11, color: "#374151", outline: "none",
                                        boxSizing: "border-box", fontFamily: "inherit",
                                        transition: "border-color .15s, box-shadow .15s",
                                        boxShadow: searchFocused ? "0 0 0 3px rgba(0,71,134,.04)" : "none",
                                    }} />
                                {search && (
                                    <button onClick={() => setSearch("")} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#c9cdd4", display: "flex", padding: 0 }}>
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                            <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.CREATE_CHANNEL}>
                                <button onClick={() => setShowAdd(true)} style={{
                                    display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
                                    background: "#004786", color: "#fff", border: "none",
                                    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                    transition: "background .12s",
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#003a6e" }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "#004786" }}
                                >
                                    <Plus size={12} /> إضافة
                                </button>
                            </ActionGuard>
                        </div>
                    </div>

                    {/* Channels Table */}
                    {isLoading ? (
                        <table className="ch-tbl">
                            <thead><tr><th>القناة</th><th>المعرّف</th><th>الحالة</th><th>الوكلاء</th><th>الإنشاء</th><th></th></tr></thead>
                            <tbody>{Array.from({ length: 3 }, (_, i) => <SkRow key={i} d={i * 60} />)}</tbody>
                        </table>
                    ) : platformChannels.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 20px", animation: "chIn .2s ease-out" }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 13,
                                background: `linear-gradient(135deg, ${am.color}, ${am.color}cc)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 10px",
                            }}>
                                <PlatformLogo platform={activePlatform} fill="#fff" />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                                {search ? "لا توجد نتائج" : `لا توجد قنوات ${am.labelAr}`}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 14 }}>
                                {search ? "جرّب كلمة بحث أخرى" : `أضف قناة ${am.labelAr} للبدء`}
                            </div>
                            {!search && (
                                <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.CREATE_CHANNEL}>
                                    <button onClick={() => setShowAdd(true)} style={{
                                        display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px",
                                        borderRadius: 7, background: "#004786", color: "#fff", border: "none",
                                        fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                    }}>
                                        <Plus size={12} /> إضافة قناة
                                    </button>
                                </ActionGuard>
                            )}
                        </div>
                    ) : (
                        <table className="ch-tbl">
                            <thead>
                                <tr>
                                    <th>القناة</th>
                                    <th>المعرّف</th>
                                    <th>الحالة</th>
                                    <th>الوكلاء</th>
                                    <th>تاريخ الإنشاء</th>
                                    <th style={{ width: 36 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {platformChannels.map((ch, i) => {
                                    const isToggling = toggleCh.isPending && toggleCh.variables?.identifier === ch.identifier
                                    return (
                                        <tr key={ch.identifier}
                                            style={{ animation: `chIn .2s ease-out ${i * 30}ms both` }}
                                            onClick={() => setViewChannel(ch)}>
                                            {/* Name */}
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                                        background: `linear-gradient(135deg, ${am.color}, ${am.color}cc)`,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        boxShadow: `0 1px 4px ${am.color}20`,
                                                    }}>
                                                        <PlatformLogo platform={ch.platform} fill="#fff" size={14} />
                                                    </div>
                                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>
                                                        {ch.name || am.labelAr}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Identifier */}
                                            <td onClick={e => e.stopPropagation()}>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    <code style={{
                                                        fontSize: 10.5, fontFamily: "monospace",
                                                        background: "#f5f6f8", padding: "2px 7px", borderRadius: 4,
                                                        color: "#6b7280", maxWidth: 150, overflow: "hidden",
                                                        textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                                                    }}>
                                                        {ch.identifier}
                                                    </code>
                                                    <button onClick={() => { navigator.clipboard.writeText(ch.identifier); toast.success("تم النسخ") }}
                                                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#d1d5db", transition: "color .1s" }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = "#004786" }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = "#d1d5db" }}
                                                    >
                                                        <Copy size={10} />
                                                    </button>
                                                </div>
                                                {ch.platform === "webchat" && ch.script_url && (
                                                    <a href={ch.script_url} target="_blank" rel="noopener noreferrer"
                                                        style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#004786", textDecoration: "none", marginTop: 2 }}>
                                                        <Globe size={8} /> تضمين <ExternalLink size={7} />
                                                    </a>
                                                )}
                                            </td>
                                            {/* Status */}
                                            <td onClick={e => e.stopPropagation()}>
                                                {isToggling ? (
                                                    <Loader2 size={13} style={{ color: "#004786", animation: "chPulse .8s infinite" }} />
                                                ) : (
                                                    <ActionGuard pageBit={PAGE_BITS.CHANNELS} actionBit={ACTION_BITS.TOGGLE_CHANNEL}>
                                                        <button className={`ch-sw ${ch.enabled ? "on" : "off"}`}
                                                            onClick={() => toggleCh.mutate({ platform: ch.platform, identifier: ch.identifier, payload: { enabled: !(ch.enabled ?? false) } })} />
                                                    </ActionGuard>
                                                )}
                                            </td>
                                            {/* Agents */}
                                            <td>
                                                {ch.agent_ids && ch.agent_ids.length > 0 ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                        {ch.agent_ids.slice(0, 3).map((aid, idx) => {
                                                            const agent = allAgents.find(a => a.id === aid)
                                                            const name = agent?.name || "?"
                                                            const initial = name.charAt(0).toUpperCase()
                                                            return (
                                                                <div key={aid} title={name} style={{
                                                                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                                                                    background: "linear-gradient(135deg, #004786, #0072b5)",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    fontSize: 9, fontWeight: 800, color: "#fff",
                                                                    marginRight: idx > 0 ? -4 : 0,
                                                                    border: "2px solid #fff",
                                                                    position: "relative", zIndex: 3 - idx,
                                                                }}>
                                                                    {initial}
                                                                </div>
                                                            )
                                                        })}
                                                        {ch.agent_ids.length > 3 && (
                                                            <div style={{
                                                                width: 24, height: 24, borderRadius: 7,
                                                                background: "#f0f1f3", border: "2px solid #fff",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: 8, fontWeight: 800, color: "#9ca3af",
                                                                marginRight: -4,
                                                            }}>
                                                                +{ch.agent_ids.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                                                )}
                                            </td>
                                            {/* Created */}
                                            <td>
                                                <span style={{ fontSize: 10.5, color: "#9ca3af", whiteSpace: "nowrap" }}>
                                                    {fmtDate(ch.created_at)}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td onClick={e => e.stopPropagation()}>
                                                <RowActions onView={() => setViewChannel(ch)} onDelete={() => setDeleteTarget(ch)} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ══ No Platform Selected hint ══ */}
            {!activePlatform && !isLoading && channels.length > 0 && (
                <div style={{
                    textAlign: "center", padding: "32px 20px", marginTop: 16,
                    borderRadius: 12, background: "#fafbfd", border: "1px solid #ebeef2",
                    animation: "chIn .3s ease-out",
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "linear-gradient(135deg, #004786, #0072b5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 10px",
                    }}>
                        <Radio size={18} style={{ color: "#fff" }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>اختر منصة للبدء</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        اضغط على أي منصة أعلاه لعرض قنواتها المتصلة وإدارتها
                    </div>
                </div>
            )}

            {/* ══ Modals ══ */}
            {showAdd && <AddChannelDialog defaultPlatform={activePlatform ?? undefined} onClose={() => setShowAdd(false)} />}
            {viewChannel && <ChannelDetailModal channel={viewChannel} onClose={() => setViewChannel(null)} />}
            {deleteTarget && (
                <DeleteModal channel={deleteTarget} onClose={() => setDeleteTarget(null)}
                    onConfirm={() => deleteMut.mutate(
                        { platform: deleteTarget.platform, identifier: deleteTarget.identifier },
                        { onSuccess: r => { if (r.success) setDeleteTarget(null) } }
                    )}
                    loading={deleteMut.isPending} />
            )}
        </div>
    )
}
