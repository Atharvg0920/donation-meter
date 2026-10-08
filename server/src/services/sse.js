// Minimal Server-Sent Events hub: campaignId -> set of open responses.
const channels = new Map();

export function subscribe(campaignId, res) {
  if (!channels.has(campaignId)) channels.set(campaignId, new Set());
  channels.get(campaignId).add(res);
  res.on('close', () => channels.get(campaignId)?.delete(res));
}

export function broadcast(campaignId, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  channels.get(campaignId)?.forEach((res) => res.write(payload));
}
