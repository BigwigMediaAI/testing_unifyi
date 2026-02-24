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
                    <TableHead>Success</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.subject}</TableCell>
                      <TableCell>{item.total_recipients}</TableCell>
                      <TableCell className="text-green-600">
                        {item.successful}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {item.failed}
                      </TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
