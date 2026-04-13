import { supabase } from "@/lib/supabase";

export type PrimaryDogRow = {
  id: string;
  household_id: string;
  name: string | null;
};

export async function fetchPrimaryDog(): Promise<
  | { ok: true; dog: PrimaryDogRow }
  | { ok: false; errorMessage: string }
> {
  const { data, error } = await supabase
    .from("dogs")
    .select("id, household_id, name")
    .limit(1);

  if (error) {
    return { ok: false, errorMessage: error.message };
  }

  const row = data?.[0];
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.household_id !== "string"
  ) {
    return {
      ok: false,
      errorMessage: "No dog found. Add a row to the dogs table in Supabase.",
    };
  }

  return {
    ok: true,
    dog: {
      id: row.id,
      household_id: row.household_id,
      name: row.name ?? null,
    },
  };
}
