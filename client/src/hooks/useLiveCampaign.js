import { useEffect, useState } from 'react';
import { api, apiUrl } from '../lib/api.js';

// Loads the campaign, then keeps it live via Server-Sent Events (with a slow polling fallback).
export function useLiveCampaign(id) {
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let closed = false;
    api.campaign(id).then((c) => !closed && setCampaign(c)).catch((e) => !closed && setError(e.message));

    const es = new EventSource(apiUrl(`/api/public/campaigns/${id}/stream`));
    es.addEventListener('update', (e) => {
      setCampaign(JSON.parse(e.data));
      setConnected(true);
      setError('');
    });
    es.onerror = () => setConnected(false);

    const poll = setInterval(() => {
      api.campaign(id).then((c) => !closed && setCampaign(c)).catch(() => {});
    }, 15000);

    return () => {
      closed = true;
      es.close();
      clearInterval(poll);
    };
  }, [id]);

  return { campaign, error, connected };
}
