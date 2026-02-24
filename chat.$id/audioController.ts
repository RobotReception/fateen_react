import { useSyncExternalStore } from 'react'

type PlayerStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'
type Snapshot = {
  playingId: string | null
  status: PlayerStatus
  currentTime: number
  duration: number
  src: string | null
}

function createStore(initial: Snapshot) {
  let state = initial
  const subs = new Set<() => void>()
  return {
    get: () => state,
    sub: (cb: () => void) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    set: (patch: Partial<Snapshot>) => {
      state = { ...state, ...patch }
      subs.forEach((s) => s())
    },
    reset: () => {
      state = {
        playingId: null,
        status: 'idle',
        currentTime: 0,
        duration: 0,
        src: null,
      }
      subs.forEach((s) => s())
    },
  }
}

const store = createStore({
  playingId: null,
  status: 'idle' as PlayerStatus,
  currentTime: 0,
  duration: 0,
  src: null,
})

class SingleAudioController {
  private a: HTMLAudioElement | null = null

  private ensure() {
    if (!this.a) {
      const el = new Audio()
      el.preload = 'none'
      el.crossOrigin = 'anonymous'

      el.addEventListener('timeupdate', () => {
        if (store.get().playingId) store.set({ currentTime: el.currentTime })
      })
      el.addEventListener('loadedmetadata', () =>
        store.set({ duration: el.duration })
      )
      el.addEventListener('play', () => store.set({ status: 'playing' }))
      el.addEventListener('pause', () => {
        const s = store.get()
        if (s.playingId) store.set({ status: 'paused' })
      })
      el.addEventListener('ended', () => {
        this.unload()
        store.set({
          playingId: null,
          status: 'ended',
          currentTime: 0,
          duration: 0,
          src: null,
        })
      })
      el.addEventListener('error', () => store.set({ status: 'error' }))

      this.a = el
    }
    return this.a!
  }

  async toggle(id: string, src: string) {
    const s = store.get()
    const el = this.ensure()

    if (s.playingId === id && s.src === src) {
      if (s.status === 'playing') {
        el.pause()
      } else {
        store.set({ status: 'loading' })
        try {
          await el.play()
        } catch {}
      }
      return
    }

    this.switchSource(src)
    store.set({
      playingId: id,
      status: 'loading',
      currentTime: 0,
      duration: 0,
      src,
    })
    try {
      await el.play()
    } catch {
      store.set({ status: 'error' })
    }
  }

  seek(seconds: number) {
    const el = this.a
    if (!el) return
    try {
      el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds))
      store.set({ currentTime: el.currentTime })
    } catch {}
  }

  private switchSource(src: string) {
    const el = this.ensure()
    el.src = src
    try {
      el.currentTime = 0
    } catch {}
    el.load()
  }

  unload() {
    if (!this.a) return
    try {
      this.a.pause()
    } catch {}
    this.a.removeAttribute('src')
    this.a.load()
  }

  dispose() {
    if (!this.a) return
    try {
      this.a.pause()
    } catch {}
    this.a.removeAttribute('src')
    this.a.load()
    this.a = null
    store.reset()
  }

  useSelector<T>(sel: (s: Snapshot) => T) {
    return useSyncExternalStore(
      store.sub,
      () => sel(store.get()),
      () => sel(store.get())
    )
  }
}

export const audioController = new SingleAudioController()
export type PlayerSnapshot = Snapshot
