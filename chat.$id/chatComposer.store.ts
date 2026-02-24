// src/chat/chatComposer.store.tsx

import { Client } from '@/globals/Client'
import { create } from 'zustand'

export type ReplyTarget = {
  imageUrl?: string
  messageId: string
  senderName: string
  text?: string
} | null

export type Snippet = {
  _id: string
  content?: {
    audio_url?: string
    caption?: string
    document_url?: string
    filename?: string
    image_url?: string
    text?: string
    transcript?: string
    video_url?: string
  }
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document'
  name: string
}

type ComposerState = {
  attachment: File | null
  audioBlob: Blob | null
  canReply: boolean
  clearComposer: () => void
  clearReplay: () => void
  fetchSnippets: () => Promise<void>
  filteredSnippets: Snippet[]

  isRecording: boolean
  recorder: MediaRecorder | null

  recordingUrl: string | null
  replyTarget: ReplyTarget
  selectedSnippet: Snippet | null
  setAttachment: (f: File | null) => void

  setAudioBlob: (b: Blob | null, url: string | null) => void
  setCanReply: (v: boolean) => void
  setReplyTarget: (r: ReplyTarget) => void
  setSelectedSnippet: (s: Snippet | null) => void
  setSnippets: (s: Snippet[]) => void
  // actions
  setText: (v: string) => void

  showSnippets: boolean
  // snippets
  snippets: Snippet[]
  startRecording: () => Promise<void>

  stopRecording: () => void
  // input & media
  text: string
}

const filterByTerm = (snippets: Snippet[], term: string) => {
  const q = term.trim().toLowerCase()
  if (!q) return []
  return snippets.filter((s) => {
    const name = s.name?.toLowerCase() || ''
    const t = s.content?.text?.toLowerCase() || ''
    const cap = s.content?.caption?.toLowerCase() || ''
    return name.includes(q) || t.includes(q) || cap.includes(q)
  })
}

export const ChatComposer = create<ComposerState>((set, get) => ({
  attachment: null,
  audioBlob: null,
  canReply: true,
  clearComposer: () =>
    set({
      attachment: null,
      audioBlob: null,
      filteredSnippets: [],
      isRecording: false,
      recorder: null,
      recordingUrl: null,
      selectedSnippet: null,
      showSnippets: false,
      text: '',
    }),
  clearReplay: () =>
    set({
      replyTarget: null,
    }),
  fetchSnippets: async () => {
    try {
      const { data } = await Client.GET('/api/backend/v1/api/snippets')
      const arr = data?.data?.snippets ?? []
      set({ snippets: arr })
    } catch {
      /* ignore */
    }
  },
  filteredSnippets: [],

  isRecording: false,
  recorder: null,

  recordingUrl: null,
  replyTarget: null,
  selectedSnippet: null,
  setAttachment: (f) => set({ attachment: f }),

  setAudioBlob: (b, url) => set({ audioBlob: b, recordingUrl: url }),

  setCanReply: (v) => set({ canReply: v }),
  setReplyTarget: (replyTarget) => set({ replyTarget }),
  setSelectedSnippet: (s) => set({ selectedSnippet: s, showSnippets: false }),
  setSnippets: (s) => set({ snippets: s }),

  setText: (v) => {
    const lastSlash = v.lastIndexOf('/')
    if (v === '/') {
      set({
        filteredSnippets: get().snippets,
        showSnippets: true,
        text: v,
      })
    } else if (lastSlash >= 0) {
      const term = v.slice(lastSlash + 1)
      const filtered = filterByTerm(get().snippets, term)
      set({
        filteredSnippets: filtered,
        showSnippets: filtered.length > 0,
        text: v,
      })
    } else {
      set({ filteredSnippets: [], showSnippets: false, text: v })
    }
  },

  showSnippets: false,
  snippets: [],

  startRecording: async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const rec = new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)
      set({
        audioBlob: blob,
        isRecording: false,
        recorder: null,
        recordingUrl: url,
      })
    }

    set({ isRecording: true, recorder: rec })
    rec.start()
  },

  stopRecording: () => {
    const rec = get().recorder
    if (rec && rec.state !== 'inactive') rec.stop()
    set({ isRecording: false })
  },

  text: '',
}))
