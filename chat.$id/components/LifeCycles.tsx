import { useGetInboxQuery } from '@/routes/chat/store'
import { ChatStore } from '@/routes/chat/store2'
import { queryKeyEnum } from '@/utils/constants/queryKeyEnum'
import { useMutation } from '@tanstack/react-query'
import { useStore } from 'zustand'

export const LifeCycles = () => {
   
    const defultValue = useStore(ChatStore, (state) => state.activeChat?.lifecycle)
    const customerId = useStore(ChatStore, (state) => state.activeChat?.customer_id)
  
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
  const { data } = useGetInboxQuery()
  const lifecycles = data?.lifecycles ?? []
  const [lifeCycle, setLifeCycle] = useState('')

  useEffect(() => {
    if (defultValue && lifecycles.length) {
      // defultValue نص يساوي name لأحد العناصر
      const exist = lifecycles.find((item) => item?.code === defultValue)
      setLifeCycle(exist.code)
    }
  }, [defultValue, lifecycles])

  const handelSelect = (event) => {
    const selectedItem = event.target.value
    commentMutation.mutate({ code: selectedItem, userId: customerId })
    setLifeCycle(selectedItem)
  }

  return (
    <div className="flex items-center space-x-2 ">
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
