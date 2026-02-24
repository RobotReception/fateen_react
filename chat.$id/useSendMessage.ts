// src/features/chat/useSendMessage.ts
import { ChatStore } from '../chat/store2'
import { ChatComposer, type Snippet } from './chatComposer.store'
import { Client } from '@/globals/Client'
import { getUserInfo } from '@/stores/useAuthStore'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { bodySerializer } from '@/utils/functions/BodySerialzer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from 'zustand'

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'interactive'
  | 'document'
  | 'video'
type OutgoingKind = 'text' | 'image' | 'audio' | 'document' | 'video'

type PayloadCommet = {
  mentions: string[]
  text: string
}
const makeOptimistic = (
  kind: OutgoingKind,
  args: {
    caption?: string
    customerId?: string
    filename?: string
    platform?: string
    response_to?: string
    sessionId?: string
    text?: string
    transcript?: string
    url?: string
    userAvatar?: string
    userId?: string
    userName?: string
  }
) => {
  const now = new Date()
  const optimisticId = `optimistic-${now.getTime()}-${Math.random().toString(16).slice(2)}`
  return {
    _id: optimisticId,
    content:
      kind === 'text'
        ? { text: args.text ?? '' }
        : kind === 'image'
          ? { caption: args.caption, url: args.url }
          : kind === 'audio'
            ? { transcript: args.transcript, url: args.url }
            : kind === 'document'
              ? {
                  caption: args.caption,
                  filename: args.filename,
                  url: args.url,
                }
              : { caption: args.caption, url: args.url },
    customer_id: args.customerId || '',
    direction: 'outbound',
    is_internal: false,
    isOptimistic: true,
    isRead: 'sent',
    message_id: optimisticId,
    message_type: kind as MessageType,
    platform: args.platform || 'whatsapp',
    recipient_id: args.customerId,
    response_to: args.response_to || '',
    sender_id: args.userId,
    sender_info: { name: args.userName, profile_photo: args.userAvatar || '' },
    sender_type: 'user',
    session_id: args.sessionId || '',
    status: 'sent',
    timestamp: now.toISOString(),
  }
}

