import type { CallerType, FollowUp, MissedCall } from '../lib/storage'
import { formatTime } from '../lib/format'

export const LIBELLE_APPELANT: Record<CallerType, string> = {
  nouveau: 'Un nouveau client',
  client: 'Un client existant',
  autre: 'Perso ou démarchage',
  inconnu: 'Je ne sais pas',
}

export const LIBELLE_SUIVI: Record<Exclude<FollowUp, null>, string> = {
  rdv: 'Rendez-vous obtenu',
  parti: 'A trouvé quelqu’un d’autre',
  'non-pertinent': 'Pas pour moi',
  'sans-reponse': 'Rappelé, pas de réponse',
  'a-faire': 'Pas encore rappelé',
}

/** Libellés complets du §5.5, affichés dans la feuille de suivi. */
export const OPTIONS_SUIVI: Record<Exclude<FollowUp, null>, string> = {
  rdv: 'Rendez-vous obtenu',
  parti: 'Il a trouvé quelqu\u2019un d\u2019autre',
  'non-pertinent': 'Pas pour moi (hors zone, hors budget\u2026)',
  'sans-reponse': 'Rappelé, pas de réponse',
  'a-faire': 'Pas encore rappelé',
}

type Props = {
  call: MissedCall
  onClick: () => void
}

export default function CallCard({ call, onClick }: Props) {
  const suivi = call.followUp ? LIBELLE_SUIVI[call.followUp] : 'Suivi à compléter'
  const aRappeler = call.followUp === 'a-faire' || call.followUp === null
  return (
    <button type="button" className="call-card" onClick={onClick}>
      {aRappeler && <span className="dot" aria-hidden="true" />}
      <span className="hour">{formatTime(call.time)}</span>
      <span className="body">
        <span className="who">{LIBELLE_APPELANT[call.callerType]}</span>
        <span className="meta">
          {call.leftMessage ? 'Message laissé' : 'Sans message'} · {suivi}
        </span>
      </span>
      <span className="chevron" aria-hidden="true">
        ›
      </span>
      <span className="sr-only">Modifier cet appel</span>
    </button>
  )
}
