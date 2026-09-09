/*
|--------------------------------------------------------------------------
| Local Semantic CV Matching
|--------------------------------------------------------------------------
|
| Uses Hugging Face Transformers.js locally.
|
| No OpenAI API.
| No paid inference API.
|--------------------------------------------------------------------------
*/

const MODEL_NAME =
  "Xenova/all-MiniLM-L6-v2";

/*
|--------------------------------------------------------------------------
| Result
|--------------------------------------------------------------------------
*/

export interface LocalSemanticMatchResult {
  similarity: number;
  percentage: number;
  semanticScore: number;
  model: string;
}

/*
|--------------------------------------------------------------------------
| Pipeline Singleton
|--------------------------------------------------------------------------
|
| Loading the model is expensive, so we load it once and reuse it.
|--------------------------------------------------------------------------
*/

let extractorPromise:
  Promise<any> | null = null;

const getExtractor =
  async (): Promise<any> => {
    if (!extractorPromise) {
      extractorPromise =
        (async () => {
          /*
          |--------------------------------------------------------------------------
          | Dynamic Import
          |--------------------------------------------------------------------------
          |
          | RecruitX uses CommonJS.
          | @huggingface/transformers is ESM.
          |--------------------------------------------------------------------------
          */

          const {
            pipeline,
          } =
            await import(
              "@huggingface/transformers"
            );

          console.log(
            "Loading local semantic model..."
          );

          const extractor =
            await pipeline(
              "feature-extraction",
              MODEL_NAME,
              {
                dtype: "q8",
              }
            );

          console.log(
            "Local semantic model loaded ✅"
          );

          return extractor;
        })();
    }

    return extractorPromise;
  };

/*
|--------------------------------------------------------------------------
| Cosine Similarity
|--------------------------------------------------------------------------
*/

const cosineSimilarity = (
  a: number[],
  b: number[]
): number => {
  if (
    a.length === 0 ||
    a.length !== b.length
  ) {
    throw new Error(
      "Invalid embedding vectors"
    );
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (
    let index = 0;
    index < a.length;
    index++
  ) {
    const valueA =
      a[index] ?? 0;

    const valueB =
      b[index] ?? 0;

    dotProduct +=
      valueA * valueB;

    magnitudeA +=
      valueA * valueA;

    magnitudeB +=
      valueB * valueB;
  }

  const denominator =
    Math.sqrt(magnitudeA) *
    Math.sqrt(magnitudeB);

  if (denominator === 0) {
    return 0;
  }

  return (
    dotProduct /
    denominator
  );
};

/*
|--------------------------------------------------------------------------
| Calculate Semantic Match
|--------------------------------------------------------------------------
*/

export const calculateLocalSemanticMatch =
  async (
    candidateText: string,
    vacancyText: string
  ): Promise<LocalSemanticMatchResult> => {
    if (!candidateText.trim()) {
      throw new Error(
        "Candidate text is required"
      );
    }

    if (!vacancyText.trim()) {
      throw new Error(
        "Vacancy text is required"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get Local Model
    |--------------------------------------------------------------------------
    */

    const extractor =
      await getExtractor();

    /*
    |--------------------------------------------------------------------------
    | Generate Both Embeddings Together
    |--------------------------------------------------------------------------
    |
    | Mean pooling + normalization is recommended for this model.
    |--------------------------------------------------------------------------
    */

    const output =
      await extractor(
        [
          candidateText,
          vacancyText,
        ],
        {
          pooling: "mean",
          normalize: true,
        }
      );

    const vectors =
      output.tolist() as number[][];

    const candidateEmbedding =
      vectors[0];

    const vacancyEmbedding =
      vectors[1];

    if (
      !candidateEmbedding ||
      !vacancyEmbedding
    ) {
      throw new Error(
        "Unable to generate local embeddings"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Similarity
    |--------------------------------------------------------------------------
    */

    const rawSimilarity =
      cosineSimilarity(
        candidateEmbedding,
        vacancyEmbedding
      );

    const similarity =
      Math.max(
        0,
        Math.min(
          rawSimilarity,
          1
        )
      );

    const percentage =
      Math.round(
        similarity *
          100 *
          100
      ) / 100;

    /*
    |--------------------------------------------------------------------------
    | Semantic Contribution
    |--------------------------------------------------------------------------
    |
    | Maximum contribution = 20 points.
    |
    | We'll calibrate this later after testing multiple CVs.
    |--------------------------------------------------------------------------
    */

    const semanticScore =
      Math.round(
        similarity *
          20 *
          100
      ) / 100;

    return {
      similarity:
        Math.round(
          similarity *
            10000
        ) / 10000,

      percentage,

      semanticScore,

      model:
        MODEL_NAME,
    };
  };