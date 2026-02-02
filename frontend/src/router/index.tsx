import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd'; // 既然用了 antd，用它的加载动画
import Dock from '../components/Dock';

// --- 关键点 1: 使用 lazy 函数进行动态导入 ---
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Todo = lazy(() => import('../pages/Todo'));
const Experiment = lazy(() => import('../pages/Experiment'));

// 提取一个简单的加载界面
const PageLoading = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <Spin size="large" tip="加载中..." />
  </div>
);

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Dock />
      <div style={{ paddingTop: '80px' }}>
        {/* --- 关键点 2: 使用 Suspense 包裹异步组件 --- */}
        {/* fallback 属性定义了在 JS 加载完成前的占位内容 */}
        <Suspense fallback={PageLoading}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/test1" element={<Todo />} />
            <Route path="/test2" element={<Experiment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;