/**
 * مفتاح إجابات النموذج A ومعايير تصحيحه.
 *
 * ⚠️ ملف مُولَّد آلياً بـ `scripts/extract-source.mjs` من أسئلة المصدر نفسها:
 *    كل إجابة صحيحة، وكل معيار تصحيح جزئي، وكل علامة، وكل تفسير، وكل خطوة حل
 *    منقولة حرفياً من `grade-7-physics-test-Model-A-24-11-26/src/data/questions.ts`.
 *
 * لا تُستورد هذه الوحدة إلا بعد التسليم أو بعد دخول المعلّم (import ديناميكي)،
 * فلا تصل الإجابات إلى حزمة صفحة الاختبار الأصلية.
 */

import type { AnswerKey } from "../lib/grading";
import { rubricMax } from "../lib/grading";

export type { AnswerKey };

export const answerKey: AnswerKey = {
  q1: {
    explanation: "الحركة والسكون حُكمٌ نسبي يعتمد على الجسم المرجعي. الحقيبة ساكنة بالنسبة إلى هيفاء لأن موضعها عندها لا يتغيّر مع الزمن، وهي متحركة بالنسبة إلى ماهر على الرصيف لأن موضعها يتغيّر بالنسبة إليه ما دامت الحافلة تتحرك. لذلك يجب دائماً ذكر المرجع عند وصف حالة جسم.",
    rubric: {
      q1a: {
        kind: "choice",
        marks: 3,
        answer: "q1a-1",
      },
      q1b: {
        kind: "choice",
        marks: 3,
        answer: "q1b-2",
      },
      q1c: {
        kind: "text",
        marks: 4,
        criteria: [
          {
            label: "ذكرت أن الحكم بالحركة أو السكون يعتمد على الجسم المرجعي",
            marks: 1,
            any: [
              "مرجع",
              "بالنسبه",
            ],
          },
          {
            label: "بيّنت أن موضع الحقيبة لا يتغيّر بالنسبة إلى هيفاء، فهي ساكنة بالنسبة إليها",
            marks: 1,
            any: [
              "لا يتغير",
              "ثابت",
              "لا تتبدل",
              "موضعها نفسه",
            ],
            all: [
              "هيفاء|الجالسه|مرجع الاول|المرجع الاول",
            ],
          },
          {
            label: "بيّنت أن موضع الحقيبة يتغيّر بالنسبة إلى ماهر أو الرصيف، فهي متحركة بالنسبة إليه",
            marks: 1,
            any: [
              "يتغير",
              "تتحرك",
              "متحركه",
            ],
            all: [
              "ماهر|الرصيف|الواقف|الشخص|مرجع الثاني|المرجع الثاني|الخارج",
            ],
          },
          {
            label: "استخدمت فكرة تغيّر الموضع (أو البعد) مع الزمن في التفسير",
            marks: 1,
            any: [
              "موضع",
              "مكان",
              "بعد",
              "مسافه",
              "الزمن",
            ],
          },
        ],
        model: "الحركة والسكون نسبيان ويعتمدان على الجسم المرجعي: الحقيبة ساكنة بالنسبة إلى هيفاء لأن موضعها عندها لا يتغيّر مع الزمن، ومتحركة بالنسبة إلى ماهر (الرصيف) لأن موضعها يتغيّر بالنسبة إليه مع الزمن.",
      },
    },
  },
  q2: {
    explanation: "القوة هي كل مؤثر قادر على تغيير الحالة الحركية للجسم أو تغيير شكله. ضغط لينا غيّر شكل الصلصال، ودفعها نقل الكرة من السكون إلى الحركة (تغيير الحالة الحركية). أما الكتلة واللون فليسا من آثار القوة الميكانيكية.",
    rubric: {
      q2a: {
        kind: "text",
        marks: 3,
        criteria: [
          {
            label: "ذكرت تغيّر شكل الصلصال بفعل الضغط",
            marks: 1,
            any: [
              "شكل",
              "انبعج",
              "انبعاج",
              "هيئه",
            ],
            all: [
              "صلصال",
            ],
          },
          {
            label: "ذكرت تغيّر الحالة الحركية للكرة (بدأت الحركة)",
            marks: 1,
            any: [
              "تحرك",
              "حركه",
              "بدات",
              "ساكن",
              "سرع",
            ],
            all: [
              "كره",
            ],
          },
          {
            label: "نسبت الأثرين إلى القوة (الدفع أو الضغط)",
            marks: 1,
            any: [
              "قوه",
              "ضغط",
              "دفع",
            ],
          },
        ],
        model: "أثر القوة في الصلصال: تغيير شكله (انبعاجه) بفعل الضغط. وأثرها في الكرة: تغيير حالتها الحركية (انتقلت من السكون إلى الحركة) بفعل الدفع، أي بفعل القوة.",
      },
      q2b: {
        kind: "matrix",
        marksPerRow: 1,
        rows: [
          {
            id: "r1",
            answer: "motion",
          },
          {
            id: "r2",
            answer: "motion",
          },
          {
            id: "r3",
            answer: "shape",
          },
          {
            id: "r4",
            answer: "shape",
          },
        ],
      },
      q2c: {
        kind: "tf",
        verdict: "false",
        verdictMarks: 1,
        correction: {
          marks: 2,
          criteria: [
            {
              label: "صحّحت بأن القوة لا تغيّر الكتلة ولا اللون",
              marks: 1,
              any: [
                "لا تغير",
                "لا تتغير",
                "لا يتغير",
                "ليس من آثار",
                "لا تؤثر",
                "لا علاقه",
              ],
            },
            {
              label: "ذكرت الأثرين الصحيحين للقوة (تغيير الحالة الحركية وتغيير الشكل)",
              marks: 1,
              all: [
                "حرك",
                "شكل",
              ],
            },
          ],
          model: "العبارة خاطئة. التصحيح: من آثار القوة الميكانيكية تغيير الحالة الحركية للجسم أو تغيير شكله، أما الكتلة واللون فلا يتغيّران بفعل القوة.",
        },
      },
    },
  },
  q3: {
    explanation: "المسار هو مجموعة النقاط التي يمرّ بها الجسم المتحرك خلال حركته، وقد يكون مستقيماً (سيارة على أوتوستراد) أو منحنياً (كرة تتخذ منعطفاً) أو دائرياً (عقارب الساعة). المسافة هي طول المسار الذي يسلكه الجسم، وتُقاس بالمتر.",
    rubric: {
      "q3a-1": {
        kind: "text",
        marks: 1,
        criteria: [
          {
            label: "كتبت المصطلح: المسار",
            marks: 1,
            any: [
              "مسار",
            ],
          },
        ],
        model: "المسار",
      },
      "q3a-2": {
        kind: "text",
        marks: 1,
        criteria: [
          {
            label: "كتبت المصطلح: المسافة",
            marks: 1,
            any: [
              "مسافه",
            ],
          },
        ],
        model: "المسافة",
      },
      q3b: {
        kind: "choice",
        marks: 3,
        answer: "q3b-1",
      },
      "q3c-1": {
        kind: "matrix",
        marksPerRow: 1,
        rows: [
          {
            id: "p1",
            answer: "curved",
          },
          {
            id: "p2",
            answer: "straight",
          },
          {
            id: "p3",
            answer: "circular",
          },
        ],
      },
      "q3c-2": {
        kind: "choice",
        marks: 1,
        answer: "q3c-2-1",
      },
      "q3c-3": {
        kind: "choice",
        marks: 1,
        answer: "q3c-3-2",
      },
    },
  },
  q4: {
    explanation: "عناصر القوة الأربعة: نقطة التأثير (النقطة أ على الجسم)، الحامل (المستقيم الذي تؤثر وفقه القوة، وهو الخط المنقّط المار بأ و ب)، الجهة (من أ إلى ب نحو اليمين)، الشدّة (40 N). يمثَّل طول السهم شدة القوة وفق مقياس الرسم: 1 cm ↔ 10 N، لذلك فإن القوة 60 N يمثلها سهم طوله 60 ÷ 10 = 6 cm. الرسم الصحيح لقوة 20 N نحو اليسار يبدأ من نقطة التأثير أ ويشير رأسه نحو اليسار بطول 2 cm.",
    solution: [
      "طول السهم = الشدّة ÷ 10 N لكل 1 cm",
      "60 N ÷ 10 N/cm = 6 cm",
    ],
    rubric: {
      "q4a-1": {
        kind: "choice",
        marks: 1,
        answer: "q4a-1-1",
      },
      "q4a-2": {
        kind: "choice",
        marks: 1,
        answer: "q4a-2-2",
      },
      "q4a-3": {
        kind: "choice",
        marks: 1,
        answer: "q4a-3-1",
      },
      "q4a-4": {
        kind: "number",
        marks: 1,
        value: 40,
        unit: null,
        steps: null,
        model: "40 N",
      },
      q4b: {
        kind: "choice",
        marks: 3,
        answer: "q4b-1",
      },
      "q4c-1": {
        kind: "choice",
        marks: 1,
        answer: "q4c-1-1",
      },
      "q4c-2": {
        kind: "number",
        marks: 1,
        value: 6,
        unit: {
          options: [
            "cm",
            "m",
            "N",
            "kg",
          ],
          answer: "cm",
          marks: 1,
        },
        steps: null,
        model: "60 N ÷ 10 N/cm = 6 cm",
      },
    },
  },
  q5: {
    explanation: "الحركة المنتظمة: مسافات متساوية خلال فواصل زمنية متساوية. الجسم (أ) يقطع 4 m في كل ثانية فحركته منتظمة، والجسم (ب) يقطع 2 ثم 3 ثم 4 ثم 5 m في كل ثانية فحركته غير منتظمة. المسافة في 10 s = 4 m × 10 = 40 m.",
    solution: [
      "الجسم (أ): 4 m في كل ثانية ← حركة منتظمة",
      "الجسم (ب): 2، 3، 4، 5 m في كل ثانية ← حركة غير منتظمة",
      "المسافة في 10 s = 4 m × 10 = 40 m",
    ],
    rubric: {
      q5a: {
        kind: "choice",
        marks: 2,
        answer: "q5a-1",
      },
      q5b: {
        kind: "choice",
        marks: 2,
        answer: "q5b-2",
      },
      "q5c-1": {
        kind: "text",
        marks: 1,
        criteria: [
          {
            label: "ذكرت أن المسافات المقطوعة متساوية في الفواصل الزمنية المتساوية",
            marks: 1,
            any: [
              "متساويه",
              "نفس المساف",
              "المسافات نفسها",
              "المسافه نفسها",
              "ثابته",
              "4\\s*m",
              "اربعه",
            ],
            none: [
              "غير متساويه",
            ],
          },
        ],
        model: "لأنه يقطع مسافات متساوية (4 m) في كل ثانية، أي في فواصل زمنية متساوية.",
      },
      "q5c-2": {
        kind: "text",
        marks: 1,
        criteria: [
          {
            label: "ذكرت أن المسافات المقطوعة غير متساوية (مختلفة) في الفواصل الزمنية المتساوية",
            marks: 1,
            any: [
              "غير متساويه",
              "مختلفه",
              "متغيره",
              "تزداد",
              "تختلف",
              "ليست متساويه",
              "غير ثابته",
            ],
          },
        ],
        model: "لأنه يقطع مسافات غير متساوية (2 ثم 3 ثم 4 ثم 5 m) في كل ثانية، أي في فواصل زمنية متساوية.",
      },
      q5d: {
        kind: "number",
        marks: 2,
        value: 40,
        unit: {
          options: [
            "m",
            "m/s",
            "s",
            "km",
          ],
          answer: "m",
          marks: 1,
        },
        steps: {
          marks: 1,
          all: [
            "4",
            "10",
          ],
          label: "التعويض: 4 m × 10",
          model: "4 m × 10 = 40 m",
        },
        model: "4 m × 10 = 40 m",
      },
    },
  },
  q6: {
    explanation: "السرعة الوسطية = المسافة ÷ الزمن: 27 km ÷ 0.5 h = 54 km/h. للتحويل من km/h إلى m/s نقسم على 3.6: 54 ÷ 3.6 = 15 m/s. الزمن لقطع 450 m بالسرعة نفسها: t = d ÷ v = 450 ÷ 15 = 30 s.",
    solution: [
      "v = d ÷ t = 27 km ÷ 0.5 h = 54 km/h",
      "التحويل: 54 km/h ÷ 3.6 = 15 m/s",
      "t = d ÷ v = 450 m ÷ 15 m/s = 30 s",
    ],
    rubric: {
      q6a: {
        kind: "choice",
        marks: 2,
        answer: "q6a-1",
      },
      q6b: {
        kind: "number",
        marks: 2,
        value: 54,
        unit: {
          options: [
            "km/h",
            "m/s",
            "km",
            "h",
          ],
          answer: "km/h",
          marks: 1,
        },
        steps: {
          marks: 1,
          all: [
            "27",
            "0\\.5|نصف|1/2|½",
            "÷|/|على|قسم",
          ],
          label: "التعويض: 27 ÷ 0.5",
          model: "v = d ÷ t = 27 km ÷ 0.5 h",
        },
        model: "v = d ÷ t = 27 km ÷ 0.5 h = 54 km/h",
      },
      q6c: {
        kind: "number",
        marks: 2,
        value: 15,
        unit: null,
        steps: null,
        model: "54 km/h ÷ 3.6 = 15 m/s",
      },
      q6d: {
        kind: "number",
        marks: 1,
        value: 30,
        unit: {
          options: [
            "s",
            "m",
            "m/s",
            "min",
          ],
          answer: "s",
          marks: 1,
        },
        steps: null,
        model: "t = d ÷ v = 450 m ÷ 15 m/s = 30 s",
      },
    },
  },
  q7: {
    explanation: "الكتلة مقدار المادة في الجسم، تبقى ثابتة (6 kg) على الأرض وعلى القمر، وتُقاس بالكيلوغرام. الثقل قوة جذب الأرض (أو القمر) للجسم، يُقاس بالنيوتن، ويتغيّر بتغيّر g: على الأرض 6 × 10 = 60 N، وعلى القمر 6 × 1.6 = 9.6 N.",
    rubric: {
      q7a: {
        kind: "choice",
        marks: 2,
        answer: "q7a-1",
      },
      q7b: {
        kind: "choice",
        marks: 2,
        answer: "q7b-1",
      },
      q7c: {
        kind: "choice",
        marks: 2,
        answer: "q7c-1",
      },
      q7d: {
        kind: "tf",
        verdict: "true",
        verdictMarks: 2,
        correction: null,
      },
      q7e: {
        kind: "tf",
        verdict: "false",
        verdictMarks: 1,
        correction: {
          marks: 1,
          criteria: [
            {
              label: "صحّحت بأن الكتلة تبقى ثابتة (والذي يقلّ هو الثقل)",
              marks: 1,
              any: [
                "ثابته",
                "لا تتغير",
                "تبقى",
                "لا تتناقص",
                "نفس الكتله",
                "الثقل هو الذي",
              ],
            },
          ],
          model: "العبارة خاطئة. التصحيح: كتلة الحقيبة تبقى $6\\ \\mathrm{kg}$ ثابتة لا تتغيّر، والذي يتناقص هو ثقلها لأن جاذبية القمر أضعف.",
        },
      },
    },
  },
  q8: {
    explanation: "المقطع أ ب: خط مستقيم مائل تزداد فيه المسافة 10 m في كل ثانية ← حركة منتظمة، وسرعته الوسطية 30 m ÷ 3 s = 10 m/s. المقطع ب ج: خط أفقي، المسافة ثابتة عند 30 m من t = 3 s إلى t = 5 s ← جسم ساكن لمدة 2 s. المقطع ج د: خط منحنٍ تزداد فيه المسافات في كل ثانية ← حركة غير منتظمة.",
    solution: [
      "المقطع أ ب: 30 m في 3 s ← v = 30 ÷ 3 = 10 m/s",
      "المقطع ب ج: المسافة ثابتة ← سكون من 3 s إلى 5 s أي 2 s",
      "المقطع ج د: منحنٍ ← حركة غير منتظمة",
    ],
    rubric: {
      q8a: {
        kind: "matrix",
        marksPerRow: 1,
        rows: [
          {
            id: "ab",
            answer: "uniform",
          },
          {
            id: "bc",
            answer: "rest",
          },
          {
            id: "cd",
            answer: "nonuniform",
          },
        ],
      },
      q8b: {
        kind: "number",
        marks: 1,
        value: 30,
        unit: {
          options: [
            "m",
            "s",
            "m/s",
          ],
          answer: "m",
          marks: 1,
        },
        steps: null,
        model: "30 m",
      },
      q8c: {
        kind: "number",
        marks: 1,
        value: 2,
        unit: {
          options: [
            "s",
            "m",
            "min",
          ],
          answer: "s",
          marks: 1,
        },
        steps: null,
        model: "2 s (من t = 3 s إلى t = 5 s)",
      },
      q8d: {
        kind: "number",
        marks: 1,
        value: 10,
        unit: {
          options: [
            "m/s",
            "m",
            "km/h",
            "s",
          ],
          answer: "m/s",
          marks: 1,
        },
        steps: {
          marks: 1,
          all: [
            "30",
            "3",
            "÷|/|على|قسم",
          ],
          label: "التعويض: 30 m ÷ 3 s",
          model: "v = d ÷ t = 30 m ÷ 3 s",
        },
        model: "v = d ÷ t = 30 m ÷ 3 s = 10 m/s",
      },
    },
  },
  q9: {
    explanation: "w = m × g = 7 kg × 10 N/kg = 70 N. القيمة g = 10 N/kg تعني أن كل 1 kg من الكتلة يقابله ثقل 10 N. واستخراج الكتلة من الثقل: m = w ÷ g = 250 N ÷ 10 N/kg = 25 kg.",
    solution: [
      "w = m × g = 7 kg × 10 N/kg = 70 N",
      "g = 10 N/kg تعني: كل 1 kg كتلة ↔ 10 N ثقلاً",
      "m = w ÷ g = 250 N ÷ 10 N/kg = 25 kg",
    ],
    rubric: {
      q9a: {
        kind: "choice",
        marks: 2,
        answer: "q9a-1",
      },
      q9b: {
        kind: "number",
        marks: 2,
        value: 70,
        unit: {
          options: [
            "N",
            "kg",
            "m/s",
            "N/kg",
          ],
          answer: "N",
          marks: 1,
        },
        steps: {
          marks: 1,
          all: [
            "7",
            "10",
            "×|\\*|x|ضرب",
          ],
          label: "التعويض: 7 kg × 10 N/kg",
          model: "w = m × g = 7 kg × 10 N/kg",
        },
        model: "w = m × g = 7 kg × 10 N/kg = 70 N",
      },
      q9c: {
        kind: "choice",
        marks: 2,
        answer: "q9c-1",
      },
      q9d: {
        kind: "number",
        marks: 1,
        value: 25,
        unit: {
          options: [
            "kg",
            "N",
            "m/s",
          ],
          answer: "kg",
          marks: 1,
        },
        steps: null,
        model: "m = w ÷ g = 250 N ÷ 10 N/kg = 25 kg",
      },
    },
  },
  q10: {
    explanation: "في الجزء الأول تقطع ريم 3 m في كل ثانية، فهي تقطع مسافات متساوية في أزمنة متساوية: حركة منتظمة. دفع الزميلة قوة غيّرت حالتها الحركية بزيادة سرعتها إلى 5 m/s. بعد توقف الدفع أبطأها الاحتكاك مع الأرض الرملية حتى توقفت. المسافة الكلية = 3 × 4 + 5 × 4 = 12 + 20 = 32 m، والسرعة الوسطية = 32 m ÷ 8 s = 4 m/s.",
    solution: [
      "المسافة في الجزء الأول: 3 m × 4 = 12 m",
      "المسافة في الجزء الثاني: 5 m × 4 = 20 m",
      "المسافة الكلية: 12 + 20 = 32 m",
      "v = d ÷ t = 32 m ÷ 8 s = 4 m/s",
    ],
    rubric: {
      q10a: {
        kind: "choice",
        marks: 2,
        answer: "q10a-1",
      },
      q10b: {
        kind: "choice",
        marks: 2,
        answer: "q10b-1",
      },
      q10c: {
        kind: "text",
        marks: 2,
        criteria: [
          {
            label: "ذكرت قوة الاحتكاك مع الأرض (مقاومة الأرض الرملية للحركة)",
            marks: 2,
            any: [
              "احتكاك",
              "مقاومه الارض",
              "الارض الرمليه|الرمليه|الرمل",
              "مقاومه سطح",
              "مقاومه الارض",
            ],
          },
        ],
        model: "قوة الاحتكاك بين أحذيتها والأرض الرملية (مقاومة سطح الأرض لحركتها).",
      },
      q10d: {
        kind: "number",
        marks: 2,
        value: 4,
        unit: {
          options: [
            "m/s",
            "m",
            "s",
          ],
          answer: "m/s",
          marks: 1,
        },
        steps: {
          marks: 1,
          all: [
            "32",
            "8",
            "÷|/|على|قسم",
          ],
          label: "المسافة الكلية 12 + 20 = 32 m ثم 32 ÷ 8",
          model: "d = 3 × 4 + 5 × 4 = 12 + 20 = 32 m؛ v = d ÷ t = 32 m ÷ 8 s",
        },
        model: "d = 3 m × 4 + 5 m × 4 = 12 + 20 = 32 m؛ v = d ÷ t = 32 m ÷ 8 s = 4 m/s",
      },
    },
  },
};

/** علامة كل سؤال — مشتقّة من المفتاح نفسه، لا مكتوبة يدوياً. */
export const QUESTION_MARKS: Record<string, number> = Object.fromEntries(
  Object.entries(answerKey).map(([questionId, question]) => [
    questionId,
    Object.values(question.rubric).reduce((sum, entry) => sum + rubricMax(entry), 0),
  ]),
);
