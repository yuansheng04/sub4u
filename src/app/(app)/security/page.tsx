"use client";

import { useState, useEffect, useCallback } from "react";

interface LoginLog {
  id: string;
  ip: string;
  username: string;
  success: boolean;
  userAgent: string | null;
  createdAt: string;
}

export default function SecurityPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [knownIps, setKnownIps] = useState<string[]>([]);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/security");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setKnownIps(data.knownIps);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const failedCount = logs.filter((l) => !l.success).length;
  const uniqueIps = new Set(logs.map((l) => l.ip)).size;

  function parseUA(ua: string | null) {
    if (!ua) return "Unknown";
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("Mac OS")) return "Mac";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Linux")) return "Linux";
    return "Other";
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Security</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">Total Attempts</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">Failed Attempts</p>
          <p className={`text-2xl font-bold ${failedCount > 0 ? "text-danger" : ""}`}>
            {failedCount}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-foreground/50 mb-1">Unique IPs</p>
          <p className="text-2xl font-bold">{uniqueIps}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Login History</h2>
          <button
            onClick={loadLogs}
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(100vh-20rem)]">
          <table className="w-full text-sm">
            <thead className="text-foreground/50 border-b border-border">
              <tr>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Device</th>
                <th className="text-left p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isNewIp =
                  log.success &&
                  logs.filter((l) => l.ip === log.ip && l.success).length === 1;
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 hover:bg-black/[0.02]"
                  >
                    <td className="p-3">
                      {log.success ? (
                        <span className="text-success">OK</span>
                      ) : (
                        <span className="text-danger">FAIL</span>
                      )}
                      {isNewIp && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          NEW IP
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{log.ip}</td>
                    <td className="p-3">{log.username}</td>
                    <td className="p-3 text-foreground/50">
                      {parseUA(log.userAgent)}
                    </td>
                    <td className="p-3 text-foreground/50" title={log.createdAt}>
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-foreground/30">
                    No login attempts recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
