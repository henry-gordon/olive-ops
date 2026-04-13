"use client";

import { useEffect, useState } from "react";
import {
  fetchPrimaryPet,
  type PrimaryPetRow,
} from "@/lib/primary-pet";

export function usePrimaryPet() {
  const [pet, setPet] = useState<PrimaryPetRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchPrimaryPet();
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        setPet(result.pet);
        setErrorMessage(null);
      } else {
        setPet(null);
        setErrorMessage(result.errorMessage);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pet, loading, errorMessage };
}
