// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUESTIONS } from '../exam/questions';
import { gradePart, stripMath } from '../exam/grading';
import type { AnswerValue, Answers, Part } from '../exam/types';
import { STORAGE_KEY, emptySession, loadSession, saveSession, clearSession } from '../lib/session';
import { buildReport, downloadReport } from '../lib/report';
import { buildPayload, sendWithRetry, retryPending, pendingKey, newAttemptId, ATTEMPT_TIMEOUT_MS } from '../lib/submit';

function correct(p: Part): AnswerValue {
  switch (p.type) {
    case 'mcq': return p.correct;
    case 'multi': return [...p.correct];
    case 'tf': return Object.fromEntries(p.items.map(x => [x.id, x.answer ? {verdict:'true'} : {verdict:'false', correction:x.correctCorrection}]));
    case 'match': return {...p.solution};
    case 'order': return [...p.correctOrder];
    case 'numeric': return Object.fromEntries(p.fields.map(x => [x.id, String(x.answer)]));
    case 'cloze': return Object.fromEntries(p.pieces.flatMap(x => typeof x === 'string' ? [] : [[x.blank.id, x.blank.correct]]));
    case 'plot': return Object.fromEntries(p.targets.map(x => [x.id, {x:x.x,y:x.y}]));
  }
}
function wrong(p: Part): AnswerValue {
  switch (p.type) {
    case 'mcq': return p.options.find(x => x.id !== p.correct)!.id;
    case 'multi': return p.options.filter(x => !p.correct.includes(x.id)).map(x => x.id);
    case 'tf': return Object.fromEntries(p.items.map(x => [x.id, {verdict:x.answer ? 'false':'true'}]));
    case 'match': return Object.fromEntries(p.left.map(x => [x.id, p.right.find(y => y.id !== p.solution[x.id])!.id]));
    case 'order': return [...p.correctOrder.slice(1), p.correctOrder[0]];
    case 'numeric': return Object.fromEntries(p.fields.map(x => [x.id, String(x.answer+1000)]));
    case 'cloze': return Object.fromEntries(p.pieces.flatMap(x => typeof x === 'string' ? [] : [[x.blank.id,x.blank.options.find(o => o.id !== x.blank.correct)!.id]]));
    case 'plot': return Object.fromEntries(p.targets.map(x => [x.id, {x:x.x+100,y:x.y+100}]));
  }
}
const parts = QUESTIONS.flatMap(q => q.parts);
beforeEach(() => localStorage.clear());
describe('each source part', () => {
  it.each(parts.map(p => [p.id, p] as const))('%s: correct, wrong, unanswered', (_id,p) => {
    expect(gradePart(p, {[p.id]:correct(p)}).earned).toBe(p.marks);
    expect(gradePart(p, {}).earned).toBe(0);
    expect(gradePart(p, {[p.id]:wrong(p)}).earned).toBe(0);
  });
  it('all questions contain their original marks and blank order is not credited', () => {
    expect(QUESTIONS.map(q => q.marks)).toEqual([15,15,15,15,15,15,10]);
    for (const q of QUESTIONS) expect(q.parts.reduce((n,p)=>n+p.marks,0)).toBe(q.marks);
    for (const p of parts.filter(p=>p.type==='order')) expect(gradePart(p,{}).earned).toBe(0);
  });
});
describe('session, report and payload', () => {
  it('restores answers and removes only this exam session', () => {
    const state = {...emptySession(), name:'Test', attemptId:'id', status:'running' as const, startedAt:123, answers:{a:'b'}};
    localStorage.setItem('other-exam', 'untouched'); saveSession(state);
    expect(loadSession()).toEqual(state); expect(localStorage.getItem(STORAGE_KEY)).toContain('"a":"b"');
    clearSession(); expect(loadSession()).toEqual(emptySession()); expect(localStorage.getItem('other-exam')).toBe('untouched');
  });
  it('report and payload match source grade and reference contract', () => {
    const answers:Answers = Object.fromEntries(parts.map(p=>[p.id,correct(p)]));
    const report = buildReport({name:'اختبار وهمي',answers,startedAt:1000,submittedAt:61000});
    const payload = buildPayload('test-id','اختبار وهمي',answers,1000,61000);
    expect(report).not.toMatch(/\$|\\(?:parallel|tfrac|sqrt|to|leftrightarrow)/);
    expect(stripMath('\\tfrac{12.4}{2}, \\sqrt{4^2 + 3^2}, A \\to B, A \\leftrightarrow B')).toBe('(12.4)/(2), √(4^2 + 3^2), A → B, A ↔ B');
    expect(report).toContain('100 / 100'); expect(report).toContain('الإجابة الصحيحة');
    expect(payload.reportText).toBe(report); expect(payload.elapsedSec).toBe(60);
    expect(payload.examId).toBe('grade-8-geometry-unit-1-test');
    expect(payload.examTitle).toBe('Grade 8 Geometry Unit 1 Test');
    expect(payload.summary.total).toBe(100); expect(payload.details).toHaveLength(parts.length);
    expect(payload.lessons.reduce((n,l)=>n+l.max,0)).toBe(100);
    expect(Object.keys(payload.summary).sort()).toEqual(['total','max','percentage','gradeLabel','fullQuestions','partialQuestions','wrongQuestions','correctSubparts','partialSubparts','wrongSubparts','unansweredSubparts'].sort());
    expect(newAttemptId()).not.toBe(newAttemptId());
  });
  it('downloads the TXT report with the student name and UTF-8 blob', () => {
    const create = vi.fn(() => 'blob:mock');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {value:create, configurable:true});
    Object.defineProperty(URL, 'revokeObjectURL', {value:revoke, configurable:true});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) {
      expect(this.download).toMatch(/\.txt$/);
      expect(this.download).toContain('طالب');
    });
    downloadReport({name:'طالب',answers:{},startedAt:1000,submittedAt:2000});
    expect(click).toHaveBeenCalledOnce();
    expect((create.mock.calls[0] as unknown as [Blob])[0].type).toBe('text/plain;charset=utf-8');
    click.mockRestore();
  });
  it('distinguishes unanswered parts', () => {
    const payload = buildPayload('test','Test',{},1000,2000);
    expect(payload.reportText).toContain('(12.4)/(2)');
    expect(payload.reportText).toContain('√(4^2 + 3^2)');
    expect(payload.reportText).not.toMatch(/\$|\\(?:parallel|tfrac|sqrt|to|leftrightarrow)/);
    expect(payload.summary.unansweredSubparts).toBe(parts.length);
    expect(payload.summary.total).toBe(0);
  });
});
describe('Google Sheets mock fetch only', () => {
  const payload = () => buildPayload('mock-id','Mock',{},1000,2000);
  it('uses the same body and ID for three attempts, then queues and retries', async () => {
    const fetchImpl = vi.fn(async () => ({text:async()=>'{"ok":false}'}));
    const sleep = vi.fn(async (_ms:number) => {});
    expect(await sendWithRetry(payload(),{fetchImpl,sleep,storage:localStorage})).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(3); expect(sleep.mock.calls.map(x=>x[0])).toEqual([2000,5000]);
    for (const [,init] of fetchImpl.mock.calls as unknown as [string,RequestInit][]) {
      expect(init.method).toBe('POST'); expect(init.headers).toEqual({'Content-Type':'text/plain;charset=utf-8'});
      expect(JSON.parse(String(init.body)).attemptId).toBe('mock-id');
    }
    expect(localStorage.getItem(pendingKey('mock-id'))).not.toBeNull();
    const ok = vi.fn(async () => ({text:async()=>'{"duplicate":true}'}));
    expect(await retryPending({fetchImpl:ok,sleep,storage:localStorage})).toBe(1);
    expect(localStorage.getItem(pendingKey('mock-id'))).toBeNull();
  });
  it('times out hanging fetches and preserves the payload', async () => {
    const hang = vi.fn(() => new Promise<{text:()=>Promise<string>}>(()=>{}));
    const sleep = vi.fn(async (_ms:number) => {});
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    expect(await sendWithRetry(payload(),{fetchImpl:hang,sleep,timeoutMs:1,storage:localStorage})).toBe(false);
    expect(hang).toHaveBeenCalledTimes(3); expect(localStorage.getItem(pendingKey('mock-id'))).not.toBeNull();
  });
});

