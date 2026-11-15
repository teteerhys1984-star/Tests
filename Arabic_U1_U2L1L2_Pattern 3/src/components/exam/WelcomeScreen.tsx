import { useState } from "react";
import { Flower2, Clock, BookOpen, Volume2, VolumeX, KeyRound } from "lucide-react";
import { Butterfly } from "../common/Decor";

interface Props {
  onStart: (name: string) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  onOpenTeacher: () => void;
}

export default function WelcomeScreen({ onStart, soundOn, onToggleSound, onOpenTeacher }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleStart = () => {
    const n = name.trim();
    if (!n) {
      setError("يرجى إدخال الاسم الكامل قبل البدء.");
      return;
    }
    if (n.length < 3) {
      setError("يرجى إدخال الاسم الكامل (ثلاثة أحرف على الأقل).");
      return;
    }
    onStart(n);
  };

  return (
    <div className="fade-in mx-auto max-w-2xl px-4 py-10">
      <div className="card-soft relative overflow-hidden p-6 sm:p-10">
        <div className="absolute left-4 top-4"><Butterfly /></div>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-400 text-white shadow-lg">
            <Flower2 className="h-9 w-9" />
          </div>
          <p className="text-sm font-bold text-pink-600">حديقة المعرفة – The Garden of Knowledge</p>
          <h1 className="mt-2 text-2xl font-bold leading-relaxed text-pink-900 sm:text-3xl">
            اختبار اللغة العربية – الصف الخامس الأساسي
          </h1>
          <p className="mt-2 text-base text-violet-800">
            الوحدة الأولى كاملة + الدرس الأول والثاني من الوحدة الثانية
          </p>
          <p className="mt-1 text-sm text-pink-700">قواعد اللغة والإملاء فقط • 30 سؤالًا • 100 درجة</p>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl bg-pink-50 p-4 text-sm leading-relaxed text-pink-900 sm:grid-cols-2">
          <div className="flex items-start gap-2"><BookOpen className="mt-1 h-5 w-5 shrink-0 text-pink-500" /><span>الوحدة الأولى: السمكة الذهبية، بالرأي والرأي الآخر، لغتي.</span></div>
          <div className="flex items-start gap-2"><BookOpen className="mt-1 h-5 w-5 shrink-0 text-violet-500" /><span>الوحدة الثانية: مخترع من بلادي، الذكاء الاصطناعي.</span></div>
          <div className="flex items-start gap-2"><Clock className="mt-1 h-5 w-5 shrink-0 text-pink-500" /><span>يبدأ المؤقت بعد الضغط على زر البدء، ويُحفظ تلقائيًا عند تحديث الصفحة.</span></div>
          <div className="flex items-start gap-2"><Flower2 className="mt-1 h-5 w-5 shrink-0 text-violet-500" /><span>اختبار رسمي: لا تظهر الإجابات أو الدرجات أثناء الاختبار.</span></div>
        </div>

        <div className="mt-6">
          <label htmlFor="student-name" className="mb-2 block text-base font-bold text-pink-900">
            اسم الطالبة الكامل <span className="text-pink-600">*</span>
          </label>
          <input
            id="student-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
            className="input-ar text-lg"
            placeholder="مثال: سارة محمد أحمد"
            autoComplete="name"
          />
          {error && <p className="mt-2 text-sm font-bold text-red-600" role="alert">{error}</p>}
        </div>

        <button onClick={handleStart} className="btn-primary mt-6 w-full px-6 py-4 text-xl">
          بدء الاختبار
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onToggleSound} className="btn-soft flex items-center gap-2 px-4 py-2 text-sm" aria-pressed={soundOn}>
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            الصوت: {soundOn ? "مفعّل" : "مغلق"}
          </button>
          <button onClick={onOpenTeacher} className="btn-soft flex items-center gap-2 px-4 py-2 text-sm">
            <KeyRound className="h-5 w-5" />
            مفتاح المعلم
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-pink-500">مفتاح المعلم مخصص للمعلمة فقط ولا يُفتح أثناء الاختبار الجاري.</p>
      </div>
    </div>
  );
}
