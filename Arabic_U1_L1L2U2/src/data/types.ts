export type LessonId = 'U1L1' | 'U1L2' | 'U1L3' | 'U2L1' | 'U2L2';
export type Section = 'grammar' | 'spelling';
export type Difficulty = 'basic' | 'intermediate' | 'advanced';

export interface SourceRef {
  unit: string;
  lessonId: LessonId;
  lessonTitle: string;
  pages: string;
  section: Section;
  skill: string;
  repoFile: string;
}

interface SubBase {
  id: string;
  prompt: string;
  marks: number;
  explanation: string;
  skill: string;
  misconception?: string;
}

export interface McqSub extends SubBase {
  kind: 'mcq';
  options: string[];
  correct: number;
}
export interface MultiSub extends SubBase {
  kind: 'multi';
  options: string[];
  correct: number[];
}
export interface TextSub extends SubBase {
  kind: 'text';
  accepted: string[];
  placeholder?: string;
}
export interface GroupSub extends SubBase {
  kind: 'group';
  choices: string[];
  items: { label: string; answer: number }[];
}
export type Subpart = McqSub | MultiSub | TextSub | GroupSub;

export interface Question {
  id: string;
  lessonId: LessonId;
  section: Section;
  difficulty: Difficulty;
  instruction: string;
  stem?: string;
  subparts: Subpart[];
}

/** Answer values: mcq -> number, multi -> number[], text -> string, group -> (number|null)[] */
export type AnswerValue = number | number[] | string | (number | null)[];
export type Answers = Record<string, AnswerValue | undefined>;
