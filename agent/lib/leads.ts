import { defineState } from "eve/context";

export interface HiringLead {
  name: string;
  company?: string;
  role?: string;
  jdUrl?: string;
  engagement?: string;
  timeline?: string;
  budget?: string;
  contact?: string;
  notes?: string;
  capturedAt: string;
}

// Durable per-session list of hiring leads captured during a conversation.
// Session-scoped — deliver leads to Duyet via the `duyet` connection or X; don't rely
// on this outliving the session.
export const hiringLeads = defineState("eved.hiring-leads", () => ({
  leads: [] as HiringLead[],
}));
