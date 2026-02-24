import React from 'react'

type VideoMessageProps = {
  readonly caption?: string
  readonly url: string
}

export const VideoMessage: React.FC<VideoMessageProps> = ({ caption, url }) => {
  if (!url) return null

  return (
    <div className="max-w-sm rounded-2xl overflow-hidden shadow-md bg-gray-50 p-3">
      <video
        className="w-full rounded-xl"
        controls
        preload="metadata"
      >
        <source
          src={url}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {caption && (
        <p className="mt-2 text-sm text-gray-700 break-words">{caption}</p>
      )}
    </div>
  )
}
