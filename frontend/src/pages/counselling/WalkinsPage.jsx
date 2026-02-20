import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { walkinsAPI } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";

export default function CounsellorWalkinsPage() {
  const [walkins, setWalkins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedWalkin, setSelectedWalkin] = useState(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState("");
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    fetchWalkins();
  }, []);

  const fetchWalkins = async () => {
    try {
      setLoading(true);
      const res = await walkinsAPI.getAssigned();
      setWalkins(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load walkins");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (walkin, type) => {
    setSelectedWalkin(walkin);
    setActionType(type);
    setNote("");
    setNewDate(walkin.visit_date || "");
    setNewTime(walkin.visit_time || "");
    setOpen(true);
  };

  const handleAction = async () => {
    if (!selectedWalkin) return;

    try {
      await walkinsAPI.updateStatus(selectedWalkin.id, {
        status: actionType,
        counsellor_note: note || null,
        visit_date: newDate || null,
        visit_time: newTime || null,
      });

      toast.success("Walk-in updated successfully");
      setOpen(false);
      fetchWalkins();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update walkin");
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Walk-in Requests</h1>
          <p className="text-slate-500">
            Approve or modify campus visit requests.
          </p>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Walk-ins</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : walkins.length === 0 ? (
              <p className="text-slate-500">No walk-in requests found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Persons</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {walkins.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{w.student_name}</TableCell>
                      <TableCell>
                        {new Date(w.visit_date).toLocaleDateString()}
                      </TableCell>{" "}
                      <TableCell>{w.student_phone}</TableCell>
                      <TableCell>{w.reason}</TableCell>
                      <TableCell>{w.visit_time}</TableCell>
                      <TableCell>{w.number_of_persons}</TableCell>
                      <TableCell>{statusBadge(w.status)}</TableCell>
                      <TableCell className="space-x-2">
                        {w.status === "requested" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openActionModal(w, "approved")}
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openActionModal(w, "modified")}
                            >
                              Modify
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openActionModal(w, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {w.status === "approved" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openActionModal(w, "modified")}
                          >
                            Update
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Action Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approved"
                  ? "Approve Walk-in"
                  : actionType === "modified"
                    ? "Modify Walk-in"
                    : "Reject Walk-in"}
              </DialogTitle>
            </DialogHeader>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Visit Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            {/* Time */}
            <div className="space-y-2 mt-3">
              <label className="text-sm font-medium">Visit Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            {/* Note */}
            <div className="mt-3">
              <Textarea
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAction}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
