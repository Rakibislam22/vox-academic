import { z } from 'zod';

export const processPdfRequestSchema = z
  .object({
    text: z.string().trim().min(1, 'Text is required').max(100000, 'Text is too long'),
  })
  .strict();

export const academicVocabularyEntrySchema = z
  .object({
    word: z.string().trim().min(1, 'Vocabulary word cannot be empty'),
    definition: z.string().trim().min(1, 'Vocabulary definition cannot be empty'),
  })
  .strict();

export const processPdfResponseSchema = z
  .object({
    summary: z.string().trim().min(1, 'Summary cannot be empty'),
    keyTakeaways: z.array(z.string().trim().min(1, 'Key takeaway cannot be empty')),
    academicVocabulary: z.array(academicVocabularyEntrySchema),
  })
  .strict();

export type ProcessPdfRequest = z.infer<typeof processPdfRequestSchema>;
export type ProcessPdfResponse = z.infer<typeof processPdfResponseSchema>;

export const keyVocabularyEntrySchema = academicVocabularyEntrySchema;
