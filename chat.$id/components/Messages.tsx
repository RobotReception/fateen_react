// import { type CommentsType } from '../types'
// import { AudioPlayer } from './AudioPlayer'
// import Avatar from './Avatar'
// import Check from '~icons/fatinChat/check'
// import CheckCheck from '~icons/fatinChat/check-check'
// import { Clock,MoreHorizontal } from 'lucide-react'
// import { memo, useState } from 'react'

// const formatTime = (date: Date) => {
//   return new Date(date).toLocaleTimeString('ar-SA', {
//     hour: '2-digit',
//     minute: '2-digit',
//   })
// }

// const ImageMessage = ({
//   caption,
//   url,
// }: {
//   readonly caption?: string
//   readonly url: string
// }) => (
//   <div className="flex flex-col items-center">
//     <img
//       alt={caption || 'sent image'}
//       className="max-w-xs  rounded-lg border border-gray-200 shadow"
//       src={url}
//       style={{ maxHeight: 200 }}
//     />
//     {caption && (
//       <span className="mt-2 text-xs text-gray-600 text-center break-words w-full">
//         {caption}
//       </span>
//     )}
//   </div>
// )

// export const Messages = memo(
//   ({
//     data,
//     onReply,
//   }: {
//     data: CommentsType[]
//     onReply?: (item: CommentsType) => void
//   }) => {
//     const re = [...data]
//     const [openMenuId, setOpenMenuId] = useState<string | null>(null)

//     const getStatusIcon = (
//       isRead: string | undefined,
//       isOptimistic?: boolean
//     ) => {
//       if (isOptimistic) {
//         return <Clock className="w-4 h-4 text-gray-400 " />
//       }

//       if (!isRead) return null
//       switch (isRead) {
//         case 'read':
//           return <CheckCheck className="w-4 h-4 text-blue-500" />
//         case 'sent':
//           return <Check className="w-4 h-4 text-gray-500" />
//         default:
//           return null
//       }
//     }

//     // Copy message text to clipboard
//     const handleCopy = (text: string) => {
//       navigator.clipboard.writeText(text)
//       setOpenMenuId(null)
//     }

//     // Placeholder for reply logic
//     const handleReply = (item: CommentsType) => {
//       if (onReply) onReply(item)
//       setOpenMenuId(null)
//     }

//     return re?.map((item) => {
//       const isOwn = item.direction === 'inbound'
//       const isRead = item.isRead
//       const messageText = item.content.text || item.content.caption || ''
//       // Find the replied-to message if exists
//       let replyMessage = null
//       if (item.response_to) {
//         replyMessage = data.find((msg) => msg.message_id === item.response_to)
//       }

//       return (
//         <div
//           className={`flex items-end  space-x-2 space-x-reverse mb-4 ${isOwn ? 'justify-start rtl:justify-end' : 'justify-end rtl:justify-start'} `}
//           key={item._id}
//         >
//           {/* Avatar for other users */}
//           <div className="flex items-center gap-2">
//             {!isOwn && (
//               <Avatar
//                 size="sm"
//                 user={item.sender_info}
//               />
//             )}

//             {/* Message Content */}
//             <div
//               className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative`}
//             >
//               <div
//                 className={`px-4 py-2 rounded-md shadow-sm ${
//                   isOwn
//                     ? 'bg-blue-500 text-white'
//                     : 'bg-white text-gray-900 border border-gray-200'
//                 } ${item.isOptimistic ? 'opacity-75' : ''}`}
//               >
//                 {/* Reply preview (WhatsApp style) */}
//                 {replyMessage && (
//                   <div
//                     className={`mb-2 pl-2 py-1 border-l-4 ${isOwn ? 'border-white bg-blue-400/30' : 'border-blue-500 bg-gray-100'} rounded`}
//                   >
//                     <span
//                       className={`block text-xs font-semibold ${isOwn ? 'text-white' : 'text-blue-700'}`}
//                     >
//                       {replyMessage.sender_info?.name || 'Unknown'}
//                     </span>
//                     {replyMessage.message_type === 'image' &&
//                       replyMessage.content.url && (
//                         <span className="text-xs text-gray-500">[Image]</span>
//                       )}
//                     {replyMessage.message_type === 'audio' &&
//                       replyMessage.content.url && (
//                         <span className="text-xs text-gray-500">[Audio]</span>
//                       )}
//                     {replyMessage.message_type === 'text' &&
//                       replyMessage.content.text && (
//                         <span className="text-xs text-gray-700 line-clamp-1">
//                           {replyMessage.content.text}
//                         </span>
//                       )}
//                   </div>
//                 )}
//                 {/* Render message content based on type */}
//                 {item.message_type === 'image' && item.content.url && (
//                   <ImageMessage
//                     caption={item.content.caption}
//                     url={item.content.url}
//                   />
//                 )}

