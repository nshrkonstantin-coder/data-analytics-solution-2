import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "Сколько стоит разработка?",
      answer:
        "Стоимость зависит от объёма проекта. Простой сайт-визитка с записью — от 50 000 ₽, CRM-система — от 200 000 ₽. Обсудим ваш проект и сделаем точный расчёт.",
    },
    {
      question: "Сколько времени занимает разработка?",
      answer:
        "Простой сайт — 1-2 недели, CRM-система — 1-2 месяца. Сроки зависят от сложности и количества функций.",
    },
    {
      question: "Предоставляете ли техподдержку?",
      answer:
        "Да, мы предоставляем полное сопровождение: обновления, исправления ошибок, консультации. Можно выбрать разовые работы или абонентское обслуживание.",
    },
    {
      question: "Можете интегрировать с 1C?",
      answer:
        "Да, мы интегрируем ваши приложения с 1C, платёжными системами, SMS-сервисами и другими внешними API.",
    },
    {
      question: "Где будет размещён сайт?",
      answer:
        "Мы можем разместить сайт на любом хостинге — на вашем или нашем. Также настроим домен, SSL-сертификат, резервное копирование.",
    },
    {
      question: "Что нужно для старта проекта?",
      answer:
        "Опишите вашу задачу — какой сайт или приложение нужно, какие функции. Мы подготовим техзадание, согласуем смету и сроки — и приступим к разработке.",
    },
  ]

  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron">Частые вопросы</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-space-mono">
            Ответы на важные вопросы о разработке, стоимости и сроках проектов.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-red-500/20 mb-4">
                <AccordionTrigger className="text-left text-lg font-semibold text-white hover:text-red-400 font-orbitron px-6 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 leading-relaxed px-6 pb-4 font-space-mono">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}