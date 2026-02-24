import { useGetInboxQuery } from '@/routes/chat/store'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { useMutation } from '@tanstack/react-query'

export const AssignUser = ({ id }) => {
  const commentMutation = useMutation({
    mutationFn: async (payload: { code: string; userId: string }) =>
      Client.PATCH('/api/backend/v1/api/customers/{customer_id}/lifecycle', {
        body: {
          lifecycle_code: payload?.code,
        },
        params: {
          path: { customer_id: payload.userId },
        },
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeyEnum.GET_INBOX_MAIN],
      })
    },
  })
  const { data } = useGetInboxQuery()
  const lifecycles = data?.lifecycles ?? []
  const [lifeCycle, setLifeCycle] = useState('')

  const handelSelect = (event) => {
    const selectedItem = event.target.value
    setLifeCycle(selectedItem)
    commentMutation.mutate({ code: selectedItem, userId: id })
  }

  return (
    <div className="flex items-center space-x-2 mt-3">
      <select
        className="text-sm border cursor-pointer border-gray-300 rounded-lg px-2 py-1 focus:outline-none "
        onChange={handelSelect}
        value={lifeCycle}
      >
        {lifecycles?.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            <div className="flex align-items-center">
              <span className={item.color}>{item.icon}</span>
              <div>{item.name}</div>
            </div>
          </option>
        ))}
      </select>
    </div>
  )
}
