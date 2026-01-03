import si from 'systeminformation';
import fs from 'fs';
import path from 'path';

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
  constructor() {
    // 如果在 Docker 容器中并挂载了宿主机文件系统，告诉 systeminformation 读取宿主机信息
    if (process.env.FS_PREFIX) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (si as any).fs = process.env.FS_PREFIX;
    }
  }

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      // 尝试手动获取宿主机的 OS 信息作为后备/覆盖
      const hostOsInfo = await this.getHostOsInfo();
      
      const [cpu, memory, osInfo, currentLoad, fsSize, networkInterfaces, time] =
        await Promise.all([
          si.cpu(),
          si.mem(),
          si.osInfo(),
          si.currentLoad(),
          si.fsSize(),
          si.networkInterfaces(),
          si.time(),
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
          distro: hostOsInfo?.distro || osInfo.distro,
          release: hostOsInfo?.release || osInfo.release,
          arch: osInfo.arch,
          hostname: osInfo.hostname,
          uptime: time.uptime,
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


  private async getHostOsInfo(): Promise<{ distro: string; release: string } | null> {
    const fsPrefix = process.env.FS_PREFIX;
    console.log('[Debug] FS_PREFIX:', fsPrefix);
    
    if (!fsPrefix) {
      console.log('[Debug] FS_PREFIX is not set, skipping host OS parsing');
      return null;
    }

    try {
      const osReleasePath = path.join(fsPrefix, 'etc/os-release');
      console.log('[Debug] Checking os-release at:', osReleasePath);
      
      if (fs.existsSync(osReleasePath)) {
        console.log('[Debug] File exists, reading...');
        const content = fs.readFileSync(osReleasePath, 'utf8');
        console.log('[Debug] Content length:', content.length);
        
        const lines = content.split('\n');
        let distro = '';
        let release = '';

        lines.forEach(line => {
          if (line.startsWith('PRETTY_NAME=')) {
            distro = line.split('=')[1].replace(/"/g, '');
          } else if (line.startsWith('NAME=') && !distro) {
             distro = line.split('=')[1].replace(/"/g, '');
          }
          
          if (line.startsWith('VERSION_ID=')) {
            release = line.split('=')[1].replace(/"/g, '');
          }
        });

        console.log(`[Debug] Parsed: distro=${distro}, release=${release}`);

        if (distro) {
          console.log(`✓ Manually parsed host OS: ${distro} ${release}`);
          return { distro, release };
        }
      } else {
        console.log(`[Debug] File does not exist at ${osReleasePath}`);
        // List directory to see what is there
        try {
          const dir = path.dirname(osReleasePath);
          const files = fs.readdirSync(dir);
          console.log(`[Debug] Files in ${dir}:`, files.slice(0, 10)); // list first 10
        } catch (e) {
          console.log(`[Debug] Cannot list directory:`, e);
        }
      }
    } catch (error) {
      console.warn('Failed to parse host os-release:', error);
    }
    return null;
  }
}
