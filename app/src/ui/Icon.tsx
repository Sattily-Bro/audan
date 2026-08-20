// Заказной пак иконок (155 SVG, design/src/icons) — спрайт вшивается один раз,
// дальше любой значок доступен как <Icon id="search" />.
import spriteRaw from '../assets/icons-sprite.svg?raw'
import mapDefsRaw from '../assets/map-defs.svg?raw'

let injected = false
export function injectIconSprite(): void {
  if (injected || typeof document === 'undefined') return
  const host = document.createElement('div')
  host.style.display = 'none'
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = spriteRaw + mapDefsRaw
  document.body.prepend(host)
  injected = true
}

export function Icon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className ?? 'size-4'} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  )
}
