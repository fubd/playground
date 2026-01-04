import React from 'react';
import { NavLink } from 'react-router-dom';
import './Dock.css';

const Dock: React.FC = () => {
  const menuItems = [
    {
      key: '/',
      label: '监控',
      path: '/'
    },
    {
      key: '/test1',
      label: '演示',
      path: '/test1'
    },
    {
      key: '/test2',
      label: '实验',
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
            <span className="active-dot"></span>
            <span className="dock-label-text">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Dock;
