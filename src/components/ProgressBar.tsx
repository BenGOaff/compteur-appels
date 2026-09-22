type Props = {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  const percent = Math.min(100, Math.round((current / total) * 100))
  const label = current <= total ? `Jour ${current} sur ${total}` : `Jour ${current}`
  return (
    <div className="progress">
      <div className="label">
        <span>{label}</span>
        <span className="muted">{current > total ? 'Objectif atteint' : `${percent}${' '}%`}</span>
      </div>
      <div
        className="track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(current, total)}
        aria-label={label}
      >
        <div className="fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
