import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallButton({ className = '', variant = 'default' }: { className?: string, variant?: 'default' | 'mobile' }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled || !deferredPrompt) return null

  if (variant === 'mobile') {
    return (
      <Button
        onClick={handleInstall}
        className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 font-heading border-0 ${className}`}
      >
        <Icon name="Download" size={16} />
        <span className="ml-2">Установить приложение</span>
      </Button>
    )
  }

  return (
    <Button
      onClick={handleInstall}
      size="sm"
      className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 font-heading border-0 ${className}`}
    >
      <Icon name="Download" size={14} />
      <span className="ml-1.5">Установить</span>
    </Button>
  )
}

export default PwaInstallButton
