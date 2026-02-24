/**
 * ReplayComment Component with Optimistic Updates
 *
 * This component implements optimistic updates for chat messages to provide
 * immediate user feedback while messages are being sent to the server.
 *
 * Optimistic Updates Features:
 * 1. Immediate UI updates - Messages appear instantly when sent
 * 2. Visual indicators - Optimistic messages show a clock icon and reduced opacity
 * 3. Automatic rollback - Failed messages are removed from the UI
 * 4. Seamless replacement - Successful messages replace optimistic ones
 *
 * How it works:
 * - When a message is sent, an optimistic message is immediately added to the cache
 * - The optimistic message has a unique ID and isOptimistic flag
 * - If the server request succeeds, the optimistic message is removed and real data is fetched
 * - If the server request fails, the optimistic message is removed and an error is shown
 *
 * Supported message types:
 * - Text messages
 * - Snippet messages (images, audio, video, documents)
 * - File uploads (images, documents)
 * - Audio recordings
 */

import { Client } from '@/globals/Client'
import useChat from '@/routes/chat/store'
import { getUserInfo } from '@/stores/useAuthStore'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { bodySerializer } from '@/utils/functions/BodySerialzer'
import { t } from '@lingui/macro'
import { useMutation } from '@tanstack/react-query'
import RiAttachment2 from '~icons/ri/attachment-2'
import RiCloseLine from '~icons/ri/close-line'
import RiMicFill from '~icons/ri/mic-fill'
import RiSendPlaneFill from '~icons/ri/send-plane-fill'
import { InputText } from 'primereact/inputtext'
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

export type ReplyTarget = {
  imageUrl?: string
  messageId: string
  senderName: string
  text?: string
}

