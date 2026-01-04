import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const TestPage2: React.FC = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Card bordered={false} style={{ borderRadius: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <Title level={2}>测试页面 2</Title>
        <Paragraph>
          这是第二个导航入口。在 Apple 风格的设计中，简洁和精致的交互是核心体验。
        </Paragraph>
        <div style={{ height: '300px', background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', borderRadius: '16px', marginTop: '24px' }} />
      </Card>
    </div>
  );
};

export default TestPage2;
