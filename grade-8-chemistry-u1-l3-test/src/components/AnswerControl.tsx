import { useId, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Check, Circle, CornerDownLeft, Delete } from 'lucide-react';
import type { AnswerValue, Field, Part } from '../lib/types';
import { parseFormula, plainChemText } from '../lib/chemistry';
import { Chem, ScientificText } from './Chem';

type Setter = (value: AnswerValue) => void;
function FormulaInput({ id, value, onChange, ion = false, label }: { id: string; value: string; onChange: (v: string) => void; ion?: boolean; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const parsed = parseFormula(value);
  const insert = (text: string, caretOffset = 0) => {
    const input = ref.current;
    const start = input?.selectionStart ?? value.length, end = input?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    if (next.length > 100) return;
    flushSync(() => { onChange(next); });
    input?.focus();
    const caret = start + text.length + caretOffset;
    input?.setSelectionRange(caret, caret);
  };
  const backspace = () => {
    const input = ref.current, start = input?.selectionStart ?? value.length, end = input?.selectionEnd ?? value.length;
    const next = start !== end ? value.slice(0, start) + value.slice(end) : start > 0 ? value.slice(0, start - 1) + value.slice(start) : value;
    flushSync(() => { onChange(next); });
    input?.focus();
    const caret = Math.max(0, start - (start === end ? 1 : 0));
    input?.setSelectionRange(caret, caret);
  };
  return <div className="formula-control">
    <input ref={ref} id={id} className="formula-input" dir="ltr" inputMode="text" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={100} value={value} placeholder={ion ? 'الرمز مع الشحنة' : 'اكتب الصيغة الكيميائية'} aria-label={label} onChange={e => onChange(e.target.value.replace(/[\\\s]/g, ''))} />
    <div className="formula-preview" aria-label="معاينة كتابة الصيغة"><span className="preview-label">معاينة الكتابة</span>{parsed ? <Chem formula={value} /> : <span className="preview-empty">{value ? <span dir="ltr">{value}</span> : 'ستظهر صيغتك هنا'}</span>}</div>
    <div className="formula-keys" aria-label="أدوات كتابة الصيغة">
      <button type="button" onClick={() => insert('()', -1)} aria-label="إضافة قوسين"><span dir="ltr">( )</span> قوسان</button>
      {['2', '3', '4'].map(n => <button type="button" key={n} onClick={() => insert(n)} aria-label={`إضافة الرقم ${n}`} dir="ltr">{n}</button>)}
      {ion && <><button type="button" onClick={() => insert('+')} aria-label="إضافة شحنة موجبة" dir="ltr">+</button><button type="button" onClick={() => insert('-')} aria-label="إضافة شحنة سالبة" dir="ltr">−</button></>}
      <button type="button" onClick={backspace} aria-label="حذف الحرف السابق"><Delete size={15} /><span>حذف</span></button>
    </div>
  </div>;
}
function FieldControl({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return <div className={`field-control ${field.kind === 'formula' ? 'field-formula' : ''}`}>
    <label htmlFor={id}>{field.formula && <Chem formula={field.formula} />}<ScientificText text={field.label} /></label>
    {field.kind === 'formula' ? <FormulaInput id={id} value={value} onChange={onChange} ion={field.id === 'cation' || field.id === 'anion'} label={field.label} /> : field.kind === 'select' ? <div className="select-wrap"><select id={id} value={value} onChange={e => onChange(e.target.value)}><option value="">اختر الإجابة</option>{field.options?.map(o => <option key={o.id} value={o.id}>{plainChemText(o.label)}</option>)}</select><CornerDownLeft size={14} aria-hidden="true" /></div> : <div className="number-input-wrap"><input id={id} type="text" inputMode="numeric" autoComplete="off" dir="ltr" maxLength={8} value={value} onChange={e => onChange(e.target.value)} placeholder="0" /><span>عدد</span></div>}
  </div>;
}
export function AnswerControl({ part, value, onChange }: { part: Part; value: AnswerValue | undefined; onChange: Setter }) {
  const id = useId();
  const r = part.response;
  const record = typeof value === 'object' && value && !Array.isArray(value) ? value : {};
  const setField = (key: string, next: string) => onChange({ ...record, [key]: next });
  if (r.kind === 'choice') return <div className="choice-grid" role="radiogroup" aria-labelledby={`${id}-prompt`}>
    {r.options.map((option, i) => <label key={option.id} className={`choice-option ${value === option.id ? 'selected' : ''}`}>
      <input type="radio" name={id} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      <span className="choice-letter">{['أ', 'ب', 'ج', 'د'][i]}</span><span className="choice-copy"><ScientificText text={option.label} /></span><span className="choice-radio">{value === option.id ? <Check size={13} /> : null}</span>
    </label>)}
    <span id={`${id}-prompt`} className="sr-only">{part.prompt.replace(/\{\{|\}\}/g, '')}</span>
  </div>;
  if (r.kind === 'number') return <div className="single-number"><label htmlFor={id}>إجابتك العددية</label><div className="number-input-wrap"><input id={id} type="text" inputMode="numeric" autoComplete="off" dir="ltr" maxLength={8} value={typeof value === 'string' ? value : ''} onChange={e => onChange(e.target.value)} placeholder="0" /><span>{r.unit || 'عدد صحيح'}</span></div></div>;
  if (r.kind === 'matching') return <div className="matching-table"><div className="matching-head"><span>العنصر أو الصيغة</span><span>المطابقة الصحيحة</span></div>{r.rows.map(row => <div className="matching-row" key={row.id}>
    <label htmlFor={`${id}-${row.id}`} className="matching-label">{row.formula && <Chem formula={row.formula} />}<ScientificText text={row.label} /></label>
    <div className="select-wrap"><select id={`${id}-${row.id}`} value={record[row.id] || ''} onChange={e => setField(row.id, e.target.value)}><option value="">اختر المطابقة</option>{r.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select><CornerDownLeft size={14} aria-hidden="true" />
  </div></div>)}</div>;
  if (r.kind === 'judgement') return <div className="judgement-list">{r.rows.map(row => <div className="judgement-row" key={row.id}>
    <ScientificText text={row.statement} className="judgement-statement" />
    <div className="judgement-buttons" role="radiogroup" aria-label="الحكم على العبارة">{[['true', 'صواب'], ['false', 'خطأ']].map(([key, label]) => <label className={`judgement-button ${record[row.id] === key ? 'selected' : ''}`} key={key}><input type="radio" name={`${id}-${row.id}`} checked={record[row.id] === key} onChange={() => onChange({ ...record, [row.id]: key, [`${row.id}.correction`]: '' })} />{record[row.id] === key ? <Check size={15} /> : <Circle size={14} />}{label}</label>)}</div>
    {record[row.id] === 'false' && !!row.correctionOptions?.length && <div className="correction-field"><label htmlFor={`${id}-${row.id}-correction`}>اختر التصحيح</label><div className="select-wrap"><select id={`${id}-${row.id}-correction`} value={record[`${row.id}.correction`] || ''} onChange={e => setField(`${row.id}.correction`, e.target.value)}><option value="">اختر التصحيح العلمي</option>{row.correctionOptions?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select><CornerDownLeft size={14} /></div></div>}
  </div>)}</div>;
  if (r.kind === 'order') return <div className="ordering-list">{r.correct.map((_, i) => <div className="ordering-row" key={i}><label htmlFor={`${id}-${i}`}><span className="stage-number">{i + 1}</span>المرحلة {['الأولى', 'الثانية', 'الثالثة', 'الرابعة'][i]}</label><div className="select-wrap"><select id={`${id}-${i}`} value={Array.isArray(value) ? value[i] || '' : ''} onChange={e => { const next = Array.isArray(value) ? [...value] : Array(r.correct.length).fill(''); next[i] = e.target.value; onChange(next); }}><option value="">اختر المرحلة</option>{r.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select><CornerDownLeft size={14} /></div></div>)}</div>;
  if (r.layout === 'construction') {
    const groups = [
      { title: 'اكتب المكوّنين', fields: r.fields.filter(f => ['cation', 'anion'].includes(f.id)) },
      { title: 'حدّد التكافؤين', fields: r.fields.filter(f => ['valencePositive', 'valenceNegative'].includes(f.id)) },
      { title: 'بادل التكافؤين، بسّط، ثم تحقّق من التعادل', fields: r.fields.filter(f => ['countPositive', 'countNegative'].includes(f.id)) },
      { title: 'اكتب الصيغة النهائية', fields: r.fields.filter(f => f.id === 'formula') },
    ];
    return <div className="construction-stages">{groups.map((group, i) => <section className="construction-stage" key={group.title}><h4><span className="stage-number">{i + 1}</span>{group.title}</h4>{i === 2 && <p className="stage-instruction">اكتب عدد كل مكوّن في الصيغة النهائية، لا قيمة التكافؤ نفسها.</p>}<div className={`field-grid ${group.fields.length === 1 ? 'single-field' : ''}`}>{group.fields.map(field => <FieldControl key={field.id} field={field} value={record[field.id] || ''} onChange={v => setField(field.id, v)} />)}</div></section>)}</div>;
  }
  return <div className={`field-grid ${r.layout === 'inventory' ? 'inventory-grid' : ''} ${r.layout === 'balance' ? 'balance-grid' : ''}`}>{r.fields.map(field => <FieldControl key={field.id} field={field} value={record[field.id] || ''} onChange={v => setField(field.id, v)} />)}</div>;
}
