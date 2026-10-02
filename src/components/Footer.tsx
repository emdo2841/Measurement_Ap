export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} TailorPro. All rights reserved.
        </p>

        <p>Measure. Create. Deliver.</p>
      </div>
    </footer>
  )
}