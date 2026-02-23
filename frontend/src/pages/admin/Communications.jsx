import { useState, useEffect } from "react";
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
import { Textarea } from "../../components/ui/textarea";
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
  const [header, setHeader] = useState("");
  const [message, setMessage] = useState("");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUniversities();
    loadHistory();
  }, []);

  const loadUniversities = async () => {
    try {
      const res = await superAdminAPI.listUniversities();
      setUniversities(res.data.data || []);
    } catch (err) {
      console.error("Failed to load universities");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await superAdminCommunicationsAPI.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  const toggleUniversity = (id) => {
    if (selectedUniversities.includes(id)) {
      setSelectedUniversities(selectedUniversities.filter((u) => u !== id));
    } else {
      setSelectedUniversities([...selectedUniversities, id]);
    }
  };

  const handleSend = async () => {
    if (!subject || !message) {
      toast.error("Subject and message are required");
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
        message: `<h2>${header}</h2><div>${message}</div>`,
        send_to_all: sendToAll,
        university_ids: sendToAll ? [] : selectedUniversities,
      };

      await superAdminCommunicationsAPI.sendEmail(payload);

      toast.success("Email sent successfully");

      setSubject("");
      setHeader("");
      setMessage("");
      setSelectedUniversities([]);
      setSendToAll(false);

      loadHistory();
    } catch (err) {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            University Communications
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Send platform-wide emails to universities
          </p>
        </div>

        {/* Send Email Card */}
        <Card>
          <CardHeader>
            <CardTitle>Send Email</CardTitle>
            <CardDescription>
              Select recipients and compose message
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Select All */}
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

            {/* University List */}
            {!sendToAll && (
              <div className="space-y-3">
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
                      <div
                        key={uni.id}
                        className="flex items-center gap-2 py-1"
                      >
                        <Checkbox
                          checked={selectedUniversities.includes(uni.id)}
                          onCheckedChange={() => toggleUniversity(uni.id)}
                        />
                        <span>{uni.name}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Selected Universities Tags */}
                {selectedUniversities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUniversities.map((id) => {
                      const uni = universities.find((u) => u.id === id);
                      return (
                        <div
                          key={id}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {uni?.name}
                          <button
                            onClick={() => toggleUniversity(id)}
                            className="text-red-500 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <Input
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />

            {/* Header */}
            <Input
              placeholder="Email Header"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
            />

            {/* Message */}
            <Textarea
              placeholder="Email Body (HTML supported)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </CardContent>
        </Card>

        {/* History Section */}
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
