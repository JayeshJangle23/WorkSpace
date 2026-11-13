import { useState, useEffect, useCallback } from "react";
import { Settings as SettingsIcon, Activity, RefreshCw, Save, Pencil } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const fmtTime = (d) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Settings() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";

    const [settings, setSettings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState(isAdmin ? "settings" : "activity");
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true); setError("");
            const reqs = isAdmin
                ? [api.get("/settings"), api.get("/settings/activity-logs")]
                : [api.get("/settings/activity-logs")];
            const results = await Promise.all(reqs);
            if (isAdmin) { setSettings(results[0].data.settings || []); setLogs(results[1].data.logs || []); }
            else { setLogs(results[0].data.logs || []); }
        } catch (err) { setError(err.response?.data?.message || "Failed to load"); }
        finally { setLoading(false); }
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    const saveSetting = async (key) => {
        try {
            setSaving(true);
            await api.patch(`/settings/${key}`, { value: editValue });
            setSettings(p => p.map(s => s.key === key ? { ...s, value: editValue } : s));
            setEditingKey(null);
        } catch (err) { window.alert(err.response?.data?.message || "Failed to save"); }
        finally { setSaving(false); }
    };

    return (
        <div className="page-pad flex flex-col gap-6">
            <div>
                <h1 className="font-heading text-token text-2xl font-extrabold tracking-tight m-0 mb-1">Settings</h1>
                <p className="font-body text-muted text-sm m-0">Manage workspace configuration and audit trail.</p>
            </div>

            {error && <p className="text-sm px-4 py-3 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)" }}>{error}</p>}

            {}
            <div className="flex gap-2">
                {isAdmin && (
                    <button className={tab === "settings" ? "btn-primary text-xs" : "btn-secondary text-xs"}
                        onClick={() => setTab("settings")}>
                        <SettingsIcon size={14} /> System Settings
                    </button>
                )}
                <button className={tab === "activity" ? "btn-primary text-xs" : "btn-secondary text-xs"}
                    onClick={() => setTab("activity")}>
                    <Activity size={14} /> Activity Logs
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center gap-3 py-16 text-muted">
                    <RefreshCw size={26} className="spin" style={{ color: "var(--accent)" }} />
                    <p className="text-sm">Loading…</p>
                </div>
            ) : tab === "settings" && isAdmin ? (
                <div className="card">
                    <div className="p-5 pb-4">
                        <h3 className="text-token text-base font-bold m-0">System Settings</h3>
                        <p className="text-muted text-xs mt-1">{settings.length} configuration keys</p>
                    </div>
                    {settings.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-14 text-muted">
                            <SettingsIcon size={38} style={{ opacity: .4, color: "var(--accent)" }} />
                            <p className="text-sm">No settings configured yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        {["KEY", "VALUE", "DESCRIPTION", "ACTIONS"].map(h => (
                                            <th key={h} className="text-muted text-[10px] font-bold tracking-widest uppercase px-4 py-3 bg-surface-2">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {settings.map((s) => (
                                        <tr key={s.id} className="hover:bg-surface-2">
                                            <td className="px-4 py-3 text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
                                                <code className="text-token font-mono">{s.key}</code>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {editingKey === s.key ? (
                                                    <input className="field text-xs py-1" value={editValue} onChange={e => setEditValue(e.target.value)} />
                                                ) : (
                                                    <span className="text-token">{JSON.stringify(s.value)}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {s.description || "—"}
                                            </td>
                                            <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {editingKey === s.key ? (
                                                    <button className="btn-icon" title="Save" onClick={() => saveSetting(s.key)} disabled={saving}>
                                                        <Save size={14} />
                                                    </button>
                                                ) : (
                                                    <button className="btn-icon" title="Edit" onClick={() => { setEditingKey(s.key); setEditValue(JSON.stringify(s.value)); }}>
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="p-5 pb-4">
                        <h3 className="text-token text-base font-bold m-0">Activity Logs</h3>
                        <p className="text-muted text-xs mt-1">{logs.length} recent activities</p>
                    </div>
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-14 text-muted">
                            <Activity size={38} style={{ opacity: .4, color: "var(--accent)" }} />
                            <p className="text-sm">No activity logged yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        {["ACTION", "ACTOR", "ENTITY", "TIME"].map(h => (
                                            <th key={h} className="text-muted text-[10px] font-bold tracking-widest uppercase px-4 py-3 bg-surface-2">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-surface-2">
                                            <td className="px-4 py-3 text-xs text-token font-semibold capitalize" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {log.action.replaceAll("_", " ").toLowerCase()}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {log.actor?.fullName || "System"}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {log.entityType}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted" style={{ borderBottom: "1px solid var(--border)" }}>
                                                {fmtTime(log.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
