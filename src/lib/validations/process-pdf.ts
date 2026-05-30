import { z } from 'zod';

export const processPdfPageSchema = z
    .object({
        pageNumber: z.number().int().positive().optional(),
        text: z.string().trim().min(1, 'Page text cannot be empty'),
    })
    .strict();

export const processPdfRequestSchema = z
    .object({
        title: z.string().trim().min(1).max(300).optional(),
        sourceType: z.enum(['pdf', 'web']).optional(),
        sourceUrl: z.string().trim().url().optional(),
        content: z.string().trim().min(1).optional(),
        pages: z.array(processPdfPageSchema).min(1).optional(),
    })
    .strict()
    .superRefine((value, context) => {
        if (!value.content && !value.pages) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['content'],
                message: 'Provide either content or pages',
            });
        }
    });

export const keyVocabularyEntrySchema = z
    .object({
        word: z.string().trim().min(1, 'Vocabulary word cannot be empty'),
        definition: z.string().trim().min(1, 'Vocabulary definition cannot be empty'),
    })
    .strict();

export const processPdfResponseSchema = z
    .object({
        summary: z.string().trim().min(1, 'Summary cannot be empty'),
        keyVocabulary: z.array(keyVocabularyEntrySchema),
        cleanedTextForSpeech: z.string().trim().min(1, 'Cleaned text for speech cannot be empty'),
    })
    .strict();

export type ProcessPdfRequest = z.infer<typeof processPdfRequestSchema>;
export type ProcessPdfResponse = z.infer<typeof processPdfResponseSchema>;