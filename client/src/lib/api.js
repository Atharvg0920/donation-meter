const BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = (p) => BASE + p;
export const getAdminKey = () => sessionStorage.getItem('adminKey') || '';
export const setAdminKey = (k) => (k ? sessionStorage.setItem('adminKey', k) : sessionStorage.removeItem('adminKey'));

async function request(path, { method = 'GET', body, admin = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin-key': getAdminKey() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // public
  campaign: (id) => request(`/api/public/campaigns/${id}`),
  createIntent: (id, body) => request(`/api/public/campaigns/${id}/intent`, { method: 'POST', body }),
  confirmPayment: (id, body) => request(`/api/public/campaigns/${id}/confirm`, { method: 'POST', body }),
  // admin
  login: (password) => request('/api/admin/login', { method: 'POST', body: { password } }),
  stats: () => request('/api/admin/stats', { admin: true }),
  campaigns: () => request('/api/admin/campaigns', { admin: true }),
  createCampaign: (body) => request('/api/admin/campaigns', { method: 'POST', body, admin: true }),
  updateCampaign: (id, body) => request(`/api/admin/campaigns/${id}`, { method: 'PUT', body, admin: true }),
  deleteCampaign: (id) => request(`/api/admin/campaigns/${id}`, { method: 'DELETE', admin: true }),
  contributions: (id) => request(`/api/admin/campaigns/${id}/contributions`, { admin: true }),
  resetCampaign: (id) => request(`/api/admin/campaigns/${id}/reset`, { method: 'POST', admin: true }),
};
