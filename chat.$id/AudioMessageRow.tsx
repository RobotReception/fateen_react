// AudioMessageRow.tsx
import React, { useMemo } from 'react'
import { useAudioRow } from './useAudioRow'

type Props = {
  id: string
  src: string
  // دالة تنسيق الوقت القديمة عندك
  formatTime: (s: number) => string
  // (اختياري) مدة متوقعة ثابتة من السيرفر لتظهر قبل تشغيل الملف
  hintDurationSeconds?: number
}

export function AudioMessageRow({
  id,
  src,
  formatTime,
  hintDurationSeconds,
}: Props) {
  const { playing, status, currentTime, duration, toggle, seek } = useAudioRow(
    id,
    src
  )

  const total = duration || hintDurationSeconds || 0
  const canSeek = total > 0

  const sliderMax = useMemo(() => total || 1, [total])
  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    seek(v)
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        type="button"
        onClick={toggle}
        className="rounded-full w-8 h-8 bg-blue-500 text-white grid place-items-center"
        aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
        title={
          status === 'loading'
            ? 'جاري التحميل…'
            : playing
              ? 'إيقاف مؤقت'
              : 'تشغيل'
        }
      >
        {status === 'loading' ? '⏳' : playing ? '❚❚' : '►'}
      </button>

      {/* لم نعد نستخدم <audio> داخل الصف. المشغّل مشترك على مستوى التطبيق. */}

      <span className="text-xs w-10 text-right">{formatTime(currentTime)}</span>

      <input
        className="flex-1 accent-blue-500"
        type="range"
        min={0}
        max={sliderMax}
        step="0.01"
        value={currentTime}
        onChange={onSlider}
        disabled={!canSeek}
      />

      <span className="text-xs w-10">{formatTime(total)}</span>
    </div>
  )
}
