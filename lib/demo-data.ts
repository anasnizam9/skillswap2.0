import type { Match, Skill } from "@/lib/api";
import { calculateCompatibility, type UserProfile } from "@/lib/matching";

export const DEMO_SKILLS: Skill[] = [
  { id: "skill-1", name: "JavaScript", category: "Programming", description: "Modern web development language" },
  { id: "skill-2", name: "Python", category: "Programming", description: "Versatile programming language" },
  { id: "skill-3", name: "React", category: "Programming", description: "UI library for web apps" },
  { id: "skill-4", name: "TypeScript", category: "Programming", description: "Typed JavaScript" },
  { id: "skill-5", name: "Node.js", category: "Programming", description: "Server-side JavaScript" },
  { id: "skill-6", name: "UI/UX Design", category: "Design", description: "User interface and experience design" },
  { id: "skill-7", name: "Figma", category: "Design", description: "Design and prototyping tool" },
  { id: "skill-8", name: "Graphic Design", category: "Design", description: "Visual communication design" },
  { id: "skill-9", name: "Machine Learning", category: "AI & Data", description: "ML algorithms and models" },
  { id: "skill-10", name: "Data Science", category: "AI & Data", description: "Data analysis and insights" },
  { id: "skill-11", name: "Deep Learning", category: "AI & Data", description: "Neural networks and AI" },
  { id: "skill-12", name: "SQL", category: "Data", description: "Database query language" },
];

export interface DemoTeacherSeed {
  id: string;
  email: string;
  name: string;
  password: string;
  languages: string;
  timezone: string;
  communicationStyle: string;
  reputation: number;
  isVerified: number;
  isFlagged: number;
  skills: Array<{ skillId: string; level: string }>;
}

export const DEMO_TEACHERS: DemoTeacherSeed[] = [
  {
    id: "demo-teacher-1",
    email: "sarah.johnson@skillswap.demo",
    name: "Sarah Johnson",
    password: "Demo12345!",
    languages: "English, Urdu",
    timezone: "PKT",
    communicationStyle: "casual",
    reputation: 4.9,
    isVerified: 1,
    isFlagged: 0,
    skills: [
      { skillId: "skill-1", level: "expert" },
      { skillId: "skill-3", level: "advanced" },
      { skillId: "skill-5", level: "advanced" },
    ],
  },
  {
    id: "demo-teacher-2",
    email: "david.chen@skillswap.demo",
    name: "David Chen",
    password: "Demo12345!",
    languages: "English",
    timezone: "UTC",
    communicationStyle: "structured",
    reputation: 4.7,
    isVerified: 1,
    isFlagged: 0,
    skills: [
      { skillId: "skill-2", level: "expert" },
      { skillId: "skill-4", level: "advanced" },
      { skillId: "skill-12", level: "advanced" },
    ],
  },
  {
    id: "demo-teacher-3",
    email: "aisha.malik@skillswap.demo",
    name: "Aisha Malik",
    password: "Demo12345!",
    languages: "English, Urdu",
    timezone: "PKT",
    communicationStyle: "casual",
    reputation: 4.8,
    isVerified: 1,
    isFlagged: 0,
    skills: [
      { skillId: "skill-6", level: "expert" },
      { skillId: "skill-7", level: "advanced" },
      { skillId: "skill-8", level: "advanced" },
    ],
  },
  {
    id: "demo-teacher-4",
    email: "omar.khan@skillswap.demo",
    name: "Omar Khan",
    password: "Demo12345!",
    languages: "English, Urdu",
    timezone: "PKT",
    communicationStyle: "structured",
    reputation: 4.6,
    isVerified: 1,
    isFlagged: 0,
    skills: [
      { skillId: "skill-9", level: "expert" },
      { skillId: "skill-10", level: "advanced" },
      { skillId: "skill-11", level: "expert" },
    ],
  },
];

export function buildDemoMatches(skillId?: string, learnerSkillLevel = "beginner"): Match[] {
  const selectedSkillId = skillId || DEMO_SKILLS[0]?.id || "skill-1";
  const learnerProfile: UserProfile = {
    id: "demo-learner",
    languages: "English, Urdu",
    timezone: "PKT",
    communicationStyle: "casual",
    reputation: 5,
    skillLevel: learnerSkillLevel,
    teachingSkills: [],
    learningGoals: [],
  };

  return DEMO_TEACHERS.flatMap((teacher) =>
    teacher.skills
      .filter((skill) => skill.skillId === selectedSkillId)
      .map((skill) => {
        const teacherProfile: UserProfile = {
          id: teacher.id,
          languages: teacher.languages,
          timezone: teacher.timezone,
          communicationStyle: teacher.communicationStyle,
          reputation: teacher.reputation,
          skillLevel: skill.level,
          teachingSkills: [],
          learningGoals: [],
        };

        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          reputation: teacher.reputation,
          skillLevel: skill.level,
          skillId: skill.skillId,
          compatibilityScore: calculateCompatibility(teacherProfile, learnerProfile),
        };
      })
  ).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}