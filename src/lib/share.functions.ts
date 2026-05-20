import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

const SharePayload = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(2).max(120),
  weightKg: z.number().min(10).max(500),
  heightCm: z.number().min(50).max(300),
  activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  bmi: z.number(),
  category: z.string().max(40),
  idealWeightKg: z.number(),
  dailyCalories: z.number().int(),
  displayName: z.string().max(60).optional(),
});

export type SharePayloadType = z.infer<typeof SharePayload>;

export const createShare = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SharePayload.parse(input))
  .handler(async ({ data }) => {
    const id = nano();
    const { error } = await supabaseAdmin.from("shared_results").insert({ id, payload: data });
    if (error) throw new Error(error.message);
    return { id };
  });

export const getShare = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(6).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("shared_results")
      .select("id, payload, created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return { id: row.id, createdAt: row.created_at, payload: row.payload as SharePayloadType };
  });