describe('partial credit on composite parts', () => {
  for (const p of parts) {
    let partial: AnswerValue;
    if (p.type === 'numeric' && p.fields.length > 1) partial = {[p.fields[0].id]:String(p.fields[0].answer)};
    else if (p.type === 'tf' && p.items.length > 1) {
      const x=p.items[0]; partial = {[x.id]:x.answer ? {verdict:'true'} : {verdict:'false',correction:x.correctCorrection}};
    } else if (p.type === 'match' && p.left.length > 1) partial = {[p.left[0].id]:p.solution[p.left[0].id]};
    else if (p.type === 'multi' && p.correct.length > 1) partial = [p.correct[0]];
    else if (p.type === 'cloze') {
      const blanks=p.pieces.flatMap(x=>typeof x==='string'?[]:[x.blank]);
      if (blanks.length > 1) partial={[blanks[0].id]:blanks[0].correct};
    } else if (p.type === 'plot' && p.targets.length > 1) partial={[p.targets[0].id]:{x:p.targets[0].x,y:p.targets[0].y}};
    else if (p.type === 'order' && p.correctOrder.length > 2) partial=[p.correctOrder[1],p.correctOrder[0],...p.correctOrder.slice(2)];
    if (partial !== undefined) it(`${p.id} awards some but not all marks`, () => {
      const earned=gradePart(p,{[p.id]:partial}).earned;
      expect(earned).toBeGreaterThan(0); expect(earned).toBeLessThan(p.marks);
    });
  }
});