export const useSendMessage = (convId?: string) => {
  const queryClient = useQueryClient()
  const customerInfo = useStore(ChatStore, (state) => state.activeChat)
  const userInfo = getUserInfo()?.user
  const { replyTarget, clearReplay } = useStore(ChatComposer, (state) => ({
    clearReplay: state.clearReplay,
    replyTarget: state.replyTarget?.messageId,
  }))

  const pushOptimistic = (msg: any) => {
    queryClient.setQueryData(
      [queryKeyEnum.GET_ALL_MESSAGES, convId],
      (old: any) => {
        if (!old?.pages) return old
        const pages = old.pages.map((p: any, i: number) =>
          i === old.pages.length - 1
            ? { ...p, messages: [...(p.messages || []), msg] }
            : p
        )
        return { ...old, pages }
      }
    )
  }

  const stripOptimistics = () => {
    queryClient.setQueryData(
      [queryKeyEnum.GET_ALL_MESSAGES, convId],
      (old: any) => {
        if (!old?.pages) return old
        const pages = old.pages.map((p: any) => ({
          ...p,
          messages: (p.messages || []).filter((m: any) => !m.isOptimistic),
        }))
        return { ...old, pages }
      }
    )
  }

  const uploadMedia = async (
    file: File,
    media_type: 'image' | 'audio' | 'document' | 'video'
  ) => {
    const { data } = await Client.POST('/api/backend/v1/upload_media', {
      body: {
        customer_id: customerInfo?.customer_id,
        file_data: file as any,
        media_type,
        platform: customerInfo?.platform,
      },
      bodySerializer: (b: any) => bodySerializer(b),
    })
    const url = data?.data as string | undefined
    if (!url) throw new Error('Upload failed')
    return url
  }

  // === TEXT ===
  const textMutation = useMutation({
    mutationFn: async (text: string) =>
      Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { text },
          message_type: 'text',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          response_to: replyTarget,
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      const optimistic = makeOptimistic('text', {
        customerId: customerInfo?.customer_id,
        platform: customerInfo?.platform,
        response_to: replyTarget,
        sessionId: customerInfo?.session_id,
        text,
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      clearReplay()

      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  //   // === COMMENT === v2
  const commentMutation = useMutation({
    mutationFn: async (payload: PayloadCommet) =>
      Client.POST('/api/backend/v1/messages/comments', {
        body: {
          content: { mentions: payload.mentions, text: payload.text },
          customer_id: customerInfo?.customer_id,
          direction: 'internal',
          platform: customerInfo?.platform,
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
          // لو باك إندك يحتاج صراحةً النوع:
          // message_type: 'comment',
          // is_internal: true,
        },
      }),

    // لاحظ: هنا "payload" مش "text"
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })

      const now = new Date()
      const optimisticId = `optimistic-cmt-${now.getTime()}-${Math.random().toString(16).slice(2)}`

      // نبني رسالة تفاؤلية تطابق شكل التعليق الداخلي القادم من الـ API
      const optimisticComment: any = {
        _id: optimisticId,
        customer_id: customerInfo?.customer_id ?? '',
        // مهم لتمييزها في الريندر
        content: {
          // سترنق فقط (ماهو كائن)
          mentions: payload.mentions ?? [],
          text: payload.text ?? '', // IDs
        },

        direction: 'internal',

        created_at: now.toISOString(),

        message_id: optimisticId,

        message_type: 'comment',

        platform: customerInfo?.platform ?? 'whatsapp',

        is_internal: true,

        sender_id: userInfo?.user_id,

        isOptimistic: true,
        // غيّرها لـ 'user' لو منطق عرضك يعتمد عليها
        sender_info: {
          name: userInfo?.name,
          profile_picture: userInfo?.profile_picture,
        },
        isRead: 'sent',
        session_id: customerInfo?.session_id ?? '',
        sender_type: 'agent',
        status: 'sent',
        timestamp: now.toISOString(),
        updated_at: now.toISOString(),
      }

      pushOptimistic(optimisticComment)
      return { id: optimisticId }
    },

    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  // v1 const commentMutation = useMutation({
  //   mutationFn: async (payload:PayloadCommet) =>
  //     Client.POST('/api/backend/v1/messages/comments', {
  //       body: {
  //             content:  {mentions:payload.mentions,text:payload.text},

  //         customer_id: customerInfo?.customer_id ,
  //         direction: 'internal',
  //         platform: customerInfo?.platform,

  //         sender_id: userInfo?.user_id,
  //         sender_info: { name: userInfo?.name, profile_picture: userInfo?.profile_picture },
  //         session_id: customerInfo?.session_id,
  //       },
  //     }),
  //   onMutate: async (text) => {
  //     await queryClient.cancelQueries({ queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId] })
  //     const optimistic = makeOptimistic('text', {
  //       customerId: customerInfo?.customer_id,
  //       platform: customerInfo?.platform,
  //       replyTo: replyTarget,
  //       sessionId: customerInfo?.session_id,
  //       text,
  //       userAvatar: userInfo?.profile_picture,
  //       userId: userInfo?.user_id,
  //       userName: userInfo?.name,
  //     })
  //     pushOptimistic(optimistic)
  //     return { id: optimistic._id }
  //   },
  //   onSuccess: () => {
  //     stripOptimistics()
  //     queryClient.invalidateQueries({ queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId] })
  //   },
  // })

  // === IMAGE ===
  const imageMutation = useMutation({
    mutationFn: async ({ file, caption }: { caption?: string; file: File }) => {
      const url = await uploadMedia(file, 'image')
      return Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { caption: caption ?? '', url },
          message_type: 'image',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async ({ file, caption }) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      const localUrl = URL.createObjectURL(file)
      const optimistic = makeOptimistic('image', {
        caption,
        customerId: customerInfo?.customer_id,
        platform: customerInfo?.platform,
        sessionId: customerInfo?.session_id,
        url: localUrl,
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })
  // === Vieod ===
  const videoMutation = useMutation({
    mutationFn: async ({ file, caption }: { caption?: string; file: File }) => {
      const url = await uploadMedia(file, 'video')
      return Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { caption: caption ?? '', url },
          message_type: 'video',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async ({ file, caption }) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      const localUrl = URL.createObjectURL(file)
      const optimistic = makeOptimistic('video', {
        caption,
        customerId: customerInfo?.customer_id,
        platform: customerInfo?.platform,
        sessionId: customerInfo?.session_id,
        url: localUrl,
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  // === FILE (document) ===
  const fileMutation = useMutation({
    mutationFn: async ({ file, caption }: { caption?: string; file: File }) => {
      const url = await uploadMedia(file, 'document')
      return Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { caption: caption ?? '', filename: file.name, url },
          message_type: 'document',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async ({ file, caption }) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      const optimistic = makeOptimistic('document', {
        caption,
        customerId: customerInfo?.customer_id,
        filename: file.name,
        platform: customerInfo?.platform,
        sessionId: customerInfo?.session_id,
        url: URL.createObjectURL(file),
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  // === AUDIO ===
  const audioMutation = useMutation({
    mutationFn: async ({
      blob,
      transcript,
    }: {
      blob: Blob
      transcript?: string
    }) => {
      const audioFile = new File([blob], `audio_${Date.now()}.mp3`, {
        type: 'audio/mp3',
      })
      const url = await uploadMedia(audioFile, 'audio')
      return Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: { transcript: transcript ?? '', url },
          message_type: 'audio',
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async ({ blob, transcript }) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      const optimistic = makeOptimistic('audio', {
        customerId: customerInfo?.customer_id,
        platform: customerInfo?.platform,
        sessionId: customerInfo?.session_id,
        transcript,
        url: URL.createObjectURL(blob),
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  // === SNIPPET ===
  const snippetMutation = useMutation({
    mutationFn: async (snippet: Snippet) => {
      const { message_type, content } = snippet
      if (message_type === 'text') {
        const txt = content?.text || snippet.name
        return textMutation.mutateAsync(txt)
      }

      let typeToSend: MessageType = 'text'
      let payload: any = {}
      if (message_type === 'image') {
        typeToSend = 'image'
        payload = { caption: content?.caption ?? '', url: content?.image_url }
      } else if (message_type === 'audio') {
        typeToSend = 'audio'
        payload = {
          transcript: content?.transcript ?? '',
          url: content?.audio_url,
        }
      } else if (message_type === 'document') {
        typeToSend = 'document'
        payload = {
          caption: content?.caption ?? '',
          filename: content?.filename,
          url: content?.document_url,
        }
      } else if (message_type === 'video') {
        typeToSend = 'video'
        payload = { caption: content?.caption ?? '', url: content?.video_url }
      } else {
        throw new Error('Unsupported snippet type')
      }

      return Client.POST('/api/backend/v1/messages/outcoming', {
        body: {
          content: payload,
          message_type: typeToSend,
          original_msg_id: '',
          platform: customerInfo?.platform,
          recipient_id: customerInfo?.customer_id,
          responder: 'user',
          sender_id: userInfo?.user_id,
          sender_info: {
            name: userInfo?.name,
            profile_picture: userInfo?.profile_picture,
          },
          session_id: customerInfo?.session_id,
        },
      })
    },
    onMutate: async (snippet) => {
      await queryClient.cancelQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
      if (snippet.message_type === 'text') return
      let kind: OutgoingKind = 'text'
      let args: any = {}
      const c = snippet.content || {}
      switch (snippet.message_type) {
        case 'image':
          kind = 'image'
          args = { caption: c.caption, url: c.image_url }
          break
        case 'audio':
          kind = 'audio'
          args = { transcript: c.transcript, url: c.audio_url }
          break
        case 'document':
          kind = 'document'
          args = {
            caption: c.caption,
            filename: c.filename,
            url: c.document_url,
          }
          break
        case 'video':
          kind = 'video'
          args = { caption: c.caption, url: c.video_url }
          break
      }

      const optimistic = makeOptimistic(kind, {
        ...args,
        customerId: customerInfo?.customer_id,
        platform: customerInfo?.platform,
        response_to: replyTarget,
        sessionId: customerInfo?.session_id,
        userAvatar: userInfo?.profile_picture,
        userId: userInfo?.user_id,
        userName: userInfo?.name,
      })
      pushOptimistic(optimistic)
      return { id: optimistic._id }
    },
    onSuccess: () => {
      stripOptimistics()
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_ALL_MESSAGES, convId],
      })
    },
  })

  return {
    sendAudioBlob: (blob: Blob, transcript?: string) =>
      audioMutation.mutate({ blob, transcript }),
    sendComment: (payload: PayloadCommet) => commentMutation.mutate(payload),
    sendImageFile: (file: File, caption?: string) => {
      if (file.type.startsWith('image/'))
        imageMutation.mutate({ caption, file })
      else if (file.type.startsWith('video'))
        videoMutation.mutate({ caption, file })
      else fileMutation.mutate({ caption, file })
    },
    sendSnippet: (snippet: Snippet) => snippetMutation.mutate(snippet),
    sendText: (text: string) => textMutation.mutate(text),
  }
}
