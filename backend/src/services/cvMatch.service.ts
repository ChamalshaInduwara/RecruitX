import prisma from "../config/prisma";

import { extractCvTextForApplication } from "./cvText.service";

import { structureCvText, StructuredCv } from "./cvStructure.service";

/*
|--------------------------------------------------------------------------
| Result Type
|--------------------------------------------------------------------------
*/

export interface CvMatchResult {
  applicationId: string;
  vacancyId: string;
  vacancyTitle: string;

  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];

  skillsScore: number;
  experienceScore: number;
  educationScore: number;

  baseScore: number;
  ruleBasedPercentage: number;

  candidateYearsExperience: number | null;

  requiredYearsExperience: number | null;

  requiredEducation: string[];
  matchedEducation: string[];
}

/*
|--------------------------------------------------------------------------
| Skill Aliases
|--------------------------------------------------------------------------
|
| Allows:
|
| React.js    = React
| Node.js     = Node
| Express.js  = Express
|--------------------------------------------------------------------------
*/

const SKILL_ALIASES: Record<string, string> = {
  "react.js": "react",
  reactjs: "react",

  "node.js": "node",
  nodejs: "node",

  "express.js": "express",

  "next.js": "nextjs",
  nextjs: "nextjs",

  "tailwind css": "tailwind",
  tailwindcss: "tailwind",

  postgres: "postgresql",

  "restful api": "rest api",
  "restful apis": "rest api",
  "rest apis": "rest api",

  springboot: "spring boot",
};

/*
|--------------------------------------------------------------------------
| Normalize Skill
|--------------------------------------------------------------------------
*/

const normalizeSkill = (skill: string): string => {
  const normalized = skill.trim().toLowerCase().replace(/\s+/g, " ");

  return SKILL_ALIASES[normalized] || normalized;
};

/*
|--------------------------------------------------------------------------
| Parse Required Skills
|--------------------------------------------------------------------------
|
| Supports examples such as:
|
| React, Node.js, PostgreSQL
|
| React
| TypeScript
| Git
|
| React; Node.js; Git
|--------------------------------------------------------------------------
*/

const parseRequiredSkills = (requiredSkills: string | null): string[] => {
  if (!requiredSkills) {
    return [];
  }

  const skills = requiredSkills
    .split(/[,;\n|]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  return Array.from(new Set(skills));
};

/*
|--------------------------------------------------------------------------
| Education Requirements
|--------------------------------------------------------------------------
*/

const EDUCATION_KEYWORDS = [
  "BSc",
  "BSc (Hons)",
  "Bachelor",
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Diploma",
  "Higher National Diploma",
  "HND",
  "MSc",
  "Master",
];

/*
|--------------------------------------------------------------------------
| Find Vacancy Education Requirements
|--------------------------------------------------------------------------
*/

const findEducationRequirements = (text: string): string[] => {
  const lowerText = text.toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Only consider education if vacancy explicitly mentions a qualification
  |--------------------------------------------------------------------------
  */

  const educationIndicators = [
    "degree",
    "bachelor",
    "bsc",
    "diploma",
    "hnd",
    "master",
    "msc",
    "undergraduate",
    "graduate",
  ];

  const hasEducationRequirement = educationIndicators.some((indicator) =>
    lowerText.includes(indicator),
  );

  if (!hasEducationRequirement) {
    return [];
  }

  return EDUCATION_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );
};

const extractRequiredYears = (text: string): number | null => {
  const patterns = [
    /(?:minimum\s+)?(\d+(?:\.\d+)?)\+?\s+years?\s+(?:of\s+)?experience/i,

    /experience\s+(?:of\s+)?(?:minimum\s+)?(\d+(?:\.\d+)?)\+?\s+years?/i,
  ];

  const values: number[] = [];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const years = Number(match[1]);

    if (Number.isFinite(years) && years >= 0 && years <= 50) {
      values.push(years);
    }
  }

  if (values.length === 0) {
    return null;
  }

  return Math.max(...values);
};

/*
|--------------------------------------------------------------------------
| Skills Score
|--------------------------------------------------------------------------
*/

const calculateSkillsScore = (cvSkills: string[], requiredSkills: string[]) => {
  /*
    |--------------------------------------------------------------------------
    | No explicit required skills
    |--------------------------------------------------------------------------
    */

  if (requiredSkills.length === 0) {
    return {
      score: 40,
      matched: [] as string[],
      missing: [] as string[],
    };
  }

  const normalizedCvSkills = new Set(cvSkills.map(normalizeSkill));

  const matched: string[] = [];

  const missing: string[] = [];

  for (const requiredSkill of requiredSkills) {
    const normalizedRequired = normalizeSkill(requiredSkill);

    if (normalizedCvSkills.has(normalizedRequired)) {
      matched.push(requiredSkill);
    } else {
      missing.push(requiredSkill);
    }
  }

  const ratio = matched.length / requiredSkills.length;

  const score = Math.round(ratio * 40 * 100) / 100;

  return {
    score,
    matched,
    missing,
  };
};

/*
|--------------------------------------------------------------------------
| Education Score
|--------------------------------------------------------------------------
*/

