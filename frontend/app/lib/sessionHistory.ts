// History Data Fetching Utilities
// This file provides functions to fetch and group session history from the backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface SessionRecord {
  id: string;
  started_at: string;
  ended_at: string | null;
  preview_image: string | null;
  status: string;
  screenshot_count: number;
}

export interface GroupedSessions {
  today: SessionRecord[];
  yesterday: SessionRecord[];
  last7Days: SessionRecord[];
  last30Days: SessionRecord[];
}

/**
 * Fetch all user's session history from backend
 */
export async function fetchSessionHistory(): Promise<SessionRecord[]> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Belum ada hasil deteksi');
    }

    const response = await fetch(`${API_URL}/api/detection/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch history');
    }

    // Map the response to our format
    return data.sessions.map((session: any) => ({
      id: session.id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      preview_image: session.preview_image,
      status: session.status,
      screenshot_count: session.screenshot_count || 0
    }));

  } catch (error) {
    console.error('Error fetching session history:', error);
    throw error;
  }
}

/**
 * Group sessions by time period
 */
export function groupSessionsByPeriod(sessions: SessionRecord[]): GroupedSessions {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);

  const grouped: GroupedSessions = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: []
  };

  sessions.forEach(session => {
    const sessionDate = new Date(session.started_at);
    
    if (sessionDate >= today) {
      grouped.today.push(session);
    } else if (sessionDate >= yesterday && sessionDate < today) {
      grouped.yesterday.push(session);
    } else if (sessionDate >= last7Days && sessionDate < yesterday) {
      grouped.last7Days.push(session);
    } else if (sessionDate >= last30Days && sessionDate < last7Days) {
      grouped.last30Days.push(session);
    }
  });

  return grouped;
}

/**
 * Format session date for display
 */
export function formatSessionDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Get session duration
 */
export function getSessionDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return 'Sedang berlangsung';
  
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const diff = end.getTime() - start.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes === 0) {
    return `${seconds} detik`;
  }
  return `${minutes} menit ${seconds} detik`;
}

/**
 * Get placeholder image if session has no preview
 */
export function getPreviewImage(previewImage: string | null): string {
  return previewImage || '/images/kelas.png';
}
