// import { Client } from '@/globals/Client'
// import useChat from '@/routes/chat/store'
// import { getUserInfo } from '@/stores/useAuthStore'
// import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
// import { bodySerializer } from '@/utils/functions/BodySerialzer'
// import { t } from '@lingui/macro'
// import { useMutation } from '@tanstack/react-query'
// import RiAttachment2 from '~icons/ri/attachment-2'
// import RiCloseLine from '~icons/ri/close-line'
// import RiMicFill from '~icons/ri/mic-fill'
// import RiSendPlaneFill from '~icons/ri/send-plane-fill'
// import { InputText } from 'primereact/inputtext'
// import React, { useEffect, useRef, useState } from 'react'

// export type ReplyTarget = {
//   imageUrl?: string
//   messageId: string
//   senderName: string
//   text?: string
// }

// export const ReplayComment = ({
//   canReply,
//   onCancelReply,
//   onMessageSent,
//   replyTarget,
//   scrollToBottom,
// }: {
//   readonly canReply: boolean | undefined
//   readonly onCancelReply?: () => void
//   readonly onMessageSent?: () => void
//   readonly replyTarget?: ReplyTarget | null
//   readonly scrollToBottom: () => void
// }) => {
//   const { customerInfo } = useChat()
//   const { id } = useParams()

//   const [message, setMessage] = useState<string>('')
//   const [attachment, setAttachment] = useState<File | null>(null)
//   const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
//   const [isRecording, setIsRecording] = useState(false)
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null)
//   const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
//   const userInfo = getUserInfo()?.user

//   // Snippets state
//   const [snippets, setSnippets] = useState<any[]>([])
//   const [showSnippets, setShowSnippets] = useState(false)
//   const [filteredSnippets, setFilteredSnippets] = useState<any[]>([])
//   const [selectedSnippet, setSelectedSnippet] = useState<any>(null)
//   // Helper function to create optimistic message
//   const createOptimisticMessage = (
//     content: any,
//     messageType: string,
//     text?: string
//   ) => {
//     const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
//     const now = new Date()
//     return {
//       _id: optimisticId,
//       content,
//       created_at: now.toISOString(),
//       message_id: optimisticId,
//       message_type: messageType,
//       isOptimistic: true,
//       platform: customerInfo?.platform,
//       direction: 'outbound',
//       recipient_id: customerInfo?.customer_id,
//       responder: 'user',
//       response_to: replyTarget ? replyTarget.messageId : '',
//       sender_id: userInfo?.user_id,
//       sender_info: {
//         name: userInfo?.name,
//         profile_picture: userInfo?.profile_picture,
//       },
//       session_id: customerInfo?.session_id,
//       // Flag to identify optimistic messages
// text: text || '',

// timestamp: now,

// updated_at: now.toISOString(), // Optimistic messages are always outbound
//     }
//   }

//   // Helper function to add optimistic message to cache
//   const addOptimisticMessage = async (optimisticMessage: any) => {
//     await queryClient.setQueryData(
//       [queryKeyEnum.GET_ALL_MESSAGES, id],
//       (oldData: any) => {
//         console.log('oldData', oldData)
//         if (!oldData) return oldData

//         // For infinite query data, we need to add the optimistic message to the first page
//         const updatedPages = oldData.pages.map((page: any, index: number) => {
//           if (index === oldData.pages.length - 1) {
//             // Add optimistic message to the first page (most recent messages)
//             return {
//               ...page,
//               messages: [...(page.messages || []), optimisticMessage],
//             }
//           }

//           return page
//         })

//         return {
//           ...oldData,
//           pages: updatedPages,
//         }
//       }
//     )

//     // Set a timeout to automatically remove optimistic messages after 10 seconds
//     // This prevents optimistic messages from staying forever if something goes wrong
//   }