const calculateEducationScore = (
  cvEducation: string[],
  requiredEducation: string[],
) => {
  /*
    |--------------------------------------------------------------------------
    | Vacancy has no explicit education requirement
    |--------------------------------------------------------------------------
    */

  if (requiredEducation.length === 0) {
    return {
      score: 0,
      matched: [] as string[],
      applicable: false,
    };
  }

  const normalizedCv = cvEducation.map((item) => item.toLowerCase());

  const matched = requiredEducation.filter((requirement) =>
    normalizedCv.some(
      (candidateItem) =>
        candidateItem.includes(requirement.toLowerCase()) ||
        requirement.toLowerCase().includes(candidateItem),
    ),
  );

  const ratio = matched.length / requiredEducation.length;

  return {
    score: Math.round(ratio * 15 * 100) / 100,
    matched,
    applicable: true,
  };
};

/*
|--------------------------------------------------------------------------
| Experience Score
|--------------------------------------------------------------------------
*/

const calculateExperienceScore = (
  structuredCv: StructuredCv,
  requiredYears: number | null,
): {
  score: number;
  applicable: boolean;
} => {
  /*
    |--------------------------------------------------------------------------
    | No explicit experience requirement
    |--------------------------------------------------------------------------
    |--------------------------------------------------------------------------
    */

  if (requiredYears === null) {
    return {
      score: 0,
      applicable: false,
    };
  }

  /*
    |--------------------------------------------------------------------------
    | Candidate explicitly states years
    |--------------------------------------------------------------------------
    */

  if (structuredCv.yearsExperience !== null) {
    const ratio = Math.min(structuredCv.yearsExperience / requiredYears, 1);

    return {
      score: Math.round(ratio * 25 * 100) / 100,

      applicable: true,
    };
  }

  /*
    |--------------------------------------------------------------------------
    | Experience evidence exists, but duration is unknown
    |--------------------------------------------------------------------------
    |--------------------------------------------------------------------------
    */

  if (structuredCv.experienceKeywords.length > 0) {
    return {
      score: 12.5,
      applicable: true,
    };
  }

  return {
    score: 0,
    applicable: true,
  };
};

/*
|--------------------------------------------------------------------------
| Analyze Application
|--------------------------------------------------------------------------
*/

export const calculateApplicationCvMatch = async (
  applicationId: string,
): Promise<CvMatchResult> => {
  /*
    |--------------------------------------------------------------------------
    | Get Application + Vacancy
    |--------------------------------------------------------------------------
    */

  const application = await prisma.application.findUnique({
    where: {
      id: applicationId,
    },

    include: {
      vacancy: true,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  /*
    |--------------------------------------------------------------------------
    | Extract + Structure CV
    |--------------------------------------------------------------------------
    */

  const extractedCv = await extractCvTextForApplication(applicationId);

  const structuredCv = structureCvText(extractedCv.text);

  /*
    |--------------------------------------------------------------------------
    | Vacancy Requirements
    |--------------------------------------------------------------------------
    */

  const requiredSkills = parseRequiredSkills(
    application.vacancy.requiredSkills,
  );

  const vacancyText = application.vacancy.description;

  const requiredEducation = findEducationRequirements(vacancyText);

  const requiredYearsExperience = extractRequiredYears(vacancyText);

  /*
    |--------------------------------------------------------------------------
    | Calculate Scores
    |--------------------------------------------------------------------------
    */

  const skillsResult = calculateSkillsScore(
    structuredCv.skills,
    requiredSkills,
  );

  const educationResult = calculateEducationScore(
    structuredCv.education,
    requiredEducation,
  );

  const experienceResult = calculateExperienceScore(
    structuredCv,
    requiredYearsExperience,
  );

  /*
    |--------------------------------------------------------------------------
    | Rule-Based Total
    |--------------------------------------------------------------------------
    |
    | Maximum:
    |
    | Skills     40
    | Experience 25
    | Education  15
    | ----------------
    | Total      80
    |--------------------------------------------------------------------------
    */

  const baseScore =
    Math.round(
      (skillsResult.score + experienceResult.score + educationResult.score) *
        100,
    ) / 100;

  /*
    |--------------------------------------------------------------------------
    | Applicable Maximum Score
    |--------------------------------------------------------------------------
    */

  let applicableMaximum = 40;

  if (experienceResult.applicable) {
    applicableMaximum += 25;
  }

  if (educationResult.applicable) {
    applicableMaximum += 15;
  }

  const ruleBasedPercentage =
    applicableMaximum > 0
      ? Math.round((baseScore / applicableMaximum) * 100 * 100) / 100
      : 0;

  return {
    applicationId: application.id,

    vacancyId: application.vacancy.id,

    vacancyTitle: application.vacancy.title,

    requiredSkills,

    matchedSkills: skillsResult.matched,

    missingSkills: skillsResult.missing,

    skillsScore: skillsResult.score,

    experienceScore: experienceResult.score,

    educationScore: educationResult.score,

    baseScore,

    ruleBasedPercentage,

    candidateYearsExperience: structuredCv.yearsExperience,

    requiredYearsExperience,

    requiredEducation,

    matchedEducation: educationResult.matched,
  };
};
