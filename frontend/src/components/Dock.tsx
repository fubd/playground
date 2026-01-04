import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ExperimentOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import './Dock.css';

const Dock: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      path: '/'
    },
    {
      key: '/test1',
      icon: <ExperimentOutlined />,
      label: '测试 1',
      path: '/test1'
    },
    {
      key: '/test2',
      icon: <ThunderboltOutlined />,
      label: '测试 2',
      path: '/test2'
    }
  ];

  return (
    <div className="dock-container">
      <div className="dock-content">
        {menuItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
          >
            <span className="dock-item-icon">{item.icon}</span>
            <span className="dock-label">{item.label}</span>
            <span className="active-dot"></span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Dock;
