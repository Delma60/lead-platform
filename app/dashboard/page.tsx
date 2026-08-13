'use client';

/**
 * /app/dashboard
 * Analytics and snapshot dashboard
 * TODO: Lead funnel view (New → Contacted → Replied → Won with conversion %)
 * TODO: Source breakdown (Upwork vs Wellfound vs cold vs referral)
 * TODO: Template performance (reply rate per template/variant)
 * TODO: This week snapshot (leads added / emails sent / replies received)
 * TODO: Weekly digest summary
 */
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODO: Summary cards */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-gray-500 text-sm">Leads Added (This Week)</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-gray-500 text-sm">Emails Sent (This Week)</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-gray-500 text-sm">Replies Received</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-gray-500 text-sm">Win Rate</h3>
          <p className="text-3xl font-bold mt-2">0%</p>
        </div>
      </div>

      {/* TODO: Funnel chart, source breakdown, template performance */}
    </div>
  );
}
