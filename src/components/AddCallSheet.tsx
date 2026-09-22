import { useState } from 'react'
import Sheet from './Sheet'
import { LIBELLE_APPELANT, OPTIONS_SUIVI } from './CallCard'
import type { CallerType, FollowUp, MissedCall } from '../lib/storage'
import { fr, nowTime } from '../lib/format'

export type CallDraft = {
  time: string
  callerType: CallerType
  leftMessage: boolean
  followUp: FollowUp
}

type Props = {
  mode: 'create' | 'edit'
  call?: MissedCall
  onSave: (draft: CallDraft) => void
  onDelete?: () => void
  onClose: () => void
}

const APPELANTS: CallerType[] = ['nouveau', 'client', 'autre', 'inconnu']
const SUIVIS: Exclude<FollowUp, null>[] = ['rdv', 'parti', 'non-pertinent', 'sans-reponse', 'a-faire']

export default function AddCallSheet({ mode, call, onSave, onDelete, onClose }: Props) {
  const [time, setTime] = useState(call?.time ?? nowTime())
  const [callerType, setCallerType] = useState<CallerType | null>(call?.callerType ?? null)
  const [leftMessage, setLeftMessage] = useState<boolean | null>(call?.leftMessage ?? null)
  const [followUp, setFollowUp] = useState<FollowUp>(call?.followUp ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const complet = callerType !== null && leftMessage !== null

  return (
    <Sheet title={mode === 'create' ? 'Ajouter un appel manqué' : 'Suivi de l’appel'} onClose={onClose}>
      <h2>{mode === 'create' ? 'Nouvel appel manqué' : fr('Qu’est-il devenu ?')}</h2>

      {mode === 'edit' && (
        <div className="field">
          {SUIVIS.map((value) => (
            <button
              key={value}
              type="button"
              className="choice"
              aria-pressed={followUp === value}
              onClick={() => setFollowUp(followUp === value ? null : value)}
            >
              {OPTIONS_SUIVI[value]}
            </button>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="heure-appel">Heure de l’appel</label>
        <input
          id="heure-appel"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value || nowTime())}
        />
      </div>

      <div className="field">
        <span className="label-like">{fr('Qui appelait ?')}</span>
        {APPELANTS.map((value) => (
          <button
            key={value}
            type="button"
            className="choice"
            aria-pressed={callerType === value}
            onClick={() => setCallerType(value)}
          >
            {LIBELLE_APPELANT[value]}
          </button>
        ))}
      </div>

      <div className="field">
        <span className="label-like">{fr('A-t-il laissé un message ?')}</span>
        <div className="segment">
          <button
            type="button"
            className="choice"
            aria-pressed={leftMessage === true}
            onClick={() => setLeftMessage(true)}
          >
            Oui
          </button>
          <button
            type="button"
            className="choice"
            aria-pressed={leftMessage === false}
            onClick={() => setLeftMessage(false)}
          >
            Non
          </button>
        </div>
      </div>

      {mode === 'edit' && onDelete && (
        <div className="field">
          {confirmDelete ? (
            <div className="card tight">
              <p className="small">{fr('Supprimer définitivement cet appel ?')}</p>
              <div className="segment">
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </button>
                <button type="button" className="btn btn-danger btn-block" onClick={onDelete}>
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(true)}>
              Supprimer cet appel
            </button>
          )}
        </div>
      )}

      <div className="sheet-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!complet}
          onClick={() => {
            if (!complet) return
            onSave({ time, callerType, leftMessage, followUp })
          }}
        >
          {mode === 'create' ? 'Enregistrer' : 'Enregistrer les modifications'}
        </button>
        {!complet && (
          <p className="help center">Répondez aux deux questions pour enregistrer.</p>
        )}
        <button type="button" className="btn-ghost btn-block" onClick={onClose}>
          Annuler
        </button>
      </div>
    </Sheet>
  )
}
