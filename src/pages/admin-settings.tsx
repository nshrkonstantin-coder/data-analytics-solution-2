import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { authService } from "@/lib/auth";

const ADMIN_API_URL =
  "https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d";
const NOTIFY_API_URL =
  "https://functions.poehali.dev/9812cd97-edcd-4540-858b-96ce682d8f82";

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_telegram: string;
  social_vk: string;
  social_youtube: string;
  company_legal_name: string;
  company_inn: string;
  company_ogrn: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "MAXISOFTZAB",
  site_description:
    "IT-подразделение компании ДДМАКСИ СТРОЙРЕМСЕРВИС",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  social_telegram: "",
  social_vk: "",
  social_youtube: "",
  company_legal_name: "",
  company_inn: "",
  company_ogrn: "",
  maintenance_mode: false,
  registration_enabled: true,
};

const SETTING_GROUPS = [
  {
    id: "general",
    name: "Основные",
    icon: "Globe",
    fields: [
      {
        key: "site_name",
        label: "Название сайта",
        type: "text",
        placeholder: "MAXISOFTZAB",
      },
      {
        key: "site_description",
        label: "Описание сайта",
        type: "text",
        placeholder: "Краткое описание вашего проекта",
      },
    ],
  },
  {
    id: "contacts",
    name: "Контакты",
    icon: "Phone",
    fields: [
      {
        key: "contact_email",
        label: "Email",
        type: "email",
        placeholder: "info@maxisoftzab.ru",
      },
      {
        key: "contact_phone",
        label: "Телефон",
        type: "text",
        placeholder: "+7 (999) 123-45-67",
      },
      {
        key: "contact_address",
        label: "Адрес",
        type: "text",
        placeholder: "г. Чита, ул. Примерная, д. 1",
      },
    ],
  },
  {
    id: "social",
    name: "Соцсети",
    icon: "Share2",
    fields: [
      {
        key: "social_telegram",
        label: "Telegram",
        type: "text",
        placeholder: "https://t.me/your_channel",
      },
      {
        key: "social_vk",
        label: "ВКонтакте",
        type: "text",
        placeholder: "https://vk.com/your_group",
      },
      {
        key: "social_youtube",
        label: "YouTube",
        type: "text",
        placeholder: "https://youtube.com/@your_channel",
      },
    ],
  },
  {
    id: "requisites",
    name: "Реквизиты",
    icon: "Building2",
    fields: [
      {
        key: "company_legal_name",
        label: "Название юридического лица",
        type: "text",
        placeholder: 'ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС»',
      },
      {
        key: "company_inn",
        label: "ИНН",
        type: "text",
        placeholder: "1234567890",
      },
      {
        key: "company_ogrn",
        label: "ОГРН",
        type: "text",
        placeholder: "1234567890123",
      },
    ],
  },
  {
    id: "system",
    name: "Система",
    icon: "Wrench",
    fields: [
      {
        key: "maintenance_mode",
        label: "Режим обслуживания",
        type: "toggle",
        description: "Сайт будет недоступен для посетителей",
      },
      {
        key: "registration_enabled",
        label: "Регистрация пользователей",
        type: "toggle",
        description: "Разрешить новым пользователям регистрироваться",
      },
    ],
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [activeGroup, setActiveGroup] = useState<typeof SETTING_GROUPS[0] | { id: string; name: string; icon: string; fields: never[] }>( SETTING_GROUPS[0]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ok: boolean; message: string} | null>(null);

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [showNewFaqForm, setShowNewFaqForm] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession();
      if (!result.valid || result.user?.role !== "admin") {
        navigate("/login");
      } else {
        await loadSettings();
        await loadFaqs();
      }
    };
    verifyAdmin();
  }, [navigate]);

  const DEFAULT_FAQ_SEED = [
    { question: "Сколько стоит разработка?", answer: "Стоимость зависит от объёма проекта. Простой сайт-визитка с записью — от 50 000 ₽, CRM-система — от 200 000 ₽. Обсудим ваш проект и сделаем точный расчёт." },
    { question: "Сколько времени занимает разработка?", answer: "Простой сайт — 1-2 недели, CRM-система — 1-2 месяца. Сроки зависят от сложности и количества функций." },
    { question: "Предоставляете ли техподдержку?", answer: "Да, мы предоставляем полное сопровождение: обновления, исправления ошибок, консультации. Можно выбрать разовые работы или абонентское обслуживание." },
    { question: "Можете интегрировать с 1C?", answer: "Да, мы интегрируем ваши приложения с 1C, платёжными системами, SMS-сервисами и другими внешними API." },
    { question: "Где будет размещён сайт?", answer: "Мы можем разместить сайт на любом хостинге — на вашем или нашем. Также настроим домен, SSL-сертификат, резервное копирование." },
    { question: "Что нужно для старта проекта?", answer: "Опишите вашу задачу — какой сайт или приложение нужно, какие функции. Мы подготовим техзадание, согласуем смету и сроки — и приступим к разработке." },
  ];

  const seedFaqs = async (token: string) => {
    await Promise.all(
      DEFAULT_FAQ_SEED.map((item, idx) =>
        fetch(`${ADMIN_API_URL}?action=content`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            section: "faq",
            key: `faq_seed_${idx}`,
            content: JSON.stringify({ question: item.question, answer: item.answer, order: idx }),
            content_type: "json",
          }),
        })
      )
    );
  };

  const loadFaqs = async () => {
    setFaqLoading(true);
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const contentItems: { section: string; key: string; content: string }[] = data.content || [];
      const faqItems = contentItems
        .filter((item) => item.section === "faq")
        .map((item) => {
          try {
            const parsed = JSON.parse(item.content);
            return { id: item.key, ...parsed };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a: FaqItem, b: FaqItem) => a.order - b.order);

      if (faqItems.length === 0 && token) {
        await seedFaqs(token);
        return loadFaqs();
      }

      setFaqs(faqItems as FaqItem[]);
    } catch (err) {
      console.error("Ошибка загрузки FAQ:", err);
    } finally {
      setFaqLoading(false);
    }
  };

  const saveFaqItem = async (item: FaqItem) => {
    setFaqSaving(true);
    const token = localStorage.getItem("auth_token");
    try {
      await fetch(`${ADMIN_API_URL}?action=content`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          section: "faq",
          key: item.id,
          content: JSON.stringify({ question: item.question, answer: item.answer, order: item.order }),
          content_type: "json",
        }),
      });
      await loadFaqs();
      setEditingFaq(null);
      setSuccess("FAQ сохранён");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setFaqSaving(false);
    }
  };

  const deleteFaqItem = async (id: string) => {
    const token = localStorage.getItem("auth_token");
    try {
      await fetch(`${ADMIN_API_URL}?action=content`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ section: "faq", key: id }),
      });
      await loadFaqs();
      setSuccess("Вопрос удалён");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  const addFaqItem = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const id = `faq_${Date.now()}`;
    await saveFaqItem({ id, question: newFaq.question, answer: newFaq.answer, order: faqs.length });
    setNewFaq({ question: "", answer: "" });
    setShowNewFaqForm(false);
  };

  const saveOrder = async (reordered: FaqItem[]) => {
    const token = localStorage.getItem("auth_token");
    await Promise.all(
      reordered.map((item, idx) =>
        fetch(`${ADMIN_API_URL}?action=content`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            section: "faq",
            key: item.id,
            content: JSON.stringify({ question: item.question, answer: item.answer, order: idx }),
            content_type: "json",
          }),
        })
      )
    );
    setFaqs(reordered.map((item, idx) => ({ ...item, order: idx })));
  };

  const handleDragStart = (id: string) => {
    dragItemId.current = id;
  };

  const handleDrop = async (targetId: string) => {
    if (!dragItemId.current || dragItemId.current === targetId) return;
    const from = faqs.findIndex((f) => f.id === dragItemId.current);
    const to = faqs.findIndex((f) => f.id === targetId);
    const reordered = [...faqs];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setDragOverId(null);
    dragItemId.current = null;
    await saveOrder(reordered);
  };

  const loadSettings = async () => {
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const contentItems = data.content || [];

      const loaded = { ...DEFAULT_SETTINGS };
      contentItems.forEach((item: { section: string; key: string; content: string }) => {
        if (item.section === "settings" && item.key in loaded) {
          const key = item.key as keyof SiteSettings;
          if (typeof loaded[key] === "boolean") {
            (loaded as Record<string, unknown>)[key] = item.content === "true";
          } else {
            (loaded as Record<string, unknown>)[key] = item.content;
          }
        }
      });
      setSettings(loaded);
    } catch (err) {
      console.error("Ошибка загрузки настроек:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    const token = localStorage.getItem("auth_token");

    try {
      const fields = activeGroup.fields;
      for (const field of fields) {
        const key = field.key as keyof SiteSettings;
        const value =
          typeof settings[key] === "boolean"
            ? String(settings[key])
            : String(settings[key]);

        await fetch(`${ADMIN_API_URL}?action=content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            section: "settings",
            key: field.key,
            content: value,
            content_type: "text",
          }),
        });
      }
      setSuccess("Настройки сохранены");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch(NOTIFY_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailResult({ ok: true, message: data.message || 'Письмо отправлено!' });
      } else {
        setTestEmailResult({ ok: false, message: data.error || 'Ошибка отправки' });
      }
    } catch {
      setTestEmailResult({ ok: false, message: 'Ошибка соединения' });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <nav className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <Icon name="ArrowLeft" size={20} />
              <span className="font-heading">Назад</span>
            </Link>
            <div className="h-6 w-px bg-primary/20" />
            <h1 className="font-heading text-xl font-bold text-white">
              <Icon name="Settings" size={20} className="inline mr-2 text-primary" />
              Настройки
            </h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
              <Icon name="CheckCircle" size={20} className="text-green-400" />
              <span className="text-green-400">{success}</span>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <Icon name="AlertCircle" size={20} className="text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="Mail" size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-white">Email-уведомления</h2>
                <p className="text-xs text-muted-foreground">Письма отправляются на ddmaxi-srs@yandex.ru</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleTestEmail}
                disabled={testingEmail}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10 font-heading"
              >
                {testingEmail ? (
                  <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Отправка...</>
                ) : (
                  <><Icon name="Send" size={16} className="mr-2" />Отправить тестовое письмо</>
                )}
              </Button>
              {testEmailResult && (
                <div className={`flex items-center gap-2 text-sm ${testEmailResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  <Icon name={testEmailResult.ok ? 'CheckCircle' : 'AlertCircle'} size={16} />
                  {testEmailResult.message}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-3 space-y-1">
                {SETTING_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeGroup.id === group.id
                        ? "bg-primary/20 text-white border border-primary/30"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      name={group.icon}
                      size={18}
                      className={
                        activeGroup.id === group.id ? "text-primary" : ""
                      }
                    />
                    <span className="font-heading text-sm font-medium">
                      {group.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveGroup({ id: "faq", name: "Частые вопросы", icon: "HelpCircle", fields: [] })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeGroup.id === "faq"
                      ? "bg-primary/20 text-white border border-primary/30"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon name="HelpCircle" size={18} className={activeGroup.id === "faq" ? "text-primary" : ""} />
                  <span className="font-heading text-sm font-medium">Частые вопросы</span>
                </button>
              </div>
            </div>

            <div className="flex-1">
              <div className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon
                      name={activeGroup.icon}
                      size={20}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-bold text-white">
                      {activeGroup.name}
                    </h2>
                  </div>
                </div>

                {activeGroup.id === "faq" ? (
                  <div className="space-y-4">
                    {faqLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Icon name="Loader2" size={32} className="text-primary animate-spin" />
                      </div>
                    ) : (
                      <>
                        {faqs.map((faq, idx) => (
                          <div
                            key={faq.id}
                            draggable={editingFaq?.id !== faq.id}
                            onDragStart={() => handleDragStart(faq.id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverId(faq.id); }}
                            onDragLeave={() => setDragOverId(null)}
                            onDrop={() => handleDrop(faq.id)}
                            className={`border rounded-xl overflow-hidden transition-all duration-150 ${
                              dragOverId === faq.id
                                ? "border-primary/60 bg-primary/5 scale-[1.01]"
                                : "border-white/10"
                            }`}
                          >
                            {editingFaq?.id === faq.id ? (
                              <div className="p-4 space-y-3 bg-white/5">
                                <Input
                                  value={editingFaq.question}
                                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                  placeholder="Вопрос"
                                  className="bg-white/5 border-white/10 focus:border-primary/50 text-white"
                                />
                                <Textarea
                                  value={editingFaq.answer}
                                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                  placeholder="Ответ"
                                  rows={3}
                                  className="bg-white/5 border-white/10 focus:border-primary/50 text-white resize-none"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => saveFaqItem(editingFaq)} disabled={faqSaving} className="bg-gradient-to-r from-primary to-[#FF8E53] border-0">
                                    {faqSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <><Icon name="Check" size={14} className="mr-1" />Сохранить</>}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingFaq(null)} className="border-white/10 hover:bg-white/5">Отмена</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 flex gap-3 cursor-grab active:cursor-grabbing">
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                                  <Icon name="GripVertical" size={16} className="text-muted-foreground/40" />
                                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">{idx + 1}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-heading text-sm font-semibold text-white mb-1">{faq.question}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{faq.answer}</p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button onClick={() => setEditingFaq(faq)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors">
                                    <Icon name="Pencil" size={14} className="text-muted-foreground hover:text-white" />
                                  </button>
                                  <button onClick={() => deleteFaqItem(faq.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                    <Icon name="Trash2" size={14} className="text-muted-foreground hover:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {showNewFaqForm ? (
                          <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
                            <p className="font-heading text-sm font-semibold text-white">Новый вопрос</p>
                            <Input
                              value={newFaq.question}
                              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                              placeholder="Введите вопрос"
                              className="bg-white/5 border-white/10 focus:border-primary/50 text-white"
                            />
                            <Textarea
                              value={newFaq.answer}
                              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                              placeholder="Введите ответ"
                              rows={3}
                              className="bg-white/5 border-white/10 focus:border-primary/50 text-white resize-none"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={addFaqItem} disabled={faqSaving || !newFaq.question.trim() || !newFaq.answer.trim()} className="bg-gradient-to-r from-primary to-[#FF8E53] border-0">
                                {faqSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <><Icon name="Plus" size={14} className="mr-1" />Добавить</>}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setShowNewFaqForm(false); setNewFaq({ question: "", answer: "" }); }} className="border-white/10 hover:bg-white/5">Отмена</Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowNewFaqForm(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/30 text-primary hover:border-primary/60 hover:bg-primary/5 transition-all text-sm font-heading"
                          >
                            <Icon name="Plus" size={16} />
                            Добавить вопрос
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-5">
                      {activeGroup.fields.map((field) => {
                        const key = field.key as keyof SiteSettings;

                        if (field.type === "toggle") {
                          return (
                            <div
                              key={field.key}
                              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                            >
                              <div>
                                <p className="font-heading text-sm font-semibold text-white">
                                  {field.label}
                                </p>
                                {"description" in field && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {(field as { description: string }).description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  updateSetting(field.key, !settings[key])
                                }
                                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                                  settings[key]
                                    ? "bg-primary"
                                    : "bg-white/10"
                                }`}
                              >
                                <span
                                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                    settings[key]
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div key={field.key}>
                            <label className="block font-heading text-sm font-semibold text-white mb-2">
                              {field.label}
                            </label>
                            <Input
                              type={field.type}
                              value={String(settings[key] || "")}
                              onChange={(e) =>
                                updateSetting(field.key, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-primary to-[#FF8E53] hover:shadow-lg hover:shadow-primary/30 font-heading border-0 px-8"
                      >
                        {saving ? (
                          <>
                            <Icon
                              name="Loader2"
                              size={16}
                              className="mr-2 animate-spin"
                            />
                            Сохранение...
                          </>
                        ) : (
                          <>
                            <Icon name="Save" size={16} className="mr-2" />
                            Сохранить
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPage;