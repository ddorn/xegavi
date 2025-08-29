import { useCallback, useEffect, useState } from "react";
import { DatasetSchema, type Dataset } from "@/lib/types";

type Loader = () => Promise<unknown>;

export function useDataset() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (loader: Loader) => {
    try {
      const raw = await loader();
      const r = DatasetSchema.safeParse(raw);
      if (r.success) {
        setData(r.data);
        setError(null);
      } else {
        setData(null);
        setError(r.error.message);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    }
  }, []);

  const onFile = useCallback((file: File) => {
    void load(async () => JSON.parse(await file.text()));
  }, [load]);

  useEffect(() => {
    void load(async () => {
      const res = await fetch("/load.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.json();
    });
  }, [load]);

  return { data, error, onFile };
}