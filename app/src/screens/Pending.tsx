// Временный маркер этапа порта: экран уже описан в дизайн-эталоне,
// но ещё не перенесён. В готовой сборке таких экранов быть не должно.
import { Link, useLocation } from 'react-router'

export default function Pending({ title }: { title: string }) {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-8 text-center">
      <div className="text-[17px] font-extrabold">{title}</div>
      <p className="text-[13px] font-medium text-mut">
        Экран переносится из дизайн-эталона (design/flow.html, путь {pathname}).
      </p>
      <Link to="/" className="mt-2 rounded-full bg-acc-bg px-5 py-2.5 text-[13px] font-bold text-acc-d">
        На главную
      </Link>
    </div>
  )
}
