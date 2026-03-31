import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Forms = lazy(() => import('./pages/Forms'));
const CreateForm = lazy(() => import('./pages/CreateForm'));
const FormDetail = lazy(() => import('./pages/FormDetail'));
const Branches = lazy(() => import('./pages/Branches'));
const Customers = lazy(() => import('./pages/Customers'));
// AMC route removed - using Booking Form directly
// const AMC = lazy(() => import('./pages/AMC'));
const Employees = lazy(() => import('./pages/Employees'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const Receipts = lazy(() => import('./pages/Receipts'));
const Collections = lazy(() => import('./pages/Collections'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Logistics = lazy(() => import('./pages/Logistics'));
const HQAccount = lazy(() => import('./pages/HQAccount'));
const Ledger = lazy(() => import('./pages/Ledger'));
const TaskAssignment = lazy(() => import('./pages/TaskAssignment'));
const MyTasks = lazy(() => import('./pages/MyTasks'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="branches" element={<Branches />} />
            <Route path="customers" element={<Customers />} />
            {/* AMC route removed - using Booking Form directly */}
            <Route path="employees" element={<Employees />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="collections" element={<Collections />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="hq-account" element={<HQAccount />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="forms" element={<Forms />} />
            <Route path="forms/create" element={<CreateForm />} />
            <Route path="forms/:id" element={<FormDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="task-assignment" element={<TaskAssignment />} />
            <Route path="my-tasks" element={<MyTasks />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