//   // Mutation for sending text messages
//   const sendTextMutation = useMutation({
//     mutationFn: async (text: string) => {
//       return await Client.POST('/api/backend/v1/messages/outcoming', {
//         body: {
//           content: { text },
//           message_type: 'text',
//           original_msg_id: '',
//           platform: customerInfo?.platform,
//           recipient_id: customerInfo?.customer_id,
//           responder: 'user',
//           response_to: replyTarget ? replyTarget.messageId : '',
//           sender_id: userInfo?.user_id,
//           sender_info: {
//             name: userInfo?.name,
//             profile_picture: userInfo?.profile_picture,
//           },
//           session_id: customerInfo?.session_id,
//         },
//       })
//     },

//     onMutate: async (text: string) => {
//       // Cancel any outgoing refetches
//       await queryClient.cancelQueries({
//         queryKey: [queryKeyEnum.GET_ALL_MESSAGES, id],
//       })

//       // Create optimistic message
//       const optimisticMessage = createOptimisticMessage({ text }, 'text', text)

//       // Add optimistic message to cache
//       await addOptimisticMessage(optimisticMessage)
//       scrollToBottom()

//       // Return optimistic message for potential rollback
//       return { optimisticMessage }
//     },
//     onSuccess: () => {
//       // Always refetch to ensure consistency
//       queryClient.invalidateQueries({
//         queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
//       })
//     },
//   })

//   // Mutation for sending snippet messages
//   const sendSnippetMutation = useMutation({
//     mutationFn: async (snippet: any) => {
//       let content: any = {}
//       const message_type = snippet.message_type

//       switch (snippet.message_type) {
//         case 'image':
//           content = {
//             caption: snippet.content.caption || '',
//             image_url: snippet.content.image_url,
//           }
//           break
//         case 'audio':
//           content = {
//             audio_url: snippet.content.audio_url,
//             transcript: snippet.content.transcript || '',
//           }
//           break
//         case 'video':
//           content = {
//             caption: snippet.content.caption || '',
//             video_url: snippet.content.video_url,
//           }
//           break
//         case 'document':
//           content = {
//             caption: snippet.content.caption || '',
//             document_url: snippet.content.document_url,
//             filename: snippet.content.filename,
//           }
//           break
//         default:
//           throw new Error('Invalid snippet type')
//       }

//       return await Client.POST('/api/backend/v1/messages/outcoming', {
//         body: {
//           content,
//           message_type,
//           original_msg_id: '',
//           platform: customerInfo?.platform,
//           recipient_id: customerInfo?.customer_id,
//           responder: 'user',
//           response_to: replyTarget ? replyTarget.messageId : '',
//           sender_id: userInfo?.user_id,
//           sender_info: {
//             name: userInfo?.name,
//             profile_picture: userInfo?.profile_picture,
//           },
//           session_id: customerInfo?.session_id,
//         },
//       })
//     },

//     onSettled: () => {
//       // Always refetch to ensure consistency
//       queryClient.invalidateQueries({
//         queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
//       })
//     },
//   })

//   // Fetch snippets when component mounts
//   useEffect(() => {
//     fetchSnippets()
//   }, [])

//   const fetchSnippets = async () => {
//     try {
//       const { data } = await Client.GET('/api/backend/v1/api/snippets')
//       console.log('Snippets fetched:', data?.data)
//       if (data?.data) {
//         setSnippets(data.data.snippets)
//       }
//     } catch (error) {
//       console.error('Error fetching snippets:', error)
//     }
//   }

//   // Handle message input change
//   const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const value = event.target.value
//     setMessage(value)

//     // Show snippets when user types "/"
//     if (value.includes('/')) {
//       setShowSnippets(true)
//       const searchTerm = value.split('/').pop() || ''
//       const filtered = snippets.filter(
//         (snippet) =>
//           snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           (snippet.content?.text &&
//             snippet.content.text
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase())) ||
//           (snippet.content?.caption &&
//             snippet.content.caption
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase()))
//       )
//       setFilteredSnippets(filtered)
//     } else {
//       setShowSnippets(false)
//     }
//   }

//   // Handle snippet selection
//   const handleSnippetSelect = (snippet: any) => {
//     setShowSnippets(false)
//     setSelectedSnippet(snippet)

