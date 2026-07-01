import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Megaphone, Info } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsApi } from '../api/notificationsApi.js';
import Button from '../components/common/Button.jsx';

const TYPE_ICONS = {
  follow_up_reminder: Bell,
  broadcast: Megaphone,
  system: Info,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              isLoading={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                  <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Bell className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">All caught up!</p>
              <p className="mt-1 text-sm text-slate-500">
                Notifications will appear here when you have follow-up reminders or system updates.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const IconComponent = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-4 rounded-xl border p-4 transition ${
                      n.isRead
                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        : 'border-indigo-100 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/20'
                    }`}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="flex-shrink-0 self-start text-xs text-indigo-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
