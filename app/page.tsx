import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: dogs, error } = await supabase.from("dogs").select("*");

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-3xl font-bold">Olive Ops</h1>
        <p className="text-sm text-gray-600">Supabase connection test</p>

        {error ? (
          <pre className="rounded-xl border p-4 text-sm overflow-x-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        ) : (
          <pre className="rounded-xl border p-4 text-sm overflow-x-auto">
            {JSON.stringify(dogs, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}