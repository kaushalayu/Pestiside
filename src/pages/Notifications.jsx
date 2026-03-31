import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, Bell, CheckCircle, XCircle, FileText, Receipt, Package } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Notifications = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Marked as read');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EXPENSE_APPROVED':
        return <CheckCircle size={20} className="text-emerald-500" />;
      case 'EXPENSE_REJECTED':
        return <XCircle size={20} className="text-red-500" />;
      case 'RECEIPT_APPROVED':
        return <Receipt size={20} className="text-emerald-500" />;
      case 'RECEIPT_REJECTED':
        return <XCircle size={20} className="text-red-500" />;
      case 'INVENTORY_LOW_STOCK':
        return <Package size={20} className="text-orange-500" />;
      default:
        return <Bell size={20} className="text-brand-500" />;
    }
  };

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
          >
            <Check size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No notifications yet</h3>
          <p className="text-sm text-slate-500">You'll see notifications here when something happens</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {notifications.map((notification, index) => (
            <div
              key={notification._id}
              className={`flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors ${
                index !== notifications.length - 1 ? 'border-b border-slate-100' : ''
              } ${!notification.isRead ? 'bg-brand-50/30' : ''}`}
            >
              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900">{notification.title}</h4>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notification._id)}
                    className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotificationMutation.mutate(notification._id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
