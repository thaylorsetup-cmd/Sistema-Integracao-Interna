import { useState, useCallback } from 'react';
// import { apiClient } from '@/services/api';

interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para fazer requisições API com gerenciamento de estado
 * @example
 * const { data, loading, error, execute } = useApi();
 * execute(() => apiClient.get('/users'));
 */
export function useApi(options?: UseApiOptions) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (request: Promise<unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const response = await request;
        setData(response);
        options?.onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    data,
    loading,
    error,
    execute,
  };
}
