import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { authService } from "@/lib/auth";

const ADMIN_API_URL =
  "https://functions.poehali.dev/60c925e5-07c4-4e22-acbb-7c60c1d9524d";

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_telegram: string;
  social_vk: string;
  social_youtube: string;
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

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [activeGroup, setActiveGroup] = useState(SETTING_GROUPS[0]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyAdmin = async () => {
      const result = await authService.verifySession();
      if (!result.valid || result.user?.role !== "admin") {
        navigate("/login");
      } else {
        await loadSettings();
      }
    };
    verifyAdmin();
  }, [navigate]);

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
