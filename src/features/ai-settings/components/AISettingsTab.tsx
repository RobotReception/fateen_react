import { useState } from "react"
import { Bot, MessageSquareText, AudioWaveform } from "lucide-react"
import { AITab } from "./AITab"
import { PromptsTab } from "./PromptsTab"
import { TTSTab } from "./TTSTab"

/* ── Sub-tabs configuration ── */
const AI_SUB_TABS = [
    { key: "ai", label: "الإعدادات والمزودين", icon: Bot },
    { key: "prompts", label: "التوجيه العام", icon: MessageSquareText },
    { key: "tts", label: "تحويل النص لكلام", icon: AudioWaveform },
] as const

type SubTab = (typeof AI_SUB_TABS)[number]["key"]

/**
 * Combined AI Settings tab — embedded inside Organization Settings sidebar.
 * Contains internal sub-tabs for AI, Prompts, and TTS.
 */
export function AISettingsTab() {
    const [sub, setSub] = useState<SubTab>("ai")

    return (
        <div>
            {/* ── Sub-tab navigation ── */}
            <div style={{
                display: "flex", gap: 6, marginBottom: 22,
                padding: 4, borderRadius: 12, background: "var(--t-surface)",
                border: "1px solid var(--t-border-light)",
            }}>
                {AI_SUB_TABS.map(t => {
                    const Icon = t.icon
                    const on = sub === t.key
                    return (
                        <button
                            key={t.key}
                            onClick={() => setSub(t.key)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "9px 18px", borderRadius: 9,
                                border: "none",
                                background: on ? "var(--t-accent)" : "transparent",
                                color: on ? "var(--t-text-on-accent)" : "var(--t-text-faint)",
                                fontSize: 12.5, fontWeight: on ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.18s ease",
                                flex: 1,
                                justifyContent: "center",
                            }}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    )
                })}
            </div>

            {/* ── Content ── */}
            <div key={sub} style={{ maxWidth: 860 }}>
                {sub === "ai" && <AITab />}
                {sub === "prompts" && <PromptsTab />}
                {sub === "tts" && <TTSTab />}
            </div>
        </div>
    )
}
