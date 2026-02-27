import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { leadAPI, applicationAPI, documentAPI } from "../../lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Loader2, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function CounsellingDocumentVerificationPage() {
  const [students, setStudents] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.list({
        page: 1,
        limit: 50,
        stage: "application_started",
      });
      console.log(res);
      setStudents(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (applicationId) => {
    try {
      const docRes = await documentAPI.getApplicationDocuments(applicationId);
      setDocuments(docRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load documents");
    }
  };

  const handleViewDocuments = async (student) => {
    if (!student.application_id) {
      toast.error("Application not found for this student");
      return;
    }

    try {
      setDocLoading(true);

      const appRes = await applicationAPI.get(student.application_id);
      setSelectedApplication(appRes.data);

      await loadDocuments(student.application_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load data");
    } finally {
      setDocLoading(false);
    }
  };

  const handleVerify = async (docId) => {
    try {
      setProcessing(true);

      await documentAPI.verify(docId, {
        status: "verified",
      });

      toast.success("Document verified successfully");
      await loadDocuments(selectedApplication.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter rejection reason");
      return;
    }

    try {
      setProcessing(true);

      await documentAPI.verify(selectedDoc.id, {
        status: "rejected",
        rejection_reason: rejectionReason,
      });

      toast.success("Document rejected");

      setRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");

      await loadDocuments(selectedApplication.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Rejection failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Student Document Verification</h1>

        {/* Students List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
          </div>
        ) : (
          students.map((student) => (
            <Card key={student.id}>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{student.name}</CardTitle>
                <Button
                  size="sm"
                  onClick={() => handleViewDocuments(student)}
                  disabled={!student.application_id}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Documents
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{student.email}</p>
              </CardContent>
            </Card>
          ))
        )}

        {/* Documents Section */}
        {docLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
          </div>
        )}

        {selectedApplication && (
          <div className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">
              Documents for Application No:{" "}
              {selectedApplication.application_number}
            </h2>

            {documents.length === 0 ? (
              <p className="text-slate-500">No documents uploaded</p>
            ) : (
              documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex justify-between items-center py-4">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.file_name}</p>
                      <p className="text-xs text-slate-400">
                        Status: {doc.status}
                      </p>
                      {doc.rejection_reason && (
                        <p className="text-sm text-red-600">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <a href={doc.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </a>

                      {doc.status !== "verified" && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerify(doc.id)}
                          disabled={processing}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}

                      {doc.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setRejectDialog(true);
                          }}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Reject Dialog */}
        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
            </DialogHeader>

            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialog(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={processing}
              >
                {processing ? "Processing..." : "Confirm Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
