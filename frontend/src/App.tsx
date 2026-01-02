import React from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';
import './styles/variables.css';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: 'hsl(217, 91%, 60%)',
          colorSuccess: 'hsl(142, 71%, 45%)',
          colorWarning: 'hsl(38, 92%, 50%)',
          colorError: 'hsl(0, 84%, 60%)',
          colorInfo: 'hsl(188, 78%, 41%)',
          borderRadius: 8,
          fontSize: 16,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
};

export default App;

