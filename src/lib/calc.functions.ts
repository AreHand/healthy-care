import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CalcInputSchema = z.object({
  gender: z.enum(["male", "female"]),
  age: z.number().int().min(2).max(120),
  weight_kg: z.number().min(10).max(500),
  height_cm: z.number().min(50).max(300),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).default("sedentary"),
  bmi: z.number().min(0).max(200),
  category: z.string().min(1).max(40),
  ideal_weight_kg: z.number().min(0).max(500),
  daily_calories: z.number().int().min(0).max(20000),
  notes: z.string().max(500).optional().nullable(),
});

export const saveCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CalcInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("calculations")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listCalculations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("calculations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearCalculations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("calculations").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Batch sync from local history → cloud
export const syncCalculations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ entries: z.array(CalcInputSchema.extend({ created_at: z.string().datetime().optional() })).max(200) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.entries.length === 0) return { inserted: 0 };
    const rows = data.entries.map((e) => ({ ...e, user_id: userId }));
    const { error, count } = await supabase
      .from("calculations")
      .insert(rows, { count: "exact" });
    if (error) throw new Error(error.message);
    return { inserted: count ?? rows.length };
  });
