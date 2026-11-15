import type { LessonId, Section, SourceRef } from '../types';

export interface LessonMeta {
  id: LessonId;
  unit: string;
  title: string;
  grammarTopic: string;
  grammarPages: string;
  spellingTopic: string;
  spellingPages: string;
  repoFile: string;
}

/**
 * Verified against the source locks of
 * github.com/teteerhys1984-star/Interactive-arabic-grade5 (docs/source-locks/*).
 */
export const LESSONS: Record<LessonId, LessonMeta> = {
  U1L1: {
    id: 'U1L1', unit: 'الوحدة الأولى: أحلامي وطموحاتي', title: 'السمكة الذهبية',
    grammarTopic: 'الجملة وأنواعها (اسمية – فعلية)', grammarPages: '٨',
    spellingTopic: 'الهمزة الأولية (القطع والوصل)', spellingPages: '٩',
    repoFile: 'docs/source-locks/lesson-01-al-smaka-al-dhahabia.md (L1-055, L1-066)',
  },
  U1L2: {
    id: 'U1L2', unit: 'الوحدة الأولى: أحلامي وطموحاتي', title: 'بالرأي والرأي الآخر',
    grammarTopic: 'المصدر', grammarPages: '١٧–١٨',
    spellingTopic: 'همزة القطع ومواضعها', spellingPages: '١٨–٢٠',
    repoFile: 'docs/source-locks/lesson-02-bil-rayi-wal-rayi-al-akhar.md',
  },
  U1L3: {
    id: 'U1L3', unit: 'الوحدة الأولى: أحلامي وطموحاتي', title: 'لغتي',
    grammarTopic: 'أركان الجملة الفعلية', grammarPages: '٢٨–٢٩',
    spellingTopic: 'همزة الوصل ومواضعها', spellingPages: '٣٠–٣٢',
    repoFile: 'docs/source-locks/lesson-03-lughati.md',
  },
  U2L1: {
    id: 'U2L1', unit: 'الوحدة الثانية', title: 'مخترع من بلادي',
    grammarTopic: 'الجملة الاسمية (المبتدأ والخبر)', grammarPages: '٤٤–٤٦',
    spellingTopic: 'الهمزة الأولية (تطبيق)', spellingPages: '٤٦',
    repoFile: 'docs/source-locks/unit2-lesson-01-mukhtari-min-biladi.md',
  },
  U2L2: {
    id: 'U2L2', unit: 'الوحدة الثانية', title: 'الذكاء الاصطناعي',
    grammarTopic: 'تحويل الجملة الفعلية إلى اسمية', grammarPages: '٥٤',
    spellingTopic: 'التاء المبسوطة والتاء المربوطة', spellingPages: '٥٥–٥٦',
    repoFile: 'docs/source-locks/unit2-lesson-02-aldhaka-al-istinaai.md',
  },
};

export const LESSON_ORDER: LessonId[] = ['U1L1', 'U1L2', 'U1L3', 'U2L1', 'U2L2'];

export const SECTION_LABEL: Record<Section, string> = { grammar: 'قواعد اللغة', spelling: 'الإملاء' };

export function sourceRef(lessonId: LessonId, section: Section, skill: string): SourceRef {
  const l = LESSONS[lessonId];
  return {
    unit: l.unit,
    lessonId,
    lessonTitle: l.title,
    pages: section === 'grammar' ? l.grammarPages : l.spellingPages,
    section,
    skill,
    repoFile: l.repoFile,
  };
}
