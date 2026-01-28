import Icon from "@/components/ui/icon"

export function Footer() {
  return (
    <footer id="contact" className="bg-[#070B13] border-t border-primary/10 pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company info */}
          <div>
            <div className="font-heading text-2xl font-extrabold text-white mb-2">
              MAXI<span className="text-primary">SOFT</span><span className="text-secondary">ZAB</span>
            </div>
            <div className="text-secondary text-xs mb-4 font-body">
              IT-подразделение ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС»
            </div>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">
              Создаем digital-решения с 2020 года. Применяем инженерный подход из сферы 
              авторемонта к разработке IT-продуктов.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-heading font-semibold text-lg mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              Навигация
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Услуги
                </a>
              </li>
              <li>
                <a href="#portfolio" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Портфолио
                </a>
              </li>
              <li>
                <a href="#process" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Процесс
                </a>
              </li>
              <li>
                <a href="#about" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  О нас
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-heading font-semibold text-lg mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              Услуги
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Веб-приложения
                </a>
              </li>
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Корпоративные сайты
                </a>
              </li>
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Мобильные приложения
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors font-body text-sm">
                  Техническая поддержка
                </a>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-white font-heading font-semibold text-lg mb-6 relative pb-3 after:absolute after:bottom-0 after:left-0 after:w-10 after:h-[2px] after:bg-primary">
              Контакты
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-muted-foreground font-body text-sm">
                <Icon name="Mail" size={16} className="text-primary mt-1 flex-shrink-0" />
                <span>digital@ddmaxi.ru</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body text-sm">
                <Icon name="Phone" size={16} className="text-primary mt-1 flex-shrink-0" />
                <span>+7 (XXX) XXX-XX-XX</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body text-sm">
                <Icon name="MapPin" size={16} className="text-primary mt-1 flex-shrink-0" />
                <span>г. Москва, ул. Авторемонтная, д. 15</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body text-sm">
                <Icon name="Car" size={16} className="text-primary mt-1 flex-shrink-0" />
                <span>Основная деятельность: ремонт автотранспорта</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-sm font-body">
            © 2023 MaxiSoftZAB. IT-направление компании ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС». Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}