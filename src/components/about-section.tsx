export function AboutSection() {
  return (
    <section id="about" className="py-24 bg-[#070B13] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Quote */}
          <div>
            <div className="text-primary font-heading text-3xl md:text-4xl font-bold leading-tight border-l-4 border-primary pl-8 mb-8">
              "Мы создаем цифровые продукты с той же надежностью, с которой ремонтируем автомобили"
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 mt-12">
              <div className="text-center">
                <div className="font-heading text-5xl font-extrabold text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-body">Лет в автосервисе</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-5xl font-extrabold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-body">Соблюдение сроков</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-5xl font-extrabold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-body">Поддержка проектов</div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-6 font-body text-muted-foreground">
            <p>
              <strong className="text-white">MaxiSoft</strong> — это IT-подразделение компании{" "}
              <strong className="text-white">«ДДМАКСИ СТРОЙРЕМСЕРВИС»</strong>, которая уже много лет 
              специализируется на техническом обслуживании и ремонте автотранспортных средств.
            </p>

            <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-sm">
              <h4 className="text-primary font-heading font-semibold text-lg mb-3">
                Почему это важно для вашего IT-проекта?
              </h4>
              <p>
                Наш опыт в авторемонте научил нас работать с точностью инженера: диагностировать проблемы, 
                планировать решения, соблюдать сроки и обеспечивать качество результата. Теперь мы применяем 
                этот подход в digital-сфере.
              </p>
            </div>

            <p>
              Мы знаем, что такое надежные системы, требующие безотказной работы. Переносим культуру качества 
              и ответственности из мира автосервиса в создание цифровых продуктов.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
