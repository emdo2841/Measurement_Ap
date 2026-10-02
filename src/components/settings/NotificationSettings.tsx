import { useEffect, useState } from 'react'
import { disableReminders, enableReminders, getReminderSubscription, supportsPushNotifications } from '../../service/pushReminders'
import { useToast } from '../toast/ToastProvider'

export default function NotificationSettings() {
  const { showToast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const supported = supportsPushNotifications()

  useEffect(() => {
    async function check() {
      try { setEnabled(Boolean(await getReminderSubscription())) }
      finally { setChecking(false) }
    }
    void check()
  }, [])

  async function toggleNotifications() {
    try {
      setSaving(true)
      if (enabled) {
        await disableReminders()
        setEnabled(false)
        showToast('Order reminders disabled.', 'success')
      } else {
        await enableReminders()
        setEnabled(true)
        showToast('Order reminders enabled.', 'success')
      }
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : 'Unable to update notification settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Order notifications</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Receive browser reminders when an unfinished order is approaching its due date.</p>
          {!supported && <p className="mt-2 text-sm font-medium text-amber-700">Notifications are unavailable in this browser or context. Use HTTPS or localhost.</p>}
        </div>
        <button type="button" onClick={() => void toggleNotifications()} disabled={!supported || checking || saving} className={`rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {checking ? 'Checking...' : saving ? 'Saving...' : enabled ? 'Disable reminders' : 'Enable reminders'}
        </button>
      </div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <strong>Status:</strong> {enabled ? 'Enabled on this browser' : 'Disabled on this browser'}
      </div>
    </section>
  )
}
