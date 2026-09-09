import prisma from "../config/prisma";

import {
  extractCvTextForApplication,
} from "../services/cvText.service";

import {
  structureCvText,
} from "../services/cvStructure.service";

import {
  buildCandidateAiText,
  buildVacancyAiText,
} from "../services/aiCvInput.service";

import {
  calculateLocalSemanticMatch,
} from "../services/localSemanticMatch.service";

const applicationId =
  process.argv[2];

if (!applicationId) {
  console.error(
    "Application ID is required."
  );

  console.error(
    "Example:"
  );

  console.error(
    "npm run test-local-semantic -- APPLICATION_ID"
  );

  process.exit(1);
}

const run =
  async () => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Application + Vacancy
      |--------------------------------------------------------------------------
      */

      const application =
        await prisma.application
          .findUnique({
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
      | Extract CV
      |--------------------------------------------------------------------------
      */

      const extracted =
        await extractCvTextForApplication(
          applicationId
        );

      /*
      |--------------------------------------------------------------------------
      | Structured Job-Relevant Data
      |--------------------------------------------------------------------------
      */

      const structured =
        structureCvText(
          extracted.text
        );

      /*
      |--------------------------------------------------------------------------
      | Safe AI Input
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

      const result =
        await calculateLocalSemanticMatch(
          candidateText,
          vacancyText
        );

      console.log(
        "\n--- LOCAL SEMANTIC MATCH ---\n"
      );

      console.log({
        model:
          result.model,

        similarity:
          result.similarity,

        percentage:
          result.percentage,

        semanticScore:
          result.semanticScore,
      });
    } catch (error) {
      console.error(
        "\nLocal semantic matching failed ❌\n"
      );

      if (
        error instanceof Error
      ) {
        console.error(
          error.message
        );
      } else {
        console.error(error);
      }

      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  };

run();