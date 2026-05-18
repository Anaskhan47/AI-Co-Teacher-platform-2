import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { jsPDF } from "jspdf";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 
 * PROFESSIONAL PDF GENERATOR 
 * Optimized for Educational Lesson Plans, Materials, and Quizzes.
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
  const metaLine2 = `Curriculum: ${data.curriculum || "Institutional"} | Marks: ${data.totalMarks || data.marks || "N/A"} | Time: ${data.duration || "180m"}`;
  
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

  // ── LEGACY QUESTIONS FALLBACK (Quizzes/Lessons) ──
  const questions = Array.isArray(data.questions) ? data.questions : [];
  if (questions.length > 0 && !data.sections && !isAssignment) {
    addHeading("Assessment Questions");
    questions.forEach((q: any, i: number) => {
      addText(`Q${i + 1}: ${q.question || q.q}`, 10, "bold");
      if (Array.isArray(q.options)) {
        q.options.forEach((opt: string, idx: number) => {
          addText(`   [ ] ${opt}`, 9);
        });
      }
      y += 3;
    });
  }

  // ── CORE CONTENT FALLBACK (Materials) ──
  if ((data.explanation || data.content) && !isAssignment) {
    addHeading("Study Content");
    addText(data.explanation || data.content || "", 10);
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
