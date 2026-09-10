import { z } from "zod";

export function normalizePhone(value: string): string {
  return value.replace(/[-\s]/g, "");
}

export const participantSchema = z.object({
  name: z.string().trim().min(2).max(30),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((value) => /^01[016789]\d{7,8}$/.test(value)),
  department: z.string().trim().min(2).max(60),
  privacyConsent: z.literal(true),
  accessToken: z.string().min(43).max(128),
});

export type ParticipantInput = z.input<typeof participantSchema>;
export type Participant = z.output<typeof participantSchema>;
