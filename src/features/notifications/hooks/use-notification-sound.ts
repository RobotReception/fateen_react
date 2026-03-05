/**
 * useNotificationSound
 *
 * Plays notification chimes using the Web Audio API.
 * No external file needed — sounds are generated programmatically.
 *
 * Supports:
 * - Multiple tone presets (selectable by user)
 * - Muting via localStorage key "fateen_notif_sound_enabled"
 * - Volume control via localStorage key "fateen_notif_volume" (0-100)
 * - Tone selection via localStorage key "fateen_notif_tone"
 */

const STORAGE_KEY_ENABLED = "fateen_notif_sound_enabled"
const STORAGE_KEY_VOLUME = "fateen_notif_volume"
const STORAGE_KEY_TONE = "fateen_notif_tone"

/* ── Tone Presets ── */
export interface TonePreset {
    id: string
    name: string
    desc: string
    notes: Array<{ freq: number; start: number; duration: number; gain: number; type?: OscillatorType }>
}

export const TONE_PRESETS: TonePreset[] = [
    {
        id: "classic",
        name: "كلاسيك",
        desc: "نغمة ثنائية هادئة",
        notes: [
            { freq: 880, start: 0, duration: 0.28, gain: 0.15 },       // A5
            { freq: 1108, start: 0.13, duration: 0.32, gain: 0.12 },   // C#6
        ],
    },
    {
        id: "gentle",
        name: "ناعمة",
        desc: "ثلاث نغمات خفيفة صاعدة",
        notes: [
            { freq: 523, start: 0, duration: 0.2, gain: 0.1 },        // C5
            { freq: 659, start: 0.12, duration: 0.2, gain: 0.1 },     // E5
            { freq: 784, start: 0.24, duration: 0.25, gain: 0.08 },   // G5
        ],
    },
    {
        id: "bell",
        name: "جرس",
        desc: "صوت جرس واحد رنّان",
        notes: [
            { freq: 1200, start: 0, duration: 0.5, gain: 0.12, type: "triangle" as OscillatorType },
            { freq: 2400, start: 0, duration: 0.3, gain: 0.04, type: "sine" as OscillatorType },
        ],
    },
    {
        id: "pulse",
        name: "نبضة",
        desc: "نبضة سريعة مزدوجة",
        notes: [
            { freq: 1000, start: 0, duration: 0.1, gain: 0.14 },
            { freq: 1000, start: 0.15, duration: 0.1, gain: 0.14 },
        ],
    },
    {
        id: "melody",
        name: "لحن",
        desc: "لحن قصير من أربع نغمات",
        notes: [
            { freq: 659, start: 0, duration: 0.15, gain: 0.1 },       // E5
            { freq: 784, start: 0.1, duration: 0.15, gain: 0.1 },     // G5
            { freq: 880, start: 0.2, duration: 0.15, gain: 0.1 },     // A5
            { freq: 1047, start: 0.3, duration: 0.25, gain: 0.08 },   // C6
        ],
    },
    {
        id: "drop",
        name: "قطرة",
        desc: "صوت قطرة ماء",
        notes: [
            { freq: 1600, start: 0, duration: 0.15, gain: 0.12, type: "sine" as OscillatorType },
            { freq: 800, start: 0.05, duration: 0.3, gain: 0.06, type: "sine" as OscillatorType },
        ],
    },
]

/* ── Helpers ── */

export function isSoundEnabled(): boolean {
    const v = localStorage.getItem(STORAGE_KEY_ENABLED)
    return v === null ? true : v === "true"
}

export function setSoundEnabled(enabled: boolean) {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled))
}

export function getSoundVolume(): number {
    const v = localStorage.getItem(STORAGE_KEY_VOLUME)
    return v === null ? 70 : Math.max(0, Math.min(100, parseInt(v, 10) || 70))
}

export function setSoundVolume(vol: number) {
    localStorage.setItem(STORAGE_KEY_VOLUME, String(Math.max(0, Math.min(100, vol))))
}

export function getSelectedTone(): string {
    return localStorage.getItem(STORAGE_KEY_TONE) || "classic"
}

export function setSelectedTone(toneId: string) {
    localStorage.setItem(STORAGE_KEY_TONE, toneId)
}

/* ── Play a specific tone preset ── */
export function playTonePreset(toneId?: string, overrideVolume?: number) {
    const id = toneId || getSelectedTone()
    const preset = TONE_PRESETS.find(t => t.id === id) || TONE_PRESETS[0]
    const volume = (overrideVolume ?? getSoundVolume()) / 100

    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

        for (const note of preset.notes) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.type = note.type || "sine"
            osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start)

            const adjustedGain = note.gain * volume
            gain.gain.setValueAtTime(0, ctx.currentTime + note.start)
            gain.gain.linearRampToValueAtTime(adjustedGain, ctx.currentTime + note.start + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.start + note.duration)

            osc.start(ctx.currentTime + note.start)
            osc.stop(ctx.currentTime + note.start + note.duration)
        }

        // Close context after longest note finishes
        const maxEnd = Math.max(...preset.notes.map(n => n.start + n.duration))
        setTimeout(() => ctx.close(), (maxEnd + 0.2) * 1000)
    } catch {
        // AudioContext not available — silently skip
    }
}

/* ── Hook ── */
export function useNotificationSound() {
    const play = () => {
        if (!isSoundEnabled()) return
        playTonePreset()
    }

    return { play }
}
