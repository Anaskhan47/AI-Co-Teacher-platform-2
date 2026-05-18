import { z } from 'zod';
import { parseJsonLoose } from './ai-guard';

export interface GovernanceScore {
  score: number; // 0-1
  valid: boolean;
  issues: string[];
}

export class AcademicGovernance {
  static validateComplexity(content: any, grade: string): GovernanceScore {
    const text = JSON.stringify(content).toLowerCase();
    const gradeNum = parseInt(grade.replace(/\D/g, '')) || 5;
    const issues: string[] = [];
    const advancedTerms = ['quantum', 'stochastic', 'epistemology', 'paradigm', 'juxtaposition', 'mitigation'];
    const complexTermsFound = advancedTerms.filter(t => text.includes(t));

    if (gradeNum < 6 && complexTermsFound.length > 2) {
      issues.push(`Complexity Alert: Highly advanced terminology found for Grade ${grade}.`);
    }

    return {
      score: issues.length === 0 ? 1 : 0.8,
      valid: true,
      issues
    };
  }

  static validateLessonFlow(plan: any): GovernanceScore {
    const issues: string[] = [];
    const requiredFields = [
      { key: 'learningObjectives', label: 'Learning Objectives', alt: 'objective' },
      { key: 'lessonFlow',         label: 'Instructional Timeline' },
      { key: 'activities',         label: 'Active Learning Activities' },
      { key: 'summary',            label: 'Lesson Summary' },
    ];

    for (const field of requiredFields) {
      const value = plan[field.key] ?? (field.alt ? plan[field.alt] : undefined);
      const isEmpty = !value || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        issues.push(`Pedagogy Alert: Missing critical phase — ${field.label}`);
      }
    }

    const flow = plan.lessonFlow;
    if (Array.isArray(flow) && flow.length > 0 && flow.length < 3) {
      issues.push('Pedagogy Alert: Instructional timeline requires at least 3 distinct phases.');
    }

    return {
      score: issues.length === 0 ? 1 : Math.max(0.5, 1 - issues.length * 0.15),
      valid: true,
      issues,
    };
  }

  static validateSafety(content: any): GovernanceScore {
    const text = JSON.stringify(content).toLowerCase();
    const issues: string[] = [];
    const safetyKeywords = ['violence', 'weapon', 'drug', 'political bias', 'discriminatory'];

    for (const kw of safetyKeywords) {
      if (text.includes(kw)) {
        issues.push(`Safety Alert: Detected potentially sensitive term: "${kw}"`);
      }
    }

    return { score: issues.length === 0 ? 1 : 0, valid: issues.length === 0, issues };
  }
}
