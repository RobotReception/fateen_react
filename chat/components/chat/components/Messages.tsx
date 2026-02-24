import { type CommentsType } from '../types'
import { CommentsOption } from './CommentsOption'
import RiAccountCircleFill from '~icons/ri/account-circle-fill'
import { Message } from 'primereact/message'
import { memo } from 'react'

export const Messages = memo(({ data }: { data: CommentsType[] }) => {
  const re = [...data].reverse()

  return re?.map((item) => (
    <div
      className="flex-1 p-3 overflow-y-auto flex flex-col space-y-2"
      key={item?.ticketCommentId}
    >
      <Message
        content={
          <div className="flex flex-col  items-start">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <RiAccountCircleFill />
                <span className="font-bold text-900">{item.createdBy}</span>
                <span>{item.createdAt}</span>
              </div>
              {item.canEdit || item.hasAttachment ? (
                <CommentsOption
                  canEdit={item.canEdit}
                  hasAttachment={item.hasAttachment}
                  ticketCommentId={item.ticketCommentId}
                />
              ) : (
                ''
              )}
            </div>
            <div className="font-medium text-lg my-3 text-900">
              {item.comment}
            </div>
          </div>
        }
        pt={{
          root: {
            className: `w-fit  ${item.userType === 1 ? 'self-start' : 'self-end'} `,
          },
        }}
        severity={item.userType === 1 ? 'info' : 'success'}
      />
    </div>
  ))
})
