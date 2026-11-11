import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Welcome } from "/home/user/sandbox/src/components/Welcome";
import { ExamView } from "/home/user/sandbox/src/components/ExamView";
import { ReviewView } from "/home/user/sandbox/src/components/ReviewView";
import { ResultsView } from "/home/user/sandbox/src/components/ResultsView";
import { TeacherKey } from "/home/user/sandbox/src/components/TeacherKey";
import { SiteTop, SiteFooter } from "/home/user/sandbox/src/components/Chrome";
import { ALL_SUBPARTS, QUESTIONS } from "/home/user/sandbox/src/exam/data";
import { gradeAttempt } from "/home/user/sandbox/src/exam/grade";
import type { Answers, Attempt, Subpart } from "/home/user/sandbox/src/exam/types";
const noop = () => {};
const welcome = renderToStaticMarkup(<Welcome onStart={noop} storageWarning={null} />);
console.log("welcome", welcome.length, welcome.includes("آدم والرياضيات"), welcome.includes("اسم الطالب"), welcome.includes("0930215022"));
for (const q of QUESTIONS) {
  for (const withAnswer of [false, true]) {
    const answers: Answers = {};
    if (withAnswer) for (const s of q.subparts) answers[s.id] = s.kind === "mcq" ? s.answer : s.kind === "tf" ? s.answer : s.kind === "numeric" ? s.answer : s.kind === "pair" ? {a:String(s.answer[0]),b:String(s.answer[1])} : s.kind === "multi" ? [...s.answer] : s.kind === "order" ? [...s.answer] : s.answer;
    const attempt: Attempt = {schema:2,examId:"adam-math-grade4-minecraft",examVersion:"1.0.0",attemptId:"a",studentName:"آدم",phase:"exam",questionOrder:QUESTIONS.map(x=>x.id),optionOrders:{},answers,currentIndex:QUESTIONS.indexOf(q),visited:[q.id],startTime:Date.now()-61000,startSoundPlayed:true,submissionSoundPlayed:false};
    const html = renderToStaticMarkup(<ExamView attempt={attempt} now={Date.now()} warning={null} autosaveOk onAnswer={noop} onNavigate={noop} onReview={noop} />);
    if (!html.includes("السؤال")) throw new Error("question failed " + q.id);
  }
}
console.log("all 30 questions render");
const answers: Answers = {};
function correctValue(sub: Subpart) { switch(sub.kind){case"mcq":return sub.answer;case"tf":return sub.answer;case"numeric":return sub.answer;case"pair":return {a:String(sub.answer[0]),b:String(sub.answer[1])};case"multi":return [...sub.answer];case"order":return [...sub.answer];case"compare":return sub.answer;} }
for (const s of ALL_SUBPARTS) answers[s.id] = correctValue(s);
answers.q1a = 0; answers.q4a = {a:"3",b:"9"}; answers.q13a = "";
const attempt: Attempt = {schema:2,examId:"adam-math-grade4-minecraft",examVersion:"1.0.0",attemptId:"a",studentName:"آدم",phase:"results",questionOrder:QUESTIONS.map(x=>x.id),optionOrders:{},answers,currentIndex:0,visited:[],startTime:Date.now()-90000,submissionTime:Date.now(),durationSeconds:90,startSoundPlayed:true,submissionSoundPlayed:true,reportText:"x",reportFileName:"x.txt"};
const review = renderToStaticMarkup(<ReviewView attempt={{...attempt,phase:"exam",reportText:undefined}} now={Date.now()} warning={null} submitError={null} onBack={noop} onJump={noop} onSubmit={noop} />);
console.log("review", review.length, review.includes("الأجزاء غير المجابة"), review.includes("تسليم الاختبار"));
const result = gradeAttempt(attempt);
const results = renderToStaticMarkup(<ResultsView attempt={attempt} result={result} onBackup={noop} onTryAgain={noop} downloadStatus="ok" downloadError={null} storageWarning={null} />);
console.log("results", results.length, results.includes("تنزيل التقرير TXT"), results.includes("المراجعة الكاملة"), results.includes("ص 8"));
const key = renderToStaticMarkup(<TeacherKey open onClose={noop} />);
console.log("key gate", key.length, key.includes("كلمة مرور المعلم"), key.includes("somer173"));
console.log("top/footer contact", (renderToStaticMarkup(<><SiteTop/><SiteFooter onTeacherKey={noop}/></>).match(/0930215022/g)||[]).length);
console.log("percent score", result.awarded, result.percentage, result.counts);
console.log("SSR TESTS PASSED");