//     // For text snippets, paste the text into input
//     if (snippet.message_type === 'text') {
//       const beforeSlash = message.split('/')[0]
//       const snippetContent = snippet.content?.text || snippet.name
//       const newMessage = beforeSlash + snippetContent
//       setMessage(newMessage)
//     }
//   }

//   // Send snippet message
//   const sendSnippetMessage = async () => {
//     if (!selectedSnippet) return

//     try {
//       let content: any = {}
//       const message_type = selectedSnippet.message_type

//       switch (selectedSnippet.message_type) {
//         case 'image':
//           content = {
//             caption: selectedSnippet.content.caption || '',
//             image_url: selectedSnippet.content.image_url,
//           }
//           break
//         case 'audio':
//           content = {
//             audio_url: selectedSnippet.content.audio_url,
//             transcript: selectedSnippet.content.transcript || '',
//           }
//           break
//         case 'video':
//           content = {
//             caption: selectedSnippet.content.caption || '',
//             video_url: selectedSnippet.content.video_url,
//           }
//           break
//         case 'document':
//           content = {
//             caption: selectedSnippet.content.caption || '',
//             document_url: selectedSnippet.content.document_url,
//             filename: selectedSnippet.content.filename,
//           }
//           break
//         default:
//           return
//       }

//       const messageResponse = await Client.POST(
//         '/api/backend/v1/messages/outcoming',
//         {
//           body: {
//             content,
//             message_type,
//             original_msg_id: '',
//             platform: customerInfo?.platform,
//             recipient_id: customerInfo?.customer_id,
//             responder: 'user',
//             response_to: replyTarget ? replyTarget.messageId : '',
//             sender_id: userInfo?.user_id,
//             sender_info: {
//               name: userInfo?.name,
//               profile_picture: userInfo?.profile_picture,
//             },
//             session_id: customerInfo?.session_id,
//           },
//         }
//       )

//       if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
//         queryClient.invalidateQueries({
//           queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
//         })
//       }

//       // Clear after sending
//       setSelectedSnippet(null)
//       setMessage('')
//       if (onMessageSent) onMessageSent()
//       if (onCancelReply) onCancelReply()
//     } catch (error) {
//       console.error('Error sending snippet message:', error)
//     }
//   }

//   // Handle file/image upload
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setAttachment(e.target.files[0])
//     }
//   }

//   const sendMessageWithFile = async () => {
//     if (!attachment) return

//     let media_type = 'document'
//     if (attachment.type.startsWith('image/')) media_type = 'image'

//     try {
//       const uploadResponse = await Client.POST('/api/backend/v1/upload_media', {
//         body: {
//           customer_id: customerInfo?.customer_id,
//           file_data: attachment as any,
//           media_type,
//           platform: customerInfo?.platform,
//         },
//         bodySerializer: (body: any) => bodySerializer(body),
//       })

//       const url = uploadResponse.data?.data
//       if (!url) throw new Error('Upload failed')

//       let content: any = {}
//       let message_type: any = media_type

//       if (media_type === 'image') {
//         content = {
//           caption: message,
//           url,
//         }
//         message_type = 'image'
//       } else {
//         content = {
//           caption: message,
//           filename: attachment.name,
//           url,
//         }
//         message_type = 'file'
//       }

//       const messageResponse = await Client.POST(
//         '/api/backend/v1/messages/outcoming',
//         {
//           body: {
//             content,
//             message_type,
//             original_msg_id: '',
//             platform: customerInfo?.platform,
//             recipient_id: customerInfo?.customer_id,
//             responder: 'user',
//             response_to: replyTarget ? replyTarget.messageId : '',
//             sender_id: userInfo?.user_id,
//             sender_info: {
//               name: userInfo?.name,
//               profile_picture: userInfo?.profile_picture,
//             },
//             session_id: customerInfo?.session_id,
//           },
//         }
//       )

//       if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
//         queryClient.invalidateQueries({
//           queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
//         })
//       }
//     } catch (error) {
//       console.error('Error sending file message:', error)
//     }
//   }

