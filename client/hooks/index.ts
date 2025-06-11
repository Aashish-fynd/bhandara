import { useEffect, useState } from "react";

type UseDataLoaderProps<T> = {
  promiseFunction: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
};

export const useDataLoader = <T>({ promiseFunction, onSuccess, onError, enabled = true }: UseDataLoaderProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    promiseFunction()
      .then((data) => {
        setData(data);
        onSuccess?.(data);
      })
      .catch((error) => {
        setError(error);
        onError?.(error);
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  return { data, loading, error, setData };
};
