// Карточка объявления в списке (эталон .adrow из S2): фото слева,
// цена/название/подстрока/район·дата, сердце справа. Без фото — заглушка с камерой.
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { fmtT } from '../../lib/format'
import type { MockAd } from '../../mocks/db'
import { Icon } from '../../ui/Icon'
import { Photo } from '../../ui/kit'

export function AdRow({ ad, fav, onFav, stats, meta, chevron, className }: {
  ad: MockAd
  /** сердце закрашено (сохранено) */
  fav?: boolean
  /** тап по сердцу; если не передан — сердце не рисуем */
  onFav?: () => void
  /** замена подстроки: строка статусов для «Моих объявлений» */
  stats?: ReactNode
  /** замена нижней строки «район · дата» */
  meta?: ReactNode
  /** шеврон справа вместо сердца (карточки «Моих») */
  chevron?: boolean
  className?: string
}) {
  return (
    <Link
      to={`/ad/${ad.id}`}
      className={
        'mx-4 mb-2 flex gap-[11px] rounded-2xl bg-card p-2.5 shadow-[0_1px_3px_rgba(20,20,25,.06)] ' +
        (className ?? '')
      }
    >
      {ad.imageIds.length > 0 ? (
        <Photo id={ad.imageIds[0]} className="h-[86px] w-[104px] flex-none rounded-[11px]" />
      ) : (
        <span className="flex h-[86px] w-[104px] flex-none items-center justify-center rounded-[11px] bg-[linear-gradient(140deg,#EFEAE2,#DFD5C4)] text-[#BDB6A8]">
          <Icon id="camera" className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="num block text-[15.5px] font-extrabold tracking-[-0.02em]">{fmtT(ad.price)}</span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-[1.3] font-semibold text-[#3A3833]">{ad.title}</span>
        {stats ?? (
          <span className="num mt-[3px] block truncate text-[11.5px] font-semibold text-mut">{ad.subtitle}</span>
        )}
        <span className="num mt-[5px] block text-[10.5px] font-semibold text-faint">
          {meta ?? <>{ad.district} · {ad.createdAt}</>}
        </span>
      </span>
      {chevron && (
        <Icon id="chevron-right" className="size-[15px] self-center text-[#C5C1B7]" />
      )}
      {onFav && (
        <button
          type="button"
          aria-label={fav ? 'Убрать из сохранённых' : 'Сохранить'}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav() }}
          className={'self-start p-0.5 ' + (fav ? 'text-[#E23D28]' : 'text-[#C5C1B7]')}
        >
          <Icon id={fav ? 'heart-filled' : 'heart'} className="size-[18px]" />
        </button>
      )}
    </Link>
  )
}
