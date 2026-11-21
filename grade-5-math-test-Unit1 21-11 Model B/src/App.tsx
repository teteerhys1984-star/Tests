import React, { useEffect, useMemo, useState } from 'react'
import {
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  KeyRound,
  LayoutGrid,
  List,
  Compass,
} from 'lucide-react'
import { examQuestions, unitOneLessons } from './data/questions'
import type { SavedAttemptState, StudentAnswersMap } from './types/exam'
import { formatDurationHHMMSS } from './utils/mathNorm'
import { gradeFullExam, isExamComplete, isQuestionComplete } from './utils/scoring'
import { playExamSound } from './utils/sound'
import { QuestionCard } from './components/QuestionCard'
import { ResultsView } from './components/ResultsView'
import { TeacherModal } from './components/TeacherModal'
import { ContactFooter } from './components/ContactFooter'

const STORAGE_KEY = 'grade5_math_unit1_arena_exam_v1'

const DEFAULT_STATE: SavedAttemptState = {
  version: 1,
  studentName: '',
  hasStarted: false,
  isSubmitted: false,
  startedAtTimestamp: null,
  submittedAtTimestamp: null,
  currentQuestionIndex: 0,
  answers: {},
  isMuted: false,
}

function loadSavedAttempt(): SavedAttemptState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<SavedAttemptState>
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE
    return {
      version: 1,
      studentName: typeof parsed.studentName === 'string' ? parsed.studentName : '',
      hasStarted: Boolean(parsed.hasStarted),
      isSubmitted: Boolean(parsed.isSubmitted),
      startedAtTimestamp:
        typeof parsed.startedAtTimestamp === 'number' ? parsed.startedAtTimestamp : null,
      submittedAtTimestamp:
        typeof parsed.submittedAtTimestamp === 'number' ? parsed.submittedAtTimestamp : null,
      currentQuestionIndex:
        typeof parsed.currentQuestionIndex === 'number' &&
        parsed.currentQuestionIndex >= 0 &&
        parsed.currentQuestionIndex < examQuestions.length
          ? parsed.currentQuestionIndex
          : 0,
      answers:
        parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      isMuted: Boolean(parsed.isMuted),
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function App() {
  const [attempt, setAttempt] = useState<SavedAttemptState>(() => loadSavedAttempt())
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now())
  const [nameError, setNameError] = useState<string>('')
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false)
  const [displayAllQuestions, setDisplayAllQuestions] = useState<boolean>(false)
  const [showNavigatorGrid, setShowNavigatorGrid] = useState<boolean>(false)

  // Save state to localStorage automatically whenever attempt changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
    } catch {
      // Ignore storage quota errors
    }
  }, [attempt])

  // Real timestamp-driven ascending timer (ticks every 500ms while exam is active)
  useEffect(() => {
    if (!attempt.hasStarted || attempt.isSubmitted || !attempt.startedAtTimestamp) return
    setNowTimestamp(Date.now())
    const interval = window.setInterval(() => {
      setNowTimestamp(Date.now())
    }, 500)
    return () => window.clearInterval(interval)
  }, [attempt.hasStarted, attempt.isSubmitted, attempt.startedAtTimestamp])

  const elapsedSeconds = useMemo(() => {
    if (!attempt.hasStarted || !attempt.startedAtTimestamp) return 0
    const endTs =
      attempt.isSubmitted && attempt.submittedAtTimestamp
        ? attempt.submittedAtTimestamp
        : nowTimestamp
    return Math.max(0, Math.floor((endTs - attempt.startedAtTimestamp) / 1000))
  }, [
    attempt.hasStarted,
    attempt.startedAtTimestamp,
    attempt.isSubmitted,
    attempt.submittedAtTimestamp,
    nowTimestamp,
  ])

  const completedQuestionsCount = useMemo(
    () => examQuestions.filter(q => isQuestionComplete(q, attempt.answers)).length,
    [attempt.answers]
  )
  const remainingQuestionsCount = examQuestions.length - completedQuestionsCount
  const allBranchesCompleted = useMemo(
    () => isExamComplete(attempt.answers, examQuestions),
    [attempt.answers]
  )

  const handleUpdateAnswer = (branchId: string, value: string) => {
    setAttempt(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [branchId]: value,
      },
    }))
  }

  const handleToggleMute = () => {
    setAttempt(prev => ({
      ...prev,
      isMuted: !prev.isMuted,
    }))
  }

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = attempt.studentName.trim()
    if (!trimmedName) {
      setNameError('يرجى كتابة اسمكِ الكامل يا بطلة قبل بدء الاختبار.')
      return
    }
    setNameError('')
    const startTs = Date.now()
    setNowTimestamp(startTs)
    playExamSound('start', attempt.isMuted)
    setAttempt(prev => ({
      ...prev,
      studentName: trimmedName,
      hasStarted: true,
      isSubmitted: false,
      startedAtTimestamp: prev.startedAtTimestamp ?? startTs,
      submittedAtTimestamp: null,
    }))
  }

  // Immediate submission without ANY confirmation dialog
  const handleSubmitExamImmediate = () => {
    if (!allBranchesCompleted) return
    const submitTs = Date.now()
    setNowTimestamp(submitTs)
    playExamSound('submit', attempt.isMuted)
    setAttempt(prev => ({
      ...prev,
      isSubmitted: true,
      submittedAtTimestamp: submitTs,
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRestartNewAttempt = () => {
    const freshState: SavedAttemptState = {
      ...DEFAULT_STATE,
      studentName: attempt.studentName,
      isMuted: attempt.isMuted,
    }
    setAttempt(freshState)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const jumpToFirstIncompleteQuestion = () => {
    const idx = examQuestions.findIndex(q => !isQuestionComplete(q, attempt.answers))
    if (idx !== -1) {
      setAttempt(prev => ({ ...prev, currentQuestionIndex: idx }))
      if (displayAllQuestions) {
        const el = document.getElementById(`question-anchor-${examQuestions[idx].number}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const examSummary = useMemo(() => {
    if (!attempt.isSubmitted) return null
    return gradeFullExam(attempt.answers as StudentAnswersMap, examQuestions)
  }, [attempt.isSubmitted, attempt.answers])

  /* ────────────────────── 1. Results Screen ────────────────────── */
  if (attempt.hasStarted && attempt.isSubmitted && examSummary) {
    return (
      <>
        <ResultsView
          studentName={attempt.studentName}
          summary={examSummary}
          elapsedSeconds={elapsedSeconds}
          submittedAtTimestamp={attempt.submittedAtTimestamp ?? Date.now()}
          onRestartExam={handleRestartNewAttempt}
          onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
        />
        <TeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
        />
      </>
    )
  }

  /* ────────────────────── 2. Welcome / Start Screen ────────────────────── */
  if (!attempt.hasStarted) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-pink-50/80 via-white to-purple-50/70">
        {/* Top Bar */}
        <header className="border-b border-pink-200/80 bg-white/90 backdrop-blur-xs px-4 py-3 shadow-2xs">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-xs font-bold text-pink-700">
                  المنهاج السوري — الصف الخامس الأساسي
                </span>
                <strong className="text-sm sm:text-base font-extrabold text-purple-950">
                  اختبار الرياضيات التفاعلي — الوحدة الأولى كاملة
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={attempt.isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50/70 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-pink-100 transition"
              >
                {attempt.isMuted ? (
                  <>
                    <VolumeX className="h-4 w-4 text-rose-600" />
                    <span className="hidden sm:inline">الصوت مكتوم</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 text-pink-600" />
                    <span className="hidden sm:inline">الصوت مفعّل</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition"
              >
                <KeyRound className="h-3.5 w-3.5 text-purple-700" />
                <span>لوحة المعلّم</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Welcome Card */}
        <main className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-6 sm:py-8">
          <div className="rounded-3xl border-2 border-pink-200 bg-white p-5 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Subtle Girly Decorative Elements (Non-intrusive SVG) */}
            <div className="pointer-events-none absolute -top-6 -left-6 opacity-15" aria-hidden="true">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="45" fill="#f472b6" />
                <path d="M60 10 L72 45 L108 45 L78 66 L90 102 L60 80 L30 102 L42 66 L12 45 L48 45 Z" fill="#c084fc" />
              </svg>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1 text-xs font-extrabold text-pink-800">
                <span>🌸 أهلاً بكِ يا نجمة الصف الخامس 🌸</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 leading-snug">
                الاختبار الشامل للوحدة الأولى في الرياضيات
              </h1>
              <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
                يتألف هذا الاختبار التفاعلي من <strong>30 سؤالاً رئيسياً</strong> تغطي الدروس الثمانية في الوحدة الأولى كاملة (صفحات الكتاب <strong>3–39</strong>)، بمجموع <strong>100 علامة</strong>. اقرئي كل سؤال ورسومه التفاعلية بهدوء وتركيز!
              </p>
            </div>

            {/* Student Name Form & Start Button */}
            <form
              onSubmit={handleStartExam}
              className="mx-auto mt-6 max-w-lg rounded-2xl border-2 border-pink-200/90 bg-gradient-to-br from-pink-50/70 via-white to-purple-50/70 p-4 sm:p-5 shadow-xs"
            >
              <label
                htmlFor="student-name-input"
                className="block text-sm font-extrabold text-purple-950 mb-2"
              >
                اسم الطالبة الثلاثي <span className="text-rose-600">(إلزامي قبل البدء)</span>:
              </label>
              <input
                id="student-name-input"
                type="text"
                value={attempt.studentName}
                onChange={e => {
                  setAttempt(prev => ({ ...prev, studentName: e.target.value }))
                  if (nameError) setNameError('')
                }}
                placeholder="اكتبي اسمكِ هنا يا مبدعة..."
                className="w-full rounded-xl border-2 border-pink-300 bg-white px-4 py-3 text-base font-bold text-purple-950 outline-none transition focus:border-pink-600 focus:ring-2 focus:ring-pink-200"
              />
              {nameError && (
                <p className="mt-2 text-xs font-bold text-rose-600" role="alert">
                  {nameError}
                </p>
              )}

              <button
                type="submit"
                disabled={!attempt.studentName.trim()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 px-6 py-3.5 text-base font-extrabold text-white shadow-md transition hover:from-pink-700 hover:to-purple-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-5 w-5" />
                <span>بدء الاختبار</span>
              </button>
              <p className="mt-2 text-center text-[11px] font-medium text-purple-700">
                ⏱ لا يبدأ المؤقت التصاعدي إلا بعد الضغط على زر «بدء الاختبار»، وتُحفظ إجاباتكِ تلقائياً.
              </p>
            </form>

            {/* Unit 1 Lessons Overview Grid */}
            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm sm:text-base font-extrabold text-purple-950">
                <BookOpen className="h-4 w-4 text-pink-600" />
                <span>نطاق الاختبار — الدروس الثمانية في الوحدة الأولى وتوزيع العلامات:</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {unitOneLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-pink-200/90 bg-pink-50/35 p-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 mb-1">
                        <span>الدرس {lesson.number}</span>
                        <span dir="ltr" className="rounded-full bg-white px-2 py-0.5 border border-pink-200">
                          ص {lesson.pages}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-purple-950 mb-1">
                        {lesson.title}
                      </h3>
                      <p className="text-[11px] text-purple-800 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-pink-200/60 flex items-center justify-between text-xs font-extrabold">
                      <span className="text-purple-900">{lesson.questionCount} أسئلة</span>
                      <span className="text-pink-700">{lesson.totalMarks} علامة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <ContactFooter />
        <TeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
        />
      </div>
    )
  }

  /* ────────────────────── 3. Active Exam Interface ────────────────────── */
  const currentQuestion = examQuestions[attempt.currentQuestionIndex] ?? examQuestions[0]
  const progressPercent = Math.round((completedQuestionsCount / examQuestions.length) * 100)

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-pink-50/60 via-white to-purple-50/50">
      {/* Sticky Exam Header */}
      <header className="sticky top-0 z-30 border-b-2 border-pink-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-4xl px-3 sm:px-6 py-2.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Student info */}
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-extrabold">
                🌸
              </span>
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-purple-950">
                  الطالبة: <span className="text-pink-700">{attempt.studentName}</span>
                </p>
                <p className="text-[11px] text-purple-700 font-medium">
                  اختبار الوحدة الأولى — 30 سؤالاً · 100 علامة
                </p>
              </div>
            </div>

            {/* Timer + Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs sm:text-sm font-extrabold text-purple-950"
                title="الوقت المنقضي منذ بدء الاختبار"
              >
                <Clock className="h-3.5 w-3.5 text-pink-600" />
                <span dir="ltr" className="font-mono tracking-wider">
                  {formatDurationHHMMSS(elapsedSeconds)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={attempt.isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-pink-50 text-purple-900 hover:bg-pink-100"
              >
                {attempt.isMuted ? (
                  <VolumeX className="h-4 w-4 text-rose-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-pink-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setDisplayAllQuestions(prev => !prev)}
                className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-white px-2.5 py-1 text-xs font-bold text-purple-900 hover:bg-purple-50"
                title="تبديل نمط عرض الأسئلة"
              >
                {displayAllQuestions ? (
                  <>
                    <Compass className="h-3.5 w-3.5 text-pink-600" />
                    <span className="hidden sm:inline">سؤالاً بسؤال</span>
                  </>
                ) : (
                  <>
                    <List className="h-3.5 w-3.5 text-pink-600" />
                    <span className="hidden sm:inline">عرض الكل</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowNavigatorGrid(prev => !prev)}
                className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-900 hover:bg-pink-100"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>الأسئلة</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-900 hover:bg-purple-100"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">المعلّم</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
              <span className="text-purple-900">
                الأسئلة المنجزة بالكامل: <strong className="text-pink-700">{completedQuestionsCount}</strong> من 30
              </span>
              <span className="text-purple-700">
                المتبقية: <strong>{remainingQuestionsCount}</strong> ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-pink-100 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Collapsible 1..30 Question Navigator Grid */}
          {showNavigatorGrid && (
            <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-purple-900">
                <span>انتقلي مباشرة إلى أي سؤال (1–30):</span>
                <button
                  type="button"
                  onClick={() => setShowNavigatorGrid(false)}
                  className="text-pink-700 underline text-[11px]"
                >
                  إخفاء الشبكة
                </button>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5" dir="ltr">
                {examQuestions.map((q, idx) => {
                  const done = isQuestionComplete(q, attempt.answers)
                  const isCurrent = !displayAllQuestions && attempt.currentQuestionIndex === idx
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setAttempt(prev => ({ ...prev, currentQuestionIndex: idx }))
                        if (displayAllQuestions) {
                          const el = document.getElementById(`question-anchor-${q.number}`)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                        setShowNavigatorGrid(false)
                      }}
                      className={`flex h-8 items-center justify-center rounded-lg text-xs font-extrabold transition ${
                        isCurrent
                          ? 'ring-2 ring-purple-900 bg-pink-600 text-white'
                          : done
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-pink-200 text-purple-900 hover:bg-pink-100'
                      }`}
                    >
                      {q.number}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Question Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-6 py-5 space-y-6">
        {displayAllQuestions ? (
          <div className="space-y-6">
            {examQuestions.map(q => (
              <div key={q.id} id={`question-anchor-${q.number}`} className="scroll-mt-32">
                <QuestionCard
                  question={q}
                  answers={attempt.answers}
                  onUpdateAnswer={handleUpdateAnswer}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <QuestionCard
              question={currentQuestion}
              answers={attempt.answers}
              onUpdateAnswer={handleUpdateAnswer}
            />

            {/* Previous / Next Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-pink-200 bg-white p-3 shadow-xs">
              <button
                type="button"
                disabled={attempt.currentQuestionIndex === 0}
                onClick={() => {
                  setAttempt(prev => ({
                    ...prev,
                    currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
                  }))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-purple-200 bg-purple-50 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-purple-950 hover:bg-purple-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="h-4 w-4" />
                <span>السؤال السابق</span>
              </button>

              <span className="text-xs sm:text-sm font-extrabold text-purple-900">
                {currentQuestion.number} / 30
              </span>

              <button
                type="button"
                disabled={attempt.currentQuestionIndex === examQuestions.length - 1}
                onClick={() => {
                  setAttempt(prev => ({
                    ...prev,
                    currentQuestionIndex: Math.min(
                      examQuestions.length - 1,
                      prev.currentQuestionIndex + 1
                    ),
                  }))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-pink-300 bg-pink-100/90 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-pink-950 hover:bg-pink-200 disabled:opacity-40 transition"
              >
                <span>السؤال التالي</span>
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* Strict Submission Card («تسليم الاختبار») */}
        <section
          className="rounded-3xl border-2 border-pink-300 bg-gradient-to-r from-pink-50 via-white to-purple-50 p-4 sm:p-6 shadow-md"
          aria-label="منطقة تسليم الاختبار"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <h3 className="text-base sm:text-lg font-extrabold text-purple-950 flex items-center justify-center sm:justify-start gap-2">
                <CheckCircle2
                  className={`h-5 w-5 ${
                    allBranchesCompleted ? 'text-emerald-600' : 'text-pink-500'
                  }`}
                />
                <span>إنهاء المحاولة وتسليم الإجابات</span>
              </h3>
              {allBranchesCompleted ? (
                <p className="text-xs sm:text-sm font-bold text-emerald-800">
                  أحسنتِ! أجبتِ عن جميع الأسئلة والفروع المطلوبة (30 من 30). يمكنكِ الآن الضغط على زر «تسليم الاختبار» لعرض نتيجتكِ فوراً.
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-purple-800">
                    يتفعّل زر <strong>«تسليم الاختبار»</strong> تلقائياً فور إجابتكِ عن جميع الفروع المطلوبة. (بقي لديكِ{' '}
                    <strong className="text-pink-700">{remainingQuestionsCount}</strong> سؤال غير مكتمل).
                  </p>
                  <button
                    type="button"
                    onClick={jumpToFirstIncompleteQuestion}
                    className="inline-block text-xs font-extrabold text-pink-700 underline hover:text-pink-900"
                  >
                    اضغطي هنا للانتقال إلى أول سؤال غير مكتمل ←
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!allBranchesCompleted}
              onClick={handleSubmitExamImmediate}
              className="w-full sm:w-auto min-w-[200px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-700 px-7 py-4 text-base font-extrabold text-white shadow-lg transition hover:from-pink-700 hover:to-purple-800 active:scale-98 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send className="h-5 w-5" />
              <span>تسليم الاختبار</span>
            </button>
          </div>
        </section>
      </main>

      <ContactFooter />
      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
      />
    </div>
  )
}
export default App
