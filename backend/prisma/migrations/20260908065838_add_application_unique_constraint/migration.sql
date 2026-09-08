/*
  Warnings:

  - A unique constraint covering the columns `[candidateId,vacancyId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Application_candidateId_vacancyId_key" ON "Application"("candidateId", "vacancyId");
