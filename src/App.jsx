import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Forms from './pages/Forms';
import CreateForm from './pages/CreateForm';
import Branches from './pages/Branches';
import Employees from './pages/Employees';
import Enquiries from './pages/Enquiries';
import Receipts from './pages/Receipts';
import Collections from './pages/Collections';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import FormDetail from './pages/FormDetail';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard/App shell */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          {/* Sub routes will append here later */}
          <Route index element={<Dashboard />} />
          <Route path="branches" element={<Branches />} />
          <Route path="employees" element={<Employees />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="receipts" element={<Receipts />} />
          <Route path="collections" element={<Collections />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="forms" element={<Forms />} />
          <Route path="forms/create" element={<CreateForm />} />
          <Route path="forms/:id" element={<FormDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
