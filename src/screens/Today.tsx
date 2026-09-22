import type { ReactNode } from 'react'
import ProgressBar from '../components/ProgressBar'
import CallCard from '../components/CallCard'
import { formatDayLabel, formatMinutes } from '../lib/format'
import type { MissedCall, Store } from '../lib/storage'

type Props = {
  store: Store
  today: string
  dayNumber: number
  onAddCall: () => void
  onEditCall: (call: MissedCall) => void
  onMinutes: (delta: number) => void
  onNoCalls: () => void
  onNotWorked: () => void
  onWorkedAgain: () => void
  installHint: ReactNode
}

export default function Today({
  store,
  today,
  dayNumber,
  onAddCall,
  onEditCall,
  onMinutes,
  onNoCalls,
  onNotWorked,
  onWorkedAgain,
  installHint,
}: Props) {
  const calls = store.calls.filter((c) => c.day === today).sort((a, b) => a.time.localeCompare(b.time))
  const log = store.days.find((d) => d.day === today)
  const minutes = log?.callbackMinutes ?? 0
  const journeeOff = log?.notWorked === true

  if (journeeOff) {
    return (
      <section className="shell">
        <ProgressBar current={dayNumber} total={5} />
        <div className="card center">
          <h2>Journée mise de côté</h2>
          <p className="small">
            {formatDayLabel(today)} ne comptera pas dans votre résultat. À demain.
          </p>
          <button type="button" className="btn btn-secondary btn-block" onClick={onWorkedAgain}>
            Finalement, j’ai travaillé aujourd’hui
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="shell">
      <ProgressBar current={dayNumber} total={5} />

      <div className="count-hero">
        <div className="number" aria-hidden="true">
          {calls.length}
        </div>
        <p className="caption">
          {calls.length <= 1 ? 'appel manqué aujourd’hui' : 'appels manqués aujourd’hui'}
        </p>
      </div>

      <button type="button" className="btn btn-primary btn-block btn-big" onClick={onAddCall}>
        + J’ai manqué un appel
      </button>

      {calls.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {calls.map((call) => (
            <CallCard key={call.id} call={call} onClick={() => onEditCall(call)} />
          ))}
          <p className="help">
            Touchez un appel pour indiquer ce qu’il est devenu. Le point orange signale ceux qui restent à
            mettre à jour.
          </p>
        </div>
      )}

      {installHint}

      <section className="card" style={{ marginTop: 16 }} aria-label="Temps passé à rappeler aujourd’hui">
        <h3>Temps passé à rappeler aujourd’hui</h3>
        <div className="stepper">
          <button
            type="button"
            aria-label="Retirer 5 minutes"
            onClick={() => onMinutes(-5)}
            disabled={minutes === 0}
          >
            −
          </button>
          <div className="value" aria-live="polite">
            {formatMinutes(minutes)}
          </div>
          <button type="button" aria-label="Ajouter 5 minutes" onClick={() => onMinutes(5)}>
            +
          </button>
        </div>
      </section>

      <div className="center stack" style={{ marginTop: 8 }}>
        {calls.length === 0 && !log && (
          <button type="button" className="btn-ghost" onClick={onNoCalls}>
            Aucun appel manqué aujourd’hui
          </button>
        )}
        <div>
          <button type="button" className="btn-ghost muted" onClick={onNotWorked}>
            Je ne travaille pas aujourd’hui
          </button>
        </div>
      </div>
    </section>
  )
}