//                 {item.message_type === 'audio' && item.content?.url && (
//                   <AudioPlayer src={item.content.url} />
//                 )}
//                 {item.message_type === 'text' && item.content?.text && (
//                   <p className="text-sm leading-relaxed">{item.content.text}</p>
//                 )}
//                 {item.message_type === 'interactive'&& (
//                   <p className="text-sm leading-relaxed">{item.content.title ||item.content.text }</p>
//                 )}
//                 {/* Options button */}

//                 {!isOwn && (
//                 <button
//                   className="absolute top-1 left-1 p-1 rounded hover:bg-gray-200 focus:outline-none"
//                   onClick={() =>
//                     setOpenMenuId(openMenuId === item._id ? null : item._id)
//                   }
//                   type="button"
//                 >
//                   <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                 </button>
//                 )}
//                 {openMenuId === item._id && (
//                   <div className="absolute z-10 top-8 left-1 bg-white border border-gray-200 rounded shadow-md py-1 w-24">
//                     <button
//                       className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
//                       onClick={() => handleCopy(messageText)}
//                     >
//                       Copy
//                     </button>
//                     <button
//                       className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
//                       onClick={() => handleReply(item)}
//                     >
//                       Reply
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Time and Status */}
//               <div
//                 className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? 'justify-start' : 'justify-end'}`}
//               >
//                 <span>{formatTime(item.timestamp)}</span>
//                 <div className="ms-1">
//                   {getStatusIcon(isRead, item.isOptimistic)}
//                 </div>
//               </div>
//             </div>
//           </div>
//           {/* Spacer for own messages */}
//         </div>
//       )
//     })
//   }
// )

/// /da

// <div
//   className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2"
//   key={item?.ticketCommentId}
// >
//   <Message
//     content={
//       <div className="flex flex-col  items-start">
//         <div className="flex items-center justify-between w-full">
//           <div className="flex items-center gap-2">

//             <span className="font-bold text-900">{item.createdBy}</span>
//             <span>{item.createdAt}</span>
//           </div>
//           {item.canEdit || item.hasAttachment ? (
//             <CommentsOption
//               canEdit={item.canEdit}
//               hasAttachment={item.hasAttachment}
//               ticketCommentId={item.ticketCommentId}
//             />
//           ) : (
//             ''
//           )}
//         </div>
//         <div className="font-medium text-lg my-3 text-900">
//           {item.content.text}
//         </div>
//       </div>
//     }
//     pt={{
//       root: {
//         className: `w-fit  ${item.direction === 'outbound' ? 'self-start' : 'self-end'} `,
//       },
//     }}
//     severity={item.direction === 'outbound'  ? 'info' : 'success'}
//   />
// </div>

// src/chat/components/Messages.tsx  this is work
import { ChatComposer } from '../chatComposer.store'
import { disposeAudio } from '../useAudioRow'
import { type ChatMessage } from '../useMessages'
import { AttachmentCard } from './AttachmentCard'
import { AudioPlayer } from './AudioPlayer'
import { ChatStore } from '@/routes/chat/store2'
import { t } from '@lingui/macro'
import Check from '~icons/fatinChat/check'
import CheckCheck from '~icons/fatinChat/check-check'
import { Clock, MoreHorizontal } from 'lucide-react'
import { Image } from 'primereact/image'
import { memo, useState } from 'react'
import { useStore } from 'zustand'
import { Avatar } from 'primereact/avatar'
import { VideoMessage } from './VideoMessage'

const formatTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  })

const ImageMessage = ({
  caption,
  url,
}: {
  readonly caption?: string
  readonly url: string
}) => (
  <div className="flex flex-col items-center">
    <Image
      alt={caption || 'sent image'}
      className=" rounded-lg border border-gray-200 shadow"
      height="200px"
      loading="lazy"
      preview
      src={url}
      width="200px"
    />
    {caption && (
      <span className="mt-2 text-xs text-gray-600 text-center break-words w-full">
        {caption}
      </span>
    )}
  </div>
)