//   const sendMessageWithAudio = async () => {
//     if (!audioBlob) return

//     try {
//       const audioFile = new File([audioBlob], `audio_${Date.now()}.mp3`, {
//         type: 'audio/mp3',
//       })

//       const uploadResponse = await Client.POST('/api/backend/v1/upload_media', {
//         body: {
//           customer_id: customerInfo?.customer_id,
//           file_data: audioFile as any,
//           media_type: 'audio',
//           platform: customerInfo?.platform,
//         },
//         bodySerializer: (body: any) => bodySerializer(body),
//       })

//       const url = uploadResponse.data?.data
//       if (!url) throw new Error('Audio upload failed')

//       const messageResponse = await Client.POST(
//         '/api/backend/v1/messages/outcoming',
//         {
//           body: {
//             content: {
//               transcript: message,
//               url: url as string,
//             },
//             message_type: 'audio',
//             original_msg_id: '',
//             platform: customerInfo?.platform,
//             recipient_id: customerInfo?.customer_id,
//             responder: 'user',
//             response_to: replyTarget ? replyTarget.messageId : '',
//             sender_id: userInfo?.user_id,
//             sender_info: {
//               name: userInfo?.name,
//               profile_picture: userInfo?.profile_picture,
//             },
//             session_id: customerInfo?.session_id,
//           },
//         }
//       )

//       if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
//         queryClient.invalidateQueries({
//           queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
//         })
//       }
//     } catch (error) {
//       console.error('Error sending audio message:', error)
//     }
//   }

//   // Handle audio recording
//   const startRecording = async () => {
//     setIsRecording(true)
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//     const mediaRecorder = new window.MediaRecorder(stream)
//     mediaRecorderRef.current = mediaRecorder
//     const chunks: BlobPart[] = []
//     mediaRecorder.ondataavailable = (e) => {
//       if (e.data.size > 0) chunks.push(e.data)
//     }

//     mediaRecorder.onstop = () => {
//       const blob = new Blob(chunks, { type: 'audio/mp3' })
//       setAudioBlob(blob)
//       setRecordingUrl(URL.createObjectURL(blob))
//       setIsRecording(false)
//     }

//     mediaRecorder.start()
//   }

//   const stopRecording = () => {
//     mediaRecorderRef.current?.stop()
//     setIsRecording(false)
//   }

//   // Send message (text, image, audio, or snippet)
//   const sendMessage = async () => {
//     if (!message && !attachment && !audioBlob && !selectedSnippet) return

//     if (selectedSnippet) {
//       sendSnippetMutation.mutate(selectedSnippet)
//       // Scroll to bottom immediately for snippets
//     } else if (attachment) {
//       await sendMessageWithFile()
//     } else if (audioBlob) {
//       await sendMessageWithAudio()
//     } else if (replyTarget) {
//       console.log('first')
//     } else {
//       sendTextMutation.mutate(message)
//       // Scroll to bottom immediately for text messages
//     }

//     setMessage('')
//     setAttachment(null)
//     setAudioBlob(null)
//     setRecordingUrl(null)
//     setSelectedSnippet(null)
//     if (onMessageSent) onMessageSent()
//     if (onCancelReply) onCancelReply()
//   }

//   const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
//     if (event.key === 'Enter') {
//       sendMessage()
//     }
//   }

