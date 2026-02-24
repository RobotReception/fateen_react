import { routesPathEnum } from '@/utils/constants/routesPathEnum'
import { t } from '@lingui/macro'
import Document from '~icons/fatin/document'
import Home from '~icons/fatin/home'
import Chat from '~icons/fatin/inbox'
import Inbox from '~icons/fatin/inbox-filled'
import Opration from '~icons/fatin/opration'
import Train from '~icons/fatin/train'
import Users from '~icons/fatin/users'

export const navOptions = () => {
  return [
    {
      icon: Home,
      isShow: true,
      title: t`الرئيسية`,

      to: '/home',
    },

    {
      children: [
        {
          // isShow: CheckAccessPermission(
          //   permetions.EMPLOY_MANAGMENT,
          //   userPermissons
          // ),
          isShow: true,
          name: t`إدارة البيانات`,
          to: routesPathEnum.DOCUMENTS,
        },
        {
          isShow: true,

          name: t`تحليلات المستخدمين`,
          to: routesPathEnum.USERS_ANALYSIS,
        },
      ],
      icon: Document,
      isShow: true,

      title: t`إدارة الوثائق`,
    },
    {
      icon: Inbox,
      isShow: true,
      title: t`الطلبات`,

      to: routesPathEnum.PENDING_ORDERS,
    },
    {
      icon: Opration,
      isShow: true,
      title: t`العمليات`,

      to: routesPathEnum.OPRATION_HISTORY,
    },
    {
      icon: Train,
      isShow: true,
      title: t`تدريب`,

      to: routesPathEnum.TRAIN_MODEL,
    },
    {
      icon: Users,
      isShow: true,
      title: t`المستخدمين`,

      to: routesPathEnum.USERS,
    },
    {
      icon: Chat,
      isShow: true,
      title: t`الدردشة`,

      to: routesPathEnum.CHAT,
    },
  ]
}
