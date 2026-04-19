// AI Matching Algorithm
export interface UserProfile {
  id: string;
  languages: string;
  timezone: string;
  communicationStyle: string;
  reputation: number;
  skillLevel: string;
  teachingSkills: string[];
  learningGoals: string[];
}

const LEVEL_MAP: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 3, expert: 4,
};

export function calculateCompatibility(teacher: UserProfile, learner: UserProfile): number {
  let score = 0;

  // Language match (25%)
  const teacherLangs = teacher.languages.split(",").map((l) => l.trim().toLowerCase());
  const learnerLangs = learner.languages.split(",").map((l) => l.trim().toLowerCase());
  const langMatch = teacherLangs.some((l) => learnerLangs.includes(l));
  score += langMatch ? 25 : 0;

  // Timezone proximity (20%)
  const tzDiff = Math.abs(getTimezoneOffset(teacher.timezone) - getTimezoneOffset(learner.timezone));
  score += Math.max(0, 20 - tzDiff * 2);

  // Communication style (15%)
  if (teacher.communicationStyle === learner.communicationStyle) score += 15;
  else if (isCompatibleStyle(teacher.communicationStyle, learner.communicationStyle)) score += 8;

  // Reputation (20%)
  const repScore = Math.min(20, (teacher.reputation / 5) * 20);
  score += repScore;

  // Skill gap (20%) - teacher should be 1-2 levels above learner
  const teacherLevel = LEVEL_MAP[teacher.skillLevel] || 2;
  const learnerLevel = LEVEL_MAP[learner.skillLevel] || 1;
  const gap = teacherLevel - learnerLevel;
  if (gap === 1 || gap === 2) score += 20;
  else if (gap === 3) score += 10;

  return Math.min(100, Math.round(score));
}

function getTimezoneOffset(tz: string): number {
  const tzMap: Record<string, number> = {
    "UTC": 0, "EST": -5, "PST": -8, "CST": -6, "MST": -7,
    "GMT": 0, "CET": 1, "IST": 5.5, "JST": 9, "AEST": 10, "PKT": 5,
  };
  return tzMap[tz] ?? 0;
}

function isCompatibleStyle(a: string, b: string): boolean {
  const compatible: Record<string, string[]> = {
    casual: ["structured"],
    structured: ["casual", "visual"],
    visual: ["structured"],
  };
  return compatible[a]?.includes(b) ?? false;
}

export function generateAssessmentQuestions(skillName: string, level: string): Array<{ q: string; options: string[]; answer: number }> {
  const questions: Record<string, Array<{ q: string; options: string[]; answer: number }>> = {
    JavaScript: [
      { q: "What does 'typeof null' return in JavaScript?", options: ["null", "undefined", "object", "string"], answer: 2 },
      { q: "Which method removes the last element of an array?", options: ["shift()", "pop()", "splice()", "slice()"], answer: 1 },
      { q: "What is a closure in JavaScript?", options: ["A loop construct", "A function with access to outer scope variables", "A class definition", "An async function"], answer: 1 },
      { q: "What does '===' check?", options: ["Value only", "Type only", "Value and Type", "Reference"], answer: 2 },
      { q: "Which is NOT a JavaScript data type?", options: ["Boolean", "Float", "Symbol", "BigInt"], answer: 1 },
    ],
    Python: [
      { q: "What is the output of print(type([]))?", options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"], answer: 1 },
      { q: "Which keyword is used for function definition?", options: ["function", "func", "def", "fn"], answer: 2 },
      { q: "What does 'enumerate()' do?", options: ["Counts items", "Returns index-value pairs", "Sorts list", "Filters items"], answer: 1 },
      { q: "What is a Python decorator?", options: ["A comment", "A function that modifies another function", "A class method", "A type hint"], answer: 1 },
      { q: "Which is mutable in Python?", options: ["tuple", "string", "list", "frozenset"], answer: 2 },
    ],
  };

  return questions[skillName] || [
    { q: `How long have you been working with ${skillName}?`, options: ["< 6 months", "6-12 months", "1-3 years", "3+ years"], answer: level === "expert" ? 3 : level === "advanced" ? 2 : 1 },
    { q: `Rate your ${skillName} proficiency`, options: ["Beginner", "Intermediate", "Advanced", "Expert"], answer: LEVEL_MAP[level] - 1 },
    { q: `Can you teach ${skillName} concepts to others?`, options: ["No", "Basic only", "Most concepts", "Yes, fully"], answer: level === "expert" ? 3 : level === "advanced" ? 2 : 1 },
    { q: "Have you built production projects with this skill?", options: ["No", "Personal only", "1-2 projects", "Many projects"], answer: 2 },
    { q: "Do you keep up with latest developments?", options: ["Rarely", "Sometimes", "Often", "Always"], answer: 2 },
  ];
}
