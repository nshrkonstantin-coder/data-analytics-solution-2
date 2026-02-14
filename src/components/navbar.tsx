import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import { authService } from "@/lib/auth"
import { PwaInstallButton } from "@/components/pwa-install-button"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[9999] backdrop-blur-md border-b transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#0F1419]/95 border-primary/20 py-3 shadow-lg shadow-black/30' 
        : 'bg-[#0F1419]/95 border-primary/20 py-5'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-extrabold text-white">
              MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
            </h1>
            <div className="hidden lg:block text-[10px] text-muted-foreground max-w-[150px] leading-tight font-body">
              IT-решения от компании по ремонту автотранспорта
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#services"
              className="font-body text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              Услуги
            </a>
            <a 
              href="#portfolio" 
              className="font-body text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              Портфолио
            </a>
            <a 
              href="#process" 
              className="font-body text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              Процесс
            </a>
            <a 
              href="#about" 
              className="font-body text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              О нас
            </a>
            <a 
              href="#contact" 
              className="font-body text-muted-foreground hover:text-primary transition-colors duration-200 font-medium relative after:absolute after:bottom-[-5px] after:left-0 after:w-0 after:h-[2px] after:bg-primary after:transition-all hover:after:w-full"
            >
              Контакты
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <PwaInstallButton />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading border-0">
                  Личный кабинет
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="border-primary/30 hover:bg-primary/10 font-heading">
                    Вход
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading border-0">
                    Регистрация
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:text-primary transition-colors duration-200"
          >
            {isOpen ? <Icon name="X" size={24} /> : <Icon name="Menu" size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-primary/20">
            <div className="pt-4 space-y-3">
              <a
                href="#services"
                className="block px-3 py-2 font-body text-white hover:text-primary transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Услуги
              </a>
              <a
                href="#portfolio"
                className="block px-3 py-2 font-body text-white hover:text-primary transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Портфолио
              </a>
              <a
                href="#process"
                className="block px-3 py-2 font-body text-white hover:text-primary transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Процесс
              </a>
              <a
                href="#about"
                className="block px-3 py-2 font-body text-white hover:text-primary transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                О нас
              </a>
              <a
                href="#contact"
                className="block px-3 py-2 font-body text-white hover:text-primary transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Контакты
              </a>
              <div className="px-3 py-2 space-y-2">
                <PwaInstallButton variant="mobile" />
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-primary to-[#FF8E53] font-heading border-0">
                      Личный кабинет
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full border-primary/30 font-heading">
                        Вход
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-primary to-[#FF8E53] font-heading border-0">
                        Регистрация
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}