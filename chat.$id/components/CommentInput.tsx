// this is code Worl
import { useGetUsersMentionQuery } from '../store'
import { useSendMessage } from '../useSendMessage'
import { Trans } from '@lingui/macro'
import Chat from '~icons/fatin/inbox'
import { Avatar } from 'primereact/avatar'
import {
  Mention,
  type MentionSearchEvent,
  type MentionSelectEvent,
} from 'primereact/mention'
import { ProgressSpinner } from 'primereact/progressspinner'
import React, { useState } from 'react'

// هوك جلب البيانات (RTK Query مثلاً):

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%25" height="100%25" fill="%23EFEFEF"/><text x="50%25" y="52%25" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%23999">User</text></svg>'

// export  function CommentInput() {
//   const { data, isLoading, isError, isFetching, refetch } = useGetUsersMentionQuery();
//   const [value, setValue] = useState('');
//   const [suggestions, setSuggestions] = useState([]);

//   // تجهيز البيانات بأمان — نتوقع data.users تكون Array of objects بالشكل:
//   // { name: "Mohammed ", profile_picture: "https://...", user_id: "admin:dw" }
//   const users = useMemo(() => {
//     const list = data?.users ?? [];
//     if (!Array.isArray(list)) return [];
//     return list
//       .filter(u => u && u.name && u.user_id)
//       .map(u => ({
//         name: String(u.name).trim(),
//         user_id: String(u.user_id),
//         profile_picture: u.profile_picture || null
//       }));
//   }, [data]);

//   // بحث محلي سريع داخل الأسماء بعد كتابة @
//   const onSearch = useCallback((e) => {
//     const q = (e.query || '').toLowerCase().trim();
//     const filtered =
//       q.length === 0
//         ? users.slice(0, 10)
//         : users.filter(u => u.name.toLowerCase().includes(q)).slice(0, 15);
//     setSuggestions(filtered);
//   }, [users]);

//   // عنصر القائمة: صورة + اسم + ID صغير
//   const itemTemplate = useCallback((item) => {
//     const src = item.profile_picture || DEFAULT_AVATAR;
//     return (
//       <div className="flex align-items-center gap-2 p-2 w-full">
//         <Avatar image={src} size="large" shape="circle"
//                 onImageError={(e) => { e.target.src = DEFAULT_AVATAR; }} />
//         <div className="flex flex-column">
//           <span className="font-medium">{item.name}</span>
//         </div>
//       </div>
//     );
//   }, []);

//   // حالات التحميل/الخطأ
//   if (isLoading) {
//     return (
//       <div className="flex align-items-center gap-3">
//         <ProgressSpinner style={{ width: 24, height: 24 }} strokeWidth="6" />
//         <Skeleton width="100%" height="2.6rem" />
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="p-3 border-1 border-round surface-border surface-card">
//         <div className="flex align-items-center justify-content-between">
//           <span className="text-red-500 font-medium">تعذّر جلب المستخدمين.</span>
//           <button className="p-button p-button-text" onClick={() => refetch()}>
//             إعادة المحاولة
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const hasUsers = users.length > 0;

//   return (
//     <Mention
//           value={value}
//           onChange={(e) => setValue(e.target.value)}
//           onSearch={onSearch}
//           suggestions={suggestions}
//           field="name"                // الحقل المعروض في القائمة
//           itemTemplate={itemTemplate} // صورة + اسم
//           trigger="@"
//           placeholder={isFetching ? 'يتم تحديث القائمة…' : 'اكتب @ لذكر مستخدم…'}
//           className="w-full"
//           inputClassName="w-full"
//         />
//   );
// }

type SuggestionItemType = {
  name: string
  profile_picture: string
  user_id: string
}

export function CommentInput() {
  const { data, isError, isLoading, refetch } = useGetUsersMentionQuery()
  const [show, setShow] = useState(true)
  const [value, setValue] = useState<string>('')
  const [suggestions, setSuggestions] = useState<SuggestionItemType[]>([])
  const [mentionIds, setMentionIds] = useState<string[]>([]) // <-- نخزّن user_id فقط
  const { id } = useParams()
  const { sendComment } = useSendMessage(id)
  // حضّر قائمة المستخدمين
  const users = (Array.isArray(data?.users) ? data.users : []).map((u) => ({
    name: String(u.name).trim(),
    profile_picture: u.profile_picture || null,
    user_id: String(u.user_id),
  }))
  const onSelect = (event: MentionSelectEvent) => {
    const userid = event.suggestion.user_id
    setMentionIds((prev) => (prev.includes(userid) ? prev : [...prev, userid]))
  }

  // فلترة مباشرة عند البحث
  const onSearch = (event: MentionSearchEvent) => {
    const query = event.query.toLowerCase().trim()
    if (!query) {
      setSuggestions(users.slice(0, 10)) // أول 10 لو الاستعلام فاضي
    } else {
      setSuggestions(
        users.filter((u) => u.name.toLowerCase().includes(query)).slice(0, 15)
      )
    }
  }

  // شكل العنصر في القائمة
  const itemTemplate = (item: SuggestionItemType) => {
    const src = item.profile_picture || DEFAULT_AVATAR
    return (
      <div className="flex align-items-center gap-2 p-2 w-full">
        <Avatar
          image={src}
          shape="circle"
          size="large"
        />
        <div className="flex flex-column">
          <span className="font-medium">{item.name}</span>
        </div>
      </div>
    )
  }

  // إرسال عند Enter
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      const payload = {
        mentions: mentionIds,
        text: value.trim(),
      }

      sendComment(payload)

      setValue('')
      setMentionIds([])
      setSuggestions([])
      setShow(true)
    }
  }

  if (isLoading)
    return (
      <ProgressSpinner
        strokeWidth="6"
        style={{ height: 20, width: 20 }}
      />
    )
  if (isError)
    return (
      <button
        onClick={() => refetch()}
        type="button"
      >
        إعادة المحاولة
      </button>
    )
  if (users.length === 0) return <div>لا توجد بيانات مستخدمين.</div>

  return (
    <>
      <Mention
        autoResize
        className="w-full"
        field="name"
        hidden={show}
        inputClassName="w-full"
        inputStyle={{ width: '50%' }}
        itemTemplate={itemTemplate}
        minLength={0} // يفتح القائمة مباشرة عند كتابة @
        onChange={(event) => setValue((event.target as HTMLInputElement).value)}
        onKeyDown={onKeyDown}
        onSearch={onSearch}
        onSelect={onSelect}
        placeholder="اكتب @ لاختيار مستخدم، ثم Enter للإرسال"
        suggestions={suggestions}
        trigger="@"
        value={value}
      />
      <button
        className="flex my-2 cursor-pointer items-center gap-1"
        onClick={() => setShow((prev) => !prev)}
        type="button"
      >
        <Chat className="stroke-secondary-900 w-4 h-4" />
        <span className="text-sm ">
          <Trans>إضافة تعليق</Trans>
        </span>
      </button>
    </>
  )
}
