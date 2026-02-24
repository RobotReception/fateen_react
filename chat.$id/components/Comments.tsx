// src/chat/components/Comments.tsx

import { ChatStore } from '@/routes/chat/store2'
import { useGetCommentsQuery } from '../store'
import { CommentInput } from './CommentInput'
import { Messages } from './Messages'
import { ReplayComment } from './ReplayComment'
import { t, Trans } from '@lingui/macro'
import { useIntersectionObserver } from 'primereact/hooks'
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { Message } from 'primereact/message'

export const Comments = () => {
  const { id } = useParams()
  const chat = useStore(ChatStore, (state) => state.activeChat)

  const {
    data: response,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
  } = useGetCommentsQuery(id)

  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  // Refs for scroll position management
  const scrollPositionRef = useRef<number>(0)
  const previousHeightRef = useRef<number>(0)

  // Setup intersection observers for both directions
  const loadPreviousRef = useRef(null)
  const loadNextRef = useRef(null)

  const isPreviousVisible = useIntersectionObserver(loadPreviousRef)

  const isNextVisible = useIntersectionObserver(loadNextRef)
  // const isNextVisible = useIntersectionObserver( loadNextRef, { threshold: 0.5})

  //   Handle scroll position preservation when loading previous messages
  useEffect(() => {
    if (containerRef.current && !isInitialLoad.current) {
      const newHeight = containerRef.current.scrollHeight
      const heightDiff = newHeight - previousHeightRef.current

      if (heightDiff > 0 && isFetchingPreviousPage) {
        containerRef.current.scrollTop = scrollPositionRef.current + heightDiff
      }

      previousHeightRef.current = newHeight
    }
  }, [response?.pages, isFetchingPreviousPage])

  // Handle infinite scroll for previous messages (up)
  useEffect(() => {
    if (isPreviousVisible && hasPreviousPage && !isFetchingPreviousPage) {
      if (containerRef.current) {
        scrollPositionRef.current = containerRef.current.scrollTop
        previousHeightRef.current = containerRef.current.scrollHeight
      }

      fetchPreviousPage()
    }
  }, [
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    isPreviousVisible,
  ])

  // Handle infinite scroll for next messages (down)
  useEffect(() => {
    if (isNextVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isNextVisible])

  // Set initial scroll position to bottom
  useEffect(() => {
    if (isInitialLoad.current && containerRef.current && response?.pages[0]) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
      isInitialLoad.current = false
      previousHeightRef.current = containerRef.current.scrollHeight
    }
  }, [response])

  const scrollToBottom = () => {
    if (containerRef.current) {
      // eslint-disable-next-line react-compiler/react-compiler
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (!isInitialLoad.current && containerRef.current) {
      scrollToBottom()
    }
  }, [response?.pages])

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden "
        ref={containerRef}
      >
        <div>
          {hasNextPage && <div ref={loadNextRef} />}
          {isFetchingNextPage && (
            <div className="text-center py-2">
              <Trans>جاري تحميل التعليقات السابقة...</Trans>
            </div>
          )}
        </div>

        {/* Messages */}
        {isLoading ? (
          <TemplateLoading />
        ) : (
          <div className="space-y-4">
            {response?.pages.map((page, index) => (
              <Messages
                // @ts-expect-error fix
                data={page?.messages}
                // eslint-disable-next-line react/no-array-index-key
                key={index}
              />
            ))}
          </div>
        )}

        {/* Next messages loader */}

        <div ref={loadPreviousRef}>
          {isFetchingPreviousPage && (
            <div className="text-center py-2">
              <Trans> جاري تحميل المزيد من التعليقات...</Trans>
            </div>
          )}
        </div>
      </div>

      {/* Reply Section */}
      {chat?.session_status === 'closed' ? (
        <Message
          severity="error"
          text={t`لا تستطيع إرسال رسالة لهذا المستخدم لأن الجلسة غير نشطة منذ أكثر من 24 ساعة.`}
        />
      ) : (
        <div className="px-3 py-2 border-t ">
          <CommentInput />

          <ReplayComment
            canReply
            scrollToBottom={scrollToBottom}
          />
        </div>
      )}
    </>
  )
}

// last Code

// src/features/chat/components/Comments.tsx

// import { useChatComposer } from '../chatComposer.store'
// import { useGetCommentsQuery } from '../useMessages'
// import { Messages } from './Messages'
// import { ReplayComment } from './ReplayComment'
// import { Trans } from '@lingui/macro'
// import { useIntersectionObserver } from 'primereact/hooks'
// import { useEffect,useRef } from 'react'
// import { useParams } from 'react-router-dom'
// // import TemplateLoading from './TemplateLoading' // تأكد من موجود

// export const Comments = () => {
//   const { id } = useParams()
//   const { data, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage, isLoading } =
//     useGetCommentsQuery(id)

//   const containerRef = useRef<HTMLDivElement>(null)
//   const loadPreviousRef = useRef(null)
//   const loadNextRef = useRef(null)
//   const isPrevVisible = useIntersectionObserver(loadPreviousRef)
//   const isNextVisible = useIntersectionObserver(loadNextRef)

//   const setReplyTarget = useChatComposer((s) => s.setReplyTarget)
//   useEffect(() => { setReplyTarget(null) }, [id, setReplyTarget])

//   // auto fetch prev
//   useEffect(() => {
//     if (isPrevVisible && hasPreviousPage && !isFetchingPreviousPage) {
//       fetchPreviousPage()
//     }
//   }, [fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage, isPrevVisible])

//   // auto fetch next
//   useEffect(() => {
//     if (isNextVisible && hasNextPage && !isFetchingNextPage) {
//       fetchNextPage()
//     }
//   }, [fetchNextPage, hasNextPage, isFetchingNextPage, isNextVisible])

//   // scroll to bottom on first load
//   useEffect(() => {
//     if (containerRef.current && data?.pages?.[0]) {
//       containerRef.current.scrollTop = containerRef.current.scrollHeight
//     }
//   }, [data])

//   return (
//     <>
//       <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={containerRef}>
//         <div>{hasNextPage && <div ref={loadNextRef} />}</div>
//         {isLoading ? (
//           <div className="p-4 text-center">Loading...</div>
//           // <TemplateLoading />
//         ) : (
//           <div className="space-y-4">
//             {data?.pages.map((page, idx) => (
//               <Messages data={page?.messages ?? []} key={idx} />
//             ))}
//           </div>
//         )}

//         <div ref={loadPreviousRef}>
//           {(isFetchingPreviousPage || isFetchingNextPage) && (
//             <div className="text-center py-2">
//               <Trans>جاري التحميل...</Trans>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="px-3 py-2 border-t dark:border-zinc-700">
//         <ReplayComment />
//       </div>
//     </>
//   )
// }