//   return (
//     <div className="flex flex-col gap-2">
//       {/* Reply preview */}
//       {replyTarget && (
//         <div className="flex items-center bg-blue-50 border-l-4 border-blue-500 px-2 py-1 rounded-t-md">
//           <div className="flex-1">
//             <span className="font-semibold text-blue-700 text-xs">
//               {replyTarget.senderName}
//             </span>
//             {replyTarget.text && (
//               <span className="block text-xs text-gray-700 line-clamp-1">
//                 {replyTarget.text}
//               </span>
//             )}
//             {replyTarget.imageUrl && (
//               <span className="block text-xs text-gray-500">[Image]</span>
//             )}
//           </div>
//           <button
//             className="ml-2 p-1"
//             onClick={onCancelReply}
//             type="button"
//           >
//             <RiCloseLine className="w-4 h-4 text-gray-400" />
//           </button>
//         </div>
//       )}
//       {/* Show preview of selected image */}
//       {attachment && (
//         <div className="flex items-center gap-2 mt-1">
//           {attachment.type.startsWith('image/') ? (
//             <img
//               alt="preview"
//               className="w-16 h-16 object-cover rounded"
//               src={URL.createObjectURL(attachment)}
//             />
//           ) : (
//             <span className="text-sm text-gray-700">{attachment.name}</span>
//           )}
//           <button
//             className="p-1"
//             onClick={() => setAttachment(null)}
//             type="button"
//           >
//             <RiCloseLine className="w-4 h-4 text-gray-400" />
//           </button>
//         </div>
//       )}
//       {/* Show preview of recorded audio */}
//       {recordingUrl && (
//         <div className="flex items-center gap-2 mt-1">
//           <audio
//             className="w-40"
//             controls
//             src={recordingUrl}
//           />
//           <button
//             className="p-1"
//             onClick={() => {
//               setAudioBlob(null)
//               setRecordingUrl(null)
//             }}
//             type="button"
//           >
//             <RiCloseLine className="w-4 h-4 text-gray-400" />
//           </button>
//         </div>
//       )}

//       {/* Show preview of selected snippet */}
//       {selectedSnippet && (
//         <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
//           <div className="flex-1">
//             <div className="flex items-center gap-2">
//               <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
//                 {selectedSnippet.message_type}
//               </span>
//               <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
//                 {selectedSnippet.name}
//               </span>
//             </div>
//             {selectedSnippet.message_type === 'image' && (
//               <img
//                 alt="snippet preview"
//                 className="w-16 h-16 object-cover rounded mt-1"
//                 src={selectedSnippet.content.image_url}
//               />
//             )}
//             {selectedSnippet.message_type === 'document' && (
//               <span className="text-xs text-gray-500 dark:text-gray-400">
//                 📄 {selectedSnippet.content.filename}
//               </span>
//             )}
//             {selectedSnippet.message_type === 'audio' && (
//               <div className="mt-1">
//                 <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
//                   🎵 Audio snippet
//                 </span>
//                 <audio
//                   className="w-full max-w-xs"
//                   controls
//                   src={selectedSnippet.content.audio_url}
//                 />
//               </div>
//             )}
//             {selectedSnippet.message_type === 'video' && (
//               <span className="text-xs text-gray-500 dark:text-gray-400">
//                 🎬 Video snippet
//               </span>
//             )}
//           </div>
//           <button
//             className="p-1"
//             onClick={() => setSelectedSnippet(null)}
//             type="button"
//           >
//             <RiCloseLine className="w-4 h-4 text-gray-400" />
//           </button>
//         </div>
//       )}
//       <div className="relative flex items-center border border-gray-300 dark:border-gray-800 rounded-md">
//         {/* Attachment button */}
//         <label className="p-2 cursor-pointer">
//           <RiAttachment2 className="hover:text-qimbColor-500 transition-colors dark:text-qimbColor-500" />
//           <input
//             accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
//             className="hidden"
//             onChange={handleFileChange}
//             type="file"
//           />
//         </label>
//         {/* Audio record button */}
//         <button
//           className={`p-2 focus:outline-none ${isRecording ? 'bg-red-100' : ''}`}
//           onClick={isRecording ? stopRecording : startRecording}
//           type="button"
//         >
//           <RiMicFill
//             className={`transition-colors ${isRecording ? 'text-red-500' : 'text-qimbColor-500'}`}
//           />
//         </button>
//         {/* Input */}
//         <InputText
//           className="flex-grow p-3 border-none focus:ring-0 focus:outline-none"
//           disabled={!canReply}
//           onChange={handleMessageChange}
//           onKeyDown={handleKeyPress}
//           placeholder={t`اكتب رسالتك هنا...`}
//           type="text"
//           value={message}
//         />
//         {/* Send button */}
//         <button
//           className="p-2 focus:outline-none"
//           disabled={!canReply}
//           onClick={sendMessage}
//           type="button"
//         >
//           <RiSendPlaneFill className="hover:text-qimbColor-500 transition-colors dark:text-qimbColor-500" />
//         </button>

