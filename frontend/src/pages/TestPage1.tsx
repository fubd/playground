import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const TestPage1: React.FC = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Title level={2}>测试页面 1</Title>
        <Paragraph>
          这是一个用于测试 Dock 导航栏交互的示例页面。你可以观察到顶部 Dock 栏的切换效果和毛玻璃背景。
        </Paragraph>
        <div style={{ height: '300px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', marginTop: '24px' }} />
      </Card>
    </div>
  );
};

export default TestPage1;
