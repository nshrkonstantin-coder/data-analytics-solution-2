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
  { label: "Генеральный директор", value: "Шнюков Константин Анатольевич", icon: "User" },
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

            <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
              <p className="text-yellow-400 text-sm flex items-start gap-2">
                <Icon name="Info" size={16} className="flex-shrink-0 mt-0.5" />
                В назначении платежа обязательно укажите номер вашего заказа, например: <strong>«Оплата по Заказу №123»</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default RequisitesPage;
