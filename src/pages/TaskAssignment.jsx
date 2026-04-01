import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Calendar, Users, UserCheck, Clock, CheckCircle, XCircle, ChevronRight, Filter, Eye } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';

const TaskAssignment = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin';

  const [activeTab, setActiveTab] = useState('bookings');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [selectedBranch, setSelectedBranch] = useState(isBranchAdmin ? user?.branchId?._id : '');
  const [filterStatus, setFilterStatus] = useState('UNASSIGNED');

  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [employeeWorkload, setEmployeeWorkload] = useState([]);
  const [branches, setBranches] = useState([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignmentNote, setAssignmentNote] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
    }
    fetchUnassignedBookings();
    fetchAssignments();
    fetchEmployeeWorkload();
  }, [selectedDate, startDate, endDate, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUnassignedBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      
      const response = await api.get(`/task-assignments/unassigned-bookings?${params.toString()}`);
      setUnassignedBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.response?.data?.message || 'Error fetching bookings');
      setUnassignedBookings([]);
    }
    setLoading(false);
  };

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      
      const response = await api.get(`/task-assignments?${params.toString()}`);
      setAllAssignments(response.data.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchEmployeeWorkload = async () => {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (selectedBranch) params.append('branchId', selectedBranch);
      if (selectedDate) params.append('date', selectedDate);
      
      const response = await api.get(`/task-assignments/employee-workload?${params.toString()}`);
      setEmployeeWorkload(response.data.data);
    } catch (error) {
      console.error('Error fetching workload:', error);
    }
  };

  const fetchAvailableEmployees = async (date, branchId) => {
    try {
      const params = new URLSearchParams();
      params.append('date', date);
      if (branchId) params.append('branchId', branchId);
      
      const response = await api.get(`/task-assignments/available-employees?${params.toString()}`);
      setAvailableEmployees(response.data.data);
    } catch (error) {
      toast.error('Error fetching employees');
    }
  };

  const handleAssignTask = async () => {
    if (!selectedBooking || !selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      await api.post('/task-assignments', {
        serviceFormId: selectedBooking._id,
        assignedTo: selectedEmployee._id,
        scheduledDate: selectedBooking.schedule?.date || selectedDate,
        notes: assignmentNote
      });
      
      toast.success('Task assigned successfully');
      setShowAssignModal(false);
      setSelectedBooking(null);
      setSelectedEmployee(null);
      setAssignmentNote('');
      fetchUnassignedBookings();
      fetchAssignments();
      fetchEmployeeWorkload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning task');
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) return;
    
    try {
      await api.patch(`/task-assignments/${assignmentId}/cancel`);
      toast.success('Assignment cancelled');
      fetchUnassignedBookings();
      fetchAssignments();
    } catch (error) {
      toast.error('Error cancelling assignment');
    }
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedDate(booking.schedule?.date ? format(parseISO(booking.schedule.date), 'yyyy-MM-dd') : selectedDate);
    fetchAvailableEmployees(
      booking.schedule?.date ? format(parseISO(booking.schedule.date), 'yyyy-MM-dd') : selectedDate,
      booking.branchId?._id || selectedBranch
    );
    setShowAssignModal(true);
  };

  const formatDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'dd MMM');
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
    const date = parseISO(dateStr);
    if (isToday(date)) return 'bg-green-500';
    if (isTomorrow(date)) return 'bg-blue-500';
    if (isThisWeek(date)) return 'bg-yellow-500';
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
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
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
            fetchEmployeeWorkload();
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : activeTab === 'bookings' ? (
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
                  unassignedBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getDateStatus(booking.schedule?.date)}`}></div>
                          <span className="font-medium">
                            {booking.schedule?.date ? formatDateLabel(booking.schedule.date) : '-'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {booking.schedule?.date ? format(parseISO(booking.schedule.date), 'dd/MM/yyyy') : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{booking.orderNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{booking.customerId?.name || booking.customer?.name}</div>
                        <div className="text-xs text-slate-500">{booking.customerId?.phone || booking.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{booking.serviceType}</div>
                        <div className="text-xs text-slate-500">{booking.serviceCategory}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{booking.branchId?.branchName}</td>
                      <td className="px-4 py-3 text-sm">{booking.schedule?.time || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{booking.pricing?.finalAmount?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingDetailModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openAssignModal(booking)}
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
                  allAssignments.map((item) => {
                    const assignment = item.assignments?.[0] || {};
                    return (
                      <tr key={item._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getDateStatus(item.schedule?.date)}`}></div>
                            <span className="font-medium">
                              {item.schedule?.date ? formatDateLabel(item.schedule.date) : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{item.orderNo}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.customerId?.name}</div>
                          <div className="text-xs text-slate-500">{item.customerId?.phone}</div>
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
                        <td className="px-4 py-3 text-sm">{item.branchId?.branchName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(item);
                                setShowBookingDetailModal(true);
                              }}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {['PENDING', 'ASSIGNED'].includes(assignment.status) && (
                              <button
                                onClick={() => handleCancelAssignment(assignment._id)}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeeWorkload.map((item) => (
            <div
              key={item.employee._id}
              className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{item.employee.name}</div>
                    <div className="text-xs text-slate-500">{item.employee.employeeId}</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-slate-900">{item.totalTasks}</div>
                  <div className="text-xs text-slate-500">Total</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-yellow-600">{item.pending}</div>
                  <div className="text-xs text-slate-500">Pending</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-2xl font-bold text-green-600">{item.accepted}</div>
                  <div className="text-xs text-slate-500">Active</div>
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Assign Task</h2>
              <p className="text-sm text-slate-500 mt-1">
                Assign to: {selectedBooking?.customerId?.name || selectedBooking?.customer?.name}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Employee
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableEmployees.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No employees available</p>
                  ) : (
                    availableEmployees.map((emp) => (
                      <div
                        key={emp._id}
                        onClick={() => setSelectedEmployee(emp)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedEmployee?._id === emp._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:border-slate-300'
                        } ${!emp.isAvailable ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-xs text-slate-500">
                              {emp.employeeId} • {emp.branchId?.branchName}
                            </div>
                          </div>
                          <div className="text-right">
                            {emp.isAvailable ? (
                              <span className="text-xs text-green-600 font-medium">Available</span>
                            ) : (
                              <span className="text-xs text-slate-500">
                                {emp.currentTasks} tasks
                              </span>
                            )}
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedBooking(null);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  disabled={!selectedEmployee}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign Task
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
                    {selectedBooking.schedule?.date ? format(parseISO(selectedBooking.schedule.date), 'dd MMM yyyy') : '-'}
                  </p>
                  <p className="text-sm text-slate-600">{selectedBooking.schedule?.time || '-'}</p>
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
