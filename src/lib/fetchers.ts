export async function jsonFetcher<T>(url: string): Promise<T> {
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = new Error('An error occurred while fetching the data.');
      // Attach extra info
      (error as any).info = await response.json();
      (error as any).status = response.status;
      throw error;
    }
    
    return response.json() as Promise<T>;
  }

/*
import { jsonFetcher } from '@/lib/fetchers';

const { data } = useSWR<Portfolio>('/api/portfolio', jsonFetcher);
*/