import client from './client.js';

export const getOverview         = ()       => client.get('/api/analytics/overview').then(r => r.data);
export const getStaffPerformance = ()       => client.get('/api/analytics/staff-performance').then(r => r.data);
export const getAuditLogs        = (params) => client.get('/api/analytics/audit-logs', { params }).then(r => r.data);
