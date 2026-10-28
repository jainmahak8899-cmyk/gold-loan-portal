import { AdminView } from "../components/AdminView";

export function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-extrabold text-gray-800">📊 Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage all gold loan applications. Mobiles are masked for privacy.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <AdminView />
      </div>
    </div>
  );
}
