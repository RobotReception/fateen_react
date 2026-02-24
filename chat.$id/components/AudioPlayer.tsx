// import React, { useEffect, useRef, useState } from 'react'

// // Format time as mm:ss
// const formatTime = (time: number) => {
//   const minutes = Math.floor(time / 60)
//   const seconds = Math.floor(time % 60)
//   return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
// }

// export const AudioPlayer = ({ src }: { readonly src: string }) => {
//   const audioRef = useRef<HTMLAudioElement>(null)
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [progress, setProgress] = useState(0) // 0 to 1
//   const [currentTime, setCurrentTime] = useState(0)
//   const [duration, setDuration] = useState(0)

//   // Pause all other audios when this one plays
//   const handlePlay = () => {
//     for (const audio of document.querySelectorAll('audio')) {
//       if (audio !== audioRef.current) audio.pause()
//     }

//     audioRef.current?.play()
//     setIsPlaying(true)
//   }

//   const handlePause = () => {
//     audioRef.current?.pause()
//     setIsPlaying(false)
//   }

//   const handleTimeUpdate = () => {
//     if (audioRef.current) {
//       setCurrentTime(audioRef.current.currentTime)
//       setProgress(audioRef.current.currentTime / audioRef.current.duration)
//     }
//   }

//   const handleLoadedMetadata = () => {
//     if (audioRef.current) {
//       setDuration(audioRef.current.duration)
//     }
//   }

//   const handleEnded = () => {
//     setIsPlaying(false)
//     setProgress(0)
//     setCurrentTime(0)
//   }

//   // Handle slider change
//   const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const value = Number(event.target.value)
//     if (audioRef.current) {
//       audioRef.current.currentTime = value
//       setCurrentTime(value)
//       setProgress(value / duration)
//     }
//   }

//   // Pause when unmounting
//   useEffect(() => {
//     return () => {
//       audioRef.current?.pause()
//     }
//   }, [])

//   return (
//     <div className="flex items-center gap-2 w-full">
//       <button
//         className=" rounded-full w-8 h-8 bg-blue-500 text-white"
//         onClick={isPlaying ? handlePause : handlePlay}
//         type="button"
//       >
//         {isPlaying ? '❚❚' : '►'}
//       </button>
//       <audio
//         onEnded={handleEnded}
//         onLoadedMetadata={handleLoadedMetadata}
//         onTimeUpdate={handleTimeUpdate}
//         ref={audioRef}
//         src={src}
//         style={{ display: 'none' }}
//       />
//       <span className="text-xs w-10 text-right">{formatTime(currentTime)}</span>
//       <input
//         className="flex-1 accent-blue-500"
//         max={duration || 1}
//         min={0}
//         onChange={handleSliderChange}
//         step="0.01"
//         type="range"
//         value={currentTime}
//       />
//       <span className="text-xs w-10">{formatTime(duration)}</span>
//     </div>
//   )
// }

// import React, { useMemo } from "react";
// import { useAudioRow } from "../useAudioRow";

// type Props = {
//   id: string;               // استخدم item._id أو item.message_id
//   src: string;              // رابط الصوت
//   hintDurationSeconds?: number; // اختياري: مدة تقديرية قبل التحميل
//   formatTime?: (n: number) => string; // اختياري: تقدر تمرّر دالتك
// };

// const defaultFormatTime = (secs: number) => {
//   const m = Math.floor(secs / 60);
//   const s = Math.floor(secs % 60).toString().padStart(2, "0");
//   return `${m}:${s}`;
// };

// export const AudioPlayer: React.FC<Props> = ({ id, src, hintDurationSeconds, formatTime }) => {
//   const fmt = formatTime ?? defaultFormatTime;
//   const { playing, status, currentTime, duration, toggle, seek } = useAudioRow(id, src);

//   const total = duration || hintDurationSeconds || 0;
//   const canSeek = total > 0;
//   const sliderMax = useMemo(() => total || 1, [total]);

//   const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const v = parseFloat(e.target.value);
//     seek(v);
//   };

//   return (
//     <div className="flex items-center gap-2 w-full">
//       <button
//         className="rounded-full w-8 h-8 bg-blue-500 text-white"
//         onClick={toggle}
//         type="button"
//         aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
//         title={status === "loading" ? "جاري التحميل…" : playing ? "إيقاف مؤقت" : "تشغيل"}
//       >
//         {status === "loading" ? "⏳" : (playing ? "❚❚" : "►")}
//       </button>

