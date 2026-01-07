import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Statistic, Spin, Alert, Typography, Button } from 'antd';
import {
  HddOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { systemApi } from '../../api/system';
import type { SystemInfo } from '../../types';
import HistoryChart from '../../components/HistoryChart';
import './index.css';

const { Text } = Typography;

const Dashboard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await systemApi.getSystemInfo();
        setSystemInfo(data);
        setError(null);
      } catch (err) {
        // 仅在首次加载失败时显示错误（通过检查 systemInfo 是否为空的当前状态很难，这里简化逻辑）
        // 实际上因为是闭包，这里也不能准确判断是否已有数据
        // 最好的方式是让 error 也不要轻易覆盖已有数据
        console.error(err);
        // 使用函数式更新来决定是否设置错误
        setSystemInfo(prev => {
          if (!prev) setError('无法获取系统信息，请检查后端服务是否运行');
          return prev;
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000); // 每5秒刷新

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0天 0小时 0分钟';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const getProgressColor = (percent: number): string => {
    if (percent < 60) return '#52c41a';
    if (percent < 80) return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载系统信息中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (!systemInfo) {
    return null;
  }

  return (
    <div className="dashboard" style={{ padding: 24 }}>
      <div className="dashboard-content container">
        {/* 系统概览 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={
                  <span className="stat-title">
                    <ThunderboltOutlined /> CPU 负载
                  </span>
                }
                value={systemInfo.currentLoad.currentLoad.toFixed(2)}
                suffix="%"
                valueStyle={{ color: getProgressColor(systemInfo.currentLoad.currentLoad) }}
              />
              <Progress
                percent={Number(systemInfo.currentLoad.currentLoad.toFixed(2))}
                strokeColor={getProgressColor(systemInfo.currentLoad.currentLoad)}
                showInfo={false}
                className="stat-progress"
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={
                  <span className="stat-title">
                    <DatabaseOutlined /> 内存使用
                  </span>
                }
                value={systemInfo.memory.usedPercent.toFixed(2)}
                suffix="%"
                valueStyle={{ color: getProgressColor(systemInfo.memory.usedPercent) }}
              />
              <Progress
                percent={Number(systemInfo.memory.usedPercent.toFixed(2))}
                strokeColor={getProgressColor(systemInfo.memory.usedPercent)}
                showInfo={false}
                className="stat-progress"
              />
              <Text type="secondary" className="stat-detail">
                {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={
                  <span className="stat-title">
                    <ClockCircleOutlined /> 运行时间
                  </span>
                }
                value={formatUptime(systemInfo?.uptime || 0)}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={
                  <span className="stat-title">
                    <HddOutlined /> 磁盘使用
                  </span>
                }
                value={(() => {
                  const mainDisk = systemInfo.disk.find(d => d.mount === '/' || d.mount === '/host') || systemInfo.disk[0];
                  if (!mainDisk) return '0.00';
                  return ((mainDisk.used / mainDisk.size) * 100).toFixed(2);
                })()}
                suffix="%"
              />
              <Progress
                percent={Number((() => {
                  const mainDisk = systemInfo.disk.find(d => d.mount === '/' || d.mount === '/host') || systemInfo.disk[0];
                  if (!mainDisk) return 0;
                  return ((mainDisk.used / mainDisk.size) * 100).toFixed(2);
                })())}
                strokeColor={getProgressColor(Number((() => {
                  const mainDisk = systemInfo.disk.find(d => d.mount === '/' || d.mount === '/host') || systemInfo.disk[0];
                  if (!mainDisk) return 0;
                  return ((mainDisk.used / mainDisk.size) * 100).toFixed(2);
                })()))}
                showInfo={false}
                className="stat-progress"
              />
              <Text type="secondary" className="stat-detail">
                {(() => {
                  const mainDisk = systemInfo.disk.find(d => d.mount === '/' || d.mount === '/host') || systemInfo.disk[0];
                  if (!mainDisk) return '0 B / 0 B';
                  return `${formatBytes(mainDisk.used)} / ${formatBytes(mainDisk.size)}`;
                })()}
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 历史趋势图 */}
        <HistoryChart />
      </div>
    </div>
  );
};

export default Dashboard;
