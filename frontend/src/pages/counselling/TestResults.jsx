import { useEffect, useState } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { testAPI } from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function TestResults() {
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, listRes] = await Promise.all([
        testAPI.getResultsSummary(),
        testAPI.getResultsList(),
      ]);

      setStats(summaryRes.data);
      setResults(listRes.data.data || []);
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Test Results Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of student performance in entrance tests
          </p>
        </div>
        {/* 🔝 STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Attempts</p>
              <h2 className="text-2xl font-bold">
                {stats?.total_attempts || 0}
              </h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Passed</p>
              <h2 className="text-2xl font-bold text-green-600">
                {stats?.passed || 0}
              </h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Failed</p>
              <h2 className="text-2xl font-bold text-red-600">
                {stats?.failed || 0}
              </h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Average %</p>
              <h2 className="text-2xl font-bold">
                {stats?.average_percentage || 0}%
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* 📋 RESULTS TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Student Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-center text-gray-500 py-6">
                No test results found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">Student ID</th>
                      <th className="p-2">Score</th>
                      <th className="p-2">Percentage</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {r.student_name?.charAt(0)}
                          </div>
                          <div>
                            <p>{r.student_name}</p>
                            <p className="text-xs text-gray-500">
                              {r.student_email}
                            </p>
                          </div>
                        </div>

                        <td className="p-2">
                          {r.score}/{r.total_marks}
                        </td>

                        <td className="p-2">{r.percentage}%</td>

                        <td className="p-2">
                          <Badge
                            className={
                              r.passed
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {r.passed ? "Passed" : "Failed"}
                          </Badge>
                        </td>

                        <td className="p-2">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
