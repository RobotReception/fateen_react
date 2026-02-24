import { ChatStore } from '../store2'
import { SidebarList } from './SidebarList'
import { SidebarNavbar } from './SidebarNavbar'
import { useStore } from 'zustand'

export default function InboxSidebar() {
  const sidebarCollapsed = useStore(
    ChatStore,
    (state) => state.sidebarCollapsed
  )
  // if (sidebarCollapsed) {
  //   return (
  //     <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
  //       <SidebarNavbar collapsedOnly />
  //     </div>
  //   )
  // }

  return (
    <div className="w-64 bg-white border-r border-gray-200 grid grid-rows-[auto_1fr] ">
      <SidebarNavbar />
      <SidebarList />
    </div>
  )
}
