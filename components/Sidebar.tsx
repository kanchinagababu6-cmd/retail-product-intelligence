export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white p-4">
      <h2 className="text-lg font-bold">RPI</h2>
      <nav className="mt-6 space-y-2 text-sm">
        <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/dashboard">Dashboard</a>
        <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/classify">Classify Product</a>
        <a className="block rounded-lg px-3 py-2 hover:bg-slate-100" href="/history">History</a>
      </nav>
    </aside>
  );
}