import { Link } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Icon from "@/components/ui/icon";

const REQUISITES = [
  { label: "Полное наименование", value: "Общество с ограниченной ответственностью «ДДМАКСИ СТРОЙРЕМСЕРВИС»", icon: "Building2" },
  { label: "Сокращённое наименование", value: "ООО «ДДМАКСИ СТРОЙРЕМСЕРВИС»", icon: "Building" },
  { label: "Юридический / Почтовый адрес", value: "673634, Забайкальский край, м. о. Газимуро-Заводский, п. Новоширокинский, д. 3, помещ. 10", icon: "MapPin" },
  { label: "Телефон", value: "+7-985-506-08-14", icon: "Phone" },
  { label: "ИНН / КПП", value: "7500009357 / 750001001", icon: "FileText" },
  { label: "ОГРН", value: "1237500001705", icon: "Hash" },
  { label: "Расчётный счёт", value: "40702810074000010251", icon: "CreditCard" },
  { label: "Корреспондентский счёт", value: "30101810500000000637", icon: "Landmark" },
  { label: "БИК банка", value: "047601637", icon: "Barcode" },
  { label: "Банк", value: "ПАО Сбербанк, г. Чита", icon: "Banknote" },
  { label: "E-mail", value: "ddmaxi-srs@yandex.ru", icon: "Mail" },
];

export function RequisitesPage() {
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

            <div className="space-y-3">
              {REQUISITES.map((item) => (
                <div
                  key={item.label}
                  className="bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-5 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground font-body text-xs mb-1">{item.label}</p>
                      <p className="text-white font-heading text-lg font-bold">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-card/50 backdrop-blur-xl border border-primary/20 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="https://cdn.poehali.dev/files/26b1c043-7d1b-44ff-a364-1ccbca26a7d8.png"
                    alt="QR-код для оплаты"
                    className="w-44 h-44 rounded-xl object-contain bg-white p-1"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="QrCode" size={20} className="text-primary" />
                    <h3 className="font-heading text-lg font-bold text-white">Оплата по QR-коду</h3>
                  </div>
                  <p className="text-muted-foreground font-body text-sm mb-3">
                    Отсканируйте QR-код в приложении вашего банка — все реквизиты заполнятся автоматически. Поддерживается в большинстве банков России (СБПэй, Сбербанк, Тинькофф и другие).
                  </p>
                  <p className="text-yellow-400 text-xs flex items-start gap-2">
                    <Icon name="Info" size={14} className="flex-shrink-0 mt-0.5" />
                    Не забудьте указать в комментарии к платежу номер вашего заказа, например: <strong>«Оплата по Заказу №123»</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RequisitesPage;