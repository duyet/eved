import { defineTool } from "eve/tools";
import { z } from "zod";
import { hiringLeads, type HiringLead } from "../lib/leads.ts";

// The model sees this tool as `capture_hiring_lead`, from the filename.
export default defineTool({
  description:
    "Record a hiring lead after interviewing someone who wants to hire Duyet. Call once " +
    "you have at least their name, plus whatever details they shared.",
  inputSchema: z.object({
    name: z.string().min(1).describe("The person's name."),
    company: z.string().optional().describe("Their company or organization."),
    role: z.string().optional().describe("The role or work they want Duyet for."),
    jdUrl: z.string().optional().describe("Link to the job description, if any."),
    engagement: z
      .string()
      .optional()
      .describe("Full-time, contract, consulting, advisory…"),
    timeline: z.string().optional().describe("When they want to start, or a deadline."),
    budget: z.string().optional().describe("Budget or comp range, if shared."),
    contact: z.string().optional().describe("How to reach them (email, handle)."),
    notes: z.string().optional().describe("Anything else worth passing to Duyet."),
  }),
  async execute(input) {
    const lead: HiringLead = { ...input, capturedAt: new Date().toISOString() };
    hiringLeads.update((s) => ({ leads: [...s.leads, lead] }));
    return {
      captured: true,
      lead,
      next:
        "Deliver this to Duyet via the duyet connection (hire_me or send_message), then " +
        "share https://x.com/_duyet for direct contact.",
    };
  },
});
