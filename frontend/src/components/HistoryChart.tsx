import React, { useEffect, useState, useRef } from 'react';
// --- 核心修改：不再直接引入 ReactECharts，而是引入核心工具 ---
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';

// --- 按需引入你需要的图表类型和组件 ---
import { LineChart } from 'echarts/charts'; // 只要折线图
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers'; // 使用 Canvas 渲染，体积更小

import { Card, Alert, Radio, type RadioChangeEvent } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

// --- 注册必须的组件 ---
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
]);

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
  const [range, setRange] = useState<'1h' | '24h'>('1h');

  const isMounted = useRef(true);

  const fetchData = async (currentRange = range) => {
    try {
      const res = await apiClient.get<Metric[]>('/metrics/history', {
        params: { range: currentRange }
      }) as unknown as Metric[];
      if (isMounted.current) {
        setData(res);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch metrics history:', err);
      if (isMounted.current && data.length === 0) {
        setError('加载失败');
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);

    fetchData().finally(() => {
      if (isMounted.current) setLoading(false);
    });

    const interval = setInterval(() => fetchData(), 10000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [range]);

  const handleRangeChange = (e: RadioChangeEvent) => {
    const newRange = e.target.value;
    setRange(newRange);
  };

  const getOption = () => {
    if (!data || data.length === 0) return {};

    const timestamps = data.map((item) => {
      const date = new Date(item.created_at);
      if (range === '24h') {
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const dd = date.getDate().toString().padStart(2, '0');
        const hh = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${mm}-${dd} ${hh}:${min}`;
      }
      return `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['CPU 负载 (%)', '内存使用 (%)'],
        textStyle: { color: '#666' },
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          color: '#888',
          fontSize: 10,
          rotate: range === '24h' ? 30 : 0
        },
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#888' },
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
      },
      series: [
        {
          name: 'CPU 负载 (%)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.1, color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
          tooltip: { valueFormatter: (value: number) => value.toFixed(2) },
          data: data.map((item) => item.cpu_load),
        },
        {
          name: '内存使用 (%)',
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.1, color: '#52c41a' },
          itemStyle: { color: '#52c41a' },
          tooltip: { valueFormatter: (value: number) => value.toFixed(2) },
          data: data.map((item) => item.memory_usage),
        },
      ],
    };
  };

  if (loading && data.length === 0) {
    return (
      <Card bordered={false} loading>
        <div style={{ height: 300 }} />
      </Card>
    );
  }

  if (error && data.length === 0) {
    return (
      <Card bordered={false}>
        <Alert message="无法加载历史数据" type="error" showIcon />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <LineChartOutlined /> 历史趋势
            <div style={{ marginLeft: 8, display: 'inline-flex' }}>
              <Radio.Group value={range} onChange={handleRangeChange} size="small">
                <Radio.Button value="1h">最近1h</Radio.Button>
                <Radio.Button value="24h">最近24h</Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>
      }
      bordered={false}
      style={{ marginTop: 24 }}
    >
      <div style={{ height: 350, width: '100%' }}>
        {/* --- 关键：使用 ReactEChartsCore 并传入配置好的 echarts 实例 --- */}
        <ReactEChartsCore
          echarts={echarts}
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