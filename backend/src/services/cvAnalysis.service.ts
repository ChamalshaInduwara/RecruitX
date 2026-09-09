import prisma from "../config/prisma";

import {
  extractCvTextForApplication,
} from "./cvText.service";

import {
  structureCvText,
} from "./cvStructure.service";

import {
  calculateApplicationCvMatch,
} from "./cvMatch.service";

import {
  buildCandidateAiText,
  buildVacancyAiText,
} from "./aiCvInput.service";

import {
  calculateLocalSemanticMatch,
} from "./localSemanticMatch.service";

/*
|--------------------------------------------------------------------------
| Recommendation
|--------------------------------------------------------------------------
*/

const getRecommendation = (
  score: number
) => {
  if (score >= 85) {
    return "EXCELLENT_MATCH" as const;
  }

  if (score >= 70) {
    return "GOOD_MATCH" as const;
  }

  if (score >= 50) {
    return "MODERATE_MATCH" as const;
  }

  return "LOW_MATCH" as const;
};

/*
|--------------------------------------------------------------------------
| Round
|--------------------------------------------------------------------------
*/

const roundScore = (
  value: number
) =>
  Math.round(value * 100) /
  100;

/*
|--------------------------------------------------------------------------
| Analyze Application CV
|--------------------------------------------------------------------------
*/

export const analyzeApplicationCv =
  async (
    applicationId: string
  ) => {
    /*
    |--------------------------------------------------------------------------
    | Application + Vacancy
    |--------------------------------------------------------------------------
    */

    const application =
      await prisma.application.findUnique({
        where: {
          id: applicationId,
        },

        include: {
          vacancy: true,
        },
      });

    if (!application) {
      throw new Error(
        "Application not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Extract CV Once
    |--------------------------------------------------------------------------
    */

    const extracted =
      await extractCvTextForApplication(
        applicationId
      );

    const structured =
      structureCvText(
        extracted.text
      );

    /*
    |--------------------------------------------------------------------------
    | Rule-Based Matching
    |--------------------------------------------------------------------------
    */

    const ruleBased =
      await calculateApplicationCvMatch(
        applicationId,
        structured
      );

    /*
    |--------------------------------------------------------------------------
    | Build Safe Semantic Input
    |--------------------------------------------------------------------------
    */

    const candidateText =
      buildCandidateAiText(
        structured
      );

    const vacancyText =
      buildVacancyAiText(
        application.vacancy.title,
        application.vacancy.description,
        application.vacancy
          .requiredSkills
      );

    /*
    |--------------------------------------------------------------------------
    | Local Semantic Matching
    |--------------------------------------------------------------------------
    */

    const semantic =
      await calculateLocalSemanticMatch(
        candidateText,
        vacancyText
      );

    /*
    |--------------------------------------------------------------------------
    | Final Score
    |--------------------------------------------------------------------------
    |
    | Rule based = 80%
    | Semantic   = 20%
    |
    | ruleBasedPercentage is already 0-100.
    | semanticScore is already 0-20.
    |--------------------------------------------------------------------------
    */

    const ruleContribution =
      ruleBased.ruleBasedPercentage *
      0.8;

    const overallScore =
      roundScore(
        ruleContribution +
          semantic.semanticScore
      );

    const recommendation =
      getRecommendation(
        overallScore
      );

    /*
    |--------------------------------------------------------------------------
    | Strengths
    |--------------------------------------------------------------------------
    */

    const strengths: string[] = [];

    if (
      ruleBased.matchedSkills
        .length > 0
    ) {
      strengths.push(
        `Matched skills: ${ruleBased.matchedSkills.join(
          ", "
        )}`
      );
    }

    if (
      semantic.percentage >= 75
    ) {
      strengths.push(
        "Strong semantic alignment with the vacancy requirements"
      );
    } else if (
      semantic.percentage >= 60
    ) {
      strengths.push(
        "Moderate semantic alignment with the vacancy requirements"
      );
    }

    if (
      ruleBased
        .matchedEducation
        .length > 0
    ) {
      strengths.push(
        `Matched education: ${ruleBased.matchedEducation.join(
          ", "
        )}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

    const summary =
      `Candidate matched ${
        ruleBased.matchedSkills.length
      } of ${
        ruleBased.requiredSkills.length
      } explicitly listed skills. ` +
      `Rule-based relevance was ${
        ruleBased.ruleBasedPercentage
      }%. ` +
      `Semantic relevance was ${
        semantic.percentage
      }%. ` +
      `Overall analysis score: ${overallScore}%.`;

    /*
    |--------------------------------------------------------------------------
    | Save / Update Analysis
    |--------------------------------------------------------------------------
    */

    const analysis =
      await prisma.cVAnalysis.upsert({
        where: {
          applicationId,
        },

        create: {
          applicationId,

          overallScore,

          skillsScore:
            ruleBased.skillsScore,

          experienceScore:
            ruleBased
              .experienceScore,

          educationScore:
            ruleBased
              .educationScore,

          semanticScore:
            semantic.semanticScore,

          recommendation,

          matchedSkills:
            ruleBased.matchedSkills,

          missingSkills:
            ruleBased.missingSkills,

          strengths,

          summary,
        },

        update: {
          overallScore,

          skillsScore:
            ruleBased.skillsScore,

          experienceScore:
            ruleBased
              .experienceScore,

          educationScore:
            ruleBased
              .educationScore,

          semanticScore:
            semantic.semanticScore,

          recommendation,

          matchedSkills:
            ruleBased.matchedSkills,

          missingSkills:
            ruleBased.missingSkills,

          strengths,

          summary,

          analyzedAt:
            new Date(),
        },
      });

    return {
      analysis,

      details: {
        ruleBasedPercentage:
          ruleBased
            .ruleBasedPercentage,

        semanticPercentage:
          semantic.percentage,

        semanticModel:
          semantic.model,

        requiredSkills:
          ruleBased.requiredSkills,

        matchedSkills:
          ruleBased.matchedSkills,

        missingSkills:
          ruleBased.missingSkills,
      },
    };
  };