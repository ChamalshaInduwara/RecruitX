export interface StructuredCv {
  skills: string[];
  education: string[];
  experienceKeywords: string[];
  yearsExperience: number | null;
}

/*
|--------------------------------------------------------------------------
| Technical Skills
|--------------------------------------------------------------------------
*/

const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "React.js",
  "Next.js",
  "Node.js",
  "Express",
  "Express.js",
  "Angular",
  "Vue",
  "Java",
  "Spring Boot",
  "Python",
  "Django",
  "FastAPI",
  "Go",
  "C#",
  ".NET",
  "PHP",
  "Laravel",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Supabase",
  "Firebase",
  "Prisma",
  "Git",
  "GitHub",
  "Docker",
  "AWS",
  "Azure",
  "REST API",
  "GraphQL",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Figma",
  "Pandas",
  "scikit-learn",
];

/*
|--------------------------------------------------------------------------
| Education Keywords
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
| Experience Keywords
|--------------------------------------------------------------------------
*/

const EXPERIENCE_KEYWORDS = [
  "Software Engineer",
  "Software Engineering Intern",
  "Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Intern",
  "Internship",
  "Web Development",
  "Mobile Development",
  "QA Engineer",
  "Quality Assurance",
];

/*
|--------------------------------------------------------------------------
| Escape Regex
|--------------------------------------------------------------------------
*/

const escapeRegex = (
  value: string
): string => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/*
|--------------------------------------------------------------------------
| Find Keywords
|--------------------------------------------------------------------------
*/

const findKeywords = (
  text: string,
  keywords: string[]
): string[] => {
  return keywords.filter(
    (keyword) => {
      const regex =
        new RegExp(
          `(^|[^a-zA-Z0-9])${escapeRegex(
            keyword
          )}([^a-zA-Z0-9]|$)`,
          "i"
        );

      return regex.test(text);
    }
  );
};

/*
|--------------------------------------------------------------------------
| Extract Years Of Experience
|--------------------------------------------------------------------------
*/

const extractYearsExperience = (
  text: string
): number | null => {
  const patterns = [
    /(\d+(?:\.\d+)?)\+?\s+years?\s+(?:of\s+)?(?:professional\s+)?experience/i,

    /experience\s+(?:of\s+)?(\d+(?:\.\d+)?)\+?\s+years?/i,
  ];

  const results: number[] = [];

  for (const pattern of patterns) {
    const regex =
      new RegExp(
        pattern.source,
        "gi"
      );

    const matches =
      text.matchAll(regex);

    for (const match of matches) {
      const years =
        Number(match[1]);

      if (
        Number.isFinite(years) &&
        years >= 0 &&
        years <= 50
      ) {
        results.push(years);
      }
    }
  }

  if (results.length === 0) {
    return null;
  }

  return Math.max(...results);
};

/*
|--------------------------------------------------------------------------
| Structure CV
|--------------------------------------------------------------------------
*/

export const structureCvText = (
  text: string
): StructuredCv => {
  const skills =
    findKeywords(
      text,
      SKILLS
    );

  const education =
    findKeywords(
      text,
      EDUCATION_KEYWORDS
    );

  const experienceKeywords =
    findKeywords(
      text,
      EXPERIENCE_KEYWORDS
    );

  const yearsExperience =
    extractYearsExperience(
      text
    );

  return {
    skills,
    education,
    experienceKeywords,
    yearsExperience,
  };
};