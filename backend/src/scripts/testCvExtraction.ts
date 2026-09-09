import prisma from "../config/prisma";
import {
  extractCvTextForApplication,
} from "../services/cvText.service";
import {
  structureCvText,
} from "../services/cvStructure.service";
import {
  calculateApplicationCvMatch,
} from "../services/cvMatch.service";

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
    "npm run test-cv-extraction -- YOUR_APPLICATION_ID"
  );

  process.exit(1);
}

const run = async () => {
  try {
    const result =
      await extractCvTextForApplication(
        applicationId
      );

    console.log(
      "\nCV extraction successful ✅\n"
    );

    console.log({
      documentId:
        result.documentId,

      fileName:
        result.fileName,

      characterCount:
        result.characterCount,

      wordCount:
        result.wordCount,
    });

    const structured =
  structureCvText(
    result.text
  );

console.log(
  "\n--- STRUCTURED CV ---\n"
);

console.log(
  JSON.stringify(
    structured,
    null,
    2
  )
);

const match =
  await calculateApplicationCvMatch(
    applicationId
  );

console.log(
  "\n--- VACANCY MATCH ---\n"
);

console.log(
  JSON.stringify(
    match,
    null,
    2
  )
);
  } catch (error) {
    console.error(
      "\nCV extraction failed ❌\n"
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