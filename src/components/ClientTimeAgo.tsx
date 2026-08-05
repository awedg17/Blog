// src/components/ClientTimeAgo.tsx
"use client";

import { useState, useEffect } from 'react';
import { timeAgo } from '@/lib/slug';

export default function ClientTimeAgo({ dateish }: { dateish: string | Date | null | undefined }) {
  const [timeAgoString, setTimeAgoString] = useState('');

  useEffect(() => {
    if (!dateish) {
      setTimeAgoString('');
      return;
    }
    setTimeAgoString(timeAgo(dateish));
    // Update every minute for live effect
    const interval = setInterval(() => {
      setTimeAgoString(timeAgo(dateish));
    }, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, [dateish]);

  // Render an empty string initially to avoid layout shift, or a placeholder
  return <>{timeAgoString || ''}</>;
}
