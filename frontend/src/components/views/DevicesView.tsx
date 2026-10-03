import React, { useState, useEffect } from 'react';
import { useSolStore } from '../../state/useSolStore';
import { Smartphone, Cpu, HardDrive, Wifi, RefreshCw, Search, ShieldCheck, AppWindow } from 'lucide-react';

interface DeviceInfo {
  device_id: string;
  hostname: string;
  platform: string;
  os_version: string;
  architecture: string;
  cpu_count: number;
  memory_total_gb: number;
  capabilities: string[];
}

interface DiscoveredApp {
  app_id: string;
  name: string;
  display_name: string;
  executable: string;
  launch_target: string;
  platform: string;
  source: string;
  categories: string[];
  aliases: string[];
}

export const DevicesView: React.FC = () => {
  const { telemetry, connectionState } = useSolStore();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [apps, setApps] = useState<DiscoveredApp[]>([]);
  const [totalApps, setTotalApps] = useState<number>(0);
  const [lastScanned, setLastScanned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDeviceData = async (refresh: boolean = false) => {
    setIsLoading(true);
    try {
      // Fetch Device Info & Capabilities
      const infoRes = await fetch('http://localhost:8000/api/device/info');
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setDeviceInfo(infoData);
      }

      // Fetch Application Catalog
      const url = `http://localhost:8000/api/device/applications${refresh ? '?refresh=true' : ''}`;
      const appRes = await fetch(url);
      if (appRes.ok) {
        const appData = await appRes.json();
        setApps(appData.apps || []);
        setTotalApps(appData.total_count || appData.apps?.length || 0);
        setLastScanned(appData.last_scanned_at || Date.now() / 1000);
      }
    } catch (err) {
      console.error('Error fetching device metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, []);

  const filteredApps = apps.filter((app) => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      app.display_name.toLowerCase().includes(q) ||
      app.executable.toLowerCase().includes(q) ||
      app.source.toLowerCase().includes(q) ||
      app.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '960px',
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 20,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: 'var(--sol-energy-primary)',
            }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              {deviceInfo ? deviceInfo.hostname : 'Universal Host Device'}
            </h2>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              PLATFORM // {deviceInfo ? `${deviceInfo.platform.toUpperCase()} (${deviceInfo.os_version})` : 'DETECTING PLATFORM...'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono text-xs"
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              color: 'var(--sol-state-success)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
            }}
          >
            {connectionState === 'CONNECTED' ? 'DEVICE ONLINE' : 'STANDBY'}
          </span>
          <button
            onClick={() => fetchDeviceData(true)}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(0, 212, 255, 0.15)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: 'var(--sol-energy-primary)',
              cursor: isLoading ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Rescan Apps
          </button>
        </div>
      </div>

      {/* Grid Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        {/* CPU Panel */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Cpu size={18} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              CPU & ARCHITECTURE
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '4px' }}>
            {telemetry.cpuUsagePct}%
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            {deviceInfo?.cpu_count || 1} CORES // {deviceInfo?.architecture || 'x64'}
          </div>
        </div>

        {/* RAM Panel */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <HardDrive size={18} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              SYSTEM RAM
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '4px' }}>
            {telemetry.memoryUsedGb.toFixed(1)} GB / {telemetry.memoryTotalGb.toFixed(1)} GB
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            USAGE: {telemetry.memoryUsagePct}%
          </div>
        </div>

        {/* Application Catalog Overview */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AppWindow size={18} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              DYNAMIC APP CATALOG
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '4px' }}>
            {totalApps} Discovered Apps
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            LAST SCAN: {lastScanned > 0 ? new Date(lastScanned * 1000).toLocaleTimeString() : 'JUST NOW'}
          </div>
        </div>

        {/* Daemon Latency Panel */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--sol-surface-border)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Wifi size={18} color="var(--sol-energy-primary)" />
            <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
              SOCKET DAEMON
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sol-text-primary)', marginBottom: '4px' }}>
            {telemetry.networkLatencyMs} ms
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
            STATE: {connectionState}
          </div>
        </div>
      </div>

      {/* Exposed Capabilities Bar */}
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={18} color="var(--sol-energy-primary)" />
          <span className="font-mono text-xs" style={{ color: 'var(--sol-energy-primary)', fontWeight: 600 }}>
            EXPOSED DEVICE CAPABILITIES
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(deviceInfo?.capabilities || ['application_discovery', 'application_launch', 'application_close', 'process_control', 'filesystem', 'system_telemetry', 'power_management']).map((cap) => (
            <span
              key={cap}
              className="font-mono text-xs"
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: 'var(--sol-text-secondary)',
              }}
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* Discovered Application Catalog */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--sol-surface-border)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--sol-text-primary)' }}>
              Discovered Applications ({filteredApps.length})
            </h3>
            <p className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
              DYNAMIC OS METADATA // NO HARDCODED LISTS
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--sol-surface-border)',
              borderRadius: '10px',
              width: '240px',
            }}
          >
            <Search size={14} color="var(--sol-text-muted)" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--sol-text-primary)',
                fontSize: '0.85rem',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* App List Table */}
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredApps.length === 0 ? (
            <div className="font-mono text-xs" style={{ padding: '20px', textAlign: 'center', color: 'var(--sol-text-muted)' }}>
              {isLoading ? 'Scanning host machine for installed applications...' : 'No applications match your search query.'}
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.app_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--sol-text-primary)' }}>
                    {app.display_name}
                  </div>
                  <div className="font-mono text-xs" style={{ color: 'var(--sol-text-muted)' }}>
                    {app.executable} // {app.source}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {app.aliases.slice(0, 3).map((alias) => (
                    <span
                      key={alias}
                      className="font-mono text-xs"
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--sol-text-muted)',
                      }}
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
