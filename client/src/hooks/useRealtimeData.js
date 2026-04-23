import { useEffect, useRef } from 'react';
import api from '../services/api';

export const useRealtimeData = (onDataUpdate) => {
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [tasksRes, notesRes, goalsRes, memoriesRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/notes'),
          api.get('/goals'),
          api.get('/memories'),
        ]);
        
        onDataUpdate({
          tasks: tasksRes.data,
          notes: notesRes.data,
          goals: goalsRes.data,
          memories: memoriesRes.data,
        });
      } catch (err) {
        console.error('Failed to fetch real-time data:', err);
      }
    };

    // Initial fetch
    fetchAllData();

    // Polling every 1.5 seconds for real-time updates
    pollingIntervalRef.current = setInterval(fetchAllData, 1500);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [onDataUpdate]);
};
