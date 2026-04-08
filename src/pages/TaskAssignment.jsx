import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Calendar, Users, UserCheck, Clock, CheckCircle, XCircle, ChevronRight, Filter, Eye } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

const TaskAssignment = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin';

  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [selectedBranch, setSelectedBranch] = useState(isBranchAdmin ? user?.branchId?._id : '');
  const [filterStatus, setFilterStatus] = useState('UNASSIGNED');

  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [branches, setBranches] = useState([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignmentNote, setAssignmentNote] = useState('');

  const [showWorkloadSidebar, setShowWorkloadSidebar] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
    }
  }, [isSuperAdmin]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const { data: unassignedData, isLoading: unassignedLoading, refetch: refetchUnassigned } = useQuery({
    queryKey: ['unassigned-bookings', startDate, endDate, selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      const response = await api.get(`/task-assignments/unassigned-bookings?${params.toString()}`);
      return response.data.data || [];
    },
    staleTime: 5000,
    refetchInterval: 10000
  });

  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery({
    queryKey: ['task-assignments', startDate, endDate, selectedBranch, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (filterStatus && filterStatus !== 'ALL') params.append('status', filterStatus);
      const response = await api.get(`/task-assignments?${params.toString()}`);
      return response.data.data || [];
    },
    staleTime: 5000,
    refetchInterval: 10000
  });

  const { data: workloadData, refetch: refetchWorkload } = useQuery({
    queryKey: ['employee-workload', startDate, endDate, selectedBranch, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedDate) params.append('date', selectedDate);
      const response = await api.get(`/task-assignments/employee-workload?${params.toString()}`);
      return response.data.data || [];
    },
    staleTime: 5000,
    refetchInterval: 10000
  });

  const unassignedBookings = unassignedData || [];
  const allAssignments = assignmentsData || [];
  const employeeWorkload = workloadData || [];

  const fetchAllEmployeesWithWorkload = async () => {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      
      const response = await api.get(`/task-assignments/employee-workload?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching all employees:', error);
      return [];
    }
  };

  const fetchAvailableEmployees = async (date, branchId) => {
    try {
      if (!date) {
        console.error('fetchAvailableEmployees called without date');
        return;
      }
      
      const params = new URLSearchParams();
      params.append('date', date);
      if (branchId) params.append('branchId', branchId);
      
      const response = await api.get(`/task-assignments/available-employees?${params.toString()}`);
      const allWorkload = await fetchAllEmployeesWithWorkload();
      const workloadMap = {};
      allWorkload.forEach(w => { workloadMap[w.employee._id] = w; });
      
      const employeesWithWorkload = response.data.data.map(emp => ({
        ...emp,
        totalTasks: workloadMap[emp._id]?.totalTasks || 0,
        workloadData: workloadMap[emp._id] || null
      }));
      
      employeesWithWorkload.sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.totalTasks - b.totalTasks;
      });
      
      setAvailableEmployees(employeesWithWorkload);
    } catch (error) {
      toast.error('Error fetching employees');
    }
  };

  const assignTaskMutation = useMutation({
    mutationFn: (data) => api.post('/task-assignments', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['unassigned-bookings'] });
      await queryClient.cancelQueries({ queryKey: ['task-assignments'] });
      await queryClient.cancelQueries({ queryKey: ['employee-workload'] });
      const previousUnassigned = queryClient.getQueryData(['unassigned-bookings']);
      const previousAssignments = queryClient.getQueryData(['task-assignments']);
      const previousWorkload = queryClient.getQueryData(['employee-workload']);
      
      // Optimistic: Remove from unassigned list
      queryClient.setQueryData(['unassigned-bookings'], (old) => {
        if (!old) return [];
        return old.filter(b => b._id !== data.serviceFormId);
      });
      
      return { previousUnassigned, previousAssignments, previousWorkload };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['unassigned-bookings'], context.previousUnassigned);
      queryClient.setQueryData(['task-assignments'], context.previousAssignments);
      queryClient.setQueryData(['employee-workload'], context.previousWorkload);
      
      // Get the actual error message from backend
      const errorData = err.response?.data;
      let errorMsg = 'Error assigning task';
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        } else {
          errorMsg = JSON.stringify(errorData);
        }
      }
      
      toast.error(errorMsg);
      console.error('Task assignment error:', errorData);
      console.error('Full error:', err);
    },
    onSuccess: (data, variables) => {
      toast.success('Task assigned successfully! Request sent to technician.');
      
      // Optimistic: Add to assignments list
      queryClient.setQueryData(['task-assignments'], (old) => {
        if (!old) return [data.data.data];
        return [data.data.data, ...old];
      });
      
      setShowAssignModal(false);
      setSelectedBooking(null);
      setSelectedEmployee(null);
      setAssignmentNote('');
      queryClient.invalidateQueries({ queryKey: ['unassigned-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['employee-workload'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
    }
  });

  const cancelAssignmentMutation = useMutation({
    mutationFn: (assignmentId) => api.patch(`/task-assignments/${assignmentId}/cancel`),
    onMutate: async (assignmentId) => {
      await queryClient.cancelQueries({ queryKey: ['unassigned-bookings'] });
      await queryClient.cancelQueries({ queryKey: ['task-assignments'] });
      const previousUnassigned = queryClient.getQueryData(['unassigned-bookings']);
      const previousAssignments = queryClient.getQueryData(['task-assignments']);
      // Optimistic: Remove from assignments
      queryClient.setQueryData(['task-assignments'], (old) => {
        if (!old) return [];
        return old.filter(a => a._id !== assignmentId);
      });
      return { previousUnassigned, previousAssignments };
    },
    onError: (err, assignmentId, context) => {
      queryClient.setQueryData(['unassigned-bookings'], context.previousUnassigned);
      queryClient.setQueryData(['task-assignments'], context.previousAssignments);
      toast.error('Error cancelling assignment');
    },
    onSuccess: () => {
      toast.success('Assignment cancelled');
      queryClient.invalidateQueries({ queryKey: ['unassigned-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['employee-workload'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
    }
  });

  const handleAssignTask = () => {
    if (!selectedBooking) {
      toast.error('Please select a booking');
      return;
    }
    
    if (!selectedEmployee || !selectedEmployee._id) {
      toast.error('Please select an employee');
      return;
    }
    
    // Get the ServiceForm ID - could be nested in serviceFormId or directly on selectedBooking
    const hasServiceFormIdNested = selectedBooking.serviceFormId && (
      typeof selectedBooking.serviceFormId === 'object' 
        ? selectedBooking.serviceFormId._id 
        : selectedBooking.serviceFormId
    );
    
    const serviceFormId = hasServiceFormIdNested 
      ? (typeof selectedBooking.serviceFormId === 'object' ? selectedBooking.serviceFormId._id : selectedBooking.serviceFormId)
      : selectedBooking._id; // selectedBooking IS the ServiceForm
    
    if (!serviceFormId) {
      toast.error('Invalid booking data. Please refresh and try again.');
      console.error('ServiceFormId missing:', selectedBooking);
      return;
    }
    
    // Get the ServiceForm data - could be nested or directly on selectedBooking
    const serviceFormData = hasServiceFormIdNested 
      ? (typeof selectedBooking.serviceFormId === 'object' ? selectedBooking.serviceFormId : null)
      : selectedBooking; // selectedBooking IS the ServiceForm
    
    // Schedule date can come from:
    // 1. ServiceForm's schedule.date (if populated)
    // 2. TaskAssignment's scheduledDate field
    // 3. Fallback to selectedDate
    let scheduleDate = 
      (serviceFormData?.schedule?.date) || 
      (serviceFormData?.schedule?.scheduledDate) || 
      selectedBooking.scheduledDate || 
      selectedDate;
    
    if (!scheduleDate) {
      toast.error('Schedule date is missing. Please set a schedule date.');
      return;
    }
    
    // Parse and format the date properly
    let finalDate;
    try {
      // If it's already a valid ISO string or YYYY-MM-DD, use it directly
      if (typeof scheduleDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(scheduleDate)) {
        finalDate = scheduleDate.split('T')[0];
      } 
      // If it's a Date object or string, convert to proper format
      else {
        const dateObj = new Date(scheduleDate);
        if (isNaN(dateObj.getTime())) {
          // Try parsing from selectedDate
          finalDate = selectedDate;
        } else {
          finalDate = dateObj.toISOString().split('T')[0];
        }
      }
    } catch (e) {
      finalDate = selectedDate;
    }
    
    if (!finalDate) {
      toast.error('Could not determine schedule date.');
      return;
    }
    
    // The actual ServiceForm ID
    const actualServiceFormId = serviceFormData?._id || selectedBooking.serviceFormId;
    
    if (!actualServiceFormId) {
      toast.error('Invalid booking data. Service Form ID not found.');
      return;
    }
    
    const payload = {
      serviceFormId: actualServiceFormId,
      assignedTo: selectedEmployee._id,
      scheduledDate: finalDate,
      notes: assignmentNote
    };
    
    assignTaskMutation.mutate(payload);
  };

  const handleCancelAssignment = (assignmentId) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) return;
    cancelAssignmentMutation.mutate(assignmentId);
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    
    // Get the ServiceForm data - could be nested in serviceFormId or directly on booking
    const hasServiceFormIdNested = booking.serviceFormId && (
      typeof booking.serviceFormId === 'object' 
        ? booking.serviceFormId._id 
        : booking.serviceFormId
    );
    
    // ServiceForm data is either nested or booking IS the ServiceForm
    const serviceFormData = hasServiceFormIdNested 
      ? (typeof booking.serviceFormId === 'object' ? booking.serviceFormId : null)
      : booking; // booking IS the ServiceForm
    
    // Schedule date can come from:
    // 1. ServiceForm's schedule.date (if populated)
    // 2. TaskAssignment's scheduledDate field
    // 3. Fallback to selectedDate
    let scheduleDate = 
      (serviceFormData?.schedule?.date) || 
      (serviceFormData?.schedule?.scheduledDate) || 
      booking.scheduledDate || 
      selectedDate;
    
    // Parse and format the date properly
    let parsedDate = selectedDate;
    try {
      if (scheduleDate) {
        // If it's already a valid ISO string or YYYY-MM-DD, use it directly
        if (typeof scheduleDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(scheduleDate)) {
          parsedDate = scheduleDate.split('T')[0];
        } 
        // Try to parse as Date
        else {
          const dateObj = new Date(scheduleDate);
          if (!isNaN(dateObj.getTime())) {
            parsedDate = format(dateObj, 'yyyy-MM-dd');
          }
        }
      }
    } catch (e) {
      parsedDate = selectedDate;
    }
    setSelectedDate(parsedDate);
    
    const branchId = serviceFormData?.branchId?._id || booking?.branchId?._id || booking?.branchId;
    fetchAvailableEmployees(parsedDate, branchId || selectedBranch);
    setShowAssignModal(true);
  };

  const getEmployeeStatusColor = (emp) => {
    if (emp.isAvailable && emp.totalTasks === 0) return 'bg-green-500';
    if (emp.totalTasks <= 3) return 'bg-yellow-500';
    if (emp.totalTasks <= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getEmployeeStatusText = (emp) => {
    if (emp.isAvailable && emp.totalTasks === 0) return 'Free';
    if (emp.totalTasks === 0) return 'Available';
    if (emp.totalTasks <= 3) return 'Light Load';
    if (emp.totalTasks <= 6) return 'Moderate';
    return 'Heavy Load';
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(String(dateStr));
      if (isNaN(date.getTime())) return '-';
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'dd MMM');
    } catch (e) {
      return '-';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getDateStatus = (dateStr) => {
    if (!dateStr) return 'bg-gray-500';
    try {
      const date = parseISO(String(dateStr));
      if (isNaN(date.getTime())) return 'bg-gray-500';
      if (isToday(date)) return 'bg-green-500';
      if (isTomorrow(date)) return 'bg-blue-500';
      if (isThisWeek(date)) return 'bg-yellow-500';
    } catch (e) {
      return 'bg-gray-500';
    }
    return 'bg-gray-500';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Task Assignment</h1>
        <p className="text-slate-500">Manage bookings and assign tasks to employees</p>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-500">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isSuperAdmin && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.branchName}
              </option>
            ))}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="UNASSIGNED">Unassigned</option>
          <option value="PENDING">Pending (Requests)</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="COMPLETED">Completed</option>
          <option value="ALL">All</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Unassigned Bookings ({unassignedBookings.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'assignments'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            All Assignments ({allAssignments.length})
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('employees');
            refetchWorkload();
          }}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Employee Workload
          </div>
        </button>
      </div>

      {unassignedLoading || assignmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : activeTab === 'bookings' ? (
        <>
          {employeeWorkload.length > 0 && (
            <div className="mb-4 bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employee Workload Summary
                </h3>
                <button
                  onClick={() => setActiveTab('employees')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {employeeWorkload.slice(0, 6).map((item) => (
                  <div
                    key={item.employee._id}
                    className={`p-3 rounded-lg border-2 ${
                      item.totalTasks === 0 ? 'border-green-200 bg-green-50' : 
                      item.totalTasks <= 3 ? 'border-yellow-200 bg-yellow-50' : 
                      item.totalTasks <= 6 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-700 truncate">{item.employee.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-lg font-bold ${
                        item.totalTasks === 0 ? 'text-green-600' : 
                        item.totalTasks <= 3 ? 'text-yellow-600' : 
                        item.totalTasks <= 6 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {item.totalTasks}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        item.totalTasks === 0 ? 'bg-green-500' : 
                        item.totalTasks <= 3 ? 'bg-yellow-500' : 
                        item.totalTasks <= 6 ? 'bg-orange-500' : 'bg-red-500'
                      }`}></span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.totalTasks === 0 ? 'FREE' : 'tasks'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Order No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Time</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unassignedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      No unassigned bookings found
                    </td>
                  </tr>
                ) : (
                  unassignedBookings.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDateStatus(task.scheduledDate)}`}></div>
                          <span className="font-medium">
                            {task.scheduledDate ? formatDateLabel(task.scheduledDate) : '-'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {task.scheduledDate ? (() => {
                            try {
                              const d = parseISO(task.scheduledDate);
                              return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy');
                            } catch { return '-'; }
                          })() : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{(task.serviceFormId || {}).orderNo || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{(task.serviceFormId?.customer?.name || task.serviceFormId?.customerId?.name || '-')}</div>
                        <div className="text-xs text-slate-500">{(task.serviceFormId?.customer?.phone || task.serviceFormId?.customerId?.phone || '-')}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{(task.serviceFormId?.serviceType || '-')}</div>
                        <div className="text-xs text-slate-500">{(task.serviceFormId?.serviceCategory || '-')}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{task.branchId?.branchName || task.serviceFormId?.branchId?.branchName || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{task.serviceFormId?.pricing?.finalAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(task.serviceFormId || {});
                              setShowBookingDetailModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAssignModal(task)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                          >
                            <UserCheck className="w-4 h-4" />
                            Assign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : activeTab === 'assignments' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Order No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Branch</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allAssignments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                      No assignments found
                    </td>
                  </tr>
                ) : (
                  allAssignments.map((assignment) => {
                    const serviceForm = assignment.serviceFormId || {};
                    return (
                      <tr key={assignment._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getDateStatus(assignment.scheduledDate)}`}></div>
                            <span className="font-medium">
                              {assignment.scheduledDate ? formatDateLabel(assignment.scheduledDate) : '-'}
                            </span>
                          </div>
                          {assignment.scheduledDate && (
                            <div className="text-xs text-slate-500">
                              {format(new Date(assignment.scheduledDate), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{serviceForm.orderNo || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{serviceForm.customerId?.name || serviceForm.customer?.name || '-'}</div>
                          <div className="text-xs text-slate-500">{serviceForm.customerId?.phone || serviceForm.customer?.phone || '-'}</div>
                        </td>
                        <td className="px-4 py-3">
                          {assignment.assignedTo ? (
                            <div>
                              <div className="font-medium">{assignment.assignedTo.name}</div>
                              <div className="text-xs text-slate-500">{assignment.assignedTo.employeeId}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {assignment.status ? getStatusBadge(assignment.status) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{serviceForm.branchId?.branchName || assignment.branchId?.branchName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(serviceForm);
                                setShowBookingDetailModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {['PENDING', 'ASSIGNED'].includes(assignment.status) && (
                              <button
                                onClick={() => handleCancelAssignment(assignment._id)}
                                disabled={cancelAssignmentMutation.isPending}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employeeWorkload.map((item) => (
            <div
              key={item.employee._id}
              className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.totalTasks === 0 ? 'bg-green-100' : 
                    item.totalTasks <= 3 ? 'bg-yellow-100' : 
                    item.totalTasks <= 6 ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      item.totalTasks === 0 ? 'text-green-600' : 
                      item.totalTasks <= 3 ? 'text-yellow-600' : 
                      item.totalTasks <= 6 ? 'text-orange-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-semibold">{item.employee.name}</div>
                    <div className="text-xs text-slate-500">{item.employee.employeeId}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  item.totalTasks === 0 ? 'bg-green-100 text-green-700' : 
                  item.totalTasks <= 3 ? 'bg-yellow-100 text-yellow-700' : 
                  item.totalTasks <= 6 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.totalTasks === 0 ? 'FREE' : `${item.totalTasks} Tasks`}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-slate-900">{item.totalTasks}</div>
                  <div className="text-[10px] text-slate-500">Total</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-yellow-600">{item.pending}</div>
                  <div className="text-[10px] text-slate-500">Pending</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-blue-600">{item.assigned}</div>
                  <div className="text-[10px] text-slate-500">Assigned</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-green-600">{item.accepted}</div>
                  <div className="text-[10px] text-slate-500">Active</div>
                </div>
              </div>
            </div>
          ))}
          {employeeWorkload.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No employees found
            </div>
          )}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-500">
              <h2 className="text-xl font-bold text-white">Assign Task</h2>
              <p className="text-sm text-blue-100 mt-1">
                Customer: {selectedBooking?.customerId?.name || selectedBooking?.customer?.name} • 
                {selectedBooking?.serviceType} • ₹{selectedBooking?.pricing?.finalAmount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Select Employee - Showing employees by workload (Free employees first)
                </label>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableEmployees.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No employees available</p>
                  ) : (
                    availableEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedEmployee?._id === emp._id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              emp.totalTasks === 0 ? 'bg-green-100' : 
                              emp.totalTasks <= 3 ? 'bg-yellow-100' : 
                              emp.totalTasks <= 6 ? 'bg-orange-100' : 'bg-red-100'
                            }`}>
                              <Users className={`w-5 h-5 ${
                                emp.totalTasks === 0 ? 'text-green-600' : 
                                emp.totalTasks <= 3 ? 'text-yellow-600' : 
                                emp.totalTasks <= 6 ? 'text-orange-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-semibold">{emp.name}</div>
                              <div className="text-xs text-slate-500">
                                {emp.employeeId} • {emp.branchId?.branchName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-xs font-bold ${
                                emp.totalTasks === 0 ? 'text-green-600' : 
                                emp.totalTasks <= 3 ? 'text-yellow-600' : 
                                emp.totalTasks <= 6 ? 'text-orange-600' : 'text-red-600'
                              }`}>
                                {emp.totalTasks} Tasks
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {emp.totalTasks === 0 ? 'Free' : 
                                  emp.totalTasks <= 3 ? 'Light' : 
                                  emp.totalTasks <= 6 ? 'Moderate' : 'Heavy'}
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              emp.totalTasks === 0 ? 'bg-green-500' : 
                              emp.totalTasks <= 3 ? 'bg-yellow-500' : 
                              emp.totalTasks <= 6 ? 'bg-orange-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add any notes for the employee..."
                />
              </div>
              {selectedEmployee && (
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedEmployee.totalTasks === 0 ? 'bg-green-100' : 
                      selectedEmployee.totalTasks <= 3 ? 'bg-yellow-100' : 
                      selectedEmployee.totalTasks <= 6 ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                      <Users className={`w-5 h-5 ${
                        selectedEmployee.totalTasks === 0 ? 'text-green-600' : 
                        selectedEmployee.totalTasks <= 3 ? 'text-yellow-600' : 
                        selectedEmployee.totalTasks <= 6 ? 'text-orange-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold">{selectedEmployee.name}</div>
                      <div className="text-sm text-blue-700">
                        Current Workload: <span className="font-bold">{selectedEmployee.totalTasks} tasks</span>
                        {selectedEmployee.totalTasks === 0 ? ' - Employee is FREE' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBooking(null);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  disabled={!selectedEmployee || assignTaskMutation.isPending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {assignTaskMutation.isPending ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBookingDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-sm text-slate-500">{selectedBooking.orderNo}</p>
              </div>
              <button
                onClick={() => setShowBookingDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Customer</h3>
                  <p className="font-semibold">{selectedBooking.customerId?.name || selectedBooking.customer?.name}</p>
                  <p className="text-sm text-slate-600">{selectedBooking.customerId?.phone || selectedBooking.customer?.phone}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.customerId?.address || selectedBooking.customer?.address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Service</h3>
                  <p className="font-semibold">{selectedBooking.serviceType}</p>
                  <p className="text-sm text-slate-600">{selectedBooking.serviceCategory}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Schedule</h3>
                  <p className="font-semibold">
                    {selectedBooking.schedule?.date ? (() => {
                      try {
                        const date = parseISO(selectedBooking.schedule.date);
                        return isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy');
                      } catch {
                        return '-';
                      }
                    })() : '-'}
                  </p>
                  <p className="text-sm text-slate-600">{selectedBooking.schedule?.time || selectedBooking.schedule?.timeSlot || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Amount</h3>
                  <p className="font-semibold">₹{selectedBooking.pricing?.finalAmount?.toLocaleString() || 0}</p>
                  <p className="text-sm text-slate-600">
                    {selectedBooking.billing?.paymentMode || 'Not Paid'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Branch</h3>
                  <p className="font-semibold">{selectedBooking.branchId?.branchName}</p>
                  <p className="text-sm text-slate-600">{selectedBooking.branchId?.city}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Premises</h3>
                  <p className="font-semibold">{selectedBooking.premises?.type || '-'}</p>
                  <p className="text-sm text-slate-600">
                    {selectedBooking.premises?.totalArea ? `${selectedBooking.premises.totalArea} sq ft` : '-'}
                  </p>
                </div>
              </div>
              {selectedBooking.attDetails?.treatmentTypes?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-500">Treatment Types</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedBooking.attDetails.treatmentTypes.map((type, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 rounded text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowBookingDetailModal(false);
                  openAssignModal(selectedBooking);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Assign Task
              </button>
              <button
                onClick={() => setShowBookingDetailModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAssignment;
