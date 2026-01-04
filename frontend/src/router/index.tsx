import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import TestPage1 from '../pages/TestPage1';
import TestPage2 from '../pages/TestPage2';
import Dock from '../components/Dock';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Dock />
      <div style={{ paddingTop: '80px' }}> {/* Space for floating dock */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test1" element={<TestPage1 />} />
          <Route path="/test2" element={<TestPage2 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;
