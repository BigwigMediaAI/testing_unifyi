import { useState, useEffect } from "react";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { referralsAPI } from "../../lib/api";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export default function ReferAFriend() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("unify-user") || "{}");

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralsAPI.getMy();
      setReferrals(res.data || []);
    } catch (err) {
      toast.error("Failed to load referrals");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user.person_id);
    toast.success("Referral code copied!");
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            Refer a Friend
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Share your referral code and invite friends to register.
          </p>
        </div>

        {/* ================= REFERRAL INFO ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Your Referral Code</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-lg font-semibold text-blue-600">
                  {user.person_id || "-"}
                </span>
                <Button size="sm" variant="outline" onClick={copyCode}>
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Registration Link</p>
              <p className="text-slate-700 dark:text-slate-300 break-all">
                https://unifyicrm.com/student/login
              </p>
            </div>

            <div>
              <Badge className="bg-blue-100 text-blue-700">
                Total Referrals: {referrals.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ================= REFERRAL TABLE ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-slate-500">Loading...</div>
            ) : referrals.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No referrals yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.person_id}</TableCell>
                      <TableCell>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
