import { useEffect, useState } from 'react';
import { getOverview, getStaffPerformance, getAuditLogs } from '../../api/analytics.js';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [logs, setLogs]               = useState([]);

  useEffect(() => {
    getOverview().then(setOverview);
    getStaffPerformance().then(setPerformance);
    getAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {overview && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Total invested</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalInvested.toLocaleString()}</p>
          </div>
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Total sold</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalSold.toLocaleString()}</p>
          </div>
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Outstanding credit</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalOutstandingCredit.toLocaleString()}</p>
          </div>
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Customer credits</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalCustomerCredits.toLocaleString()}</p>
          </div>
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Customer debits</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalCustomerDebits.toLocaleString()}</p>
          </div>
          <div className="surface-card rounded-[1.5rem] p-4">
            <p className="text-sm text-[#666]">Collected revenue</p>
            <p className="mt-2 text-2xl font-extrabold">Ksh {overview.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* staff performance */}
      {performance && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Staff Performance</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-xl p-4">
              <p className="font-medium mb-3">Customer Registrations</p>
              {performance.registrations.map((s, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{s.staffName}</span>
                  <span className="font-semibold">{s.registrations}</span>
                </div>
              ))}
              {performance.registrations.length === 0 && <p className="text-sm text-gray-400">No data</p>}
            </div>
            <div className="border rounded-xl p-4">
              <p className="font-medium mb-3">Deliveries Made</p>
              {performance.deliveries.map((s, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{s.staffName}</span>
                  <span className="font-semibold">{s.deliveries}</span>
                </div>
              ))}
              {performance.deliveries.length === 0 && <p className="text-sm text-gray-400">No data</p>}
            </div>
          </div>
        </div>
      )}

      {/* audit logs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Audit Logs</h2>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="border rounded-xl p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                <span className="text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-500 mt-0.5">
                {log.actor?.name} · {log.targetModel}
              </p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-400">No logs yet</p>}
        </div>
      </div>
    </div>
  );
}
