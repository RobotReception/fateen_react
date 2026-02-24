import { useCallback, useMemo } from 'react'
import { audioController } from './audioController'

export function useAudioRow(id: string, src: string) {
  const isActive = audioController.useSelector((s) => s.playingId === id)
  const status = audioController.useSelector((s) =>
    s.playingId === id ? s.status : ('inactive' as const)
  )
  const currentTime = audioController.useSelector((s) =>
    s.playingId === id ? s.currentTime : 0
  )
  const duration = audioController.useSelector((s) =>
    s.playingId === id ? s.duration : 0
  )
  const playing = isActive && status === 'playing'

  const toggle = useCallback(() => audioController.toggle(id, src), [id, src])
  const seek = useCallback((t: number) => audioController.seek(t), [])

  const progress = useMemo(
    () => (duration ? currentTime / duration : 0),
    [currentTime, duration]
  )

  return {
    isActive,
    status,
    playing,
    currentTime,
    duration,
    progress,
    toggle,
    seek,
  } as const
}

export function disposeAudio() {
  audioController.dispose()
}
