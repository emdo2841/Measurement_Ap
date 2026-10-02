import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../service/api'

type OrderStatus =
  | 'PENDING'
  | 'CUTTING'
  | 'SEWING'
  | 'FITTING'
  | 'COMPLETED'
  | 'DELIVERED'

type Order = {
  id: string
  clientId: string
  status: OrderStatus
  dueDate?: string | null
  totalAmount?: number | null
  notes?: string | null
  createdAt?: string
  client?: {
    id: string
    name: string
    image?: string | null
  }
}

type PaginatedResponse<T> = {
  status: string
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

type CalendarPageProps = {
  onLogout: () => void
}

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CUTTING: 'border-orange-200 bg-orange-50 text-orange-700',
  SEWING: 'border-blue-200 bg-blue-50 text-blue-700',
  FITTING: 'border-violet-200 bg-violet-50 text-violet-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DELIVERED: 'border-slate-200 bg-slate-100 text-slate-700',
}

const statusDotStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500',
  CUTTING: 'bg-orange-500',
  SEWING: 'bg-blue-500',
  FITTING: 'bg-violet-500',
  COMPLETED: 'bg-emerald-500',
  DELIVERED: 'bg-slate-500',
}

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function orderDateKey(dateValue: string) {
  return toDateKey(new Date(dateValue))
}

