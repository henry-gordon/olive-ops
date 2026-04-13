"use client";

import { useEffect, useState } from "react";
import {
  fetchPrimaryDog,
  type PrimaryDogRow,
} from "@/lib/primary-dog";

export function usePrimaryDog() {
  const [dog, setDog] = useState<PrimaryDogRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchPrimaryDog();
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        setDog(result.dog);
        setErrorMessage(null);
      } else {
        setDog(null);
        setErrorMessage(result.errorMessage);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { dog, loading, errorMessage };
}