//       {/* مافيش <audio> هنا؛ المشغّل مشترك */}
//       <span className="text-xs w-10 text-right">{fmt(currentTime)}</span>

//       <input
//         className="flex-1 accent-blue-500"
//         max={sliderMax}
//         min={0}
//         onChange={onSlider}
//         step="0.01"
//         type="range"
//         value={currentTime}
//         disabled={!canSeek}
//       />

//       <span className="text-xs w-10">{fmt(total)}</span>
//     </div>
//   );
// };

import React, { memo, useCallback, useEffect, useRef, useState } from 'react'

// ---------- Registry لمنع تشغيل أكثر من صوت ----------
const players = new Set<HTMLAudioElement>()
const register = (el: HTMLAudioElement) => {
  players.add(el)
  return () => players.delete(el)
}

const pauseOthers = (me: HTMLAudioElement | null) => {
  for (const p of players) {
    if (p !== me && !p.paused) p.pause()
  }
}

// ---------- تنسيق وقت mm:ss ----------
const formatTime = (time: number) => {
  if (!isFinite(time) || time < 0) return '0:00'
  const m = Math.floor(time / 60)
  const s = Math.floor(time % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

type Props = {
  // اختياري: مدة تقريبية قبل التحميل لو توفرها من السيرفر
  readonly hintDurationSeconds?: number
  readonly src: string
}

export const AudioPlayer = memo(function AudioPlayer({
  hintDurationSeconds,
  src,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState<string | null>(null)

  // سجّل العنصر في الريجستري ونظّفه عند التفكيك
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const unregister = register(el)
    return () => {
      try {
        el.pause()
      } catch {}
      unregister()
    }
  }, [])

  // لو تغيّر src: أعد الضبط
  useEffect(() => {
    setIsPlaying(false)
    setHasError(null)
    setCurrentTime(0)
    setDuration(0)
    // نخلي المتصفح يجيب الـmetadata فقط
    const el = audioRef.current
    if (el) {
      el.preload = 'metadata'
      // إعادة تحميل آمنة
      el.load()
    }
  }, [src])

  const handlePlay = useCallback(async () => {
    const el = audioRef.current
    if (!el) return
    setHasError(null)

    // أوقف أي لاعبين آخرين
    pauseOthers(el)

    try {
      await el.play()
      setIsPlaying(true)
    } catch {
      setHasError('تعذّر تشغيل الصوت')
      setIsPlaying(false)
    }
  }, [])

  const handlePause = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setIsPlaying(false)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    setCurrentTime(el.currentTime || 0)
    if (isFinite(el.duration)) setDuration(el.duration)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (isFinite(el.duration)) setDuration(el.duration)
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    // ما نرجّع السلايدر للصفر لو تبغى المستخدم يعيد من البداية يدوياً
  }, [])

  const handleError = useCallback(() => {
    setHasError('تعذّر تشغيل الصوت')
    setIsPlaying(false)
  }, [])

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(event.target.value)
      const el = audioRef.current
      if (!el) return
      try {
        el.currentTime = Math.max(0, Math.min(v, el.duration || v))
        setCurrentTime(el.currentTime)
      } catch {}
    },
    []
  )

  const total = duration || hintDurationSeconds || 0
  const sliderMax = total || 1

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        className="rounded-full w-8 h-8 bg-blue-500 text-white"
        onClick={isPlaying ? handlePause : handlePlay}
        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        type="button"
      >
        {isPlaying ? '❚❚' : '►'}
      </button>

      {/* عنصر الصوت داخل الصف (يتوافق مع سيرفرك) */}
      <audio
        onEnded={handleEnded}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
        ref={audioRef}
        src={src}
        style={{ display: 'none' }}
      />

      <span className="text-xs w-10 text-right">{formatTime(currentTime)}</span>

      <input
        className="flex-1 accent-blue-500"
        disabled={!total}
        max={sliderMax}
        min={0}
        onChange={handleSliderChange}
        step="0.01"
        type="range"
        value={currentTime}
      />

      <span className="text-xs w-10">{formatTime(total)}</span>

      {hasError && (
        <span className="text-[11px] text-red-500 ms-1">{hasError}</span>
      )}
    </div>
  )
})
