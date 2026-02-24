import { ChatStore } from "@/routes/chat/store2";
import { queryKeyEnum } from "@/utils/constants/queryKeyEnum";
import { useMutation } from "@tanstack/react-query";
import { InputSwitch } from "primereact/inputswitch";
import { useStore } from "zustand";

export const EnableAI = () => {
        const [checked, setChecked] = useState(true);
          const enable_ai = useStore(ChatStore, (state) => state.activeChat?.enable_ai)
          const customerId = useStore(ChatStore, (state) => state.activeChat?.customer_id)
        
          useEffect(()=>{
            setChecked(enable_ai)
          },[enable_ai])
  const enableAiMutation = useMutation({
    mutationFn: async (payload: { checkStatus: boolean; userId: string }) =>
      Client.PATCH('/api/backend/v1/customers/{customer_id}/enable-ai', {
     
        params: {
            path: { customer_id: payload.userId },
          query:{
                enable_ai:payload.checkStatus,
            },
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

    const handelSelect = (event) => {
    const value = event.value
    enableAiMutation.mutate({ checkStatus: value, userId: customerId })
    setChecked(value)
  }

  return (
   <div className=" flex items-center gap-2 ">
            <InputSwitch checked={checked} onChange={ handelSelect} />
            <p>وضع الذكاء الاصطناعي</p>
        </div>  )
}
