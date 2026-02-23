import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { walkinsAPI, authAPI } from "../../lib/api";
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

import { Badge } from "../../components/ui/badge";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Walkins() {
  const [form, setForm] = useState({
    time: "",
    persons: "",
    reason: "",
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [requests, setRequests] = useState([]);
  const [lead, setLead] = useState(null);

  const [loading, setLoading] = useState(false);
  const [checkingLead, setCheckingLead] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setCheckingLead(true);

      const leadRes = await authAPI.getMyLead();
      const leadData = leadRes.data;

      setLead(leadData);

      if (leadData?.assigned_to) {
        fetchWalkins();
      }
    } catch (err) {
      toast.error("Failed to load profile data");
    } finally {
      setCheckingLead(false);
    }
  };

  const fetchWalkins = async () => {
    try {
      setLoading(true);
      const res = await walkinsAPI.getMy();
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load walk-in requests");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      toast.error("Please select visit date");
      return;
    }

    try {
      setSubmitting(true);

      await walkinsAPI.create({
        visit_date: selectedDate.toISOString(),
        visit_time: form.time,
        number_of_persons: Number(form.persons),
        reason: form.reason,
      });

      toast.success("Walk-in request submitted successfully");

      setForm({ time: "", persons: "", reason: "" });
      setSelectedDate(null);
      fetchWalkins();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "modified":
        return <Badge className="bg-blue-100 text-blue-700">Modified</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkingLead) {
    return (
      <StudentLayout>
        <div className="py-20 text-center text-slate-500">
          Loading your profile...
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            Campus Visit Request
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Request a campus visit and track your approval status.
          </p>
        </div>

        {/* NOT ASSIGNED */}
        {!lead?.assigned_to ? (
          <Card>
            <CardContent className="py-16 text-center space-y-3">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-white">
                Your profile is under review
              </h2>
              <p className="text-sm text-slate-500">
                Our admission team is assigning a counsellor to you.
              </p>
              <p className="text-sm text-slate-500">
                You will be able to request a campus visit once assigned.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* FORM */}
            <Card>
              <CardHeader>
                <CardTitle>
                  New Visit Request
                  {lead.assigned_to_name && (
                    <span className="block text-sm font-normal text-slate-500 mt-1">
                      Assigned Counsellor: {lead.assigned_to_name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-3 gap-5"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "PPP")
                          : "Pick visit date"}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < today}
                      />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    type="number"
                    name="persons"
                    placeholder="Number of visitors"
                    value={form.persons}
                    onChange={handleChange}
                    min={1}
                    required
                  />

                  <div className="md:col-span-3">
                    <Textarea
                      name="reason"
                      placeholder="Reason for visit"
                      value={form.reason}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* HISTORY */}
            <Card>
              <CardHeader>
                <CardTitle>Your Requests</CardTitle>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-slate-500">
                    Loading...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No requests yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Persons</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Counsellor Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            {new Date(r.visit_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{r.visit_time}</TableCell>
                          <TableCell>{r.number_of_persons}</TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell>{r.reason || "-"}</TableCell>
                          <TableCell>{r.counsellor_note || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