//         {/* Snippets dropdown */}
//         {showSnippets && filteredSnippets.length > 0 && (
//           <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
//             {filteredSnippets.map((snippet) => (
//               <button
//                 className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
//                 key={snippet._id}
//                 onClick={() => handleSnippetSelect(snippet)}
//                 type="button"
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
//                     {snippet.name}
//                   </div>
//                   <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
//                     {snippet.message_type}
//                   </div>
//                 </div>
//                 <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
//                   {snippet.message_type === 'text' &&
//                     snippet.content?.text &&
//                     snippet.content.text}
//                   {snippet.message_type !== 'text' &&
//                     snippet.content?.caption &&
//                     snippet.content.caption}
//                   {!snippet.content?.text &&
//                     !snippet.content?.caption &&
//                     snippet.name}
//                 </div>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // File: ReplayComment.tsx

// src/chat/components/ReplayComment.tsx

import { ChatComposer, type Snippet } from '../chatComposer.store'
import { useSendMessage } from '../useSendMessage'
import { SnippetDropdown } from './SnippetDropdown'
import { t } from '@lingui/macro'
import RiAttachment2 from '~icons/ri/attachment-2'
import RiCloseLine from '~icons/ri/close-line'
import RiMicFill from '~icons/ri/mic-fill'
import RiSendPlaneFill from '~icons/ri/send-plane-fill'
import { InputText } from 'primereact/inputtext'
import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from 'zustand'

