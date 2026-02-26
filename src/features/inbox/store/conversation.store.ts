import { create } from "zustand"
import type { Message } from "../types/inbox.types"

export interface ReplyTo {
    messageId: string
    text: string
    senderName: string
    messageType: string
}

interface ConversationState {
    // ── Draft ──
    draftText: string
    setDraftText: (text: string) => void

    // ── Sending ──
    isSending: boolean
    setIsSending: (v: boolean) => void

    // ── Optimistic messages ──
    pendingMessages: Message[]
    addPendingMessage: (msg: Message) => void
    removePendingMessage: (id: string) => void
    clearPending: () => void

    // ── Details panel ──
    detailsOpen: boolean
    toggleDetails: () => void

    // ── Reply to ──
    replyTo: ReplyTo | null
    setReplyTo: (r: ReplyTo | null) => void
}

export const useConversationStore = create<ConversationState>((set) => ({
    draftText: "",
    setDraftText: (draftText) => set({ draftText }),

    isSending: false,
    setIsSending: (isSending) => set({ isSending }),

    pendingMessages: [],
    addPendingMessage: (msg) =>
        set((s) => ({ pendingMessages: [...s.pendingMessages, msg] })),
    removePendingMessage: (id) =>
        set((s) => ({ pendingMessages: s.pendingMessages.filter((m) => m.id !== id) })),
    clearPending: () => set({ pendingMessages: [] }),

    detailsOpen: true,
    toggleDetails: () => set((s) => ({ detailsOpen: !s.detailsOpen })),

    replyTo: null,
    setReplyTo: (replyTo) => set({ replyTo }),
}))
