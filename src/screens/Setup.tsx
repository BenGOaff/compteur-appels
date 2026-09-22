import { useState } from 'react'
import { fr } from '../lib/format'
import type { Profile, Settings } from '../lib/storage'

type Props = {
  profile: Profile | null
  onDone: (settings: Settings) => void
}

export default function Setup({ profile, onDone }: Props) {
  const [clientValue, setClientValue] = useState('')
  const [conversion, setConversion] = useState(3)
  // « Je ne sais pas » est coché d'entrée : sans réponse, l'outil doit annoncer
  // une fourchette prudente plutôt qu'un taux unique que personne n'a choisi.
  const [unknownRate, setUnknownRate] = useState(true)
  const [workingDays, setWorkingDays] = useState<5 | 6 | 7>(5)

  const valeur = Number(clientValue.replace(',', '.'))
  const valide = Number.isFinite(valeur) && valeur > 0

  return (
    <section className="shell">
      <h1>Trois questions, puis c’est parti</h1>

      <div className="card">
        <div className="field">
          <label htmlFor="valeur-client">{fr('Que vous rapporte en moyenne un nouveau client ?')}</label>
          <input
            id="valeur-client"
            type="number"
            inputMode="numeric"
            min={1}
            step={10}
            placeholder="150"
            value={clientValue}
            onChange={(event) => setClientValue(event.target.value)}
            aria-describedby="aide-valeur"
          />
          <p className="help" id="aide-valeur">
            Comptez la première prestation ou le premier rendez-vous, pas ce que le client vous rapportera
            sur plusieurs années. Montant en euros.
          </p>
        </div>

        <div className="field">
          <label htmlFor="taux">
            {fr('Sur 10 nouveaux clients qui vous appellent, combien finissent par réserver ?')}
          </label>
          <input
            id="taux"
            type="range"
            min={1}
            max={10}
            step={1}
            className={unknownRate ? 'inactif' : undefined}
            value={conversion}
            onChange={(event) => {
              setConversion(Number(event.target.value))
              setUnknownRate(false)
            }}
          />
          <p className="center" aria-live="polite">
            <strong style={{ color: unknownRate ? 'var(--mute)' : 'var(--ink)', fontSize: '18px' }}>
              {unknownRate ? 'Fourchette de 1 à 3 sur 10' : `${conversion} sur 10`}
            </strong>
          </p>
          <label className="checkbox" htmlFor="taux-inconnu">
            <input
              id="taux-inconnu"
              type="checkbox"
              checked={unknownRate}
              onChange={(event) => setUnknownRate(event.target.checked)}
            />
            Je ne sais pas
          </label>
          <p className="help">
            {unknownRate
              ? 'Déplacez le curseur si vous connaissez votre chiffre. Sinon, votre résultat sera donné en fourchette, hypothèse affichée en clair.'
              : 'Recochez « Je ne sais pas » si vous préférez une fourchette prudente.'}
          </p>
        </div>

        <div className="field">
          <span className="label-like">{fr('Combien de jours travaillez-vous par semaine ?')}</span>
          <div className="segment">
            {([5, 6, 7] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="choice"
                aria-pressed={workingDays === value}
                onClick={() => setWorkingDays(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block btn-big"
        disabled={!valide}
        onClick={() =>
          onDone({
            startedAt: new Date().toISOString(),
            clientValue: Math.round(valeur),
            conversionKnown: unknownRate ? null : conversion,
            workingDays,
            profile,
          })
        }
      >
        Démarrer mon jour 1
      </button>
      {!valide && <p className="help center">Indiquez un montant pour continuer.</p>}
    </section>
  )
}
