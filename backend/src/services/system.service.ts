import si from 'systeminformation';
import { injectable } from 'inversify';

export interface SystemInfo {
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercent: number;
  };
  uptime: number;
  disk: Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    usePercent: number;
    mount: string;
  }>;
  currentLoad: {
    avgLoad: number;
    currentLoad: number;
    currentLoadUser: number;
    currentLoadSystem: number;
  };
}

@injectable()
export class SystemService {
  constructor() {
    // 如果在 Docker 容器中并挂载了宿主机文件系统，告诉 systeminformation 读取宿主机信息
    if (process.env.FS_PREFIX) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (si as any).fs = process.env.FS_PREFIX;
      console.log(`[System] Configured systeminformation with fs=${process.env.FS_PREFIX}`);
    } 
    // 自动探测逻辑可以简化或移除，既然不再需要 OS Distro 信息，
    // 其实 FS_PREFIX 仅对 CPU/Uptime 等内核信息有辅助作用 (pid:host 已解决大部分),
    // 但 fsSize 仍然主要靠 mount。既然用户说只要 "CPU负载、内存、运行时间、磁盘"，
    // 实际上大部分数据不依赖 /etc/os-release 了。
    // 但是 FS_PREFIX 对 fsSize (df command) 的准确性可能有帮助，保留基本配置即可。
  }

  async getSystemInfo(): Promise<SystemInfo> {
    try {
      const [memory, currentLoad, fsSize, time] =
        await Promise.all([
          si.mem(),
          si.currentLoad(),
          si.fsSize(),
          si.time(),
        ]);

      // 过滤和去重逻辑
      const filteredDisks = (fsSize || [])
        .filter(d => {
          // 排除虚拟文件系统
          if (['tmpfs', 'devtmpfs', 'squashfs', 'iso9660', 'devfs', 'autofs'].includes(d.type)) return false;
          // 排除常见的 Docker 内部挂载点或小容量挂载
          if (d.mount.startsWith('/run') || d.mount.startsWith('/etc') || d.mount.startsWith('/sys')) return false;
          // 如果挂载点包含 /var/lib/docker，通常是容器层的挂载，排除
          if (d.mount.includes('/var/lib/docker')) return false;
          return true;
        });

      // 按 fs 去重，保留挂载路径最短的（例如 '/' 优于 '/app'）
      const uniqueDisks = filteredDisks.reduce((acc: typeof fsSize, curr) => {
        const existing = acc.find(d => d.fs === curr.fs);
        if (!existing) {
          acc.push(curr);
        } else if (curr.mount.length < existing.mount.length) {
          // 保留挂载路径更短的那个
          const index = acc.indexOf(existing);
          acc[index] = curr;
        }
        return acc;
      }, []);

      return {
        memory: {
          total: memory.total,
          free: memory.free,
          used: memory.used,
          usedPercent: (memory.used / memory.total) * 100,
        },
        uptime: time.uptime,
        disk: uniqueDisks.map((disk) => ({
          fs: disk.fs,
          type: disk.type,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          usePercent: disk.use,
          mount: disk.mount,
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
