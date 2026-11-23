export type AppTab = "welcome" | "exam" | "review" | "results" | "teacher";

export const site = {
  name: "حلا والفيزياء",
  nameEn: "Hala & Physics",
  tagline: "مسائل الدرسين الأول والثاني — الصف السابع",
  teacher: "المهندس سومر شاهين",
  teacherShort: "سومر شاهين",
  role: "مدرّس الفيزياء والكيمياء — الصف السابع",
  phoneDisplay: "0930 215 022",
  phoneIntl: "963930215022",
  whatsappDisplay: "0930 215 022",
  whatsappMessage: "مرحباً مهندس سومر، أنا أتابع اختبار «مسائل الدرسين الأول والثاني» وعندي سؤال 🌿",
};

export const whatsappLink = `https://wa.me/${site.phoneIntl}?text=${encodeURIComponent(site.whatsappMessage)}`;

export function scrollToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
