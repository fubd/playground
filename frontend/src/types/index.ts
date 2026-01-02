export interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    speed: number;
    cores: number;
    physicalCores: number;
    processors: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
    uptime: number;
  };
  disk: Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    usePercent: number;
    mount: string;
  }>;
  network: Array<{
    iface: string;
    ip4: string;
    ip6: string;
    mac: string;
    speed: number;
  }>;
  currentLoad: {
    avgLoad: number;
    currentLoad: number;
    currentLoadUser: number;
    currentLoadSystem: number;
  };
}
