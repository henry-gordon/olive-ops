import { supabase } from "@/lib/supabase";

export type PrimaryPetRow = {
  id: string;
  household_id: string;
  household_name: string | null;
  name: string | null;
  species: string;
};

export async function fetchPrimaryPet(): Promise<
  | { ok: true; pet: PrimaryPetRow }
  | { ok: false; errorMessage: string }
> {
  const { data, error } = await supabase
    .from("pets")
    .select("id, household_id, name, species")
    .order("created_at", { ascending: true })
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
      errorMessage: "No pet found. Add a row to the pets table in Supabase.",
    };
  }

  const { data: household } = await supabase
    .from("households")
    .select("name")
    .eq("id", row.household_id)
    .limit(1);

  return {
    ok: true,
    pet: {
      id: row.id,
      household_id: row.household_id,
      household_name: household?.[0]?.name ?? null,
      name: row.name ?? null,
      species: typeof row.species === "string" && row.species ? row.species : "pet",
    },
  };
}
