import type { LessonId } from "./exam";

export type LessonInfo = {
  title: string;
  topics: string[];
};

/** Curriculum mapping used only after submission (results, report, teacher area). */
export const LESSONS: Record<LessonId, LessonInfo> = {
  1: {
    title: "Sentence Structure",
    topics: [
      "Subject",
      "Verb",
      "Object",
      "Subject + Verb + Object word order",
      "Some verbs have no object",
    ],
  },
  2: {
    title: "Verb to be — am, is, are",
    topics: [
      "Affirmative sentences with am / is / are",
      "Subject pronouns (I, you, he, she, it, we, they)",
      "Replacing names and nouns with pronouns",
    ],
  },
  3: {
    title: "Verb to be — negative, questions, short answers",
    topics: ["Negative with not", "Yes / No questions", "Short answers"],
  },
  4: {
    title: "Nouns and Articles",
    topics: [
      "What a noun is",
      "a vs an",
      "the for something specific",
      "Singular and plural with articles",
    ],
  },
  5: {
    title: "Adjectives",
    topics: [
      "Adjectives with the verb to be",
      "Adjective before a noun",
      "Adjectives have no plural",
      "Adjective or noun",
      "Opposite adjectives",
    ],
  },
  16: {
    title: "Possessive Adjectives",
    topics: [
      "my, your, his, her, its, our, their",
      "Possessive adjective + noun",
      "Subject pronoun vs possessive adjective",
      "its vs it's",
    ],
  },
  17: {
    title: "Possessive Pronouns",
    topics: [
      "mine, yours, his, hers, ours, theirs",
      "Possessive adjective vs possessive pronoun",
      "Whose?",
      "your / you're and their / they're",
    ],
  },
  18: {
    title: "Plural Nouns",
    topics: [
      "a / an with singular nouns only",
      "Regular plurals: -s, -es, -ies, -ves",
      "Irregular plurals",
      "is / are with singular and plural nouns",
    ],
  },
};

export function lessonLabel(lesson: LessonId): string {
  return `Lesson ${lesson} — ${LESSONS[lesson].title}`;
}
