// @ts-nocheck
import { Groq } from 'groq-sdk';
import { z } from 'zod';
import { 
    LessonPlanAIResultSchema, 
    QuizAIResultSchema, 
    MaterialAIResultSchema, 
    QuestionPaperAIResultSchema,
    PPTAIResultSchema,
    AssignmentAIResultSchema,
    SummaryAIResultSchema
} from './ai-schemas.js';
import { AcademicGovernance } from './ai-governance.js';
import { parseJsonLoose } from './ai-guard.js';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

function formatUntrustedContext(label: string, text: string, maxChars = 2000) {
    if (!text) return "";
    const clean = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").slice(0, maxChars);
    return `\n--- [REFERENCE CONTEXT: ${label}] ---\n${clean}\n--- [END CONTEXT] ---\n`;
}

export class AIService {
    private static async runWithFallbackValidated<T>(
        prompt: string,
        schema: z.ZodSchema<T>,
        type: string,
        fallback: () => T
    ): Promise<{ data: T; meta: any }> {
        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.6,
                max_tokens: 8000,
            });

            let raw = completion.choices[0]?.message?.content || '{}';
            raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const { value: parsed } = parseJsonLoose(raw);
            const validated = schema.safeParse(parsed);
            
            if (validated.success) {
                return { data: validated.data, meta: { source: 'ai', model: completion.model } };
            }

            console.warn(`[AI] Validation failed for ${type}:`, JSON.stringify(validated.error.format(), null, 2));
            return { data: fallback(), meta: { source: 'simulation', error: validated.error.message } };
        } catch (error: any) {
            console.error(`[AI] Error in ${type}:`, error.message);
            return { data: fallback(), meta: { source: 'simulation', error: error.message } };
        }
    }

    static async generateLessonPlan(topic: string, grade: string, subject: string, pdfContext: string = "", unitDetails: string = "", duration: string = "45", numSessions: string = "1", detailLevel: number = 50) {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);
        if (unitDetails) contextPrompt += `\n\nSpecific Teacher Instructions: "${unitDetails}"\n\n`;
        
        const prompt = `You are a Senior Academic Architect and Institutional Curriculum Designer.
Generate a high-density, professional LESSON PLAN for: "${topic}".
Context: Class ${grade}, Subject: ${subject}, Duration: ${duration} minutes.
${contextPrompt}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON.
2. Provide DEEP, multi-paragraph instructional text in every section.
3. The lessonFlow must have at least 5-7 distinct phases with 3-4 sentences each.
4. Include 5-8 measurable learning objectives.
5. Provide real-world applications for every core concept.
6. Target Detail Level: ${detailLevel}/100 (Extensive depth required).

SCHEMA:
{
  "title": "Lesson: ${topic}",
  "subject": "${subject}",
  "grade": "Grade ${grade}",
  "curriculum": "Standard",
  "duration": "${duration} mins",
  "learningObjectives": ["Extensive objective 1...", "Objective 2..."],
  "introduction": "A very detailed 5-minute hook and engagement strategy (at least 20 words)...",
  "priorKnowledge": ["Detail 1...", "Detail 2..."],
  "keyVocabulary": ["Term 1: Definition...", "Term 2: Definition..."],
  "keyConcepts": ["Concept 1...", "Concept 2..."],
  "materialsRequired": ["Item 1...", "Item 2..."],
  "lessonFlow": [
    {"step": "Phase 1", "description": "Long, detailed instructional text (at least 3-4 sentences)...", "time": "10m"},
    {"step": "Phase 2", "description": "Further deep explanation and examples...", "time": "15m"}
  ],
  "activities": [
    {"description": "A comprehensive active learning task with step-by-step instructions...", "time": "20m", "tip": "Expert teacher tip..."}
  ],
  "assessment": ["Formative check 1...", "Deep evaluation question 2..."],
  "homework": ["A meaningful extended project or task..."],
  "summary": "A deep academic recap of everything covered."
}`;

        return this.runWithFallbackValidated(
            prompt,
            LessonPlanAIResultSchema,
            "LessonPlan",
            () => ({
                title: `Lesson: ${topic}`,
                subject,
                grade: `Grade ${grade}`,
                curriculum: "Standard",
                duration: `${duration} mins`,
                learningObjectives: [`Master the foundational concepts of ${topic}.`, `Apply ${topic} principles in real-world scenarios.`],
                introduction: `This comprehensive session on ${topic} explores fundamental principles through interactive inquiry and guided instruction.`,
                lessonFlow: [
                    { step: "Introduction", description: `Overview of ${topic} and engagement.`, time: "10m" },
                    { step: "Core Instruction", description: `Detailed exploration of ${topic} concepts.`, time: "25m" },
                    { step: "Conclusion", description: `Recap and assessment of ${topic}.`, time: "10m" }
                ],
                activities: [{ description: `Guided interaction on ${topic}.`, time: "15m" }],
                summary: "Professional pedagogical session completed."
            })
        );
    }

    static async generateQuiz(topic: string, grade: string, subject: string, questionType: string = "MCQ", bloomLevel: string = "Mixed", count: number = 5, pdfContext: string = "") {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);
        
        const prompt = `Generate a high-quality ${count}-question MCQ quiz for: "${topic}" (Grade ${grade}, ${subject}).
Ensure clear questions and professional distractor options.
${contextPrompt}

RETURN JSON:
{
  "title": "Quiz: ${topic}",
  "questions": [
    {
      "question": "Clear academic question?",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correctAnswer": "The correct option exactly as written in options array",
      "bloomLevel": "${bloomLevel}"
    }
  ]
}`;

        return this.runWithFallbackValidated(
            prompt,
            QuizAIResultSchema,
            "Quiz",
            () => ({
                title: `Quiz: ${topic}`,
                questions: [{ question: `Basic question about ${topic}?`, options: ["A", "B", "C", "D"], correctAnswer: "A" }]
            })
        );
    }

    static async generateStudyMaterial(topic: string, grade: string, subject: string, pdfContext: string = "", unitDetails: string = "") {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);
        
        const prompt = `Generate DEEP and COMPREHENSIVE study material for: "${topic}" (Grade ${grade}, ${subject}).
Provide long explanations, multiple examples, and clear definitions.
${contextPrompt}
${unitDetails ? `Constraints: ${unitDetails}` : ""}

RETURN JSON:
{
  "title": "Study Guide: ${topic}",
  "explanation": "Extensive 5-8 paragraph academic explanation of the topic...",
  "definitions": [{"term": "Term", "meaning": "Detailed meaning..."}],
  "examples": ["Example 1 with context...", "Example 2 with context..."],
  "keyPoints": ["Crucial point 1...", "Crucial point 2..."],
  "summary": "Professional summary...",
  "studyTips": ["Strategy 1...", "Strategy 2..."]
}`;

        return this.runWithFallbackValidated(
            prompt,
            MaterialAIResultSchema,
            "Material",
            () => ({
                title: `Study Material: ${topic}`,
                explanation: `Comprehensive notes on ${topic}.`,
                definitions: [{ term: topic, meaning: "Core subject of study" }],
                examples: ["Standard example"],
                keyPoints: ["Foundational concept"],
            })
        );
    }

    static async generatePPT(topic: string, grade: string, curriculum: string, slideCount: number = 5, pdfContext: string = "", subject: string = "", duration: string = "45", unitDetails: string = "") {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);
        if (unitDetails) contextPrompt += `\n\nSpecific Teacher Instructions: "${unitDetails}"\n\n`;
        
        const prompt = `You are a Senior Instructional Designer and Visual Pedagogy Expert.
Generate a structured EDUCATIONAL PRESENTATION for: "${topic}".
Context: Subject: ${subject}, Grade: ${grade}, Curriculum: ${curriculum.toUpperCase()}, Total Session Time: ${duration} minutes.
Target Slides: ${slideCount}.
${contextPrompt}

STRICT REQUIREMENTS:
1. Return ONLY valid JSON matching the schema.
2. Every slide must have a clear title and deep instructional content.
3. Use 'organic_title' for the first slide and 'timeline_process' for content slides.
4. Each content slide must have 4-5 high-density bullet points (at least 15 words each).
5. For the first slide (Title Slide):
   - "subtitle_1" MUST be: "${subject} | ${curriculum.toUpperCase()} Protocol"
   - "subtitle_2" MUST be: "Grade ${grade} | Institutional Assessment | ${duration}m"
6. Provide a relevant 'tag' for each slide (e.g., "CORE CONCEPT", "TACTICAL VIEW").

SCHEMA:
{
  "title": "Presentation: ${topic}",
  "slides": [
    {
      "title": "Title of Slide",
      "subtitle_1": "Institutional metadata as specified...",
      "subtitle_2": "Grade and time metadata as specified...",
      "content": ["High-density point 1...", "Detailed explanation 2..."],
      "layout": "organic_title",
      "tag": "STRATEGIC OVERVIEW",
      "image": "https://source.unsplash.com/featured/?${topic.replace(/\s+/g, ',')},education"
    }
  ]
}`;

        return this.runWithFallbackValidated(
            prompt,
            PPTAIResultSchema,
            "PPT",
            () => ({
                title: `Presentation: ${topic}`,
                slides: Array.from({ length: slideCount }, (_, i) => ({
                    title: i === 0 ? `Introduction to ${topic}` : `Key Aspect ${i} of ${topic}`,
                    subtitle_1: "Institutional Overview",
                    subtitle_2: `Grade ${grade} | ${curriculum.toUpperCase()}`,
                    content: [`Foundational concept related to ${topic}.`, `Analytical breakdown of secondary principles.`],
                    layout: i === 0 ? 'organic_title' : 'timeline_process',
                    tag: i === 0 ? "STRATEGIC OVERVIEW" : "CORE PRINCIPLE",
                    image: `https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000`
                }))
            })
        );
    }

    static async generateQuestionPaper(subject: string, grade: string, totalMarks: string, difficulty: string, examType: string, syllabus: string = "", breakdown: any = null, pdfContext: string = "") {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);

        const prompt = `You are an Elite Academic Synthesis Engine and Senior Examiner.
Generate a comprehensive, high-quality INSTITUTIONAL EXAMINATION PAPER for: "${subject}" (Grade ${grade}).
Exam Type: ${examType}
Total Marks: ${totalMarks}
Difficulty: ${difficulty}
Syllabus Scope: ${syllabus || 'Full Curriculum'}
Distribution: ${breakdown ? JSON.stringify(breakdown) : 'Section A: MCQ, Section B: Short, Section C: Long'}
${contextPrompt}

STRICT PEDAGOGICAL REQUIREMENTS:
1. Provide a massive, deep set of questions that strictly sum up to exactly ${totalMarks} marks.
2. Structure the paper exactly like this:
   - SECTION A: MULTIPLE CHOICE QUESTIONS (Objective)
   - SECTION B: SHORT ANSWER QUESTIONS (Conceptual)
   - SECTION C: LONG ANSWER QUESTIONS (Analytical/Case Study)
3. Ensure every question has professional academic phrasing and clear marks [e.g. [Marks: 4]].
4. Provide a full Evaluation Guide at the end including an Answer Key and Marking Rubrics.
5. All MCQs MUST have 4 clear distractor options.

RETURN ONLY VALID JSON:
{
  "title": "${examType.toUpperCase()}: ${subject.toUpperCase()} (GRADE ${grade})",
  "totalMarks": ${totalMarks},
  "instructions": "General examination instructions and tactical advice...",
  "sections": [
    {
      "name": "SECTION A: MULTIPLE CHOICE QUESTIONS",
      "questions": [
        { "q": "Deep conceptual MCQ...", "marks": 1, "options": ["A", "B", "C", "D"], "type": "MCQ" }
      ]
    },
    {
      "name": "SECTION B: SHORT ANSWER QUESTIONS",
      "questions": [
        { "q": "Academic descriptive question...", "marks": 4, "type": "Short" }
      ]
    },
    {
      "name": "SECTION C: LONG ANSWER QUESTIONS",
      "questions": [
        { "q": "Extensive analytical or case study question...", "marks": 13, "type": "Long" }
      ]
    }
  ],
  "answerKey": { "Q1": "Correct option text", "Q2": "Conceptual model answer..." },
  "markingScheme": "Detailed evaluation rubrics for examiners..."
}`;

        return this.runWithFallbackValidated(
            prompt,
            QuestionPaperAIResultSchema,
            "QuestionPaper",
            () => ({
                title: `${examType}: ${subject}`,
                totalMarks: parseInt(totalMarks) || 80,
                instructions: "Please read all questions carefully.",
                sections: [
                    {
                        name: "Section A",
                        questions: [{ q: `Sample question for ${subject}?`, marks: 5, type: "Subjective" }]
                    }
                ],
                answerKey: { "Q1": "Model Answer" },
                markingScheme: "Award marks for correct conceptual explanation."
            })
        );
    }

    static async generateAssignment(topic: string, grade: string, subject: string, assignmentType: string, difficulty: string, pdfContext: string = "", count: number = 6) {
        let contextPrompt = "";
        if (pdfContext) contextPrompt += formatUntrustedContext('PDF', pdfContext, 4000);

        const prompt = `You are an Elite Academic Synthesis Engine.
Generate a high-intensity EDUCATIONAL ASSIGNMENT for: "${topic}".
Context: Subject: ${subject}, Grade: ${grade}, Format: ${assignmentType}, Intensity: ${difficulty}.
${contextPrompt}

STRICT REQUIREMENTS:
1. Return ONLY valid JSON.
2. Provide ${count} distinct short/long questions.
3. Provide 2-3 practical activity questions.
4. Provide 4 MCQs with clear options and answers.
5. Provide a Master Answer Key for all questions.

JSON SCHEMA:
{
  "title": "${assignmentType}: ${topic}",
  "instructions": "Tactical instructions for the student (min 20 words)...",
  "shortQuestions": ["Question 1...", "Question 2..."],
  "longQuestions": ["Deep analysis question 1...", "Question 2..."],
  "practicalActivities": ["Hands-on task 1...", "Task 2..."],
  "criticalThinking": ["High-level inquiry 1..."],
  "mcqs": [
    { "question": "MCQ 1?", "options": ["A", "B", "C", "D"], "answer": "Option text" }
  ],
  "submissionGuidelines": "Professional submission protocol...",
  "answers": {
    "assignmentQuestions": ["Answer 1...", "Answer 2..."],
    "activityQuestions": ["Step-by-step solution 1..."],
    "mcqs": ["Option text 1..."]
  }
}`;

        return this.runWithFallbackValidated(
            prompt,
            AssignmentAIResultSchema,
            "Assignment",
            () => ({
                title: `${assignmentType}: ${topic}`,
                instructions: `Complete this institutional production artifact focused on ${topic}.`,
                shortQuestions: [`Identify the primary characteristics of ${topic}.`],
                longQuestions: [`Evaluate the impact of ${topic} on ${subject}.`],
                practicalActivities: [`Design a conceptual model representing ${topic}.`],
                criticalThinking: [`How does ${topic} integrate with modern ${subject} frameworks?`],
                submissionGuidelines: "Submit via the institutional portal in PDF format.",
                mcqs: [{ question: `Fundamental check: ${topic}?`, options: ["Opt A", "Opt B", "Opt C", "Opt D"], answer: "Opt A" }],
                answers: { assignmentQuestions: ["Concept analysis"], activityQuestions: ["Practical walkthrough"], mcqs: ["Opt A"] }
            })
        );
    }

    static async summarizeContent(text: string) {
        const cleanText = text.slice(0, 8000); // safety cap
        const prompt = `You are an expert Educational Content Summarizer and Pedagogical Analyst.
Analyze the following educational content and generate a highly detailed and beautifully structured summary matching the JSON schema.

CONTENT TO SUMMARIZE:
${cleanText}

CRITICAL SCHEMA:
{
  "overview": "A detailed 2-3 sentence high-impact academic overview summarizing the core focus of this material.",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5"],
  "definitions": [
    { "term": "Vocabulary Term 1", "meaning": "Precise, clear academic definition." },
    { "term": "Vocabulary Term 2", "meaning": "Precise, clear academic definition." }
  ],
  "revisionNotes": [
    "Comprehensive and deep revision point 1 summarizing key learning or findings.",
    "Comprehensive and deep revision point 2 with clear takeaways.",
    "Comprehensive and deep revision point 3 with clear takeaways.",
    "Comprehensive and deep revision point 4."
  ],
  "activities": [
    "Interactive student classroom activity or experiment based on the content.",
    "A self-study or practical project task for students to reinforce the concepts."
  ]
}`;

        return this.runWithFallbackValidated(
            prompt,
            SummaryAIResultSchema,
            "Summary",
            () => ({
                overview: "A comprehensive educational resource covering the fundamental concepts, vocabulary, and practical applications of the provided material.",
                keyConcepts: ["Core Principles", "Applied Methodologies", "Foundational Systems"],
                definitions: [
                    { term: "Subject Matter", meaning: "The primary domain or topic under educational inquiry." },
                    { term: "Methodology", meaning: "A system of methods used in a particular area of study or activity." }
                ],
                revisionNotes: [
                    "Identify the central thesis and core arguments presented in the source document.",
                    "Understand how secondary supporting evidence reinforces the main concepts.",
                    "Review critical definitions and vocabulary terms to ensure conceptual mastery."
                ],
                activities: [
                    "Analyze the text and list three real-world examples of the main concept in action.",
                    "Create a mind map connecting the key concepts and glossary terms found in this guide."
                ]
            })
        );
    }
}
