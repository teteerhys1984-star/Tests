import React, { useState } from 'react'
import { Lock, Unlock, X, BookOpen, CheckCircle2, Layers, ListOrdered, ShieldAlert } from 'lucide-react'
import { examQuestions, unitOneLessons } from '../data/questions'
import type { LessonId } from '../types/exam'
import { RichMathText } from './MathTex'
import { ContactFooter } from './ContactFooter'

interface TeacherModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose }) => {
  const [passwordInput, setPasswordInput] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [viewMode, setViewMode] = useState<'by-lesson' | 'by-question'>('by-lesson')
  const [selectedLessonFilter, setSelectedLessonFilter] = useState<LessonId | 'all'>('all')

  if (!isOpen) return null

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput.trim() === 'somer173') {
      setIsUnlocked(true)
      setErrorMsg('')
    } else {
      setErrorMsg('كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="لوحة المعلم والإجابات النموذجية"
    >
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border-2 border-pink-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-100/90 via-purple-50 to-pink-100/90 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
              {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-purple-950">
                لوحة المعلّم ودليل الإجابات النموذجية
              </h2>
              <p className="text-xs text-purple-700">
                الوحدة الأولى كاملة (الدروس 1–8 · ص 3–39) — 30 سؤالاً رئيسياً · 100 علامة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق لوحة المعلم"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-pink-200 bg-white text-purple-900 hover:bg-pink-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isUnlocked ? (
            <form onSubmit={handleUnlock} className="mx-auto max-w-md py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-700">
                <Lock className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-purple-950">
                منطقة مخصّصة للمعلّم والمشرف التربوي
              </h3>
              <p className="mb-5 text-xs sm:text-sm text-purple-800 leading-relaxed">
                أدخل كلمة مرور المعلّم لعرض مفتاح الإجابات النموذجية وخطوات الحل وتوزيع العلامات ومراجع صفحات الكتاب المدرسي.
              </p>
              <div className="mb-3">
                <input
                  type="password"
                  dir="ltr"
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value)
                    setErrorMsg('')
                  }}
                  placeholder="أدخل كلمة المرور"
                  aria-label="كلمة مرور المعلم"
                  className="w-full rounded-xl border-2 border-pink-300 px-4 py-2.5 text-center text-base font-bold text-purple-950 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              {errorMsg && (
                <p className="mb-3 text-xs font-bold text-rose-600" role="alert">
                  {errorMsg}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:from-pink-700 hover:to-purple-700 active:scale-98 transition"
              >
                فتح دليل الإجابات النموذجية
              </button>
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-right text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>تنبيه تقني:</span>
                </div>
                كلمة المرور هنا وسيلة إخفاء للواجهة فقط (Client-Side UI Gate) لمنع ظهور الحلول للطالبة أثناء المحاولة، وليست مصادقة أمنية حقيقية أو تشفيراً للبيانات.
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Technical Disclaimer Banner */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <strong>تنبيه تقني:</strong> كلمة المرور هنا وسيلة إخفاء للواجهة فقط، وليست مصادقة أمنية حقيقية أو تشفيراً للبيانات.
                </div>
              </div>

              {/* Blueprint Summary Table */}
              <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm sm:text-base font-extrabold text-purple-950">
                  <BookOpen className="h-4 w-4 text-pink-600" />
                  <span>جدول مواصفات الاختبار وتوزيع الأسئلة والعلامات على دروس الوحدة الأولى</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs sm:text-sm bg-white rounded-xl overflow-hidden border border-purple-200">
                    <thead>
                      <tr className="bg-purple-100/90 text-purple-950">
                        <th className="border border-purple-200 px-3 py-2 text-right">رقم الدرس</th>
                        <th className="border border-purple-200 px-3 py-2 text-right">اسم الدرس</th>
                        <th className="border border-purple-200 px-3 py-2 text-center">صفحات الكتاب</th>
                        <th className="border border-purple-200 px-3 py-2 text-center">عدد الأسئلة الرئيسية</th>
                        <th className="border border-purple-200 px-3 py-2 text-center">مجموع العلامات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unitOneLessons.map(lesson => (
                        <tr key={lesson.id} className="hover:bg-pink-50/50">
                          <td className="border border-purple-200 px-3 py-1.5 font-bold text-center">
                            {lesson.number}
                          </td>
                          <td className="border border-purple-200 px-3 py-1.5 font-bold text-purple-950">
                            {lesson.title}
                          </td>
                          <td className="border border-purple-200 px-3 py-1.5 text-center" dir="ltr">
                            ص {lesson.pages}
                          </td>
                          <td className="border border-purple-200 px-3 py-1.5 text-center font-bold">
                            {lesson.questionCount}
                          </td>
                          <td className="border border-purple-200 px-3 py-1.5 text-center font-bold text-pink-700">
                            {lesson.totalMarks}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-pink-100/80 font-extrabold text-purple-950">
                        <td colSpan={3} className="border border-purple-200 px-3 py-2 text-right">
                          المجموع الكلي للوحدة الأولى كاملة
                        </td>
                        <td className="border border-purple-200 px-3 py-2 text-center">30 سؤالاً</td>
                        <td className="border border-purple-200 px-3 py-2 text-center text-pink-800">
                          100 علامة
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Mode Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl border border-pink-200 bg-pink-50/70 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('by-lesson')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === 'by-lesson'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-purple-900 hover:bg-pink-100'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>تنظيم بحسب الدرس (1–8)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('by-question')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === 'by-question'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'text-purple-900 hover:bg-pink-100'
                    }`}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                    <span>تنظيم بحسب تسلسل الأسئلة (1–30)</span>
                  </button>
                </div>

                {viewMode === 'by-lesson' && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedLessonFilter('all')}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        selectedLessonFilter === 'all'
                          ? 'bg-purple-700 text-white'
                          : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                      }`}
                    >
                      جميع الدروس (8)
                    </button>
                    {unitOneLessons.map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setSelectedLessonFilter(l.id)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          selectedLessonFilter === l.id
                            ? 'bg-purple-700 text-white'
                            : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                        }`}
                      >
                        {l.number}. {l.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Questions & Model Answers Display */}
              {viewMode === 'by-lesson' ? (
                <div className="space-y-6">
                  {unitOneLessons
                    .filter(l => selectedLessonFilter === 'all' || l.id === selectedLessonFilter)
                    .map(lesson => {
                      const lessonQuestions = examQuestions.filter(q => q.lessonId === lesson.id)
                      return (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border-2 border-pink-200 bg-white p-4 shadow-xs"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3">
                            <div>
                              <span className="inline-block rounded-full bg-purple-100 px-3 py-0.5 text-xs font-extrabold text-purple-900 mb-1">
                                الدرس {lesson.number} · صفحات الكتاب: {lesson.pages}
                              </span>
                              <h4 className="text-base font-extrabold text-purple-950">
                                {lesson.title}
                              </h4>
                            </div>
                            <span className="rounded-xl bg-pink-100 px-3 py-1 text-xs font-extrabold text-pink-800">
                              {lesson.questionCount} أسئلة · {lesson.totalMarks} علامة
                            </span>
                          </div>

                          <div className="space-y-4">
                            {lessonQuestions.map(q => (
                              <TeacherQuestionCard key={q.id} question={q} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="space-y-4">
                  {examQuestions.map(q => (
                    <TeacherQuestionCard key={q.id} question={q} />
                  ))}
                </div>
              )}

              <ContactFooter />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TeacherQuestionCard: React.FC<{ question: (typeof examQuestions)[number] }> = ({
  question,
}) => {
  return (
    <div className="rounded-xl border border-purple-200/90 bg-purple-50/30 p-3.5 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-purple-800 px-2.5 py-1 text-xs font-extrabold text-white">
            السؤال {question.number}
          </span>
          <span className="rounded-lg bg-pink-100 px-2.5 py-1 text-xs font-bold text-pink-900">
            {question.lessonTitle} (ص {question.pages})
          </span>
          <span className="rounded-lg bg-white border border-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            {question.patternBadge}
          </span>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-extrabold text-emerald-900">
          العلامة الكاملة: {question.totalMarks}
        </span>
      </div>

      <p className="mb-2 text-xs font-semibold text-purple-700">
        المهارة المختبرة: {question.skill}
      </p>

      <div className="mb-3 rounded-lg bg-white p-3 text-sm text-purple-950 border border-pink-100">
        <RichMathText text={question.prompt} />
      </div>

      {/* Branches Model Answers */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.branches.map(b => (
          <div
            key={b.id}
            className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs"
          >
            <div className="flex items-center justify-between font-bold text-emerald-950 mb-1">
              <span>الفرع ({b.label}):</span>
              <span>{b.marks} علامة</span>
            </div>
            <p className="text-purple-900 mb-1">
              <RichMathText text={b.prompt} />
            </p>
            <div className="flex items-center gap-1.5 font-extrabold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>الإجابة النموذجية:</span>
              <span dir="ltr" className="bg-white px-2 py-0.5 rounded border border-emerald-200">
                {b.modelAnswerDisplay}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Steps & Explanation */}
      <div className="rounded-lg bg-white p-3 border border-purple-100 text-xs space-y-1.5">
        <p className="font-bold text-purple-950">خطوات الحل النموذجية:</p>
        <ol className="list-decimal list-inside space-y-1 text-purple-900">
          {question.solutionSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p className="pt-1 text-pink-800 font-semibold border-t border-pink-100">
          القاعدة الرياضية: {question.explanation}
        </p>
      </div>
    </div>
  )
}