function formatAmount(amount?: number | null) {
  if (amount === null || amount === undefined) {
    return 'Amount not set'
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatSelectedDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function CalendarPage({ onLogout }: CalendarPageProps) {
  const today = useMemo(() => new Date(), [])

  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )

  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const orderResponse = await apiRequest<
        Order[] | PaginatedResponse<Order>
      >('/orders?page=1&limit=100')

      setOrders(
        Array.isArray(orderResponse)
          ? orderResponse
          : orderResponse.data,
      )
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Unable to load calendar orders.'

      setError(message)

      if (
        message.toLowerCase().includes('session') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const ordersByDate = useMemo(() => {
    const groupedOrders: Record<string, Order[]> = {}

    for (const order of orders) {
      if (!order.dueDate) continue

      const key = orderDateKey(order.dueDate)

      if (!groupedOrders[key]) {
        groupedOrders[key] = []
      }

      groupedOrders[key].push(order)
    }

    for (const dateOrders of Object.values(groupedOrders)) {
      dateOrders.sort((first, second) =>
        first.client?.name?.localeCompare(second.client?.name ?? '') ?? 0,
      )
    }

    return groupedOrders
  }, [orders])

  const calendarDays = useMemo(() => {
    const year = displayedMonth.getFullYear()
    const month = displayedMonth.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const firstCalendarDay = new Date(year, month, 1)

    firstCalendarDay.setDate(
      firstCalendarDay.getDate() - firstDayOfMonth.getDay(),
    )

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstCalendarDay)
      date.setDate(firstCalendarDay.getDate() + index)

      return {
        date,
        key: toDateKey(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: toDateKey(date) === toDateKey(today),
      }
    })
  }, [displayedMonth, today])

  const selectedOrders = ordersByDate[selectedDate] ?? []

  const ordersWithoutDueDate = useMemo(
    () => orders.filter((order) => !order.dueDate),
    [orders],
  )

  const upcomingOrders = useMemo(() => {
    const todayKey = toDateKey(today)

    return orders
      .filter(
        (order) =>
          order.dueDate &&
          orderDateKey(order.dueDate) >= todayKey &&
          !['COMPLETED', 'DELIVERED'].includes(order.status),
      )
      .sort(
        (first, second) =>
          new Date(first.dueDate!).getTime() -
          new Date(second.dueDate!).getTime(),
      )
      .slice(0, 5)
  }, [orders, today])

  function previousMonth() {
    setDisplayedMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() - 1, 1),
    )
  }

  function nextMonth() {
    setDisplayedMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + 1, 1),
    )
  }

  function showToday() {
    const currentDate = new Date()

    setDisplayedMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    )

    setSelectedDate(toDateKey(currentDate))
  }

  const monthTitle = new Intl.DateTimeFormat('en-NG', {
    month: 'long',
    year: 'numeric',
  }).format(displayedMonth)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
          Loading calendar...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-blue-600"
            >
              ← Dashboard
            </Link>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Order calendar
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Monitor client deadlines and upcoming tailoring work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/orders"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              View all orders
            </Link>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-600 p-5 text-white shadow-sm">
            <p className="text-sm text-blue-100">Total orders</p>
            <p className="mt-2 text-3xl font-black">{orders.length}</p>
          </div>

          <div className="rounded-2xl bg-violet-600 p-5 text-white shadow-sm">
            <p className="text-sm text-violet-100">
              Upcoming unfinished orders
            </p>
            <p className="mt-2 text-3xl font-black">
              {
                orders.filter(
                  (order) =>
                    order.dueDate &&
                    !['COMPLETED', 'DELIVERED'].includes(order.status),
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-amber-500 p-5 text-white shadow-sm">
            <p className="text-sm text-amber-100">
              Orders without due dates
            </p>
            <p className="mt-2 text-3xl font-black">
              {ordersWithoutDueDate.length}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-xl font-bold text-slate-900">
                {monthTitle}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  aria-label="Previous month"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={showToday}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {weekdayNames.map((weekday) => (
                <div
                  key={weekday}
                  className="px-1 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((calendarDay) => {
                const dayOrders =
                  ordersByDate[calendarDay.key] ?? []

                const selected =
                  selectedDate === calendarDay.key

                return (
                  <button
                    key={calendarDay.key}
                    type="button"
                    onClick={() =>
                      setSelectedDate(calendarDay.key)
                    }
                    className={[
                      'min-h-28 border-b border-r border-slate-100 p-1.5 text-left transition sm:min-h-32 sm:p-2',
                      selected
                        ? 'bg-blue-50 ring-2 ring-inset ring-blue-500'
                        : 'hover:bg-slate-50',
                      calendarDay.isCurrentMonth
                        ? 'text-slate-900'
                        : 'bg-slate-50/50 text-slate-400',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                        calendarDay.isToday
                          ? 'bg-blue-600 text-white'
                          : '',
                      ].join(' ')}
                    >
                      {calendarDay.date.getDate()}
                    </span>

                    <div className="mt-1 space-y-1">
                      {dayOrders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-semibold sm:text-xs ${statusStyles[order.status]}`}
                          title={`${order.client?.name ?? 'Client'} — ${order.status}`}
                        >
                          {order.client?.name ?? 'Client'}
                        </div>
                      ))}

                      {dayOrders.length > 3 && (
                        <p className="px-1 text-[10px] font-semibold text-slate-500">
                          +{dayOrders.length - 3} more
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">
                {formatSelectedDate(selectedDate)}
              </h2>

              <div className="mt-4 space-y-3">
                {selectedOrders.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    No orders are due on this date.
                  </p>
                ) : (
                  selectedOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {order.client?.name ??
                              'Unknown client'}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatAmount(order.totalAmount)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {order.notes && (
                        <p className="mt-3 line-clamp-2 text-xs text-slate-500">
                          {order.notes}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">
                Next deadlines
              </h2>

              <div className="mt-4 space-y-3">
                {upcomingOrders.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No upcoming deadlines.
                  </p>
                ) : (
                  upcomingOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotStyles[order.status]}`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {order.client?.name ?? 'Unknown client'}
                        </p>

                        <p className="text-xs text-slate-500">
                          {new Intl.DateTimeFormat('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(order.dueDate!))}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">
                Status guide
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {(
                  Object.keys(statusStyles) as OrderStatus[]
                ).map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${statusDotStyles[status]}`}
                    />
                    {status}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default CalendarPage