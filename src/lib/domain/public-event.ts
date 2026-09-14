export type PublicEventResponse = {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string | null;
  status:
    | "SETUP"
    | "OPEN"
    | "CLOSED"
    | "DRAWN"
    | "REVEALING"
    | "REVEALED"
    | "PUBLISHED"
    | "PURGED";
  participantCount: number;
  privacy: { items: string[]; purpose: string; retentionDays: 7 };
};
