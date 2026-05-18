import { z } from 'zod';

export const LessonPlanAIResultSchema = z.object({
  title: z.string().optional(),
  grade: z.string().optional(),
  subject: z.string().optional(),
  curriculum: z.string().optional(),
  duration: z.string().optional(),
  
  learningObjectives: z.array(z.string()).min(2),
  priorKnowledge: z.array(z.string()).optional(),
  keyVocabulary: z.array(z.string()).optional(),
  keyConcepts: z.array(z.string()).optional(),
  materialsRequired: z.array(z.string()).optional(),
  
  introduction: z.string().min(20),
  lessonFlow: z.array(z.object({
    step: z.string(),
    description: z.string(),
    time: z.string().optional()
  })).min(3).default([]),
  
  activities: z.array(z.object({
    time: z.string().optional(),
    description: z.string(),
    recap: z.string().optional(),
    tip: z.string().optional(),
  })).default([]),
  
  discussionQuestions: z.array(z.string()).optional(),
  bloomsTaxonomy: z.array(z.object({
    level: z.string(),
    description: z.string()
  })).optional(),
  
  guidedPractice: z.array(z.string()).optional(),
  assessment: z.array(z.string()).default([]),
  reflectionQuestions: z.array(z.string()).optional(),
  commonMisconceptions: z.array(z.string()).optional(),
  
  differentiationStrategies: z.object({
    slowLearners: z.array(z.string()).optional(),
    advancedLearners: z.array(z.string()).optional()
  }).optional(),
  
  homework: z.array(z.string()).optional(),
  realWorldConnection: z.string().optional(),
  teacherNotes: z.array(z.string()).optional(),
  summary: z.string().default(''),
  
  // Backward compatibility keys
  objective: z.array(z.string()).optional(),
  teacherInstructions: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

export const QuizAIResultSchema = z.object({
  title: z.string(),
  questions: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]).optional(),
        type: z.string().optional(),
        question: z.string(),
        options: z.array(z.string()).min(4).max(4).optional(),
        correctAnswer: z.string().optional(),
        bloomLevel: z.string().optional(),
      })
    )
    .min(1),
}).superRefine((val, ctx) => {
  for (let i = 0; i < val.questions.length; i++) {
    const q = val.questions[i];
    if (q.options && q.options.length === 4 && !q.correctAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MCQ question is missing correctAnswer',
        path: ['questions', i, 'correctAnswer'],
      });
    }
  }
});

export const AssignmentAIResultSchema = z.object({
  title: z.string(),
  instructions: z.string().min(20),
  shortQuestions: z.array(z.string()).min(2),
  longQuestions: z.array(z.string()).min(2),
  practicalActivities: z.array(z.string()).min(1),
  criticalThinking: z.array(z.string()).min(1),
  submissionGuidelines: z.string().min(15),
  mcqs: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answer: z.string()
  })).optional(),
  // backward-compat fallback keys if model uses old naming
  assignmentQuestions: z.array(z.string()).optional(),
  activityQuestions: z.array(z.string()).optional(),
  answers: z
    .object({
      assignmentQuestions: z.array(z.string()).optional().default([]),
      activityQuestions: z.array(z.string()).optional().default([]),
      mcqs: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export const MaterialAIResultSchema = z.object({
  title: z.string(),
  explanation: z.string().min(40),
  definitions: z.array(z.object({ term: z.string(), meaning: z.string() })).min(1),
  examples: z.array(z.string()).min(2),
  formulas: z.array(z.string()).default([]),
  keyPoints: z.array(z.string()).min(3),
  summary: z.string().min(20),
  studyTips: z.array(z.string()).optional(),
  content: z.string().optional(),
});

export const QuestionPaperAIResultSchema = z.object({
  title: z.string().optional().default('Examination Paper'),
  totalMarks: z.any().optional(),
  instructions: z.string().optional().default('Attempt all questions.'),
  sections: z.array(
    z.object({
      name: z.string().optional().default('General Section'),
      questions: z.array(
        z.object({
          id: z.any().optional(),
          q: z.string().optional().default('Question stems missing...'),
          marks: z.any().optional().default(1),
          type: z.string().optional().default('Subjective'),
          options: z.array(z.any()).optional().default([]),
        })
      ).optional().default([]),
    })
  ).optional().default([]),
  answerKey: z.any().optional(),
  markingScheme: z.string().optional(),
}).transform((val) => {
  const sections = Array.isArray(val.sections) ? val.sections : [];
  
  // Flatten all questions to calculate actual marks
  const allQuestions = sections.flatMap(s => Array.isArray(s.questions) ? s.questions : []);
  
  const actualSum = allQuestions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
  
  let qCounter = 1;
  const processedSections = sections.map(section => ({
    ...section,
    questions: (Array.isArray(section.questions) ? section.questions : []).map(q => {
      const id = q.id || `Q${qCounter++}`;
      return { ...q, id, marks: Number(q.marks) || 1 };
    })
  }));

  return {
    ...val,
    sections: processedSections,
    totalMarks: actualSum > 0 ? actualSum : (Number(val.totalMarks) || 80),
  };
});

export const PPTAIResultSchema = z.object({
  title: z.string(),
  slides: z.array(z.object({
    title: z.string(),
    content: z.array(z.string()).optional(),
    subtitle_1: z.string().optional(),
    subtitle_2: z.string().optional(),
    image: z.string().optional(),
    layout: z.enum(['organic_title', 'timeline_process', 'thank_you']).default('timeline_process'),
    tag: z.string().optional(),
    theme: z.string().optional()
  })).min(3)
});

export const SummaryAIResultSchema = z.object({
  overview: z.string().min(10),
  keyConcepts: z.array(z.string()).default([]),
  definitions: z.array(z.object({
    term: z.string(),
    meaning: z.string()
  })).default([]),
  revisionNotes: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([])
});
