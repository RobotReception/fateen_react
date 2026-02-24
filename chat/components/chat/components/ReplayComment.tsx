import { getTicktId } from '../utils/functions/getTicktId'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { bodySerializer } from '@/utils/functions/BodySerialzer'
import { handleResponse } from '@/utils/functions/handleResponse'
import { t } from '@lingui/macro'
import RiAttachment2 from '~icons/ri/attachment-2'
import RiSendPlaneFill from '~icons/ri/send-plane-fill'
import { InputText } from 'primereact/inputtext'

export const ReplayComment = ({
  canReply,
  scrollToBottom,
}: {
  readonly canReply: boolean | undefined
  readonly scrollToBottom: () => void
}) => {
  const ticktId = 11
  const [message, setMessage] = useState<string>('')

  const sendComment = async (text: string) => {
    const { data, error } = await Client.POST(
      '/api/Ticket/CreateTicketComment',
      {
        body: {
          Attachment: undefined,
          Comment: text,
          TicketId: ticktId,
        },
        bodySerializer: (body) => bodySerializer(body),
      }
    )
    setMessage('')
    // handleResponse(
    //   data,
    //   error,

    //   queryKeyEnum.COMMENTS_GET_ALL
    // )

    scrollToBottom()
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendComment(message)
    }
  }

  return (
    <div
      className="flex items-center border border-gray-300   rounded-md"
      id="repla"
    >
      <Link
        className="p-2  focus:outline-none"
        state={{ ticketId: ticktId }}
        to="upload"
      >
        <RiAttachment2 className="hover:text-qimbColor-500 transition-colors  " />
      </Link>

      <InputText
        className="flex-grow p-3 border-none focus:ring-0 focus:outline-none"
        disabled={!canReply}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setMessage(event.target.value)
        }
        onKeyDown={handleKeyPress}
        placeholder={t`اكتب رسالتك هنا...`}
        type="text"
        value={message}
      />

      <button
        className="p-2 focus:outline-none"
        disabled={!canReply}
        onClick={() => sendComment(message)}
        type="button"
      >
        <RiSendPlaneFill className="hover:text-qimbColor-500 transition-colors  " />
      </button>
    </div>
  )
}
