// File: useMessageSender.ts
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { bodySerializer } from '@/utils/functions/BodySerialzer'
import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'

export const useMessageSender = ({
  customerInfo,
  userInfo,
  replyTarget,
  onMessageSent,
  onCancelReply,
  scrollToBottom,
}: {
  customerInfo: any
  onCancelReply?: () => void
  onMessageSent?: () => void
  replyTarget?: any
  scrollToBottom: () => void
  userInfo: any
}) => {
  const [message, setMessage] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [selectedSnippet, setSelectedSnippet] = useState<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [showSnippets, setShowSnippets] = useState(false)
  const [filteredSnippets, setFilteredSnippets] = useState<any[]>([])

  const buildMessageBody = (message_type: string, content: any) => ({
    content,
    message_type,
    original_msg_id: '',
    platform: customerInfo?.platform,
    recipient_id: customerInfo?.customer_id,
    responder: 'user',
    response_to: replyTarget?.messageId || '',
    sender_id: userInfo?.user_id,
    sender_info: {
      name: userInfo?.name,
      profile_picture: userInfo?.profile_picture,
    },
    session_id: customerInfo?.session_id,
  })

  const sendTextMutation = useMutation({
    mutationFn: async (text: string) => {
      return await Client.POST('/api/backend/v1/messages/outcoming', {
        body: buildMessageBody('text', { text }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES],
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    }
  }

  const sendMessageWithFile = async () => {
    if (!attachment) return
    const media_type = attachment.type.startsWith('image/')
      ? 'image'
      : 'document'

    const uploadRes = await Client.POST('/api/backend/v1/upload_media', {
      body: {
        customer_id: customerInfo?.customer_id,
        file_data: attachment,
        media_type,
        platform: customerInfo?.platform,
      },
      bodySerializer,
    })

    const url = uploadRes.data?.data
    const content =
      media_type === 'image'
        ? { caption: message, image_url: url }
        : { caption: message, document_url: url, filename: attachment.name }

    await Client.POST('/api/backend/v1/messages/outcoming', {
      body: buildMessageBody(
        media_type === 'image' ? 'image' : 'file',
        content
      ),
    })

    queryClient.invalidateQueries({ queryKey: [queryKeyEnum.GET_ALL_MESSAGES] })
  }

  const sendMessageWithAudio = async () => {
    if (!audioBlob) return
    const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
      type: 'audio/webm',
    })

    const uploadRes = await Client.POST('/api/backend/v1/upload_media', {
      body: {
        customer_id: customerInfo?.customer_id,
        file_data: audioFile,
        media_type: 'audio',
        platform: customerInfo?.platform,
      },
      bodySerializer,
    })

    const url = uploadRes.data?.data
    await Client.POST('/api/backend/v1/messages/outcoming', {
      body: buildMessageBody('audio', {
        audio_url: url,
        transcript: message,
      }),
    })

    queryClient.invalidateQueries({ queryKey: [queryKeyEnum.GET_ALL_MESSAGES] })
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)
    if (value.includes('/')) {
      setShowSnippets(true)
      const searchTerm = value.split('/').pop()?.toLowerCase() || ''
      const filtered = (filteredSnippets || []).filter(
        (snippet) =>
          snippet.name.toLowerCase().includes(searchTerm) ||
          snippet.content?.text?.toLowerCase().includes(searchTerm) ||
          snippet.content?.caption?.toLowerCase().includes(searchTerm)
      )
      setFilteredSnippets(filtered)
    } else {
      setShowSnippets(false)
    }
  }

  const handleSnippetSelect = (snippet: any) => {
    setSelectedSnippet(snippet)
    setShowSnippets(false)
    if (snippet.message_type === 'text') {
      const beforeSlash = message.split('/')[0]
      setMessage(beforeSlash + (snippet.content?.text || snippet.name))
    }
  }

  const sendMessage = async () => {
    if (!message && !attachment && !audioBlob && !selectedSnippet) return

    if (selectedSnippet) {
      const content = selectedSnippet.content || {}
      const type = selectedSnippet.message_type
      await Client.POST('/api/backend/v1/messages/outcoming', {
        body: buildMessageBody(type, content),
      })
    } else if (attachment) {
      await sendMessageWithFile()
    } else if (audioBlob) {
      await sendMessageWithAudio()
    } else {
      sendTextMutation.mutate(message)
    }

    clearPreviews()
    if (onMessageSent) onMessageSent()
    if (onCancelReply) onCancelReply()
    scrollToBottom()
  }

  const clearPreviews = () => {
    setMessage('')
    setAttachment(null)
    setAudioBlob(null)
    setRecordingUrl(null)
    setSelectedSnippet(null)
  }

  const startRecording = async () => {
    setIsRecording(true)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    const chunks: BlobPart[] = []

    mediaRecorder.ondataavailable = (e) =>
      e.data.size > 0 && chunks.push(e.data)
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

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') sendMessage()
  }

  return {
    attachment,
    audioBlob,
    filteredSnippets,
    handleFileChange,
    handleMessageChange,
    isRecording,
    handleKeyPress,
    message,
    clearPreviews,
    recordingUrl,
    handleSnippetSelect,
    setMessage,
    selectedSnippet,
    setAttachment,
    sendMessage,
    showSnippets,
    startRecording,
    stopRecording,
  }
}
