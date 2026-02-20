import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { walkinsAPI } from "../../lib/api";
import { toast } from "sonner";

export default function Walkins() {
  const [form, setForm] = useState({
    date: "",
    time: "",
    persons: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // Fetch Student Walkins
  // ===============================
  useEffect(() => {
    fetchWalkins();
  }, []);

  const fetchWalkins = async () => {
    try {
      setLoading(true);
      const res = await walkinsAPI.getMy();
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load walk-in requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Handle Form Change
  // ===============================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ===============================
  // Submit Walkin Request
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        visit_date: form.date,
        visit_time: form.time,
        number_of_persons: Number(form.persons),
        reason: form.reason,
      };

      await walkinsAPI.create(payload);

      toast.success("Walk-in request submitted successfully");

      setForm({
        date: "",
        time: "",
        persons: "",
        reason: "",
      });

      fetchWalkins(); // refresh list
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Status Badge
  // ===============================
  const statusBadge = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium inline-block";

    switch (status) {
      case "approved":
        return (
          <span className={`${base} bg-green-100 text-green-700`}>
            Approved
          </span>
        );
      case "modified":
        return (
          <span className={`${base} bg-blue-100 text-blue-700`}>Modified</span>
        );
      case "rejected":
        return (
          <span className={`${base} bg-red-100 text-red-700`}>Rejected</span>
        );
      default:
        return (
          <span className={`${base} bg-yellow-100 text-yellow-700`}>
            Pending
          </span>
        );
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            Walk-in Campus Visit
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Request a campus visit and track your approval status.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">New Request</h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2.5 border rounded-lg"
              required
            />

            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full p-2.5 border rounded-lg"
              required
            />

            <input
              type="number"
              name="persons"
              placeholder="Number of visitors"
              value={form.persons}
              onChange={handleChange}
              className="w-full p-2.5 border rounded-lg"
              required
            />

            <textarea
              name="reason"
              placeholder="Reason for visit"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className="md:col-span-2 w-full p-2.5 border rounded-lg resize-none"
              required
            />

            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-slate-800 border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Your Requests</h2>

          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-slate-500">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left">
                  <tr>
                    <th className="py-2">Date</th>
                    <th>Time</th>
                    <th>Persons</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th>Counsellor Note</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <td className="py-2">
                        {new Date(r.visit_date).toLocaleDateString()}
                      </td>
                      <td>{r.visit_time}</td>
                      <td>{r.number_of_persons}</td>
                      <td>{statusBadge(r.status)}</td>
                      <td className="text-slate-500">{r.reason || "-"}</td>
                      <td className="text-slate-500">
                        {r.counsellor_note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
