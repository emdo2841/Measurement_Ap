import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'

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
  PENDING: 'border-[#ead8ad] bg-[#fbf3df] text-[#8a681f]',
  CUTTING: 'border-[#e4c7b8] bg-[#f8ebe4] text-[#965f45]',
  SEWING: 'border-[#c8d8cf] bg-[#edf3ef] text-[#4d705f]',
  FITTING: 'border-[#d9ced5] bg-[#f3edf1] text-[#775c6e]',
  COMPLETED: 'border-[#bcd8c8] bg-[#eaf5ee] text-[#397153]',
  DELIVERED: 'border-[#d8dcd9] bg-[#f0f2f0] text-[#5f6b65]',
}

const statusDotStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-[#c29334]',
  CUTTING: 'bg-[#b66f50]',
  SEWING: 'bg-[#6f8b7d]',
  FITTING: 'bg-[#8d7082]',
  COMPLETED: 'bg-[#4f8a68]',
  DELIVERED: 'bg-[#7b8680]',
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
  if (amount == null) return 'Amount not set'

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

function formatShortDate(dateValue: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue))
}

function CalendarPage({ onLogout }: CalendarPageProps) {
  const today = useMemo(() => new Date(), [])
  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(toDateKey(today))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async (background = false) => {
    try {
      if (background) setRefreshing(true)
      else setLoading(true)

      setError('')

      const response = await apiRequest<Order[] | PaginatedResponse<Order>>(
        '/orders?page=1&limit=100',
      )

      setOrders(Array.isArray(response) ? response : response.data)
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
      setRefreshing(false)
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
      if (!groupedOrders[key]) groupedOrders[key] = []
      groupedOrders[key].push(order)
    }

    for (const dateOrders of Object.values(groupedOrders)) {
      dateOrders.sort((first, second) =>
        (first.client?.name ?? '').localeCompare(second.client?.name ?? ''),
      )
    }

    return groupedOrders
  }, [orders])

  const calendarDays = useMemo(() => {
    const year = displayedMonth.getFullYear()
    const month = displayedMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const firstCalendarDay = new Date(year, month, 1)

    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstDay.getDay())

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

  const unfinishedOrders = orders.filter(
    (order) =>
      order.dueDate && !['COMPLETED', 'DELIVERED'].includes(order.status),
  ).length

  function previousMonth() {
    setDisplayedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    )
  }

  function nextMonth() {
    setDisplayedMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
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
      <div className="flex min-h-full items-center justify-center p-8">
        <div className="rounded-2xl border border-white/80 bg-white/88 px-6 py-4 font-semibold text-[#617069] shadow-[0_10px_28px_rgba(45,58,55,0.08)]">
          Loading calendar…
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-5 rounded-3xl border border-white/80 bg-white/70 px-5 py-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:px-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#778f83]">
              Workshop schedule
            </p>
            <h1 className="mt-1 font-display text-4xl text-[#263d47]">
              Order calendar
            </h1>
            <p className="mt-1 text-sm text-[#75817c]">
              Monitor client deadlines and upcoming tailoring work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/orders" className="rounded-xl border border-[#d6dcd8] bg-white px-4 py-2.5 text-sm font-bold text-[#596861] transition hover:bg-[#f0f3f0]">
              View all orders
            </Link>
            <button type="button" onClick={() => void loadOrders(true)} disabled={refreshing} className="rounded-xl bg-[#263d47] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#36515b] disabled:opacity-60">
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#cbd8d0] bg-[#edf2ef] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#60766b]">Total orders</p>
            <p className="mt-2 text-3xl font-black text-[#314b43]">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-[#d8cec4] bg-[#f2ede8] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#806b5c]">Upcoming unfinished orders</p>
            <p className="mt-2 text-3xl font-black text-[#725f52]">{unfinishedOrders}</p>
          </div>
          <div className="rounded-2xl border border-[#dfd2b8] bg-[#f3eee3] p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a754d]">Orders without due dates</p>
            <p className="mt-2 text-3xl font-black text-[#866d40]">{ordersWithoutDueDate.length}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(45,58,55,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e9e6] px-4 py-4 sm:px-6">
              <h2 className="font-display text-2xl text-[#263d47]">{monthTitle}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={previousMonth} className="rounded-lg border border-[#d4dad6] px-3 py-2 text-sm font-bold text-[#596861] transition hover:bg-[#f0f3f0]" aria-label="Previous month">←</button>
                <button type="button" onClick={showToday} className="rounded-lg border border-[#d4dad6] px-3 py-2 text-sm font-bold text-[#596861] transition hover:bg-[#f0f3f0]">Today</button>
                <button type="button" onClick={nextMonth} className="rounded-lg border border-[#d4dad6] px-3 py-2 text-sm font-bold text-[#596861] transition hover:bg-[#f0f3f0]" aria-label="Next month">→</button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-[#e5e9e6] bg-[#f5f6f3]">
              {weekdayNames.map((weekday) => (
                <div key={weekday} className="px-1 py-3 text-center text-xs font-extrabold uppercase tracking-wider text-[#7a8580]">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((calendarDay) => {
                const dayOrders = ordersByDate[calendarDay.key] ?? []
                const selected = selectedDate === calendarDay.key

                return (
                  <button
                    key={calendarDay.key}
                    type="button"
                    onClick={() => setSelectedDate(calendarDay.key)}
                    className={[
                      'min-h-24 border-b border-r border-[#edf0ed] p-1.5 text-left transition sm:min-h-32 sm:p-2',
                      selected
                        ? 'bg-[#edf2ef] ring-2 ring-inset ring-[#778f83]'
                        : 'hover:bg-[#f7f8f5]',
                      calendarDay.isCurrentMonth
                        ? 'text-[#263d47]'
                        : 'bg-[#f8f8f5]/60 text-[#adb4b0]',
                    ].join(' ')}
                  >
                    <span className={[
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      calendarDay.isToday ? 'bg-[#263d47] text-white' : '',
                    ].join(' ')}>
                      {calendarDay.date.getDate()}
                    </span>

                    <div className="mt-1 space-y-1">
                      {dayOrders.slice(0, 3).map((order) => {
                        const clientName = formatName(order.client?.name) || 'Client'
                        return (
                          <div key={order.id} className={`truncate rounded-md border px-1.5 py-1 text-[10px] font-bold sm:text-xs ${statusStyles[order.status]}`} title={`${clientName} — ${order.status}`}>
                            {clientName}
                          </div>
                        )
                      })}
                      {dayOrders.length > 3 && (
                        <p className="px-1 text-[10px] font-bold text-[#718078]">+{dayOrders.length - 3} more</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(45,58,55,0.07)]">
              <h2 className="font-extrabold text-[#263d47]">{formatSelectedDate(selectedDate)}</h2>
              <div className="mt-4 space-y-3">
                {selectedOrders.length === 0 ? (
                  <p className="rounded-xl bg-[#f5f6f3] p-4 text-sm text-[#75817c]">No orders are due on this date.</p>
                ) : (
                  selectedOrders.map((order) => (
                    <Link key={order.id} to={`/orders/${order.id}`} className="block rounded-xl border border-[#e1e6e2] p-4 transition hover:border-[#bdcec4] hover:bg-[#f3f7f4]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#263d47]">{formatName(order.client?.name) || 'Unknown Client'}</p>
                          <p className="mt-1 text-xs text-[#7a8580]">{formatAmount(order.totalAmount)}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyles[order.status]}`}>{order.status}</span>
                      </div>
                      {order.notes && <p className="mt-3 line-clamp-2 text-xs text-[#75817c]">{order.notes}</p>}
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(45,58,55,0.07)]">
              <h2 className="font-extrabold text-[#263d47]">Next deadlines</h2>
              <div className="mt-4 space-y-2">
                {upcomingOrders.length === 0 ? (
                  <p className="text-sm text-[#75817c]">No upcoming deadlines.</p>
                ) : (
                  upcomingOrders.map((order) => (
                    <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f3f6f3]">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotStyles[order.status]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#263d47]">{formatName(order.client?.name) || 'Unknown Client'}</p>
                        <p className="text-xs text-[#7a8580]">{formatShortDate(order.dueDate!)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_28px_rgba(45,58,55,0.07)]">
              <h2 className="font-extrabold text-[#263d47]">Status guide</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(Object.keys(statusStyles) as OrderStatus[]).map((status) => (
                  <div key={status} className="flex items-center gap-2 text-xs font-semibold text-[#68756f]">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDotStyles[status]}`} />
                    {status.charAt(0) + status.slice(1).toLowerCase()}
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
