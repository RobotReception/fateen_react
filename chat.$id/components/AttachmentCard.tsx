import { getFileTypeFromUrl } from '../utils/functions/getFileTypeFromUrl'
import { useDownload } from '../utils/hooks/useDownload'
import PdfIcon from '~icons/fatin/pdf'
import TextIcon from '~icons/fatin/text-file'
import WordIcon from '~icons/fatin/word'
import { Button } from 'primereact/button'

const fileTypeIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  doc: WordIcon,
  docx: WordIcon,
  pdf: PdfIcon,
  txt: TextIcon,
}

type AttachmentType = {
  caption: string | null
  file_size: string | null
  height: string | null

  last_retry: string | null
  mime_type: string | null
  original_url: string | null
  retry_count: number | null
  thumbnail_url: string | null
  upload_error: string | null
  upload_status: string | null
  url: string | null
  width: string | null
}
export const AttachmentCard = ({
  attachment,
}: {
  readonly attachment: AttachmentType
}) => {
  const type = getFileTypeFromUrl(attachment.url)
  const Icon = fileTypeIcons[type]
  const sizeInKB = (Number(attachment.file_size) / 1_024).toFixed(1) + ' KB'

  const { isPending: isDownloading, mutate: downloadFile } = useDownload()
  const downloadAttachment = () => {
    downloadFile(attachment.url)
  }

  return (
    <div className="flex items-start bg-gray-50 rounded-xl p-2 my-2 max-w-full">
      <div className="me-2">
        <span className="flex items-center gap-2  max-w-full  text-sm font-medium text-gray-900 pb-1">
          {Icon ? <Icon className="w-5 h-5 text-gray-700" /> : null}
          <span className="break-words text-ellipsis overflow-hidden max-w-48">
            {attachment.caption}
          </span>
        </span>
        <span className="flex text-xs font-normal text-gray-500 gap-2">
          {sizeInKB}
          <span>•</span>
          {type}
        </span>
      </div>
      <Button
        className="ml-auto p-2 group  text-sm font-medium text-gray-900 bg-gray-50 rounded-lg  "
        disabled={isDownloading}
        onClick={() => downloadAttachment()}
        text
      >
        <svg
          aria-hidden="true"
          className="w-4 h-4 text-gray-900 group-hover:text-white "
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
          <path d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
        </svg>
      </Button>
    </div>
  )
}