export const ReplayComment = ({
  canReply,

  scrollToBottom,
}: {
  readonly canReply?: boolean

  readonly scrollToBottom: () => void
}) => {
  const { id } = useParams()

  const {
    attachment,
    audioBlob,
    clearComposer,
    fetchSnippets,
    filteredSnippets,
    isRecording,
    recordingUrl,
    replyTarget,
    selectedSnippet,
    setAttachment,
    setAudioBlob,
    setReplyTarget,
    setSelectedSnippet,
    setText,
    showSnippets,
    startRecording,
    stopRecording,
    text,
  } = useStore(ChatComposer, (state) => ({
    attachment: state.attachment,
    audioBlob: state.audioBlob,
    clearComposer: state.clearComposer,
    fetchSnippets: state.fetchSnippets,
    filteredSnippets: state.filteredSnippets,
    isRecording: state.isRecording,
    recordingUrl: state.recordingUrl,
    replyTarget: state.replyTarget,
    selectedSnippet: state.selectedSnippet,
    setAttachment: state.setAttachment,
    setAudioBlob: state.setAudioBlob,
    setReplyTarget: state.setReplyTarget,
    setSelectedSnippet: state.setSelectedSnippet,
    setText: state.setText,
    showSnippets: state.showSnippets,
    startRecording: state.startRecording,
    stopRecording: state.stopRecording,
    text: state.text,
  }))

  const { sendAudioBlob, sendImageFile, sendSnippet, sendText } =
    useSendMessage(id)

  useEffect(() => {
    fetchSnippets()
  }, [fetchSnippets])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0])
      setAttachment(event.target.files[0])
  }

  const send = async () => {
    if (selectedSnippet) {
      sendSnippet(selectedSnippet)
      clearComposer()
      scrollToBottom()
      return
    }

    if (attachment) {
      sendImageFile(attachment, text || undefined)
    } else if (audioBlob) {
      sendAudioBlob(audioBlob, text || undefined)
    } else if (text?.trim()) {
      sendText(text.trim())
    } else {
      return
    }

    clearComposer()
    scrollToBottom()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') send()
  }

  const onSelectSnippet = (snip: Snippet) => {
    // النصي: إدراج مباشر مكان الجزء بعد آخر "/"
    if (snip.message_type === 'text') {
      const lastSlash = text.lastIndexOf('/')
      const before = lastSlash >= 0 ? text.slice(0, lastSlash) : text
      const insert = snip.content?.text || snip.name
      setSelectedSnippet(snip)
      setText(`${before}${insert}`)
    } else {
      setSelectedSnippet(snip)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Reply preview */}
      {replyTarget && (
        <div className="flex items-center bg-blue-50 border-l-4 border-blue-500 px-2 py-1 rounded-t-md">
          <div className="flex-1">
            <span className="font-semibold text-blue-700 text-xs">
              {replyTarget?.senderName}
            </span>
            {replyTarget?.text && (
              <span className="block text-xs text-gray-700 line-clamp-1">
                {replyTarget.text}
              </span>
            )}
            {replyTarget?.imageUrl && (
              <img
                alt="snippet preview"
                className="w-16 h-16 object-cover rounded mt-1"
                src={replyTarget.imageUrl}
              />
            )}
          </div>
          <button
            className="ml-2 p-1"
            onClick={() => setReplyTarget(null)}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {attachment && (
        <div className="flex items-center gap-2 mt-1">
          {attachment.type.startsWith('image/') ? (
            <img
              alt="preview"
              className="w-16 h-16 object-cover rounded"
              src={URL.createObjectURL(attachment)}
            />
          ) : (
            <span className="text-sm text-gray-700">{attachment.name}</span>
          )}
          <button
            className="p-1"
            onClick={() => setAttachment(null)}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Audio preview */}
      {recordingUrl && (
        <div className="flex items-center gap-2 mt-1">
          <audio
            className="w-40"
            controls
            src={recordingUrl}
          />
          <button
            className="p-1"
            onClick={() => setAudioBlob(null, null)}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Selected snippet preview (non-text) */}
      {selectedSnippet && selectedSnippet.message_type !== 'text' && (
        <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50  border border-blue-200  rounded-md">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100  text-blue-800  px-2 py-1 rounded">
                {selectedSnippet.message_type}
              </span>
              <span className="font-medium text-sm text-gray-900 ">
                {selectedSnippet.name}
              </span>
            </div>
            {selectedSnippet.message_type === 'image' &&
              selectedSnippet.content?.image_url && (
                <img
                  alt="snippet preview"
                  className="w-16 h-16 object-cover rounded mt-1"
                  src={selectedSnippet.content.image_url}
                />
              )}
            {selectedSnippet.message_type === 'document' && (
              <span className="text-xs text-gray-500 ">
                📄 {selectedSnippet.content?.filename}
              </span>
            )}
          </div>
          <button
            className="p-1"
            onClick={() => setSelectedSnippet(null)}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      <div className="relative flex items-center border border-gray-300  rounded-md">
        {/* Attachment */}
        <label className="p-2 cursor-pointer">
          <RiAttachment2 className="hover:text-qimbColor-500 transition-colors " />
          <input
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleFileChange}
            type="file"
          />
        </label>

        {/* Record toggle */}
        <button
          className={`p-2 focus:outline-none ${isRecording ? 'bg-red-100' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          type="button"
        >
          <RiMicFill
            className={`transition-colors ${isRecording ? 'text-red-500' : 'text-qimbColor-500'}`}
          />
        </button>

        {/* Input */}
        <InputText
          className="flex-grow p-3 border-none focus:ring-0 focus:outline-none"
          disabled={canReply === false}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t`اكتب رسالتك هنا...`}
          type="text"
          value={text}
        />

        {/* Send */}
        <button
          className="p-2 focus:outline-none"
          disabled={canReply === false}
          onClick={send}
          type="button"
        >
          <RiSendPlaneFill className="hover:text-qimbColor-500 transition-colors " />
        </button>

        {/* Snippets dropdown */}

        <SnippetDropdown
          onSelect={onSelectSnippet}
          snippets={filteredSnippets}
          visible={showSnippets}
        />
      </div>
    </div>
  )
}
