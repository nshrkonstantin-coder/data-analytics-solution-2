import { Link } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useContent } from "@/hooks/useContent";
import Icon from "@/components/ui/icon";

export function RequisitesPage() {
  const { content: settings, loading } = useContent("settings");

  const requisites = [
    {
      label: "Наименование юридического лица",
      value: settings.company_legal_name,
      icon: "Building2",
    },
    {
      label: "ИНН",
      value: settings.company_inn,
      icon: "FileText",
    },
    {
      label: "ОГРН",
      value: settings.company_ogrn,
      icon: "Hash",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F1419]">
      <Navbar />

      <div className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <Icon name="ArrowLeft" size={18} />
              <span className="font-body">На главную</span>
            </Link>

            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white mb-4">
              Реквизиты <span className="text-primary">компании</span>
            </h1>
            <p className="text-muted-foreground font-body text-lg mb-12">
              Юридическая информация для оформления договоров и оплаты
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Icon name="Loader2" size={40} className="text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {requisites.map((item) => (
                  <div
                    key={item.label}
                    className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon name={item.icon} size={22} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-body text-sm mb-1">
                          {item.label}
                        </p>
                        <p className="text-white font-heading text-xl font-bold">
                          {item.value || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RequisitesPage;
