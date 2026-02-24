import React, { useEffect } from 'react'
import useChat from '../../store'
import ChatList from '../inbox/ChatList'
import ChatWindow from '../chat/ChatWindow'
import InboxSidebar from '../InboxSidebar'

const MainLayout: React.FC = () => {
  const { initializeData, sidebarCollapsed } = useChat()

  // useEffect(() => {
  //   initializeData()
  // }, [initializeData])

  return (
    <div className="h-dvh grid grid-cols-[minmax(auto,_0.0fr)_minmax(auto,_0.0fr)_auto] overflow-hidden bg-gray-100 ">
      <InboxSidebar />
      <ChatList />
      <Outlet />
    </div>
  )
}

export default MainLayout
