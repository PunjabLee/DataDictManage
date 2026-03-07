/**
 * @file App.tsx
 * @description EE Web 版根组件
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Designer from './pages/Designer';
import ProjectList from './pages/ProjectList';
import TeamManage from './pages/TeamManage';
import DataStandard from './pages/DataStandard';
import Workflow from './pages/Workflow';
import ApiPlatform from './pages/ApiPlatform';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="designer/:projectId?" element={<Designer />} />
          <Route path="teams" element={<TeamManage />} />
          <Route path="standards" element={<DataStandard />} />
          <Route path="workflows" element={<Workflow />} />
          <Route path="api-platform" element={<ApiPlatform />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
