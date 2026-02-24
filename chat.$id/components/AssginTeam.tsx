import {
  changePagination,
  CommentsStore,
  useGetTeamQuery,
} from '../store'
import { PaginatedDropdown } from '@/components/PaginatedDropdown'
import { ChatStore } from '@/routes/chat/store2'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { Trans } from '@lingui/macro'
import { useMutation } from '@tanstack/react-query'
import { Avatar } from 'primereact/avatar'
import { useDebounce } from 'primereact/hooks'
import { useStore } from 'zustand'

type UsersBriefItemType = {
  name: string
  profile_picture: string
  team_id: string
}

const selectedUserTemplate = (option: UsersBriefItemType) => {
  if (option) {
    return (
      <span className="inline-flex items-center gap-2">
        <Avatar
          image={option.profile_picture}
          label={option.name.charAt(0)}
          shape="circle"
        />

        <span>{option.name}</span>
      </span>
    )
  }

  return (
    <span className="text-gray-500 ">
      <Trans>غير معين</Trans>{' '}
    </span>
  )
}

const UserOptionTemplate = (option: UsersBriefItemType) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar
        image={option.profile_picture}
        label={option.name.charAt(0)}
        shape="circle"
      />
      <div className="flex flex-col">
        <span className="font-medium">{option.name}</span>
      </div>
    </div>
  )
}

export const AssginTeam = () => {
   const [selectedOption, setSelectedOption] =
    useState<UsersBriefItemType | null>(null)

  const activeChat = useStore(ChatStore, (state) => state.activeChat)

  const AssignMutation = useMutation({
    mutationFn: async (payload: {
      customerId: string
      isAssgin: boolean
      userId: string
    }) =>
      Client.PATCH('/api/backend/v1/customers/{customer_id}/assign-teams', {
        params: {
          path: { customer_id: payload.customerId },
        
        },
        body:{
            //    assigned_to: payload.userId,
            // is_assigned: payload.isAssgin,
            teams:[ payload.userId]
        }
      }),

    onSuccess: (data) => {
      refs.toast({
        detail: data.data?.message,
        life: 3_000,
        severity: 'success',
        summary: data.data?.status,
      })
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_INBOX_MAIN],
      })
    },
  })
  const [searchValue, debouncedValue, setSearchValue] = useDebounce('', 400)

  const options = useStore(CommentsStore, (selector) => selector.options)

  const { data, isLoading } = useGetTeamQuery(options, debouncedValue)

  const items = data?.data ?? []
  const totalItems = data?.pagination?.totalCount ?? 0

  // مِلفّع بسيط يوحّد حدث البيجنيتر مع شكل الداتا عندك
  const handlePageChange = (event: {
    first?: number
    page?: number
    rows?: number
  }) => {
    // لو changePagination عندك يتوقع OptionsTable بنفس الحقول، مرّرها له
    // هنا افترضنا أنه يقبل first/rows/page
    changePagination({
      ...options,
      first: event.first ?? options?.first ?? 0,
      page:
        event.page ??
        Math.floor((event.first ?? 0) / (event.rows ?? options?.rows ?? 10)),
      rows: event.rows ?? options?.rows ?? 10,
    })
  }

  const handelChange = (value: UsersBriefItemType) => {
    setSelectedOption(value)
    if (value === null)
      AssignMutation.mutate({
        customerId: activeChat?.customer_id,
        isAssgin: false,
        userId: '',
      })
    else
      AssignMutation.mutate({
        customerId: activeChat?.customer_id,
        isAssgin: true,
        userId: value.team_id,
      })
  }

  useEffect(() => {
    if (activeChat?.team_id.length > 0) {
      setSelectedOption({
        name: activeChat?.assigned.assigned_to_username,
        team_id: activeChat?.team_id[0],
      })
    }
  }, [activeChat])
  return (
    <PaginatedDropdown<UsersBriefItemType>
      InputClassName="py-1  px-2"
      className="w-52 "
      getKey={(x) => x.team_id}
      getLabel={(x) => x.name}
      isLoading={isLoading}
      itemTemplate={UserOptionTemplate}
      items={items}
      searchTerm={searchValue}
      texts={{
        noData: 'لا توجد بيانات',
        searchPlaceholder: 'بحث',
        clearAriaLabel: 'مسح الاختيار',
      }}
      // تحديد الهوية والعرض (بدل ربط النوع داخل الكمبوننت)
      totalRecords={totalItems}
      value={selectedOption}
      setSearchTerm={setSearchValue}
      // التجميعة المطلوبة للترقيم
      paginator={{
        first: options?.first ?? 0,
        rows: options?.rows ?? 2,
        onPageChange: handlePageChange,
        // template اختياري؛ الافتراضي "PrevPageLink PageLinks NextPageLink"
      }}
      valueTemplate={selectedUserTemplate}
      // البحث المتحكَّم فيه
      onChange={handelChange}
    />
  )
}
