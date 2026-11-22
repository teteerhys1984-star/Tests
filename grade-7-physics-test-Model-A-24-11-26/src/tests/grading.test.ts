import { describe, it, expect } from 'vitest';
import { parseNumber, normalizeArabic } from '../lib/normalize';
import { buildPerfectAnswers, gradeExam, gradeInput, isInputComplete } from '../lib/grading';
import { QUESTIONS } from '../data/questions';
import { texToPlain } from '../lib/tex';
import { formatDuration, reportFileName } from '../lib/report';
import type { Input } from '../types';

function find(id: string): Input {
  const input = QUESTIONS.flatMap((q) => q.parts.flatMap((p) => p.inputs)).find((i) => i.id === id);
  if (!input) throw new Error('missing input ' + id);
  return input;
}

describe('parseNumber', () => {
  it('يقبل الأرقام العربية', () => {
    expect(parseNumber('٥٤')).toBe(54);
    expect(parseNumber('٩٫٦')).toBe(9.6);
  });
  it('يتجاهل الوحدات المكتوبة مع العدد', () => {
    expect(parseNumber('54 km/h')).toBe(54);
    expect(parseNumber('10 m/s')).toBe(10);
    expect(parseNumber('70N')).toBe(70);
    expect(parseNumber('6 cm')).toBe(6);
  });
  it('يقبل النتيجة بعد علامة يساوي', () => {
    expect(parseNumber('27 ÷ 0.5 = 54')).toBe(54);
    expect(parseNumber('7 × 10 = 70 N')).toBe(70);
  });
  it('يحسب التعبيرات الحسابية', () => {
    expect(parseNumber('27 ÷ 0.5')).toBe(54);
    expect(parseNumber('3000/600')).toBe(5);
    expect(parseNumber('7 × 10')).toBe(70);
    expect(parseNumber('12 + 20')).toBe(32);
    expect(parseNumber('450 ÷ 15')).toBe(30);
  });
  it('يرفض النصوص غير الرقمية', () => {
    expect(parseNumber('لا أعرف')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
  });
  it('يتعامل مع الفواصل', () => {
    expect(parseNumber('3,000')).toBe(3000);
    expect(parseNumber('9,6')).toBe(9.6);
  });
});

describe('normalizeArabic', () => {
  it('يزيل التشكيل ويوحّد الهمزات والتاء المربوطة', () => {
    expect(normalizeArabic('مَسَافَةٌ متَسَاوِيَةٌ')).toBe('مسافه متساويه');
    expect(normalizeArabic('أحمد إبراهيم آدم')).toBe('احمد ابراهيم ادم');
    expect(normalizeArabic('الحقيبة')).toBe('الحقيبه');
  });
});

describe('منطق التصحيح', () => {
  it('الإجابة الكاملة من المفتاح تنال 100/100', () => {
    const r = gradeExam(QUESTIONS, buildPerfectAnswers(QUESTIONS));
    expect(r.total).toBe(100);
    expect(r.max).toBe(100);
    expect(r.percentage).toBe(100);
    expect(r.partsCorrect).toBe(r.partsTotal);
    expect(r.partsPartial).toBe(0);
    expect(r.partsWrong).toBe(0);
  });
  it('الإجابات الفارغة تنال 0', () => {
    const r = gradeExam(QUESTIONS, {});
    expect(r.total).toBe(0);
    expect(r.partsWrong).toBe(r.partsTotal);
  });
  it('علامة جزئية: التعويض الصحيح مع خطأ حسابي لاحق', () => {
    const r = gradeInput(find('q6b'), { 'q6b:value': '50', 'q6b:unit': 'km/h', 'q6b:steps': 'v = 27 ÷ 0.5' });
    expect(r.marks).toBe(2);
    expect(r.status).toBe('partial');
  });
  it('علامة الوحدة مستقلة عن صحّة العدد', () => {
    const r = gradeInput(find('q9b'), { 'q9b:value': '17', 'q9b:unit': 'N', 'q9b:steps': 'خطأ' });
    expect(r.marks).toBe(1);
  });
  it('النتيجة الصحيحة بلا تعويض ولا وحدة = علامة العدد فقط', () => {
    const r = gradeInput(find('q9b'), { 'q9b:value': '70' });
    expect(r.marks).toBe(2);
  });
  it('صح أو خطأ: الحكم الصحيح مع تصحيح صحيح = العلامة كاملة', () => {
    const r = gradeInput(find('q2c'), { 'q2c:verdict': 'false', 'q2c:correction': 'القوة لا تغيّر الكتلة، بل تغيّر الحالة الحركية أو الشكل' });
    expect(r.marks).toBe(3);
    expect(r.status).toBe('correct');
  });
  it('صح أو خطأ: حكم خاطئ على عبارة صحيحة = 0', () => {
    expect(gradeInput(find('q7d'), { 'q7d:verdict': 'false' }).marks).toBe(0);
    expect(gradeInput(find('q7d'), { 'q7d:verdict': 'true' }).marks).toBe(2);
  });
  it('النفي لا يمنح معيار الإيجاب', () => {
    expect(gradeInput(find('q5c-1'), { 'q5c-1': 'لأن المسافات غير متساوية' }).marks).toBe(0);
    expect(gradeInput(find('q5c-1'), { 'q5c-1': 'لأنها تقطع مسافات متساوية في كل ثانية' }).marks).toBe(1);
  });
  it('يقبل الإجابات العلمية المكافئة', () => {
    expect(gradeInput(find('q10c'), { 'q10c': 'مقاومة الأرض الرملية' }).marks).toBe(2);
    expect(gradeInput(find('q10c'), { 'q10c': 'قوة الاحتكاك' }).marks).toBe(2);
    expect(gradeInput(find('q3a-1'), { 'q3a-1': 'المَسَار' }).marks).toBe(1);
  });
  it('الأرقام العربية والصيغ الحسابية في خانة النتيجة', () => {
    const r = gradeInput(find('q6b'), { 'q6b:value': '٥٤ km/h', 'q6b:unit': 'km/h', 'q6b:steps': '27 ÷ 0.5' });
    expect(r.marks).toBe(4);
    expect(gradeInput(find('q6c'), { 'q6c:value': '54 / 3.6' }).marks).toBe(2);
  });
  it('التصنيف: علامة لكل صف صحيح', () => {
    const r = gradeInput(find('q8a'), { 'q8a:ab': 'uniform', 'q8a:bc': 'nonuniform', 'q8a:cd': 'nonuniform' });
    expect(r.marks).toBe(2);
  });
  it('اكتمال الحقول', () => {
    expect(isInputComplete(find('q6b'), {})).toBe(false);
    expect(isInputComplete(find('q6b'), { 'q6b:value': '54', 'q6b:unit': 'km/h', 'q6b:steps': 'x' })).toBe(true);
    expect(isInputComplete(find('q6b'), { 'q6b:value': '54', 'q6b:unit': 'km/h' })).toBe(false);
    expect(isInputComplete(find('q2c'), { 'q2c:verdict': 'false' })).toBe(false);
    expect(isInputComplete(find('q2c'), { 'q2c:verdict': 'false', 'q2c:correction': 'كذا' })).toBe(true);
    expect(isInputComplete(find('q2c'), { 'q2c:verdict': 'true' })).toBe(true);
    expect(isInputComplete(find('q8a'), { 'q8a:ab': 'uniform' })).toBe(false);
  });
});

describe('أدوات العرض', () => {
  it('تحويل الصيغ إلى نص مقروء للتقرير', () => {
    expect(texToPlain('$w = m \\times g$')).toBe('w = m × g');
    expect(texToPlain('$v_{avg}=\\dfrac{d}{t}$')).toBe('v_avg=(d) / (t)');
    expect(texToPlain('$27\\ \\mathrm{km}$')).toBe('27 km');
    expect(texToPlain('نص بلا صيغ')).toBe('نص بلا صيغ');
  });
  it('تنسيق المدة واسم الملف', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(3725)).toBe('01:02:05');
    expect(reportFileName('نور أحمد/ علي')).toContain('نور_أحمد');
    expect(reportFileName('نور أحمد')).toMatch(/\.txt$/);
  });
});
