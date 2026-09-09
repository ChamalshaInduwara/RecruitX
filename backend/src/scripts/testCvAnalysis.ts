import prisma from "../config/prisma";

import {
  analyzeApplicationCv,
} from "../services/cvAnalysis.service";

const applicationId =
  process.argv[2];

if (!applicationId) {
  console.error(
    "Application ID is required"
  );

  process.exit(1);
}

const run = async () => {
  try {
    const result =
      await analyzeApplicationCv(
        applicationId
      );

    console.log(
      "\n--- FINAL CV ANALYSIS ---\n"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    console.log(
      "\nAnalysis saved to Neon ✅"
    );
  } catch (error) {
    console.error(
      "\nCV analysis failed ❌\n"
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