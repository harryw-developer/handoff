const ITEMS = [
  '100% free',
  '✦',
  'zero landfill',
  '✦',
  'one less drawer of shame',
  '✦',
  'give tech, get karma',
  '✦',
  'your cables called — they want a new home',
  '✦',
  'reduce, reuse, rehome',
  '✦',
]

export default function Marquee() {
  const strip = ITEMS.join('  ')
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{strip}</span>
        <span>{strip}</span>
      </div>
    </div>
  )
}
