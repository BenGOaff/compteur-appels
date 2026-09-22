import { useCallback, useEffect, useMemo, useState } from 'react'
import Welcome from './screens/Welcome'
import Setup from './screens/Setup'
import Today from './screens/Today'
import History from './screens/History'
import Result from './screens/Result'
import AddCallSheet, { type CallDraft } from './components/AddCallSheet'
import InstallHint from './components/InstallHint'
import { joursTravailles } from './lib/calculations'
import { profileFromUrl } from './lib/profiles'
import { todayIso } from './lib/format'
import {
  askPersistence,
  clearStore,
  emptyStore,
  installHintSeen,
  loadStore,
  markInstallHintSeen,
  newId,
  parseStore,
  saveStore,
  storageAvailable,
  type MissedCall,
  type Settings,
  type Store,
} from './lib/storage'

type Tab = 'today' | 'history' | 'result'
type SheetState = { mode: 'create' } | { mode: 'edit'; call: MissedCall } | null

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

const LOGO = '/logo-concierge-ai.webp'

export default function App() {
  const [store, setStore] = useState<Store>(() => loadStore())
  const [phase, setPhase] = useState<'welcome' | 'setup' | 'app'>(() =>
    loadStore().settings ? 'app' : 'welcome',
  )
  const [tab, setTab] = useState<Tab>('today')
  const [sheet, setSheet] = useState<SheetState>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  const stockageOk = useMemo(() => storageAvailable(), [])
  const profilUrl = useMemo(
    () => (typeof window === 'undefined' ? null : profileFromUrl(window.location.search)),
    [],
  )
  const today = todayIso()

  const commit = useCallback((next: Store) => {
    saveStore(next)
    askPersistence()
    setStore(next)
  }, [])

  const annonce = useCallback((message: string) => {
    setToast(message)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(id)
  }, [toast])

  // Le profil de l'URL est enregistré une fois, au premier chargement.
  useEffect(() => {
    if (!profilUrl) return
    setStore((prev) => {
      if (!prev.settings || prev.settings.profile) return prev
      const next = { ...prev, settings: { ...prev.settings, profile: profilUrl } }
      saveStore(next)
      return next
    })
  }, [profilUrl])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const jours = joursTravailles(store)
  const numeroDuJour = jours.includes(today) ? jours.indexOf(today) + 1 : jours.length + 1

  const ouvrirJour = (source: Store, day: string): Store => {
    const existe = source.days.some((d) => d.day === day)
    return existe
      ? { ...source, days: source.days.map((d) => (d.day === day ? { ...d, notWorked: false } : d)) }
      : { ...source, days: [...source.days, { day, callbackMinutes: 0 }] }
  }

  const enregistrerAppel = (draft: CallDraft) => {
    const call: MissedCall = { id: newId(), day: today, ...draft }
    const premier = store.calls.length === 0
    commit({ ...ouvrirJour(store, today), calls: [...store.calls, call] })
    setSheet(null)
    annonce('Appel noté.')
    if (premier && !installHintSeen()) setShowInstall(true)
  }

  const modifierAppel = (id: string, draft: CallDraft) => {
    commit({ ...store, calls: store.calls.map((c) => (c.id === id ? { ...c, ...draft } : c)) })
    setSheet(null)
    annonce('Appel mis à jour.')
  }

  const supprimerAppel = (id: string) => {
    commit({ ...store, calls: store.calls.filter((c) => c.id !== id) })
    setSheet(null)
    annonce('Appel supprimé.')
  }

  const ajouterMinutes = (delta: number) => {
    const base = ouvrirJour(store, today)
    commit({
      ...base,
      days: base.days.map((d) =>
        d.day === today ? { ...d, callbackMinutes: Math.max(0, d.callbackMinutes + delta) } : d,
      ),
    })
  }

  const exporter = () => {
    try {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `compteur-appels-${today}.json`
      document.body.appendChild(lien)
      lien.click()
      document.body.removeChild(lien)
      URL.revokeObjectURL(url)
      annonce('Fichier enregistré.')
    } catch {
      annonce('Export impossible sur ce navigateur.')
    }
  }

  const importer = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const importe = parseStore(JSON.parse(String(reader.result)))
        commit(importe)
        setPhase(importe.settings ? 'app' : 'welcome')
        annonce('Suivi importé.')
      } catch {
        annonce('Fichier non reconnu.')
      }
    }
    reader.onerror = () => annonce('Lecture du fichier impossible.')
    reader.readAsText(file)
  }

  const toutEffacer = () => {
    clearStore()
    setStore(emptyStore())
    setPhase('welcome')
    setTab('today')
    annonce('Tout a été effacé.')
  }

  const terminerReglages = (settings: Settings) => {
    commit({ ...store, settings })
    setPhase('app')
  }

  const lancerInstallation = () => {
    const event = installEvent
    setShowInstall(false)
    markInstallHintSeen()
    if (!event) return
    void event.prompt().catch(() => undefined)
    setInstallEvent(null)
  }

  const invitation = showInstall ? (
    <InstallHint
      canPrompt={installEvent !== null}
      onInstall={lancerInstallation}
      onClose={() => {
        setShowInstall(false)
        markInstallHintSeen()
      }}
    />
  ) : null

  const avecOnglets = phase === 'app'

  return (
    <div className={avecOnglets ? 'app with-tabs' : 'app'}>
      <header className="site-header">
        <div className="shell">
          <a href="https://www.concierge-ai.fr" aria-label="Concierge AI, ouvrir le site">
            <img src={LOGO} alt="Concierge AI" width="132" height="28" />
          </a>
          <span className="tagline">Compteur d’appels manqués</span>
        </div>
      </header>

      <main>
        {!stockageOk && (
          <div className="shell">
            <p className="banner">
              Votre navigateur ne permet pas d’enregistrer vos données. Ouvrez ce lien dans votre
              navigateur habituel, hors navigation privée.
            </p>
          </div>
        )}

        {phase === 'welcome' && <Welcome onStart={() => setPhase('setup')} />}

        {phase === 'setup' && <Setup profile={profilUrl} onDone={terminerReglages} />}

        {phase === 'app' && tab === 'today' && (
          <Today
            store={store}
            today={today}
            dayNumber={numeroDuJour}
            onAddCall={() => setSheet({ mode: 'create' })}
            onEditCall={(call) => setSheet({ mode: 'edit', call })}
            onMinutes={ajouterMinutes}
            onNoCalls={() => {
              commit(ouvrirJour(store, today))
              annonce('Journée enregistrée.')
            }}
            onNotWorked={() => {
              const base = ouvrirJour(store, today)
              commit({
                ...base,
                days: base.days.map((d) => (d.day === today ? { ...d, notWorked: true } : d)),
              })
            }}
            onWorkedAgain={() => commit(ouvrirJour(store, today))}
            installHint={invitation}
          />
        )}

        {phase === 'app' && tab === 'history' && (
          <History
            store={store}
            onEditCall={(call) => setSheet({ mode: 'edit', call })}
            onExport={exporter}
            onImport={importer}
            onClearAll={toutEffacer}
          />
        )}

        {phase === 'app' && tab === 'result' && <Result store={store} />}
      </main>

      <footer className="site-footer">
        <div className="shell">
          <div className="links">
            <a href="https://www.concierge-ai.fr/mentions-legales" target="_blank" rel="noopener">
              Mentions légales
            </a>
            <a
              href="https://www.concierge-ai.fr/politique-de-confidentialite"
              target="_blank"
              rel="noopener"
            >
              Politique de confidentialité
            </a>
          </div>
          <p>Vos données restent sur cet appareil.</p>
        </div>
      </footer>

      {avecOnglets && (
        <nav className="tabbar no-print" aria-label="Navigation principale">
          <div className="shell">
            <button
              type="button"
              aria-current={tab === 'today' ? 'page' : undefined}
              onClick={() => setTab('today')}
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              aria-current={tab === 'history' ? 'page' : undefined}
              onClick={() => setTab('history')}
            >
              Historique
            </button>
            <button
              type="button"
              aria-current={tab === 'result' ? 'page' : undefined}
              onClick={() => setTab('result')}
            >
              Mon résultat
            </button>
          </div>
        </nav>
      )}

      {sheet?.mode === 'create' && (
        <AddCallSheet mode="create" onSave={enregistrerAppel} onClose={() => setSheet(null)} />
      )}

      {sheet?.mode === 'edit' && (
        <AddCallSheet
          mode="edit"
          call={sheet.call}
          onSave={(draft) => modifierAppel(sheet.call.id, draft)}
          onDelete={() => supprimerAppel(sheet.call.id)}
          onClose={() => setSheet(null)}
        />
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  )
}
