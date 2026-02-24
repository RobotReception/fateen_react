import { Comments } from './components/Comments'
import { Header } from './components/Header'

export default function Page() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] overflow-auto w-full  gap-5 rounded-md bg-white   px-4 py-6 drop-shadow-sm">
      <Header />
      <Comments />
    </div>
  )
}
