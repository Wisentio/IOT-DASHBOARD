import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Battery, Cpu, MapPin, Plus, Radio, Send, Thermometer, Droplets } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function statusClass(status) {
  if (status === "ALERT") return "bg-red-100 text-red-700 border-red-200";
  if (status === "WARNING") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-6 w-6 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">{device.name}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{device.deviceId}</p>
          <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" /> {device.location}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(device.status)}`}>
          {device.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <Thermometer className="mb-1 h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold">{device.temperature}°C</p>
          <p className="text-xs text-slate-500">Temp</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <Droplets className="mb-1 h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold">{device.humidity}%</p>
          <p className="text-xs text-slate-500">Humidity</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <Battery className="mb-1 h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold">{device.battery}%</p>
          <p className="text-xs text-slate-500">Battery</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">Last seen: {device.lastSeen}</p>
    </div>
  );
}

export default function App() {

  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [newDevice, setNewDevice] = useState({ deviceId: "", name: "", location: "" });
  const [telemetry, setTelemetry] = useState({
    deviceId: "greenhouse-01",
    temperature: "25",
    humidity: "60",
    battery: "90",
  });

  async function loadDashboard() {
    const dashboardRes = await fetch(`${API_BASE_URL}/dashboard`);
    const dashboardData = await dashboardRes.json();
    setDevices(dashboardData);
  }

  async function loadAlerts() {
    const alertsRes = await fetch(`${API_BASE_URL}/alerts`);
    const alertsData = await alertsRes.json();
    setAlerts(alertsData);
  }

  useEffect(() => {
    loadDashboard();
    loadAlerts();
  }, []);

  const totals = useMemo(() => {
    return {
      devices: devices.length,
      alerts: alerts.filter((alert) => alert.status === "OPEN").length,
      ok: devices.filter((device) => device.status === "OK").length,
      messages: readings.length,
    };
  }, [devices, alerts, readings]);

  async function addDevice(event) {
    event.preventDefault();
    if (!newDevice.deviceId || !newDevice.name) return;

    const res = await fetch(`${API_BASE_URL}/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: newDevice.deviceId,
        name: newDevice.name,
        location: newDevice.location,
      }),
    });

    const savedDevice = await res.json();

    setDevices((current) => [
      {
        temperature: 0,
        humidity: 0,
        battery: 100,
        lastSeen: "no telemetry yet",
        ...savedDevice,
      },
      ...current,
    ]);

    setNewDevice({ deviceId: "", name: "", location: "" });
  }

  // Function simulates sending telemetry data from a device.
  // It creates a reading object based on the current telemetry state,
  // determines the device status, and updates the readings state.
  async function sendTelemetry(event) {
    event.preventDefault();

    const reading = {
      deviceId: telemetry.deviceId,
      temperature: Number(telemetry.temperature),
      humidity: Number(telemetry.humidity),
      battery: Number(telemetry.battery),
    };

    // Get the latest device info.
    const res = await fetch(`${API_BASE_URL}/telemetry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reading),
    });

    if (!res.ok) {
      console.error("Failed to send telemetry");
      return;
    }

    setReadings((current) => [
      {
        ...reading,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...current,
    ]);

    // Reload dashboard and alerts after backend saves telemetry
    await loadDashboard();
    await loadAlerts();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl bg-slate-950 p-8 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                <Radio className="h-4 w-4" /> Cloud IoT Monitoring Platform
              </div>
              <h1 className="text-3xl font-bold md:text-5xl">IoT Device Dashboard</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Monitor simulated sensors, send telemetry, detect abnormal readings, and prepare the app for real IoT devices later.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard title="Registered devices" value={totals.devices} icon={Cpu} />
          <StatCard title="Healthy devices" value={totals.ok} icon={Activity} />
          <StatCard title="Open alerts" value={totals.alerts} icon={AlertTriangle} />
          <StatCard title="Telemetry messages" value={totals.messages} icon={Send} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Live devices</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {devices.map((device) => (
                // <DeviceCard key={device.deviceId} device={device} />
                <DeviceCard device={device} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={addDevice} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <h2 className="text-lg font-bold">Add device</h2>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                  placeholder="Device ID, e.g. sensor-02"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                  placeholder="Device name"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                  placeholder="Location"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                />
                <button className="w-full rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-slate-800">
                  Add device
                </button>
              </div>
            </form>

            <form onSubmit={sendTelemetry} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <Send className="h-5 w-5" />
                <h2 className="text-lg font-bold">Telemetry simulator</h2>
              </div>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Device
                  </span>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                    value={telemetry.deviceId}
                    onChange={(e) => setTelemetry({ ...telemetry, deviceId: e.target.value })}
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.deviceId}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Temperature °C
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                    placeholder="Example: 25"
                    value={telemetry.temperature}
                    onChange={(e) => setTelemetry({ ...telemetry, temperature: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Humidity %
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                    placeholder="Example: 60"
                    value={telemetry.humidity}
                    onChange={(e) => setTelemetry({ ...telemetry, humidity: e.target.value })}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Battery %
                  </span>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 outline-none focus:border-slate-500"
                    placeholder="Example: 90"
                    value={telemetry.battery}
                    onChange={(e) => setTelemetry({ ...telemetry, battery: e.target.value })}
                  />
                </label>
                <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                  Send telemetry
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h2 className="mb-4 text-xl font-bold">Recent telemetry</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-3">Time</th>
                    <th>Device</th>
                    <th>Temp</th>
                    <th>Humidity</th>
                    <th>Battery</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.slice(0, 8).map((reading, index) => (
                    <tr key={`${reading.deviceId}-${reading.timestamp}-${index}`} className="border-b last:border-0">
                      <td className="py-3">{reading.timestamp}</td>
                      <td>{reading.deviceId}</td>
                      <td>{reading.temperature}°C</td>
                      <td>{reading.humidity}%</td>
                      <td>{reading.battery}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
            <h2 className="mb-4 text-xl font-bold">Alerts</h2>
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-sm text-slate-500">No alerts yet.</p>}
              {alerts.slice(0, 8).map((alert) => (
                <div key={alert.deviceId} className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-red-800">{alert.type}</p>
                      <p className="text-sm text-red-700">{alert.message}</p>
                      <p className="mt-1 text-xs text-red-600">
                        {alert.deviceId} · {alert.value} · {alert.createdAt}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700">
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
