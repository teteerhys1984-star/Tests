export type AppTab = "home" | "motion" | "force" | "teacher";

export const site = {
  name: "حلا والفيزياء",
  nameEn: "Hala & Physics",
  tagline: "مسائل تفكير… مش حفظ 🌿",
  teacher: "المهندس سومر شاهين",
  teacherShort: "سومر شاهين",
  role: "مدرّس الفيزياء والكيمياء — الصف السابع",
  phoneDisplay: "0930 215 022",
  phoneIntl: "963930215022",
  whatsappMessage: "مرحباً مهندس سومر، أنا أتابع مسائل «حلا والفيزياء» وعندي سؤال 🌿",
};

export const whatsappLink = `https://wa.me/${site.phoneIntl}?text=${encodeURIComponent(site.whatsappMessage)}`;

export const tabs: { id: AppTab; label: string; shortLabel: string }[] = [
  { id: "home", label: "الرئيسية", shortLabel: "الرئيسية" },
  { id: "motion", label: "مسائل الدرس الأول", shortLabel: "الدرس الأول" },
  { id: "force", label: "مسائل الدرس الثاني", shortLabel: "الدرس الثاني" },
  { id: "teacher", label: "منطقة المعلم", shortLabel: "المعلم" },
];

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
