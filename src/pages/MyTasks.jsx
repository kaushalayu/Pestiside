import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle, XCircle, Clock, History, Eye, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';

const MyTasks = () => {
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const fetchMyTasks = async () => {
    const params = new URLSearchParams();
    if (activeTab === 'pending') {
      params.append('status', 'PENDING');
    } else if (activeTab === 'accepted') {
      params.append('status', 'ASSIGNED');
    }
    if (selectedDate) {
      params.append('date', selectedDate);
    }
    const response = await api.get(`/task-assignments/my-tasks?${params.toString()}`);
    return response.data.data;
  };

  const { data: myTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['my-tasks', activeTab, selectedDate],
    queryFn: fetchMyTasks,
    staleTime: 5000,
    refetchInterval: 10000
  });

  const { data: myHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['my-tasks-history'],
    queryFn: async () => {
      const response = await api.get('/task-assignments/my-history');
      return response.data.data;
    },
    enabled: activeTab === 'history',
    staleTime: 5000
  });

  const acceptTaskMutation = useMutation({
    mutationFn: (taskId) => api.patch(`/task-assignments/${taskId}/accept`),
    onMutate: async (taskId) => {
      // Cancel all my-tasks queries
      await queryClient.cancelQueries({ queryKey: ['my-tasks'] });
      const previousTasks = queryClient.getQueryData(['my-tasks', activeTab, selectedDate]);

      // Optimistic: Remove from current list (it will move to ASSIGNED)
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], (old) => {
        if (!old) return [];
        return old.filter(task => task._id !== taskId);
      });
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], context.previousTasks);
      toast.error(err.response?.data?.message || 'Error accepting task');
    },
    onSuccess: () => {
      toast.success('Task accepted!');
      // Force refetch of my-tasks queries
      queryClient.refetchQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
    }
  });

  const declineTaskMutation = useMutation({
    mutationFn: ({ taskId, reason }) => api.patch(`/task-assignments/${taskId}/decline`, { reason }),
    onMutate: async ({ taskId, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['my-tasks'] });
      const previousTasks = queryClient.getQueryData(['my-tasks', activeTab, selectedDate]);
      // Optimistic: Remove from list (declined tasks go to history)
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], (old) => {
        if (!old) return [];
        return old.filter(task => task._id !== taskId);
      });
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], context.previousTasks);
      toast.error('Error declining task');
    },
    onSuccess: () => {
      toast.success('Task declined');
      setShowDeclineModal(false);
      setDeclineReason('');
      setSelectedTask(null);
      // Force refetch of my-tasks queries
      queryClient.refetchQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId) => api.patch(`/task-assignments/${taskId}/complete`),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['my-tasks'] });
      const previousTasks = queryClient.getQueryData(['my-tasks', activeTab, selectedDate]);
      // Optimistic: Remove from current list (completed goes to history)
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], (old) => {
        if (!old) return [];
        return old.filter(task => task._id !== taskId);
      });
      return { previousTasks };
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['my-tasks', activeTab, selectedDate], context.previousTasks);
      toast.error('Error completing task');
    },
    onSuccess: () => {
      toast.success('Task completed!');
      // Force refetch of my-tasks queries
      queryClient.refetchQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
    }
  });

  const openDeclineModal = (task) => {
    setSelectedTask(task);
    setShowDeclineModal(true);
  };

  const openDetailModal = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleAcceptTask = (taskId) => {
    acceptTaskMutation.mutate(taskId);
  };

  const handleDeclineTask = () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    declineTaskMutation.mutate({ taskId: selectedTask._id, reason: declineReason });
  };

  const handleCompleteTask = (taskId) => {
    completeTaskMutation.mutate(taskId);
  };

  const getDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'dd MMM yyyy');
  };

  const isDatePast = (dateStr) => {
    return isPast(parseISO(dateStr));
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-gray-100 text-gray-800'
    };
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      ASSIGNED: <AlertCircle className="w-4 h-4" />,
      ACCEPTED: <CheckCircle className="w-4 h-4" />,
      DECLINED: <XCircle className="w-4 h-4" />,
      COMPLETED: <CheckCircle className="w-4 h-4" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]} {status}
      </span>
    );
  };

  const tasksToShow = activeTab === 'history' ? myHistory : myTasks;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-slate-500">View and manage your assigned tasks</p>
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
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'pending'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          <AlertCircle className="w-4 h-4" />
          Requests ({myTasks.filter(t => t.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('accepted')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'accepted'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          <CheckCircle className="w-4 h-4" />
          Assigned ({myTasks.filter(t => t.status === 'ASSIGNED').length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'history'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {(tasksLoading || historyLoading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : tasksToShow.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tasks found</h3>
          <p className="text-slate-500">
            {activeTab === 'history'
              ? 'Your completed and declined tasks will appear here'
              : 'You have no assigned tasks for this date'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasksToShow.map((task) => {
            const booking = task.serviceFormId;
            const isOverdue = task.status === 'ACCEPTED' && isDatePast(task.scheduledDate);

            return (
              <div
                key={task._id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${isOverdue ? 'border-red-300 bg-red-50' : ''
                  }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(task.status)}
                      {isOverdue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                        {booking?.orderNo}
                      </span>
                      <span className="text-sm text-slate-500">
                        {getDateLabel(task.scheduledDate)}
                      </span>
                      {booking?.schedule?.time && (
                        <span className="text-sm text-slate-400">
                          • {booking.schedule.time}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900">
                      {booking?.customerId?.name || booking?.customer?.name || 'Customer'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {booking?.customerId?.phone || booking?.customer?.phone}
                    </p>
                    <p className="text-sm text-slate-400">
                      {booking?.customerId?.address || booking?.customer?.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {booking?.serviceType}
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                        {booking?.branchId?.branchName}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center gap-2">
                    <button
                      onClick={() => openDetailModal(task)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    {task.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAcceptTask(task._id)}
                          disabled={acceptTaskMutation.isPending}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => openDeclineModal(task)}
                          disabled={declineTaskMutation.isPending}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </button>
                      </>
                    )}

                    {task.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleCompleteTask(task._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}

                    {task.status === 'COMPLETED' && (
                      <div className="text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-5 h-5" />
                        Completed
                      </div>
                    )}

                    {task.status === 'DECLINED' && (
                      <div className="text-red-600 font-medium flex items-center gap-1">
                        <XCircle className="w-5 h-5" />
                        Declined
                      </div>
                    )}
                  </div>
                </div>

                {task.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Note:</span> {task.notes}
                    </p>
                  </div>
                )}

                {task.declineReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Decline Reason:</span> {task.declineReason}
                    </p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-slate-400">
                  <span>Assigned by: {task.assignedBy?.name || 'Admin'}</span>
                  <span>
                    Assigned on: {format(parseISO(task.assignedAt), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Task Details</h2>
                <p className="text-sm text-slate-500">{selectedTask.serviceFormId?.orderNo}</p>
              </div>
              {getStatusBadge(selectedTask.status)}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Customer</h3>
                  <p className="font-semibold">
                    {selectedTask.serviceFormId?.customerId?.name || selectedTask.serviceFormId?.customer?.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedTask.serviceFormId?.customerId?.phone || selectedTask.serviceFormId?.customer?.phone}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedTask.serviceFormId?.customerId?.address || selectedTask.serviceFormId?.customer?.address}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Service</h3>
                  <p className="font-semibold">{selectedTask.serviceFormId?.serviceType}</p>
                  <p className="text-sm text-slate-600">{selectedTask.serviceFormId?.serviceCategory}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Schedule</h3>
                  <p className="font-semibold">
                    {selectedTask.scheduledDate ? getDateLabel(selectedTask.scheduledDate) : '-'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedTask.serviceFormId?.schedule?.time || '-'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Amount</h3>
                  <p className="font-semibold">
                    ₹{selectedTask.serviceFormId?.pricing?.finalAmount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Branch</h3>
                  <p className="font-semibold">{selectedTask.serviceFormId?.branchId?.branchName}</p>
                  <p className="text-sm text-slate-600">{selectedTask.serviceFormId?.branchId?.city}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Premises</h3>
                  <p className="font-semibold">{selectedTask.serviceFormId?.premises?.type || '-'}</p>
                  <p className="text-sm text-slate-600">
                    {selectedTask.serviceFormId?.premises?.totalArea
                      ? `${selectedTask.serviceFormId.premises.totalArea} sq ft`
                      : '-'}
                  </p>
                </div>
              </div>

              {selectedTask.serviceFormId?.attDetails?.treatmentTypes?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-500">Treatment Types</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTask.serviceFormId.attDetails.treatmentTypes.map((type, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-100 rounded text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Notes from Admin</h3>
                  <p className="text-sm text-slate-600">{selectedTask.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              {selectedTask.status === 'ASSIGNED' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAcceptTask(selectedTask._id);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept Task
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openDeclineModal(selectedTask);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}
              {selectedTask.status === 'ACCEPTED' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCompleteTask(selectedTask._id);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className={`px-4 py-2 border rounded-lg hover:bg-slate-50 ${(selectedTask.status === 'ASSIGNED' || selectedTask.status === 'ACCEPTED') ? 'flex-1' : 'w-full'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeclineModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Decline Task</h2>
              <p className="text-sm text-slate-500 mt-1">
                Please provide a reason for declining this task
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                rows="4"
                placeholder="Enter reason for declining..."
              />
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineTask}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
