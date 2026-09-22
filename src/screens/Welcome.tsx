type Props = {
  onStart: () => void
}

export default function Welcome({ onStart }: Props) {
  return (
    <section className="shell">
      <h1>Votre compteur d’appels manqués</h1>
      <p>
        Pendant 5 jours de travail, notez les appels que vous ne pouvez pas prendre. À la fin, vous saurez
        ce qu’ils représentent chaque mois, en clients et en temps passé à rappeler.
      </p>

      <ul className="reassurance">
        <li>
          <span className="ico" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          Quelques secondes par appel
        </li>
        <li>
          <span className="ico" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          Aucun compte, aucun email demandé
        </li>
        <li>
          <span className="ico" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2.5" width="12" height="19" rx="3" />
              <path d="M11 18.5h2" />
            </svg>
          </span>
          Vos données restent sur ce téléphone
        </li>
      </ul>

      <button type="button" className="btn btn-primary btn-block btn-big" onClick={onStart}>
        Commencer
      </button>
    </section>
  )
}
