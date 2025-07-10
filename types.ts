
export interface CriterionFeedback {
  score: number;
  reason: string;
}

export interface AdvisorSummary {
    status: 'GO' | 'GO with major revisions' | 'NO-GO';
    keyRisk: string;
    discussionPoint: string;
}

export interface AnalysisResult {
  advisorSummary: AdvisorSummary;
  strengths: string[];
  areasForImprovement: string[];
  scores: {
    problemClarityInContext: CriterionFeedback;
    measurableObjectives: CriterionFeedback;
    scopeAndTimelineFeasibility: CriterionFeedback;
    methodologyInPractice: CriterionFeedback;
    synergyAndValueForCompany: CriterionFeedback;
  };
  summary: string;
  actionableNextSteps: string[];
  probingQuestions: string[];
  redFlags: string[];
}
