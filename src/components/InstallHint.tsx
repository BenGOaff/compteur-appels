type Props = {
  canPrompt: boolean
  onInstall: () => void
  onClose: () => void
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)
}

export default function InstallHint({ canPrompt, onInstall, onClose }: Props) {
  const ios = isIos()
  return (
    <section className="card" aria-label="Ajouter le compteur à votre écran d’accueil">
      <h3>Gardez le compteur sous la main</h3>
      <p className="small">
        Ajoutez ce compteur à votre écran d’accueil pour le retrouver en un geste demain.
      </p>

      {canPrompt && !ios && (
        <button type="button" className="btn btn-primary btn-block" onClick={onInstall}>
          Ajouter à mon écran d’accueil
        </button>
      )}

      {ios && (
        <ol className="steps">
          <li>
            Touchez <strong>Partager</strong> <span aria-hidden="true">⬆️</span> en bas de l’écran.
          </li>
          <li>
            Choisissez <strong>Sur l’écran d’accueil</strong>.
          </li>
          <li>
            Touchez <strong>Ajouter</strong>.
          </li>
        </ol>
      )}

      {!canPrompt && !ios && (
        <p className="small">
          Dans le menu de votre navigateur, choisissez <strong>Ajouter à l’écran d’accueil</strong>.
        </p>
      )}

      <p className="help">
        Vos données sont enregistrées dans ce navigateur, sur ce téléphone. Revenez toujours par le même.
      </p>

      <button type="button" className="btn-ghost btn-block" onClick={onClose}>
        Plus tard
      </button>
    </section>
  )
}
