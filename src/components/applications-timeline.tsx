import { useEffect, useRef, useState } from "react"
import { useContent } from "@/hooks/useContent"

export function ApplicationsTimeline() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const { content } = useContent('process')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  const processes = [
    {
      number: "01",
      title: content.step1_title,
      description: content.step1_description
    },
    {
      number: "02",
      title: content.step2_title,
      description: content.step2_description
    },
    {
      number: "03",
      title: content.step3_title,
      description: content.step3_description
    },
    {
      number: "04",
      title: content.step4_title,
      description: content.step4_description
    }
  ]

  return (
    <section ref={sectionRef} id="process" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="text-primary font-heading font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            {content.title}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
            {content.heading}
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto font-body">
            {content.description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary to-secondary hidden md:block">
            <div 
              className={`h-full bg-gradient-to-b from-primary to-secondary origin-top transition-all duration-[2s] ease-out ${
                isVisible ? 'scale-y-100' : 'scale-y-0'
              }`}
            />
          </div>

          {/* Process items */}
          <div className="space-y-16">
            {processes.map((process, index) => (
              <div key={index} className="flex items-start relative">
                {/* Number circle */}
                <div className="w-[60px] h-[60px] rounded-full bg-background border-2 border-primary flex items-center justify-center font-heading font-bold text-xl text-white flex-shrink-0 mr-8 relative z-10">
                  {process.number}
                </div>

                {/* Content */}
                <div className="pt-3 flex-1">
                  <h3 className="text-2xl font-bold text-white mb-3 font-heading">
                    {process.title}
                  </h3>
                  <p className="text-muted-foreground max-w-2xl font-body">
                    {process.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}