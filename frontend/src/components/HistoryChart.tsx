import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Alert } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

export interface Metric {
  id: number;
  cpu_load: number;
  memory_usage: number;
  created_at: string;
}

const HistoryChart: React.FC = () => {
  const [data, setData] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track mounted state to prevent state updates on unmount
  const isMounted = useRef(true);

  const fetchData = async () => {
    try {
      console.log('Fetching history data...');
      // The interceptor returns response.data, so the result IS the data (Metric[])
      // We cast to Metric[] to satisfy TypeScript forcing AxiosResponse
      const res = await apiClient.get<Metric[]>('/metrics/history') as unknown as Metric[];
      console.log('History data received:', res);
      if (isMounted.current) {
        // Take last 60 points if needed, though backend limits to 1 hour
        setData(res);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch metrics history:', err);
      // Only set error if we don't have data yet
      if (isMounted.current && data.length === 0) {
        setError('加载失败');
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // Initial fetch
    fetchData().finally(() => {
      if (isMounted.current) setLoading(false);
    });

    const interval = setInterval(fetchData, 10000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOption = () => {
    if (!data || data.length === 0) return {};

    const timestamps = data.map((item) => {
      const date = new Date(item.created_at);
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['CPU 负载 (%)', '内存使用 (%)'],
        textStyle: {
          color: '#666',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          color: '#888',
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          color: '#888',
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#eee',
          },
        },
      },
      series: [
        {
          name: 'CPU 负载 (%)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            opacity: 0.1,
            color: '#1890ff',
          },
          itemStyle: {
            color: '#1890ff',
          },
          data: data.map((item) => item.cpu_load),
        },
        {
          name: '内存使用 (%)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            opacity: 0.1,
            color: '#52c41a',
          },
          itemStyle: {
            color: '#52c41a',
          },
          data: data.map((item) => item.memory_usage),
        },
      ],
    };
  };

  if (loading) {
    return (
      <Card className="chart-card" bordered={false} loading>
        <div style={{ height: 300 }} />
      </Card>
    );
  }

  if (error && data.length === 0) {
    return (
      <Card className="chart-card" bordered={false}>
        <Alert message="无法加载历史数据" type="error" showIcon />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <LineChartOutlined /> 历史趋势 (最近1小时)
        </span>
      }
      className="chart-card"
      bordered={false}
      style={{ marginTop: 24 }}
    >
      <div style={{ height: 350, width: '100%' }}>
        <ReactECharts
          option={getOption()}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </Card>
  );
};

export default HistoryChart;
