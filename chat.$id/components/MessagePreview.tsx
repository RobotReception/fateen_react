// File: MessagePreview.tsx
import { FilePreview } from './FilePreview'
import { type FC } from 'react'

export type MessagePreviewProps = {
  readonly attachments?: File[]
  readonly audioFile?: File | null
  readonly onClearAudio: () => void
  readonly onClearReply: () => void
  readonly onRemoveFile: (index: number) => void
  readonly replyToMessage?: { content: string; senderName: string }
  readonly snippet?: { content: string; title: string } | null
}

export const MessagePreview: FC<MessagePreviewProps> = ({
  attachments = [],
  audioFile,
  onClearAudio,
  onClearReply,
  onRemoveFile,
  replyToMessage,
  snippet,
}) => {
  return (
    <div className="flex flex-col gap-2 mb-2">
      {replyToMessage && (
        <div className="border rounded p-2 bg-blue-50 relative">
          <p className="text-sm text-blue-600 font-semibold">
            Replying to: {replyToMessage.senderName}
          </p>
          <p className="text-sm text-blue-800">{replyToMessage.content}</p>
          <button
            className="absolute top-1 right-1 text-xs text-red-500"
            onClick={onClearReply}
          >
            ✕
          </button>
        </div>
      )}

      {audioFile && (
        <div className="border rounded p-2 bg-gray-100 relative">
          <p className="text-sm">Audio: {audioFile.name}</p>
          <button
            className="absolute top-1 right-1 text-xs text-red-500"
            onClick={onClearAudio}
          >
            ✕
          </button>
        </div>
      )}

      {attachments.map((file, idx) => (
        <FilePreview
          file={file}
          key={idx}
          onRemove={() => onRemoveFile(idx)}
        />
      ))}

      {snippet && (
        <div className="border rounded p-2 bg-green-50 relative">
          <p className="text-sm text-green-600 font-semibold">
            Snippet: {snippet.title}
          </p>
          <p className="text-sm text-green-800 whitespace-pre-line">
            {snippet.content}
          </p>
        </div>
      )}
    </div>
  )
}
