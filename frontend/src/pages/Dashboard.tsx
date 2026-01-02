import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Statistic, Tag, Spin, Alert, Typography } from 'antd';
import {
  CloudServerOutlined,
  HddOutlined,
  DatabaseOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { systemApi } from '../api/system';
import type { SystemInfo } from '../types';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const data = await systemApi.getSystemInfo();
        setSystemInfo(data);
        setError(null);
      } catch (err) {
        setError('无法获取系统信息，请检查后端服务是否运行');
        console.error(err);
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
    <div className="dashboard">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <CloudServerOutlined className="hero-icon" />
          <Title level={1} className="hero-title gradient-text">
            服务器监控仪表板
          </Title>
          <Text className="hero-subtitle">
            实时监控您的服务器性能和资源使用情况
          </Text>
        </div>
      </div>

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
                value={formatUptime(systemInfo.os.uptime)}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" bordered={false}>
              <Statistic
                title={
                  <span className="stat-title">
                    <ApiOutlined /> CPU 核心
                  </span>
                }
                value={systemInfo.cpu.cores}
                suffix={`/ ${systemInfo.cpu.physicalCores} 物理核心`}
              />
            </Card>
          </Col>
        </Row>

        {/* CPU 信息 */}
        <Card
          title={
            <span className="card-title">
              <ThunderboltOutlined /> CPU 信息
            </span>
          }
          className="info-card"
          bordered={false}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">制造商</Text>
                <Text strong>{systemInfo.cpu.manufacturer}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">型号</Text>
                <Text strong>{systemInfo.cpu.brand}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">主频</Text>
                <Text strong>{systemInfo.cpu.speed} GHz</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">处理器数量</Text>
                <Text strong>{systemInfo.cpu.processors}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 操作系统信息 */}
        <Card
          title={
            <span className="card-title">
              <CloudServerOutlined /> 操作系统
            </span>
          }
          className="info-card"
          bordered={false}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">平台</Text>
                <Tag color="blue">{systemInfo.os.platform}</Tag>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">发行版</Text>
                <Text strong>{systemInfo.os.distro}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">版本</Text>
                <Text strong>{systemInfo.os.release}</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="info-item">
                <Text className="info-label">架构</Text>
                <Tag color="green">{systemInfo.os.arch}</Tag>
              </div>
            </Col>
            <Col xs={24}>
              <div className="info-item">
                <Text className="info-label">主机名</Text>
                <Text strong code>{systemInfo.os.hostname}</Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 磁盘信息 */}
        <Card
          title={
            <span className="card-title">
              <HddOutlined /> 磁盘使用
            </span>
          }
          className="info-card"
          bordered={false}
        >
          {systemInfo.disk.map((disk, index) => (
            <div key={index} className="disk-item">
              <div className="disk-header">
                <Text strong>{disk.mount}</Text>
                <Text type="secondary">
                  {formatBytes(disk.used)} / {formatBytes(disk.size)}
                </Text>
              </div>
              <Progress
                percent={Number(disk.usePercent.toFixed(2))}
                strokeColor={getProgressColor(disk.usePercent)}
                className="disk-progress"
              />
              <div className="disk-footer">
                <Tag>{disk.fs}</Tag>
                <Tag>{disk.type}</Tag>
                <Text type="secondary">可用: {formatBytes(disk.available)}</Text>
              </div>
            </div>
          ))}
        </Card>

        {/* 网络接口 */}
        <Card
          title={
            <span className="card-title">
              <ApiOutlined /> 网络接口
            </span>
          }
          className="info-card"
          bordered={false}
        >
          <Row gutter={[16, 16]}>
            {systemInfo.network.map((net, index) => (
              <Col xs={24} md={12} key={index}>
                <Card className="network-card" size="small">
                  <div className="network-header">
                    <Text strong>{net.iface}</Text>
                    {net.speed > 0 && (
                      <Tag color="cyan">{net.speed} Mbps</Tag>
                    )}
                  </div>
                  <div className="network-info">
                    {net.ip4 && (
                      <div className="network-item">
                        <Text type="secondary">IPv4:</Text>
                        <Text code>{net.ip4}</Text>
                      </div>
                    )}
                    {net.ip6 && (
                      <div className="network-item">
                        <Text type="secondary">IPv6:</Text>
                        <Text code className="network-ipv6">{net.ip6}</Text>
                      </div>
                    )}
                    {net.mac && (
                      <div className="network-item">
                        <Text type="secondary">MAC:</Text>
                        <Text code>{net.mac}</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
