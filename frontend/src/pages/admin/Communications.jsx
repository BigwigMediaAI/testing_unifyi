"use client";

import { useState, useEffect } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";

import { AdminLayout } from "../../components/layouts/AdminLayout";
import { superAdminCommunicationsAPI, superAdminAPI } from "../../lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

import { Badge } from "../../components/ui/badge";
import { Eye } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";

export default function Communications() {
  const [universities, setUniversities] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openView = (item) => {
    setSelectedItem(item);
    setViewOpen(true);
  };

  const getStatusBadge = (status) => {
    if (status === "sent")
      return <Badge className="bg-green-100 text-green-700">Sent</Badge>;

    if (status === "partial")
      return <Badge className="bg-yellow-100 text-yellow-700">Partial</Badge>;

    return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
  };

  /* ---------------- Quill Setup ---------------- */

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    },
  });

  // Sync Quill content to state
  useEffect(() => {
    if (quill) {
      quill.on("text-change", () => {
        setMessage(quill.root.innerHTML);
      });
    }
  }, [quill]);

  /* ---------------- Data Loading ---------------- */

  useEffect(() => {
    loadUniversities();
    loadHistory();
  }, []);

  const loadUniversities = async () => {
    try {
      const res = await superAdminAPI.listUniversities();
      setUniversities(res.data.data || []);
    } catch {
      toast.error("Failed to load universities");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await superAdminCommunicationsAPI.getHistory();
      setHistory(res.data || []);
    } catch {
      toast.error("Failed to load history");
    }
  };

  const toggleUniversity = (id) => {
    setSelectedUniversities((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  /* ---------------- Send Email ---------------- */

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!message || message === "<p><br></p>") {
      toast.error("Message cannot be empty");
      return;
    }

    if (!sendToAll && selectedUniversities.length === 0) {
      toast.error("Select at least one university");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        subject,
        message: `
          <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6;">
            ${message}
          </div>
        `,
        send_to_all: sendToAll,
        university_ids: sendToAll ? [] : selectedUniversities,
      };

      await superAdminCommunicationsAPI.sendEmail(payload);

      toast.success("Email sent successfully");

      // Reset
      setSubject("");
      setMessage("");
      setSelectedUniversities([]);
      setSendToAll(false);

      if (quill) {
        quill.setText("");
      }

      loadHistory();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            University Communications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Send professional formatted emails to universities
          </p>
        </div>

        {/* Compose Card */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Select recipients and write your message
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Send to All */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={sendToAll}
                onCheckedChange={(val) => {
                  setSendToAll(val);
                  if (val) setSelectedUniversities([]);
                }}
              />
              <span>Send to All Universities</span>
            </div>

            {/* University Selector */}
            {!sendToAll && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedUniversities.length === 0
                      ? "Select Universities"
                      : `${selectedUniversities.length} selected`}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                  {universities.map((uni) => (
                    <div key={uni.id} className="flex items-center gap-2 py-1">
                      <Checkbox
                        checked={selectedUniversities.includes(uni.id)}
                        onCheckedChange={() => toggleUniversity(uni.id)}
                      />
                      <span>{uni.name}</span>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            {/* Subject */}
            <Input
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            {/* Quill Editor */}
            <div className="quill-wrapper">
              <div ref={quillRef} />
            </div>

            {/* Send Button */}
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Communication History</CardTitle>
          </CardHeader>

          <CardContent>
            {history.length === 0 ? (
              <div className="text-slate-500 text-center py-6">
                No communications yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>

                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.subject}
                      </TableCell>

                      <TableCell>{item.total_recipients}</TableCell>

                      <TableCell>{getStatusBadge(item.status)}</TableCell>

                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openView(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Communication Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {selectedItem.subject}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm">
                {/* Top Section - Two Column Layout */}
                <div className="grid grid-cols-3 gap-6">
                  {/* LEFT SIDE - Details */}
                  <div className="col-span-2 space-y-4">
                    <div>
                      <span className="font-semibold">Status:</span>
                      <div className="mt-1">
                        {getStatusBadge(selectedItem.status)}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Total Recipients:</span>
                      <div className="text-muted-foreground mt-1">
                        {selectedItem.total_recipients}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Successful:</span>
                      <div className="text-green-600 mt-1">
                        {selectedItem.successful}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Failed:</span>
                      <div className="text-red-600 mt-1">
                        {selectedItem.failed}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Sent On:</span>
                      <div className="text-muted-foreground mt-1">
                        {new Date(selectedItem.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE - Universities */}
                  <div className="border rounded-md p-4  flex flex-col">
                    <span className="font-semibold mb-3">Universities</span>

                    <div className="overflow-y-auto space-y-2 max-h-[220px] pr-1">
                      {selectedItem.send_to_all ? (
                        <div className="text-muted-foreground">
                          All Universities
                        </div>
                      ) : selectedItem.university_names?.length ? (
                        selectedItem.university_names.map((uni, index) => (
                          <div
                            key={index}
                            className="text-sm  border rounded px-2 py-1"
                          >
                            {uni}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">
                          No universities
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Preview Section - Full Width */}
                <div>
                  <div className="font-semibold mb-2">Email Content</div>

                  <div className="border rounded-md p-4 max-h-[350px] overflow-y-auto shadow-sm ">
                    {selectedItem.message ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                          __html: selectedItem.message,
                        }}
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        No message content available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
