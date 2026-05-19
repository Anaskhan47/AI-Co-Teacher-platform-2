import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from "jspdf";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 
 * PROFESSIONAL PDF GENERATOR 
 * Optimized for Educational Lesson Plans, Materials, Summaries, and Quizzes.
 */
export function downloadAsPDF(data: any, filename: string) {
  const doc = new jsPDF();
  let y = 20;
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);

  const addText = (text: string, size: number = 10, style: "normal" | "bold" = "normal", color: [number, number, number] = [60, 60, 60]) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text || "", contentWidth);
    lines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += (size / 2) + 2;
    });
    y += 2;
  };

  const addHeading = (text: string) => {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(text.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, margin + 50, y);
    y += 6;
  };

  // ── INSTITUTIONAL HEADER ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text((data.title || "Examination Paper").toUpperCase(), margin, y);
  y += 6;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 170, y);
  y += 10;

  // ── DYNAMIC METADATA ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const metaLine1 = `Subject: ${data.subject || "General"} | Grade: ${data.grade || "N/A"}`;
  const metaLine2 = `Curriculum: ${data.curriculum || "Institutional"} | Marks: ${data.totalMarks || data.marks || "N/A"} | Time: ${data.duration || "N/A"}`;
  
  doc.text(metaLine1, margin, y);
  y += 5;
  doc.text(metaLine2, margin, y);
  y += 12;

  // ── INSTRUCTIONS ──
  if (data.instructions) {
    addHeading("General Instructions");
    addText(data.instructions, 10, "normal", [80, 80, 80]);
    y += 4;
  }

  // ── EXAMINATION SECTIONS & QUESTIONS ──
  if (Array.isArray(data.sections)) {
    data.sections.forEach((section: any) => {
      addHeading(section.name);
      section.questions.forEach((q: any, idx: number) => {
        const qText = `${idx + 1}. ${q.q || q.question}`;
        addText(qText, 11, "normal", [20, 20, 20]);
        
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: string, optIdx: number) => {
            const letter = String.fromCharCode(97 + optIdx);
            addText(`   (${letter}) ${opt}`, 10, "normal", [60, 60, 60]);
          });
        }
        
        if (q.marks) {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`[Marks: ${q.marks}]`, margin + contentWidth - 20, y - 4);
        }
        y += 4;
      });
      y += 8;
    });
  }

  // ── ASSIGNMENT CONTENT (DB field names: assignmentQuestions, activityQuestions, description) ──
  const isAssignment = Array.isArray(data.assignmentQuestions) || Array.isArray(data.activityQuestions) ||
                       data.shortQuestions || data.longQuestions || data.criticalThinking || data.practicalActivities;
  if (isAssignment) {
    // Instructions stored as 'description' in DB
    const instructions = data.instructions || data.description;
    if (instructions) {
      addHeading("Instructions");
      addText(instructions, 10, "normal", [80, 80, 80]);
      y += 4;
    }

    // assignmentQuestions = merged shortQuestions + longQuestions + criticalThinking
    const mainQuestions = Array.isArray(data.assignmentQuestions) ? data.assignmentQuestions
      : [
          ...(data.shortQuestions || []),
          ...(data.longQuestions || []),
          ...(data.criticalThinking || []),
        ];

    if (mainQuestions.length > 0) {
      addHeading("Assignment Questions");
      mainQuestions.forEach((q: string, i: number) => {
        addText(`${i + 1}. ${q}`, 10, "normal", [20, 20, 20]);
        y += 6; // writing space
      });
      y += 4;
    }

    // activityQuestions = practical activities
    const activities = Array.isArray(data.activityQuestions) ? data.activityQuestions
      : (data.practicalActivities || []);

    if (activities.length > 0) {
      addHeading("Practical Activities");
      activities.forEach((q: string, i: number) => {
        addText(`${i + 1}. ${q}`, 10, "normal", [20, 20, 20]);
        y += 4;
      });
      y += 4;
    }

    if (data.submissionGuidelines) {
      addHeading("Submission Guidelines");
      addText(data.submissionGuidelines, 10, "normal", [80, 80, 80]);
      y += 4;
    }

    // Answer Key on new page
    const answers = data.answers;
    if (answers && (answers.assignmentQuestions?.length || answers.activityQuestions?.length)) {
      doc.addPage();
      y = 20;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("ANSWER KEY", margin, y);
      y += 10;

      if (Array.isArray(answers.assignmentQuestions) && answers.assignmentQuestions.length > 0) {
        addHeading("Assignment Answers");
        answers.assignmentQuestions.forEach((ans: string, i: number) => {
          addText(`${i + 1}. ${ans}`, 10, "normal", [30, 30, 30]);
          y += 2;
        });
      }

      if (Array.isArray(answers.activityQuestions) && answers.activityQuestions.length > 0) {
        addHeading("Activity Answers");
        answers.activityQuestions.forEach((ans: string, i: number) => {
          addText(`${i + 1}. ${ans}`, 10, "normal", [30, 30, 30]);
          y += 2;
        });
      }
    }
  }

  // ── LESSON PLAN CONTENT ──
  let lessonActivities: any = null;
  if (data.activities) {
    if (typeof data.activities === 'string' && (data.activities.startsWith('{') || data.activities.trim().startsWith('{'))) {
      try {
        lessonActivities = JSON.parse(data.activities);
      } catch (e) {
        lessonActivities = null;
      }
    } else if (typeof data.activities === 'object') {
      lessonActivities = data.activities;
    }
  }

  const isLessonPlan = (lessonActivities && (lessonActivities.lessonFlow || lessonActivities.introduction)) || 
                       data.learningObjectives || data.lessonFlow || data.realWorldConnection;

  if (isLessonPlan && !isAssignment) {
    // Objectives
    const objectives = data.learningObjectives || data.objective || (lessonActivities && lessonActivities.learningObjectives);
    if (objectives) {
      addHeading("Learning Objectives");
      if (Array.isArray(objectives)) {
        objectives.forEach((obj: string) => addText(`• ${obj}`, 10));
      } else {
        addText(objectives, 10);
      }
      y += 4;
    }

    // Introduction
    const intro = data.introduction || (lessonActivities && lessonActivities.introduction);
    if (intro) {
      addHeading("Introduction");
      addText(intro, 10);
      y += 4;
    }

    // Prior Knowledge
    const prior = data.priorKnowledge || (lessonActivities && lessonActivities.priorKnowledge);
    if (prior) {
      addHeading("Prior Knowledge Required");
      if (Array.isArray(prior)) {
        prior.forEach((item: string) => addText(`• ${item}`, 10));
      } else {
        addText(prior, 10);
      }
      y += 4;
    }

    // Vocabulary & Concepts
    const vocab = data.keyVocabulary || (lessonActivities && lessonActivities.keyVocabulary);
    const concepts = data.keyConcepts || (lessonActivities && lessonActivities.keyConcepts);
    if (vocab) {
      addHeading("Key Vocabulary");
      if (Array.isArray(vocab)) {
        addText(vocab.join(", "), 10);
      } else {
        addText(vocab, 10);
      }
      y += 4;
    }
    if (concepts) {
      addHeading("Core Concepts");
      if (Array.isArray(concepts)) {
        addText(concepts.join(", "), 10);
      } else {
        addText(concepts, 10);
      }
      y += 4;
    }

    // Lesson Flow / Timeline
    const flow = data.lessonFlow || (lessonActivities && lessonActivities.lessonFlow);
    if (Array.isArray(flow) && flow.length > 0) {
      addHeading("Lesson Flow & Timeline");
      flow.forEach((step: any) => {
        addText(`${step.step || step.phase || "Step"} (${step.time || step.duration || ""}): ${step.description}`, 10);
      });
      y += 4;
    }

    // Classroom Activities
    const activities = data.activities || (lessonActivities && lessonActivities.activities);
    if (activities && !lessonActivities) {
      addHeading("Classroom Activities");
      addText(activities, 10);
      y += 4;
    } else if (Array.isArray(activities) && activities.length > 0) {
      addHeading("Classroom Activities");
      activities.forEach((act: any) => {
        if (typeof act === 'string') {
          addText(`• ${act}`, 10);
        } else {
          addText(`• ${act.description || ""} (${act.time || ""})`, 10);
          if (act.tip) {
            addText(`  Tip: ${act.tip}`, 9, "normal", [120, 120, 120]);
          }
        }
      });
      y += 4;
    }

    // Real World Connection
    const rwc = data.realWorldConnection || (lessonActivities && lessonActivities.realWorldConnection);
    if (rwc) {
      addHeading("Real-World Connection");
      addText(rwc, 10);
      y += 4;
    }

    // Homework
    const hw = data.homework || (lessonActivities && lessonActivities.homework);
    if (hw) {
      addHeading("Homework / Extended Tasks");
      if (Array.isArray(hw)) {
        hw.forEach((item: string) => addText(`• ${item}`, 10));
      } else {
        addText(hw, 10);
      }
      y += 4;
    }

    // Resources
    const res = data.resources || (lessonActivities && lessonActivities.resources);
    if (res) {
      addHeading("Resources & Materials");
      addText(res, 10);
      y += 4;
    }

    // Assessment
    const assess = data.assessment || (lessonActivities && lessonActivities.assessment);
    if (assess) {
      addHeading("Formative Assessment");
      if (Array.isArray(assess)) {
        assess.forEach((item: string) => addText(`• ${item}`, 10));
      } else {
        addText(assess, 10);
      }
      y += 4;
    }

    // Summary
    const sum = data.summary || (lessonActivities && lessonActivities.summary);
    if (sum) {
      addHeading("Summary & Recap");
      addText(sum, 10);
      y += 4;
    }
  }

  // ── LESSON SUMMARIZER CONTENT ──
  const isSummary = data.overview || Array.isArray(data.revisionNotes);
  if (isSummary && !isAssignment && !isLessonPlan) {
    if (data.overview) {
      addHeading("Executive Summary");
      addText(data.overview, 10, "normal", [40, 40, 40]);
      y += 4;
    }
    
    if (Array.isArray(data.keyConcepts) && data.keyConcepts.length > 0) {
      addHeading("Key Concepts");
      addText(data.keyConcepts.join(", "), 10, "normal", [60, 60, 60]);
      y += 4;
    }

    if (Array.isArray(data.definitions) && data.definitions.length > 0) {
      addHeading("Vocabulary & Definitions");
      data.definitions.forEach((d: any) => {
        addText(`${d.term}: ${d.meaning}`, 10, "normal", [60, 60, 60]);
      });
      y += 4;
    }

    if (Array.isArray(data.revisionNotes) && data.revisionNotes.length > 0) {
      addHeading("Key Revision Points");
      data.revisionNotes.forEach((n: string, i: number) => {
        addText(`${i + 1}. ${n}`, 10, "normal", [60, 60, 60]);
      });
      y += 4;
    }

    if (Array.isArray(data.activities) && data.activities.length > 0) {
      addHeading("Student Activities");
      data.activities.forEach((a: string, i: number) => {
        addText(`${i + 1}. ${a}`, 10, "normal", [60, 60, 60]);
      });
      y += 4;
    }
  }

  // ── LEGACY QUESTIONS FALLBACK (Quizzes/Lessons) ──
  const questions = Array.isArray(data.questions) ? data.questions : [];
  if (questions.length > 0 && !data.sections && !isAssignment && !isLessonPlan && !isSummary) {
    addHeading("Assessment Questions");
    questions.forEach((q: any, i: number) => {
      addText(`Q${i + 1}: ${q.question || q.q || ""}`, 10, "bold");
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: string, idx: number) => {
          const isCorrect = q.correctAnswer === opt || q.answer === opt;
          addText(`   [${isCorrect ? '✓' : ' '}] ${opt}`, 9);
        });
      }
      y += 3;
    });
  }

  // ── CORE CONTENT FALLBACK (Materials) ──
  if ((data.explanation || data.content) && !isAssignment && !isLessonPlan && !isSummary) {
    addHeading("Study Content");
    addText(data.explanation || data.content || "", 10);
    
    if (Array.isArray(data.definitions) && data.definitions.length > 0) {
      addHeading("Vocabulary & Definitions");
      data.definitions.forEach((d: any) => {
        addText(`${d.term}: ${d.meaning}`, 10, "normal", [60, 60, 60]);
      });
    }
  }

  // ── MARKING SCHEME / ANSWER KEY ──
  if (data.answerKey || data.markingScheme) {
    doc.addPage();
    y = 20;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("EVALUATION GUIDE", margin, y);
    y += 10;
    
    if (data.answerKey) {
      addHeading("Answer Key");
      Object.entries(data.answerKey).forEach(([qId, ans]: any) => {
        addText(`${qId}: ${ans}`, 10, "bold", [30, 30, 30]);
      });
    }
    
    if (data.markingScheme) {
      addHeading("Marking Rubrics");
      addText(data.markingScheme, 10);
    }
  }

  // ── FOOTER ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Institutional Assessment Generated by AI Co-Teacher Platform | Page ${i} of ${pageCount}`, margin, 285);
  }

  doc.save(filename);
}
