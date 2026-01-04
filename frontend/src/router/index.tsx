import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Todo from '../pages/Todo';
import Experiment from '../pages/Experiment';
import Dock from '../components/Dock';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Dock />
      <div style={{ paddingTop: '80px' }}> {/* Space for floating dock */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/test1" element={<Todo />} />
          <Route path="/test2" element={<Experiment />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;
