import { useEffect, useState } from "react";

export const useDataLoader = <T>(
  promiseFunction: () => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
  }, []);

  return { data, loading, error };
};
