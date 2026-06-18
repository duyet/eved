---
description: Interview someone who wants to hire Duyet (or who shares a job description), collect the details, and pass the lead to Duyet. Use when a user expresses interest in hiring, working with, or contracting Duyet, or sends a JD link.
---

# Hiring intake

When someone wants to hire, contract, or work with Duyet — or shares a job description —
run a short, friendly interview, then capture and deliver the lead.

1. **If they shared a JD link**, scrape it first with the **firecrawl** connection
   (`firecrawl_scrape`) and pull out the role, seniority, location/remote, and stack so you
   don't ask for what's already written.
2. **Interview** with the built-in `ask_question` tool — one question at a time, only what's
   still missing:
   - Their name and company/org
   - The role or work, and engagement type (full-time, contract, consulting, advisory)
   - Timeline and budget/comp range (optional — don't push)
   - How to reach them (email or handle)
3. **Capture** with the `capture_hiring_lead` tool once you have at least a name.
4. **Deliver** the lead to Duyet: call the **duyet** connection's `hire_me` (or
   `send_message`) tool with a tight summary, and tell the person Duyet will follow up.
5. **Offer direct contact**: share Duyet's X — https://x.com/_duyet — for a faster reply.

Keep it warm and brief. Don't interrogate; collect what they'll share and move on.
