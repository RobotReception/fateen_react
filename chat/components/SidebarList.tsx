import { LifecycleList } from './LifecycleList'
import { MainFilterList } from './MainFilterList'
import { TeamInboxList } from './TeamInboxList'

export function SidebarList() {
  return (
    <div className="flex-1 overflow-y-auto">
      <MainFilterList />
      <LifecycleList />
      <TeamInboxList />
    </div>
  )
}
