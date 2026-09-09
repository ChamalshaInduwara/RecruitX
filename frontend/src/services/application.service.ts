import api from "./api";

import type { AnalyzeCVResponse } from "../types/application";

export const analyzeApplicationCV = async (
  applicationId: string,
): Promise<AnalyzeCVResponse> => {
  const response = await api.post<AnalyzeCVResponse>(
    `/applications/${applicationId}/analyze-cv`,
  );

  return response.data;
};
