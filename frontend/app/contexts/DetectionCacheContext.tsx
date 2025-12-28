import React, { createContext, useContext, useState, useCallback } from 'react';

interface CachedSession {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  total_screenshots: number;
  direction_summary: Record<string, number>;
  custom_name?: string;
  images?: Array<{
    id: string;
    image_url: string;
    direction: string;
    confidence: number;
    captured_at: string;
  }>;
}

interface DetectionCacheContextType {
  // History cache
  historyCache: CachedSession[] | null;
  historyLoading: boolean;
  historyError: string;
  setHistoryCache: (data: CachedSession[] | null) => void;
  setHistoryLoading: (loading: boolean) => void;
  setHistoryError: (error: string) => void;
  clearHistoryCache: () => void;
  
  // Session detail cache
  sessionDetailCache: Map<string, CachedSession>;
  getSessionDetail: (sessionId: string) => CachedSession | undefined;
  setSessionDetail: (sessionId: string, data: CachedSession) => void;
  clearSessionDetailCache: () => void;
  
  // Overall cache invalidation
  invalidateCache: () => void;
}

const DetectionCacheContext = createContext<DetectionCacheContextType | undefined>(undefined);

export function DetectionCacheProvider({ children }: { children: React.ReactNode }) {
  const [historyCache, setHistoryCache] = useState<CachedSession[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [sessionDetailCache] = useState<Map<string, CachedSession>>(new Map());

  const getSessionDetail = useCallback((sessionId: string) => {
    return sessionDetailCache.get(sessionId);
  }, [sessionDetailCache]);

  const setSessionDetail = useCallback((sessionId: string, data: CachedSession) => {
    sessionDetailCache.set(sessionId, data);
  }, [sessionDetailCache]);

  const clearSessionDetailCache = useCallback(() => {
    sessionDetailCache.clear();
  }, [sessionDetailCache]);

  const clearHistoryCache = useCallback(() => {
    setHistoryCache(null);
    setHistoryError("");
  }, []);

  const invalidateCache = useCallback(() => {
    setHistoryCache(null);
    clearSessionDetailCache();
    setHistoryError("");
    setHistoryLoading(false);
  }, [clearSessionDetailCache]);

  return (
    <DetectionCacheContext.Provider
      value={{
        historyCache,
        historyLoading,
        historyError,
        setHistoryCache,
        setHistoryLoading,
        setHistoryError,
        clearHistoryCache,
        sessionDetailCache,
        getSessionDetail,
        setSessionDetail,
        clearSessionDetailCache,
        invalidateCache,
      }}
    >
      {children}
    </DetectionCacheContext.Provider>
  );
}

export function useDetectionCache() {
  const context = useContext(DetectionCacheContext);
  if (context === undefined) {
    throw new Error("useDetectionCache must be used within DetectionCacheProvider");
  }
  return context;
}
