import si from 'systeminformation';

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

export class SystemService {
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const [cpu, memory, osInfo, currentLoad, fsSize, networkInterfaces] =
        await Promise.all([
          si.cpu(),
          si.mem(),
          si.osInfo(),
          si.currentLoad(),
          si.fsSize(),
          si.networkInterfaces(),
        ]);

      return {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          speed: cpu.speed,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          processors: cpu.processors,
        },
        memory: {
          total: memory.total,
          free: memory.free,
          used: memory.used,
          usedPercent: (memory.used / memory.total) * 100,
        },
        os: {
          platform: osInfo.platform,
          distro: osInfo.distro,
          release: osInfo.release,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          uptime: osInfo.uptime,
        },
        disk: fsSize.map((disk) => ({
          fs: disk.fs,
          type: disk.type,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          usePercent: disk.use,
          mount: disk.mount,
        })),
        network: networkInterfaces
          .filter((net) => !net.internal && net.ip4)
          .map((net) => ({
            iface: net.iface,
            ip4: net.ip4,
            ip6: net.ip6,
            mac: net.mac,
            speed: net.speed || 0,
          })),
        currentLoad: {
          avgLoad: currentLoad.avgLoad,
          currentLoad: currentLoad.currentLoad,
          currentLoadUser: currentLoad.currentLoadUser,
          currentLoadSystem: currentLoad.currentLoadSystem,
        },
      };
    } catch (error) {
      console.error('Error fetching system info:', error);
      throw new Error('Failed to fetch system information');
    }
  }
}
