import { useGetCommentsQuery } from '../store'
import { setTicktIdToSession } from '../utils/functions/setTicktIdToSession'
import { Messages } from './Messages'
import { ReplayComment } from './ReplayComment'
import { Trans } from '@lingui/macro'
import { useIntersectionObserver } from 'primereact/hooks'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export const Comments = () => {
  const { state } = useLocation()

  const ticketId = 11
  const {
    data: response,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
  } = useGetCommentsQuery(ticketId)

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

  return (
    <div className="flex flex-col h-[70vh]">
      <div className="px-4 py-3 border-b ">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 ">المحادثة</h2>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
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
                data={page?.data}
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
      <div className="px-3 py-2 border-t ">
        <ReplayComment
          canReply
          scrollToBottom={scrollToBottom}
        />
      </div>
    </div>
  )
}
