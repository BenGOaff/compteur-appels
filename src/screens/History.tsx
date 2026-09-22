import { useRef, useState } from 'react'
import Sheet from '../components/Sheet'
import CallCard from '../components/CallCard'
import { joursTravailles, resumeJour } from '../lib/calculations'
import { formatDayLabel, formatMinutes, fr } from '../lib/format'
import type { MissedCall, Store } from '../lib/storage'

type Props = {
  store: Store
  onEditCall: (call: MissedCall) => void
  onExport: () => void
  onImport: (file: File) => void
  onClearAll: () => void
}

export default function History({ store, onEditCall, onExport, onImport, onClearAll }: Props) {
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const travailles = joursTravailles(store)
  const numero = new Map(travailles.map((day, index) => [day, index + 1]))
  const tousLesJours = [...new Set([...store.days.map((d) => d.day), ...store.calls.map((c) => c.day)])]
    .sort()
    .reverse()

  return (
    <section className="shell">
      <h1>Votre historique</h1>

      {tousLesJours.length === 0 && (
        <div className="card">
          <p className="small">
            Vos journées s’afficheront ici dès votre premier appel noté.
          </p>
        </div>
      )}

      {tousLesJours.map((day) => {
        const resume = resumeJour(store, day)
        const calls = store.calls
          .filter((c) => c.day === day)
          .sort((a, b) => a.time.localeCompare(b.time))
        const estOuvert = ouvert === day
        const titre = resume.notWorked
          ? `Jour non travaillé · ${formatDayLabel(day)}`
          : `Jour ${numero.get(day) ?? '–'} · ${formatDayLabel(day)}`
        const detail = resume.notWorked
          ? 'Cette journée ne compte pas dans votre résultat.'
          : [
              `${resume.appels} ${resume.appels <= 1 ? 'appel' : 'appels'}`,
              `${resume.nouveaux} ${resume.nouveaux <= 1 ? 'nouveau client' : 'nouveaux clients'}`,
              `${resume.rdv} ${resume.rdv <= 1 ? 'rendez-vous' : 'rendez-vous'}`,
              `${formatMinutes(resume.minutes)} de rappel`,
            ].join(', ')

        return (
          <div key={day}>
            <button
              type="button"
              className="day-row"
              aria-expanded={estOuvert}
              onClick={() => setOuvert(estOuvert ? null : day)}
            >
              <span className="body">
                <span className="title">{titre}</span>
                <span className="meta muted small">{fr(detail)}</span>
              </span>
              <span className="chevron no-print" aria-hidden="true">
                {estOuvert ? '⌃' : '⌄'}
              </span>
            </button>

            {estOuvert && (
              <div style={{ margin: '8px 0 14px' }}>
                {calls.length === 0 && <p className="help">Aucun appel noté ce jour-là.</p>}
                {calls.map((call) => (
                  <CallCard key={call.id} call={call} onClick={() => onEditCall(call)} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="card no-print" style={{ marginTop: 18 }}>
        <h3>Changer de téléphone, garder vos données</h3>
        <p className="small">
          L’export enregistre un fichier sur votre appareil. Vous pourrez l’importer sur un autre
          navigateur pour retrouver votre suivi.
        </p>
        <div className="stack">
          <button type="button" className="btn btn-secondary btn-block" onClick={onExport}>
            Exporter mon suivi
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => fileInput.current?.click()}
          >
            Importer un suivi
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={() => window.print()}>
            Imprimer cette page
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="center no-print" style={{ marginBottom: 12 }}>
        <button type="button" className="btn-ghost muted" onClick={() => setConfirmation(true)}>
          Tout effacer
        </button>
      </div>

      {confirmation && (
        <Sheet title="Tout effacer" onClose={() => setConfirmation(false)}>
          <h2>{fr('Tout effacer ?')}</h2>
          <p className="small">
            Vos appels, vos journées et vos réglages seront supprimés de ce téléphone. Cette action est
            définitive.
          </p>
          <div className="stack">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setConfirmation(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={() => {
                setConfirmation(false)
                onClearAll()
              }}
            >
              Oui, tout effacer
            </button>
          </div>
        </Sheet>
      )}
    </section>
  )
}
