/*
  Warnings:

  - A unique constraint covering the columns `[userId,category,fact]` on the table `ExtractedMemory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ExtractedMemory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExtractedMemory" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ExtractedMemory_userId_idx" ON "ExtractedMemory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractedMemory_userId_category_fact_key" ON "ExtractedMemory"("userId", "category", "fact");
