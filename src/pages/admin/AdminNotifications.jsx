import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { apiRequest } from '../../services/api'

// =========================================================
// NORMALIZE NOTIFICATIONS
// =========================================================

function normalizeNotifications(response) {
  const raw =
    Array.isArray(response)
      ? response
      : Array.isArray(response?.notifications)
        ? response.notifications
        : Array.isArray(response?.data)
          ? response.data
          : []

  return raw
    .map((item) => ({
      id: item?.id,

      title:
        item?.title ||
        'Notification',

      message:
        item?.message ||
        '',

      type:
        String(
          item?.type ||
            'GENERAL'
        ).toUpperCase(),

      isRead:
        Boolean(
          item?.isRead ??
          item?.read ??
          false
        ),

      createdAt:
        item?.createdAt ||
        item?.created_at ||
        null,

      caseId:
        item?.caseId ||
        item?.case?.id ||
        null,
    }))
    .filter(
      (item) =>
        item.id != null
    )
    .sort((a, b) => {
      const first =
        new Date(
          a.createdAt || 0
        ).getTime()

      const second =
        new Date(
          b.createdAt || 0
        ).getTime()

      return second - first
    })
}

// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(value) {
  if (!value) {
    return 'Date not available'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Date not available'
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

// =========================================================
// VISUAL
// =========================================================

function getNotificationVisual(type) {
  if (
    type.includes('REJECT')
  ) {
    return {
      icon: '✕',
      box:
        'bg-red-50 text-red-700 border-red-100',
      badge:
        'bg-red-50 text-red-700',
    }
  }

  if (
    type.includes('APPROVED') ||
    type.includes('APPROVE')
  ) {
    return {
      icon: '✓',
      box:
        'bg-emerald-50 text-emerald-700 border-emerald-100',
      badge:
        'bg-emerald-50 text-emerald-700',
    }
  }

  if (
    type.includes('DOCTOR')
  ) {
    return {
      icon: '👨‍⚕️',
      box:
        'bg-violet-50 text-violet-700 border-violet-100',
      badge:
        'bg-violet-50 text-violet-700',
    }
  }

  if (
    type.includes('CASE') ||
    type.includes('SUBMIT')
  ) {
    return {
      icon: '▣',
      box:
        'bg-blue-50 text-blue-700 border-blue-100',
      badge:
        'bg-blue-50 text-blue-700',
    }
  }

  return {
    icon: '🔔',
    box:
      'bg-amber-50 text-amber-700 border-amber-100',
    badge:
      'bg-slate-100 text-slate-600',
  }
}

// =========================================================
// COMPONENT
// =========================================================

function AdminNotifications() {
  const navigate =
    useNavigate()

  const [notifications, setNotifications] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [unreadCount, setUnreadCount] =
    useState(0)

  const [filter, setFilter] =
    useState('ALL')

  const [markingId, setMarkingId] =
    useState(null)

  const [markingAll, setMarkingAll] =
    useState(false)

  // =========================================================
  // LOAD
  // =========================================================

  const loadNotifications = async ({
    silent = false,
  } = {}) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const [
        notificationResponse,
        countResponse,
      ] = await Promise.all([
        apiRequest(
          '/notifications/my',
          {
            method: 'GET',
          }
        ),

        apiRequest(
          '/notifications/my/unread/count',
          {
            method: 'GET',
          }
        ),
      ])

      const normalized =
        normalizeNotifications(
          notificationResponse
        )

      setNotifications(
        normalized
      )

      const count =
        typeof countResponse ===
        'number'
          ? countResponse
          : Number(
              countResponse?.count ??
              countResponse?.unreadCount ??
              countResponse?.data ??
              0
            )

      setUnreadCount(
        Number.isFinite(count)
          ? count
          : normalized.filter(
              (item) =>
                !item.isRead
            ).length
      )
    } catch (err) {
      console.error(
        'Admin notifications error:',
        err
      )

      setError(
        err?.message ||
          'Unable to load admin notifications.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadNotifications()
  }, [])

  // =========================================================
  // FILTER
  // =========================================================

  const visibleNotifications =
    useMemo(() => {
      if (
        filter === 'UNREAD'
      ) {
        return notifications.filter(
          (item) =>
            !item.isRead
        )
      }

      if (
        filter === 'DOCTOR'
      ) {
        return notifications.filter(
          (item) =>
            item.type.includes(
              'DOCTOR'
            )
        )
      }

      return notifications
    }, [
      filter,
      notifications,
    ])

  const localUnreadCount =
    notifications.filter(
      (item) =>
        !item.isRead
    ).length

  const effectiveUnreadCount =
    Math.max(
      unreadCount,
      localUnreadCount
    )

  // =========================================================
  // MARK ONE READ
  // =========================================================

  const handleMarkRead = async (
    notification
  ) => {
    if (
      notification.isRead
    ) {
      return
    }

    setMarkingId(
      notification.id
    )

    setError('')
    setSuccess('')

    try {
      await apiRequest(
        `/notifications/${notification.id}/read`,
        {
          method: 'PUT',
        }
      )

      setNotifications(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
          )
      )

      setUnreadCount(
        (previous) =>
          Math.max(
            0,
            previous - 1
          )
      )
    } catch (err) {
      console.error(
        'Mark notification read failed:',
        err
      )

      setError(
        err?.message ||
          'Unable to mark notification as read.'
      )
    } finally {
      setMarkingId(null)
    }
  }

  // =========================================================
  // MARK ALL READ
  // =========================================================

  const handleMarkAllRead =
    async () => {
      if (
        effectiveUnreadCount ===
          0 ||
        markingAll
      ) {
        return
      }

      setMarkingAll(true)

      setError('')
      setSuccess('')

      try {
        await apiRequest(
          '/notifications/my/read-all',
          {
            method: 'PUT',
          }
        )

        setNotifications(
          (previous) =>
            previous.map(
              (item) => ({
                ...item,
                isRead: true,
              })
            )
        )

        setUnreadCount(0)

        setSuccess(
          'All notifications marked as read.'
        )

        setTimeout(() => {
          setSuccess('')
        }, 4000)
      } catch (err) {
        console.error(
          'Mark all notifications failed:',
          err
        )

        setError(
          err?.message ||
            'Unable to mark all notifications as read.'
        )
      } finally {
        setMarkingAll(false)
      }
    }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200">

        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-4">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-lg">
                🔔
              </div>

              <div>

                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  AYUSH Care
                </h1>

                <p className="text-xs text-slate-500">
                  Admin Notifications
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/admin/dashboard'
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Dashboard
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="max-w-6xl mx-auto px-5 sm:px-6 py-8">

        {/* TITLE */}

        <section className="mb-7">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">

            <div>

              <p className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                Administration
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                Notifications
              </h2>

              <p className="text-slate-500 mt-3 max-w-2xl leading-7">
                Important system events,
                doctor registrations and
                approval-related updates
                appear here.
              </p>

            </div>

            <div className="px-4 py-2.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 text-sm font-bold">
              {effectiveUnreadCount}{' '}
              unread
            </div>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            ✓ {success}
          </div>
        )}

        {/* NOTIFICATIONS */}

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          {/* FILTER */}

          <div className="px-5 sm:px-7 py-5 border-b border-slate-100">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setFilter('ALL')
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    filter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter('UNREAD')
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    filter === 'UNREAD'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Unread
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter('DOCTOR')
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    filter === 'DOCTOR'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Doctor
                </button>

              </div>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  onClick={() =>
                    loadNotifications({
                      silent: true,
                    })
                  }
                  disabled={refreshing}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  {refreshing
                    ? 'Refreshing...'
                    : '↻ Refresh'}
                </button>

                <button
                  type="button"
                  onClick={
                    handleMarkAllRead
                  }
                  disabled={
                    effectiveUnreadCount ===
                      0 ||
                    markingAll
                  }
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-40"
                >
                  {markingAll
                    ? 'Updating...'
                    : 'Mark all read'}
                </button>

              </div>

            </div>

          </div>

          {/* CONTENT */}

          {loading ? (

            <div className="px-6 py-16 text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-2xl animate-pulse">
                🔔
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading notifications...
              </p>

            </div>

          ) : visibleNotifications.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                ✓
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                No notifications
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                New administration
                updates will appear here.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {visibleNotifications.map(
                (notification) => {

                  const visual =
                    getNotificationVisual(
                      notification.type
                    )

                  const isDoctorRegistration =
                    notification.type ===
                    'DOCTOR_REGISTRATION'

                  return (

                    <div
                      key={
                        notification.id
                      }
                      className={`px-5 sm:px-7 py-6 transition ${
                        notification.isRead
                          ? 'bg-white'
                          : 'bg-violet-50/30'
                      }`}
                    >

                      <div className="flex gap-4">

                        <div
                          className={`shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center text-xl ${visual.box}`}
                        >
                          {visual.icon}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <h3
                                  className={`text-base ${
                                    notification.isRead
                                      ? 'font-semibold text-slate-800'
                                      : 'font-bold text-slate-900'
                                  }`}
                                >
                                  {
                                    notification.title
                                  }
                                </h3>

                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                                )}

                              </div>

                              <p className="mt-2 text-sm text-slate-600 leading-6">
                                {
                                  notification.message
                                }
                              </p>

                            </div>

                            <span
                              className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${visual.badge}`}
                            >
                              {notification.type.replaceAll(
                                '_',
                                ' '
                              )}
                            </span>

                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">

                            <span>
                              {formatDate(
                                notification.createdAt
                              )}
                            </span>

                            {notification.caseId && (
                              <span className="font-semibold text-slate-500">
                                Case #
                                {
                                  notification.caseId
                                }
                              </span>
                            )}

                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">

                            {isDoctorRegistration && (
                              <button
                                type="button"
                                onClick={async () => {

                                  if (
                                    !notification.isRead
                                  ) {
                                    await handleMarkRead(
                                      notification
                                    )
                                  }

                                  navigate(
                                    '/admin/dashboard'
                                  )
                                }}
                                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"
                              >
                                Review Doctor →
                              </button>
                            )}

                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkRead(
                                    notification
                                  )
                                }
                                disabled={
                                  markingId ===
                                  notification.id
                                }
                                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                              >
                                {markingId ===
                                notification.id
                                  ? 'Updating...'
                                  : 'Mark read'}
                              </button>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                }
              )}

            </div>

          )}

        </section>

        {/* SECURITY NOTICE */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex gap-3">

            <div className="text-xl">
              🛡️
            </div>

            <div>

              <h3 className="font-bold text-slate-800">
                Administration notice
              </h3>

              <p className="text-sm text-slate-500 mt-1 leading-6">
                Doctor approval is performed
                through the secured backend.
                The account status changes from
                PENDING to APPROVED only after
                successful server-side authorization.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  )
}

export default AdminNotifications