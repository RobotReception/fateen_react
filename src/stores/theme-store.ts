import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "light" | "dark"

/* ── Default color tokens (light mode) ── */
const DEFAULT_COLORS = {
    accent: "#111827",
    "accent-hover": "#1f2937",
    "accent-muted": "rgba(17, 24, 39, 0.08)",
    "text-on-accent": "#ffffff",
    success: "#10b981",
    "success-soft": "rgba(16, 185, 129, 0.08)",
    warning: "#f59e0b",
    "warning-soft": "rgba(245, 158, 11, 0.08)",
    danger: "#ef4444",
    "danger-soft": "rgba(239, 68, 68, 0.06)",
    info: "#3b82f6",
    "info-soft": "rgba(59, 130, 246, 0.08)",
} as const

/* ── Default color tokens (dark mode) ── */
const DEFAULT_COLORS_DARK = {
    accent: "#e2e8f0",
    "accent-hover": "#cbd5e1",
    "accent-muted": "rgba(226, 232, 240, 0.08)",
    "text-on-accent": "#0f172a",
    success: "#34d399",
    "success-soft": "rgba(52, 211, 153, 0.12)",
    warning: "#fbbf24",
    "warning-soft": "rgba(251, 191, 36, 0.12)",
    danger: "#f87171",
    "danger-soft": "rgba(248, 113, 113, 0.1)",
    info: "#60a5fa",
    "info-soft": "rgba(96, 165, 250, 0.12)",
} as const

export type ThemeColorKey = keyof typeof DEFAULT_COLORS
export type ThemeColors = Partial<Record<ThemeColorKey, string>>

interface ThemeState {
    theme: Theme
    customColors: ThemeColors       // light mode overrides
    customColorsDark: ThemeColors   // dark mode overrides
    setTheme: (t: Theme) => void
    toggleTheme: () => void
    setColor: (key: ThemeColorKey, value: string) => void
    setColorDark: (key: ThemeColorKey, value: string) => void
    resetColors: () => void
    resetColorsDark: () => void
}

/** Apply theme class + custom CSS variable overrides */
function applyTheme(theme: Theme, customColors: ThemeColors, customColorsDark: ThemeColors) {
    const root = document.documentElement
    if (theme === "dark") {
        root.classList.add("dark")
    } else {
        root.classList.remove("dark")
    }
    // Apply custom color overrides on top of CSS defaults
    const overrides = theme === "dark" ? customColorsDark : customColors

    for (const key of Object.keys(DEFAULT_COLORS) as ThemeColorKey[]) {
        const val = overrides[key]
        if (val) {
            root.style.setProperty(`--t-${key}`, val)
        } else {
            // Reset to default (remove inline override, CSS file defaults apply)
            root.style.removeProperty(`--t-${key}`)
        }
    }
}

export { DEFAULT_COLORS, DEFAULT_COLORS_DARK }

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: "light" as Theme,
            customColors: {},
            customColorsDark: {},
            setTheme: (theme: Theme) => {
                set({ theme })
                applyTheme(theme, get().customColors, get().customColorsDark)
            },
            toggleTheme: () => {
                const next: Theme = get().theme === "light" ? "dark" : "light"
                set({ theme: next })
                applyTheme(next, get().customColors, get().customColorsDark)
            },
            setColor: (key, value) => {
                const updated = { ...get().customColors, [key]: value }
                set({ customColors: updated })
                if (get().theme === "light") {
                    applyTheme("light", updated, get().customColorsDark)
                }
            },
            setColorDark: (key, value) => {
                const updated = { ...get().customColorsDark, [key]: value }
                set({ customColorsDark: updated })
                if (get().theme === "dark") {
                    applyTheme("dark", get().customColors, updated)
                }
            },
            resetColors: () => {
                set({ customColors: {} })
                if (get().theme === "light") {
                    applyTheme("light", {}, get().customColorsDark)
                }
            },
            resetColorsDark: () => {
                set({ customColorsDark: {} })
                if (get().theme === "dark") {
                    applyTheme("dark", get().customColors, {})
                }
            },
        }),
        { name: "fateen-theme" }
    )
)

// Initialize theme + custom colors on import
if (typeof window !== "undefined") {
    const stored = localStorage.getItem("fateen-theme")
    if (stored) {
        try {
            const parsed = JSON.parse(stored)
            const s = parsed?.state
            if (s) {
                applyTheme(
                    s.theme || "light",
                    s.customColors || {},
                    s.customColorsDark || {},
                )
            }
        } catch { /* ignore */ }
    }
}
