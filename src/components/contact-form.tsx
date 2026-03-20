import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Icon from "@/components/ui/icon"

const CONTACT_API_URL = "https://functions.poehali.dev/44c43608-5866-4d49-ae14-4663a9a15026"
const MAX_TOTAL_SIZE = 30 * 1024 * 1024 // 30 МБ

interface AttachedFile {
  name: string
  size: number
  data: string // base64
}

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  })
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return

    const toAdd: AttachedFile[] = []
    let currentTotal = totalSize

    for (const file of Array.from(newFiles)) {
      if (currentTotal + file.size > MAX_TOTAL_SIZE) {
        toast({
          title: "Превышен лимит",
          description: `Файл "${file.name}" не добавлен — общий размер превысит 30 МБ`,
          variant: "destructive"
        })
        continue
      }
      const data = await readFileAsBase64(file)
      toAdd.push({ name: file.name, size: file.size, data })
      currentTotal += file.size
    }

    setFiles(prev => [...prev, ...toAdd])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          files: files.map(f => ({ name: f.name, data: f.data }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка отправки')
      }

      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время.",
      })

      setFormData({ name: "", email: "", phone: "", message: "" })
      setFiles([])
    } catch (err) {
      toast({
        title: "Ошибка отправки",
        description: err instanceof Error ? err.message : "Попробуйте ещё раз",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-[#0A192F] to-[#0F1419] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="text-primary font-heading font-semibold text-sm tracking-[0.2em] uppercase mb-4">
            Связаться с нами
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
            Обсудим ваш проект
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            Оставьте заявку, и мы свяжемся с вами для обсуждения деталей
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  name="name"
                  placeholder="Ваше имя"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border focus:border-primary transition-colors"
                />
              </div>
              <div>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Телефон"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="bg-background/50 border-border focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-background/50 border-border focus:border-primary transition-colors"
              />
            </div>

            <div>
              <Textarea
                name="message"
                placeholder="Расскажите о вашем проекте"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="bg-background/50 border-border focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Зона загрузки файлов */}
            <div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="Paperclip" size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Перетащите файлы сюда или <span className="text-primary">выберите файлы</span>
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Любые форматы · до 30 МБ суммарно
                  {totalSize > 0 && (
                    <span className="ml-2 text-primary/80">
                      · использовано {formatSize(totalSize)} из 30 МБ
                    </span>
                  )}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                  onClick={e => (e.currentTarget.value = '')}
                />
              </div>

              {/* Список файлов */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-background/30 border border-border rounded-lg"
                    >
                      <Icon name="FileText" size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-white flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-heading text-base"
            >
              {isSubmitting ? (
                <><Icon name="Loader2" size={18} className="mr-2 animate-spin" />Отправка...</>
              ) : (
                <><Icon name="Send" size={18} className="mr-2" />Отправить заявку</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
