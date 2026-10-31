import { z } from "zod";
import { UNITS } from "@/lib/pricing/units";

/**
 * Structured output the HUZA MAJU AI Estimator must return. The API enforces
 * this shape (structured outputs) and the SDK validates it again with zod.
 * There is deliberately no price field anywhere: the backend prices items.
 */
export const EstimateSchema = z.object({
  project_category: z.string().describe("Category of the project in Bahasa Melayu"),
  project_summary: z.string().describe("Two to four sentence professional summary of the requested works, in the customer's language"),
  scope_of_work: z.array(z.string()).describe("Ordered scope description, one work stage per entry"),
  line_items: z
    .array(
      z.object({
        pricing_code: z
          .string()
          .nullable()
          .describe("Exact code from the approved pricing list, or null when no listed item fits"),
        description: z.string().describe("Professional work item description for the quotation"),
        unit: z.enum(UNITS),
        quantity: z.number().nullable().describe("Quantity in the given unit, or null when it cannot be determined from the information provided"),
        quantity_basis: z.string().describe("How the quantity was derived, e.g. '12 ft x 10 ft = 120 ft2' or 'customer stated 6 points'"),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe("Measurable work items"),
  missing_information: z
    .array(z.object({ question: z.string(), reason: z.string() }))
    .describe("Questions to ask the customer to firm up the estimate, most important first, at most 6"),
  recommended_materials: z.array(z.string()),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()).describe("Site or technical risks that may change the cost"),
  requires_site_inspection: z.boolean(),
  pricing_status: z.enum(["requires_database_lookup", "insufficient_information", "out_of_scope"]),
});

export type Estimate = z.infer<typeof EstimateSchema>;