type Props = {
  data: ChatMessage[]
}
export const Messages = ({ data }: Props) => {
  useEffect(() => {
    return () => disposeAudio()
  }, [])
  const chat = useStore(ChatStore, (state) => state.activeChat)
  const setReplyTarget = useStore(ChatComposer, (state) => state.setReplyTarget)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const getStatusIcon = (isRead?: string, isOptimistic?: boolean) => {
    if (isOptimistic) return <Clock className="w-4 h-4 text-gray-400" />
    if (!isRead) return null
    switch (isRead) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'sent':
        return <Check className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const handleCopy = (text) => {
    setOpenMenuId(null)

    navigator.clipboard.writeText(text).then(() => {
      refs.toast({
        detail: text,
        life: 10_000,
        severity: 'success',
        sticky: false,
        summary: t`تم نسخ`,
      })
    })
  }

  const handleReply = (item) => {
    // طبّع الكائن لشكل ReplyTarget
    setReplyTarget({
      imageUrl: item?.content?.url ?? undefined,
      messageId: item.message_id,
      senderName: item?.sender_name,
      text: item?.content?.text ?? item?.content?.caption ?? '',
    })
    setOpenMenuId(null)
  }

  return data.map((item) => {
    const isOwn = item.direction === 'outbound' // ✅ تصحيح
    const messageText = item.content.text || item.content.caption || ''
    const replyMessage = item.response_to
      ? data.find((m) => m.message_id === item.response_to)
      : null

    return (
      <div
        className={`flex items-end space-x-2 space-x-reverse mb-4 ${
          !isOwn
            ? 'justify-end rtl:justify-start'
            : 'justify-start rtl:justify-end'
        }`}
        key={item._id}
      >
        {!isOwn && (
          <Avatar
            size="normal"
            shape="circle"
            user={chat?.profile_photo}
            label={chat?.sender_name.charAt(0)}
          />
        )}

        <div
          className={`max-w-xs lg:max-w-md  relative ${isOwn ? 'order-2' : 'order-1'}`}
        >
          <div
            className={`px-4 py-2  rounded-md shadow-sm ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-white   text-gray-900 border border-gray-200'
            } ${item.isOptimistic ? 'opacity-75' : ''} ${item.message_type === 'comment' ? '!bg-amber-300' : ''}  `}
          >
            {replyMessage && (
              <div
                className={`mb-2 pl-2 py-1 border-l-4 ${
                  isOwn
                    ? 'border-white bg-blue-400/30'
                    : 'border-blue-500 bg-gray-100'
                } rounded`}
              >
                <span
                  className={`block text-xs font-semibold ${
                    isOwn ? 'text-white' : 'text-blue-700'
                  }`}
                >
                  {replyMessage.sender_info?.name || 'Unknown'}
                </span>
                {replyMessage.message_type === 'image' &&
                  replyMessage.content.url && (
                    <span className="text-xs text-gray-500">[Image]</span>
                  )}
                {replyMessage.message_type === 'audio' &&
                  replyMessage.content.url && (
                    <span className="text-xs text-gray-500">[Audio]</span>
                  )}
                {replyMessage.message_type === 'text' &&
                  replyMessage.content.text && (
                    <span className="text-xs text-gray-700 line-clamp-1">
                      {replyMessage.content.text}
                    </span>
                  )}
              </div>
            )}

            {/* المحتوى */}
            {item.message_type === 'image' && item.content.url && (
              <ImageMessage
                caption={item.content.caption}
                url={item.content.url}
              />
            )}

            {item.message_type === 'video' && item.content.url && (
              <VideoMessage
                caption={item.content.caption}
                url={item.content.url}
              />
            )}

            {item.message_type === 'audio' && item.content.url && (
              <AudioPlayer
                id={item._id}
                src={item.content.url}
              />
            )}

            {item.message_type === 'text' && item.content.text && (
              <p className="text-sm  break-words leading-relaxed whitespace-pre-wrap">
                {item.content.text}
              </p>
            )}
            {item.message_type === 'document' && (
              <AttachmentCard attachment={item.content} />
            )}
            {item.message_type === 'comment' && item.content.text && (
              <p className="text-sm break-words  leading-relaxed whitespace-pre-wrap ">
                {item.content.text}
              </p>
            )}

            {item.message_type === 'interactive' && (
              <p className="text-sm break-words  leading-relaxed">
                {item.content.text}
              </p>
            )}

            {/* قائمة الخيارات (على رسائل العميل فقط) */}
            {!isOwn && (
              <button
                className="absolute top-1 left-1 p-1 rounded hover:bg-gray-200 focus:outline-none"
                onClick={() =>
                  setOpenMenuId(openMenuId === item._id ? null : item._id)
                }
                type="button"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            )}
            {openMenuId === item._id && (
              <div className="absolute z-10 top-8 left-1 bg-white border border-gray-200 rounded shadow-md py-1 w-24">
                {Boolean(messageText) && (
                  <button
                    className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleCopy(messageText)
                    }}
                  >
                    Copy
                  </button>
                )}
                <button
                  className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleReply(item)
                  }}
                >
                  Reply
                </button>
              </div>
            )}
          </div>

          {/* الوقت + الحالة */}
          <div
            className={`flex items-center mt-1 text-xs text-gray-500 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            <span>{formatTime(item.timestamp)}</span>
            <div className="ms-1">
              {getStatusIcon(item.isRead, item.isOptimistic)}
            </div>
          </div>
        </div>
      </div>
    )
  })
}
