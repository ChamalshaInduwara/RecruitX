import {
  StructuredCv,
} from "./cvStructure.service";

/*
|--------------------------------------------------------------------------
| Build Job-Relevant Candidate Text
|--------------------------------------------------------------------------
|
| We intentionally exclude:
|
| - Name
| - Email
| - Phone
| - Address
| - Gender
| - Age
| - Nationality
| - Other personal characteristics
|--------------------------------------------------------------------------
*/

export const buildCandidateAiText = (
  structuredCv: StructuredCv
): string => {
  const parts: string[] = [];

  if (
    structuredCv.skills.length > 0
  ) {
    parts.push(
      `Technical skills: ${structuredCv.skills.join(
        ", "
      )}`
    );
  }

  if (
    structuredCv.education.length > 0
  ) {
    parts.push(
      `Education and qualifications: ${structuredCv.education.join(
        ", "
      )}`
    );
  }

  if (
    structuredCv
      .experienceKeywords
      .length > 0
  ) {
    parts.push(
      `Relevant experience: ${structuredCv.experienceKeywords.join(
        ", "
      )}`
    );
  }

  if (
    structuredCv.yearsExperience !==
    null
  ) {
    parts.push(
      `Years of experience: ${structuredCv.yearsExperience}`
    );
  }

  return parts.join("\n");
};

/*
|--------------------------------------------------------------------------
| Build Vacancy AI Text
|--------------------------------------------------------------------------
*/

export const buildVacancyAiText = (
  title: string,
  description: string,
  requiredSkills: string | null
): string => {
  const parts: string[] = [
    `Job title: ${title}`,
    `Job description: ${description}`,
  ];

  if (requiredSkills) {
    parts.push(
      `Required skills: ${requiredSkills}`
    );
  }

  return parts.join("\n");
};