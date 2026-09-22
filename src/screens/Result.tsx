import { computeResult } from '../lib/calculations'
import { formatEuros, formatMinutes, formatNumber, formatSlot, fr, NBSP } from '../lib/format'
import { CONCLUSION_COMMUNE, conclusionPour } from '../lib/profiles'
import type { Store } from '../lib/storage'

const LIEN_ESSAI = 'https://thomasgio.fr/conciergeai-7109?am_id=bene'
const LIEN_DEMO = 'https://www.concierge-ai.fr/demonstration'
const LIEN_PARTAGE = 'https://quiz.concierge-ai.fr/test'
const TEXTE_PARTAGE =
  'J’ai mesuré mes appels manqués pendant 5 jours, le résultat m’a surpris. Faites le test : ' +
  LIEN_PARTAGE

type Props = {
  store: Store
}

function partager() {
  const data = { title: 'Le compteur des appels manqués', text: TEXTE_PARTAGE, url: LIEN_PARTAGE }
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share(data).catch(() => undefined)
      return
    }
  } catch {
    /* repli ci-dessous */
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(TEXTE_PARTAGE), '_blank', 'noopener')
}

export default function Result({ store }: Props) {
  const r = computeResult(store)
  const settings = store.settings

  if (r.joursTravailles === 0) {
    return (
      <section className="shell">
        <h1>Mon résultat</h1>
        <div className="card">
          <p>
            Notez votre premier appel manqué et votre estimation s’affichera ici, dès aujourd’hui.
          </p>
        </div>
      </section>
    )
  }

  const termine = r.joursTravailles >= 5
  const tampon = termine
    ? 'Votre résultat sur 5 jours'
    : fr(`Estimation provisoire, jour ${r.joursTravailles} sur 5`)

  const chiffre =
    r.euroBas === r.euroHaut
      ? r.euroBas === 0 && r.aucunePerte
        ? null
        : `environ ${formatEuros(r.euroBas)} par mois`
      : `Entre ${formatEuros(r.euroBas)} et ${formatEuros(r.euroHaut)} par mois`

  const observations: [string, string][] = [
    ['Appels manqués notés', formatNumber(r.observed.appels)],
    ['Nouveaux clients identifiés', formatNumber(r.observed.nouveaux)],
    ['Appels sans message', formatNumber(r.observed.sansMessage)],
    ['Nouveaux clients partis ailleurs', formatNumber(r.observed.perdusConfirmes)],
    ['Nouveaux clients jamais joints', formatNumber(r.observed.jamaisJoints)],
    ['Rendez-vous récupérés grâce à vos rappels', formatNumber(r.observed.rdv)],
  ]

  return (
    <section className="shell">
      <h1>Mon résultat</h1>

      <div className="hero-result">
        <span className="stamp">{tampon}</span>
        {chiffre ? (
          <>
            <div className="amount">{chiffre}</div>
            <p className="sub">de chiffre d’affaires potentiel lié à vos appels manqués</p>
          </>
        ) : (
          <>
            <div className="amount">Aucun client perdu</div>
            <p className="sub">
              Sur ces jours-là, aucun nouveau client ne vous a échappé. Continuez quelques jours pour
              confirmer.
            </p>
          </>
        )}
      </div>

      {r.minutesNotees > 0 && (
        <section className="card">
          <h3>Votre temps</h3>
          <p>
            <strong style={{ color: 'var(--ink)', fontSize: '20px' }}>
              {formatMinutes(r.minutesMois)} par mois
            </strong>{' '}
            à rappeler, {r.equivalenceTemps}.
          </p>
        </section>
      )}

      <section className="card">
        <h3>Ce que vous avez observé</h3>
        <ul className="stat-list">
          {observations.map(([cle, valeur]) => (
            <li key={cle}>
              <span className="k">{cle}</span>
              <span className="v">{valeur}</span>
            </li>
          ))}
          {r.creneauCharge !== null && (
            <li>
              <span className="k">Votre créneau le plus chargé</span>
              <span className="v soft">{formatSlot(r.creneauCharge)}</span>
            </li>
          )}
        </ul>
        <p className="help">
          {fr(
            `Chiffres réellement notés sur ${r.joursTravailles} ${r.joursTravailles <= 1 ? 'journée travaillée' : 'journées travaillées'}, sans projection.`,
          )}
        </p>
      </section>

      <details className="method">
        <summary>Comment c’est calculé</summary>
        <div className="content">
          <p>
            {fr(
              `Vous avez noté vos appels sur ${r.joursTravailles} ${r.joursTravailles <= 1 ? 'journée travaillée' : 'journées travaillées'}. Pour passer au mois, nous multiplions par ${r.projection.toFixed(1).replace('.', ',')} : c’est votre rythme de ${settings?.workingDays ?? 5} jours par semaine, sur 4,33 semaines.`,
            )}
          </p>
          <p>
            {fr(
              `Nous comptons les nouveaux clients partis ailleurs (${r.observed.perdusConfirmes}) et ceux que vous n’avez jamais réussi à joindre (${r.observed.jamaisJoints}).`,
            )}
          </p>
          <p>
            {r.tauxConnu
              ? fr(
                  `Vous nous avez dit que ${settings?.conversionKnown} nouveaux clients sur 10 finissent par réserver : nous appliquons ce taux.`,
                )
              : fr(
                  'Vous ne connaissiez pas votre taux de réservation : nous retenons une fourchette prudente de 1 à 3 sur 10.',
                )}
          </p>
          <p>
            {fr(
              `La borne haute ajoute les numéros inconnus sans message (${r.observed.inconnusSansTrace}), dont nous supposons que ${Math.round(r.partNouveaux * 100)}${NBSP}% étaient de nouveaux clients${r.partNouveauxSuppose ? ' (hypothèse par défaut, faute d’appels identifiés)' : ', comme dans vos appels identifiés'}.`,
            )}
          </p>
          <p>
            {fr(
              `Le tout est multiplié par la valeur d’un nouveau client que vous avez indiquée : ${formatEuros(settings?.clientValue ?? 0)}. Les montants sont arrondis à la dizaine d’euros.`,
            )}
          </p>
          <p>
            {fr(
              `Votre temps : ${formatMinutes(r.minutesNotees)} de rappel notées, multipliées par le même coefficient.`,
            )}
          </p>
          <p className="help">
            Ce sont des estimations, pas une promesse. Les journées marquées « non travaillées » sont
            exclues du calcul.
          </p>
        </div>
      </details>

      <div className="conclusion">
        <p>{conclusionPour(settings?.profile ?? null)}</p>
        <p>{CONCLUSION_COMMUNE}</p>
      </div>

      <div className="stack">
        <a
          className="btn btn-primary btn-block btn-big"
          href={LIEN_ESSAI}
          target="_blank"
          rel="sponsored nofollow noopener"
        >
          Tester Concierge AI 7 jours
        </a>
        <a className="btn btn-secondary btn-block" href={LIEN_DEMO} target="_blank" rel="noopener">
          Écouter un appel réel
        </a>
      </div>
      <p className="disclosure">
        Lien partenaire{' '}: nous percevons une commission si vous vous abonnez, sans surcoût pour
        vous. Frais d’installation offerts ce mois-ci.
      </p>

      <div className="center" style={{ marginTop: 18 }}>
        <button type="button" className="btn btn-secondary btn-block" onClick={partager}>
          Partager le compteur à un confrère
        </button>
        <p className="help">Nous partageons le test, jamais vos chiffres.</p>
      </div>
    </section>
  )
}
