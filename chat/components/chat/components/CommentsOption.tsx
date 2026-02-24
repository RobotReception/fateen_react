import { useDownload } from '../utils/hooks/useDownload'
import { t } from '@lingui/macro'
import RiMore2Fill from '~icons/ri/more-2-fill'
import { Menu } from 'primereact/menu'

type CommentsOptionType = {
  readonly canEdit: boolean
  readonly hasAttachment: boolean
  readonly ticketCommentId: string
}

export const CommentsOption = ({
  canEdit,
  hasAttachment,
  ticketCommentId,
}: CommentsOptionType) => {
  const menuRef = useRef<Menu>(null)

  const { downloadFile } = useDownload()

  const items = []

  if (hasAttachment) {
    items.push({
      command: () => {
        downloadFile(ticketCommentId)
      },
      label: t`عرض الملف`,
    })
  }

  if (canEdit) {
    items.push({
      command: () =>
        router.navigate('edit', { state: { id: ticketCommentId } }),
      label: t`تعديل`,
    })
  }

  return (
    <>
      <Menu
        id="popup_menu_left"
        model={items}
        popup
        ref={menuRef}
      />

      <button
        aria-controls="popup_menu_left"
        onClick={(event) => menuRef?.current?.toggle(event)}
        type="button"
      >
        <RiMore2Fill />
      </button>
    </>
  )
}
