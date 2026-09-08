import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../services/api'

function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)

  const loadNotifications = async (showLoader = false) => {
    if (showLoader) setIsLoading(true)
    setError('')

    try {
      const [items, count] = await Promise.all([
        apiRequest('/notifications/my', { method: 'GET' }),
        apiRequest('/notifications/my/unread/count', { method: 'GET' }),
      ])

      setNotifications(Array.isArray(items) ? items : [])
      setUnreadCount(Number(count) || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError(err.message || 'Unable to load notifications.')
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications(true)

    const interval = setInterval(() => {
      loadNotifications(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const markAsRead = async (notification) => {
    if (notification.isRead) return

    try {
      await apiRequest(`/notifications/${notification.id}/read`, {
        method: 'PUT',
      })

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      )

      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      setError(err.message || 'Unable to update notification.')
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    try {
      await apiRequest('/notifications/my/read-all', { method: 'PUT' })

      const now = new Date().toISOString()

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || now,
        }))
      )

      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
      setError(err.message || 'Unable to update notifications.')
    }
  }

  const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current)
          if (!isOpen) loadNotifications(false)
        }}
        className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center text-xl hover:bg-slate-100 hover:text-slate-900 transition"
        aria-label="Notifications"
        title="Notifications"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,390px)] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'You are all caught up'}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl">🔔</div>
                <p className="font-semibold text-slate-700 mt-3">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">
                  New case and review updates will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => markAsRead(notification)}
                  className={`w-full text-left px-4 py-4 border-b border-slate-100 transition hover:bg-slate-50 ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-base ${
                        notification.isRead
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {notification.type === 'CASE_REJECTED'
                        ? '⚠️'
                        : notification.type === 'CASE_REVIEWED'
                          ? '✓'
                          : notification.type === 'DOCTOR_NOTES_UPDATED'
                            ? '🩺'
                            : '🔔'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm ${
                            notification.isRead
                              ? 'font-semibold text-slate-700'
                              : 'font-bold text-slate-900'
                          }`}
                        >
                          {notification.title}
                        </p>

                        {!notification.isRead && (
                          <span className="w-2 h-2 shrink-0 mt-1.5 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-5">
                        {notification.message}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