export const ReplayComment = ({
  canReply,
  onCancelReply,
  onMessageSent,
  replyTarget,
  scrollToBottom,
}: {
  readonly canReply: boolean | undefined
  readonly onCancelReply?: () => void
  readonly onMessageSent?: () => void
  readonly replyTarget?: ReplyTarget | null
  readonly scrollToBottom: () => void
}) => {
  // Get customer info from session storage or URL params
  const { id } = useParams()
  const customerInfo = {
    customer_id: id || '',
    session_id: id || '',
    platform: 'web',
  }

  const [message, setMessage] = useState<string>('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const userInfo = getUserInfo()?.user

  // Snippets state
  const [snippets, setSnippets] = useState<any[]>([])
  const [showSnippets, setShowSnippets] = useState(false)
  const [filteredSnippets, setFilteredSnippets] = useState<any[]>([])
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null)

  // Helper function to create optimistic message
  const createOptimisticMessage = (
    content: any,
    messageType: string,
    text?: string
  ) => {
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
    const now = new Date()
    return {
      _id: optimisticId,
      message_id: optimisticId,
      content,
      message_type: messageType,
      sender_info: {
        name: userInfo?.name,
        profile_picture: userInfo?.profile_picture,
      },
      sender_id: userInfo?.user_id,
      responder: 'user',
      response_to: replyTarget ? replyTarget.messageId : '',
      session_id: customerInfo?.session_id,
      platform: customerInfo?.platform,
      recipient_id: customerInfo?.customer_id,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      timestamp: now,
      isOptimistic: true, // Flag to identify optimistic messages
      text: text || '',
      direction: 'outbound', // Optimistic messages are always outbound
    }
  }

  // Helper function to add optimistic message to cache
  const addOptimisticMessage = (optimisticMessage: any) => {
    queryClient.setQueryData(
      [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      (oldData: any) => {
        if (!oldData) return oldData
        console.log('oldData', oldData)

        // For infinite query data, we need to add the optimistic message to the first page
        // const updatedPages = oldData.pages.map((page: any, index: number) => {
        //   if (index === oldData.pages.length - 1) {
        //     // Add optimistic message to the first page (most recent messages)
        //     return {
        //       ...page,
        //       messages: [optimisticMessage, ...(page.messages || [])]
        //     }
        //   }
        //   return page
        // })

        const updatedPages = oldData.pages.map((page: any, index: number) => {
          if (index === 0) {
            // Add optimistic message to the first page (most recent messages)
            return {
              ...page,
              messages: [...(page.messages || []), optimisticMessage],
            }
          }
          return page
        })

        return {
          ...oldData,
          pages: updatedPages,
        }
      }
    )

    // Set a timeout to automatically remove optimistic messages after 10 seconds
    // This prevents optimistic messages from staying forever if something goes wrong
    setTimeout(() => {
      removeOptimisticMessage(optimisticMessage._id)
    }, 10000)
  }

  // Helper function to remove optimistic message from cache
  const removeOptimisticMessage = (optimisticId: string) => {
    queryClient.setQueryData(
      [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      (oldData: any) => {
        if (!oldData) return oldData

        // For infinite query data, we need to remove the optimistic message from all pages
        const updatedPages = oldData.pages.map((page: any) => ({
          ...page,
          messages: (page.messages || []).filter(
            (msg: any) => msg._id !== optimisticId
          ),
        }))

        return {
          ...oldData,
          pages: updatedPages,
        }
      }
    )
  }

  // Mutation for sending text messages
  const sendTextMutation = useMutation({
    mutationFn: async (text: string) => {
      return await Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { text },
          message_type: 'text',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          response_to: replyTarget ? replyTarget.messageId : '',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async (text: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      })

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage({ text }, 'text', text)

      // Add optimistic message to cache
      addOptimisticMessage(optimisticMessage)

      // Return optimistic message for potential rollback
      return { optimisticMessage }
    },
    onError: (err, variables, context) => {
      // Remove optimistic message on error
      if (context?.optimisticMessage) {
        removeOptimisticMessage(context.optimisticMessage._id)
      }

      // Show error toast
      console.error('Error sending text message:', err)
      // You can add a toast notification here if you have a toast system
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic message and let the refetch handle the real data
      if (context?.optimisticMessage) {
        removeOptimisticMessage(context.optimisticMessage._id)
      }

      // Refetch to get the real message from server
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      })
    },
  })

  // Mutation for sending snippet messages
  const sendSnippetMutation = useMutation({
    mutationFn: async (snippet: any) => {
      let content: any = {}
      const message_type = snippet.message_type

      switch (snippet.message_type) {
        case 'image':
          content = {
            caption: snippet.content.caption || '',
            image_url: snippet.content.image_url,
          }
          break
        case 'audio':
          content = {
            audio_url: snippet.content.audio_url,
            transcript: snippet.content.transcript || '',
          }
          break
        case 'video':
          content = {
            caption: snippet.content.caption || '',
            video_url: snippet.content.video_url,
          }
          break
        case 'document':
          content = {
            caption: snippet.content.caption || '',
            document_url: snippet.content.document_url,
            filename: snippet.content.filename,
          }
          break
        default:
          throw new Error('Invalid snippet type')
      }

      return await Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content,
          message_type,
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          response_to: replyTarget ? replyTarget.messageId : '',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async (snippet: any) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      })

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(
        snippet.content,
        snippet.message_type
      )

      // Add optimistic message to cache
      addOptimisticMessage(optimisticMessage)

      // Return optimistic message for potential rollback
      return { optimisticMessage }
    },
    onError: (err, variables, context) => {
      // Remove optimistic message on error
      if (context?.optimisticMessage) {
        removeOptimisticMessage(context.optimisticMessage._id)
      }

      // Show error toast
      console.error('Error sending snippet message:', err)
      // You can add a toast notification here if you have a toast system
    },
    onSuccess: (data, variables, context) => {
      // Remove optimistic message and let the refetch handle the real data
      if (context?.optimisticMessage) {
        removeOptimisticMessage(context.optimisticMessage._id)
      }

      // Refetch to get the real message from server
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
      })
    },
  })

  // Fetch snippets when component mounts
  useEffect(() => {
    fetchSnippets()
  }, [])

  const fetchSnippets = async () => {
    try {
      const { data } = await Client.GET('/api/backend/v1/api/snippets')
      console.log('Snippets fetched:', data?.data)
      const responseData = data?.data as any
      if (
        responseData &&
        responseData.snippets &&
        Array.isArray(responseData.snippets)
      ) {
        setSnippets(responseData.snippets)
      }
    } catch (error) {
      console.error('Error fetching snippets:', error)
    }
  }

  // Handle message input change
  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setMessage(value)

    // Show snippets when user types "/"
    if (value.includes('/')) {
      setShowSnippets(true)
      const searchTerm = value.split('/').pop() || ''
      const filtered = snippets.filter(
        (snippet) =>
          snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (snippet.content?.text &&
            snippet.content.text
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (snippet.content?.caption &&
            snippet.content.caption
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
      setFilteredSnippets(filtered)
    } else {
      setShowSnippets(false)
    }
  }

  // Handle snippet selection
  const handleSnippetSelect = (snippet: any) => {
    setShowSnippets(false)
    setSelectedSnippet(snippet)

    // For text snippets, paste the text into input
    if (snippet.message_type === 'text') {
      const beforeSlash = message.split('/')[0]
      const snippetContent = snippet.content?.text || snippet.name
      const newMessage = beforeSlash + snippetContent
      setMessage(newMessage)
    }
  }

  // Send snippet message
  const sendSnippetMessage = async () => {
    if (!selectedSnippet) return

    let optimisticMessage: any = null

    try {
      let content: any = {}
      const message_type = selectedSnippet.message_type

      switch (selectedSnippet.message_type) {
        case 'image':
          content = {
            caption: selectedSnippet.content.caption || '',
            image_url: selectedSnippet.content.image_url,
          }
          break
        case 'audio':
          content = {
            audio_url: selectedSnippet.content.audio_url,
            transcript: selectedSnippet.content.transcript || '',
          }
          break
        case 'video':
          content = {
            caption: selectedSnippet.content.caption || '',
            video_url: selectedSnippet.content.video_url,
          }
          break
        case 'document':
          content = {
            caption: selectedSnippet.content.caption || '',
            document_url: selectedSnippet.content.document_url,
            filename: selectedSnippet.content.filename,
          }
          break
        default:
          return
      }

      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(content, message_type)
      addOptimisticMessage(optimisticMessage)

      const messageResponse = await Client.POST(
        '/api/backend/v1/messages/outcoming',
        {
          body: {
            content,
            message_type,
            original_msg_id: '',
            platform: customerInfo?.platform,
            recipient_id: customerInfo?.customer_id,
            responder: 'user',
            response_to: replyTarget ? replyTarget.messageId : '',
            sender_id: userInfo?.user_id,
            sender_info: {
              name: userInfo?.name,
              profile_picture: userInfo?.profile_picture,
            },
            session_id: customerInfo?.session_id,
          },
        }
      )

      if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
        // Remove optimistic message and refetch
        removeOptimisticMessage(optimisticMessage._id)
        queryClient.invalidateQueries({
          queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
        })
      } else {
        // Remove optimistic message on failure
        removeOptimisticMessage(optimisticMessage._id)
      }

      // Clear after sending
      setSelectedSnippet(null)
      setMessage('')
      if (onMessageSent) onMessageSent()
      scrollToBottom()
      if (onCancelReply) onCancelReply()
    } catch (error) {
      console.error('Error sending snippet message:', error)
      // Remove optimistic message on error
      if (optimisticMessage) {
        removeOptimisticMessage(optimisticMessage._id)
      }
    }
  }

  // Handle file/image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    }
  }

  const sendMessageWithFile = async () => {
    if (!attachment) return

    let media_type = 'document'
    if (attachment.type.startsWith('image/')) media_type = 'image'

    let optimisticMessage: any = null

    try {
      // Create optimistic message for file upload
      let optimisticContent: any = {}
      let message_type: any = media_type

      if (media_type === 'image') {
        optimisticContent = {
          caption: message,
          image_url: URL.createObjectURL(attachment), // Temporary URL for preview
        }
        message_type = 'image'
      } else {
        optimisticContent = {
          caption: message,
          document_url: '#', // Placeholder
          filename: attachment.name,
        }
        message_type = 'file'
      }

      optimisticMessage = createOptimisticMessage(
        optimisticContent,
        message_type
      )
      addOptimisticMessage(optimisticMessage)

      const uploadResponse = await Client.POST('/api/backend/v1/upload_media', {
        body: {
          customer_id: customerInfo?.customer_id,
          file_data: attachment as any,
          media_type,
          platform: customerInfo?.platform,
        },
        bodySerializer: (body: any) => bodySerializer(body),
      })

      const url = uploadResponse.data?.data
      if (!url) throw new Error('Upload failed')

      let content: any = {}

      if (media_type === 'image') {
        content = {
          caption: message,
          image_url: url,
        }
        message_type = 'image'
      } else {
        content = {
          caption: message,
          document_url: url,
          filename: attachment.name,
        }
        message_type = 'file'
      }

      const messageResponse = await Client.POST(
        '/api/backend/v1/messages/outcoming',
        {
          body: {
            content,
            message_type,
            original_msg_id: '',
            platform: customerInfo?.platform,
            recipient_id: customerInfo?.customer_id,
            responder: 'user',
            response_to: replyTarget ? replyTarget.messageId : '',
            sender_id: userInfo?.user_id,
            sender_info: {
              name: userInfo?.name,
              profile_picture: userInfo?.profile_picture,
            },
            session_id: customerInfo?.session_id,
          },
        }
      )

      if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
        // Remove optimistic message and refetch
        removeOptimisticMessage(optimisticMessage._id)
        queryClient.invalidateQueries({
          queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
        })
      } else {
        // Remove optimistic message on failure
        removeOptimisticMessage(optimisticMessage._id)
      }
    } catch (error) {
      console.error('Error sending file message:', error)
      // Remove optimistic message on error
      if (optimisticMessage) {
        removeOptimisticMessage(optimisticMessage._id)
      }
    }
  }

  const sendMessageWithAudio = async () => {
    if (!audioBlob) return

    let optimisticMessage: any = null

    try {
      // Create optimistic message for audio
      const optimisticContent = {
        audio_url: recordingUrl, // Use the recording URL for preview
        transcript: message,
      }

      optimisticMessage = createOptimisticMessage(optimisticContent, 'audio')
      addOptimisticMessage(optimisticMessage)

      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
        type: 'audio/webm',
      })

      const uploadResponse = await Client.POST('/api/backend/v1/upload_media', {
        body: {
          customer_id: customerInfo?.customer_id,
          file_data: audioFile as any,
          media_type: 'audio',
          platform: customerInfo?.platform,
        },
        bodySerializer: (body: any) => bodySerializer(body),
      })

      const url = uploadResponse.data?.data
      if (!url) throw new Error('Audio upload failed')

      const messageResponse = await Client.POST(
        '/api/backend/v1/messages/outcoming',
        {
          body: {
            content: {
              audio_url: url as string,
              transcript: message,
            },
            message_type: 'audio',
            original_msg_id: '',
            platform: customerInfo?.platform,
            recipient_id: customerInfo?.customer_id,
            responder: 'user',
            response_to: replyTarget ? replyTarget.messageId : '',
            sender_id: userInfo?.user_id,
            sender_info: {
              name: userInfo?.name,
              profile_picture: userInfo?.profile_picture,
            },
            session_id: customerInfo?.session_id,
          },
        }
      )

      if (messageResponse.data?.data?.status?.toLowerCase() === 'success') {
        // Remove optimistic message and refetch
        removeOptimisticMessage(optimisticMessage._id)
        queryClient.invalidateQueries({
          queryKey: [queryKeyEnum.GET_ALL_MESSAGES, customerInfo?.session_id],
        })
      } else {
        // Remove optimistic message on failure
        removeOptimisticMessage(optimisticMessage._id)
      }
    } catch (error) {
      console.error('Error sending audio message:', error)
      // Remove optimistic message on error
      if (optimisticMessage) {
        removeOptimisticMessage(optimisticMessage._id)
      }
    }
  }

  // Handle audio recording
  const startRecording = async () => {
    setIsRecording(true)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new window.MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    const chunks: BlobPart[] = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      setAudioBlob(blob)
      setRecordingUrl(URL.createObjectURL(blob))
      setIsRecording(false)
    }

    mediaRecorder.start()
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  // Send message (text, image, audio, or snippet)
  const sendMessage = async () => {
    if (!message && !attachment && !audioBlob && !selectedSnippet) return

    if (selectedSnippet) {
      sendSnippetMutation.mutate(selectedSnippet)
      // Scroll to bottom immediately for snippets
      scrollToBottom()
    } else if (attachment) {
      await sendMessageWithFile()
      scrollToBottom()
    } else if (audioBlob) {
      await sendMessageWithAudio()
      scrollToBottom()
    } else if (replyTarget) {
      console.log('first')
    } else {
      sendTextMutation.mutate(message)
      // Scroll to bottom immediately for text messages
      scrollToBottom()
    }

    setMessage('')
    setAttachment(null)
    setAudioBlob(null)
    setRecordingUrl(null)
    setSelectedSnippet(null)
    if (onMessageSent) onMessageSent()
    if (onCancelReply) onCancelReply()
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Reply preview */}
      {replyTarget && (
        <div className="flex items-center bg-blue-50 border-l-4 border-blue-500 px-2 py-1 rounded-t-md">
          <div className="flex-1">
            <span className="font-semibold text-blue-700 text-xs">
              {replyTarget.senderName}
            </span>
            {replyTarget.text && (
              <span className="block text-xs text-gray-700 line-clamp-1">
                {replyTarget.text}
              </span>
            )}
            {replyTarget.imageUrl && (
              <span className="block text-xs text-gray-500">[Image]</span>
            )}
          </div>
          <button
            className="ml-2 p-1"
            onClick={onCancelReply}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}
      {/* Show preview of selected image */}
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
      {/* Show preview of recorded audio */}
      {recordingUrl && (
        <div className="flex items-center gap-2 mt-1">
          <audio
            className="w-40"
            controls
            src={recordingUrl}
          />
          <button
            className="p-1"
            onClick={() => {
              setAudioBlob(null)
              setRecordingUrl(null)
            }}
            type="button"
          >
            <RiCloseLine className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Show preview of selected snippet */}
      {selectedSnippet && (
        <div className="flex items-center gap-2 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {selectedSnippet.message_type}
              </span>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {selectedSnippet.name}
              </span>
            </div>
            {selectedSnippet.message_type === 'image' && (
              <img
                alt="snippet preview"
                className="w-16 h-16 object-cover rounded mt-1"
                src={selectedSnippet.content.image_url}
              />
            )}
            {selectedSnippet.message_type === 'document' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                📄 {selectedSnippet.content.filename}
              </span>
            )}
            {selectedSnippet.message_type === 'audio' && (
              <div className="mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  🎵 Audio snippet
                </span>
                <audio
                  className="w-full max-w-xs"
                  controls
                  src={selectedSnippet.content.audio_url}
                />
              </div>
            )}
            {selectedSnippet.message_type === 'video' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                🎬 Video snippet
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
      <div className="relative flex items-center border border-gray-300 dark:border-gray-800 rounded-md">
        {/* Attachment button */}
        <label className="p-2 cursor-pointer">
          <RiAttachment2 className="hover:text-qimbColor-500 transition-colors dark:text-qimbColor-500" />
          <input
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            onChange={handleFileChange}
            type="file"
          />
        </label>
        {/* Audio record button */}
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
          disabled={!canReply}
          onChange={handleMessageChange}
          onKeyDown={handleKeyPress}
          placeholder={t`اكتب رسالتك هنا...`}
          type="text"
          value={message}
        />
        {/* Send button */}
        <button
          className="p-2 focus:outline-none"
          disabled={!canReply}
          onClick={sendMessage}
          type="button"
        >
          <RiSendPlaneFill className="hover:text-qimbColor-500 transition-colors dark:text-qimbColor-500" />
        </button>

        {/* Snippets dropdown */}
        {showSnippets && filteredSnippets.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
            {filteredSnippets.map((snippet) => (
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                key={snippet._id}
                onClick={() => handleSnippetSelect(snippet)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {snippet.name}
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {snippet.message_type}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {snippet.message_type === 'text' &&
                    snippet.content?.text &&
                    snippet.content.text}
                  {snippet.message_type !== 'text' &&
                    snippet.content?.caption &&
                    snippet.content.caption}
                  {!snippet.content?.text &&
                    !snippet.content?.caption &&
                    snippet.name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
