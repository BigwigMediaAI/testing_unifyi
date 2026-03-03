import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { applicationAPI, documentAPI } from "../../lib/api";
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
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  // ✅ Load Submitted Applications Only
  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationAPI.getSubmitted();
      setApplications(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load submitted applications");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load Documents
  const loadDocuments = async (applicationId) => {
    try {
      const res = await documentAPI.getApplicationDocuments(applicationId);
      setDocuments(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load documents");
    }
  };

  // ✅ View Documents
  const handleViewDocuments = async (application) => {
    try {
      setDocLoading(true);
      setSelectedApplication(application);
      await loadDocuments(application.id);
    } catch (err) {
      toast.error("Failed to load application");
    } finally {
      setDocLoading(false);
    }
  };

  // ✅ Verify Document
  const handleVerify = async (docId) => {
    try {
      setProcessing(true);

      await documentAPI.verify(docId, {
        status: "verified",
        rejection_reason: null,
      });

      toast.success("Document verified successfully");
      await loadDocuments(selectedApplication.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ Reject Document
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
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow">
          <h1 className="text-2xl font-bold">Document Verification</h1>
          <p className="text-indigo-100 mt-1">
            Review and verify submitted student documents
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Submitted Applications</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-slate-500 text-center py-6">
                  No submitted applications found
                </p>
              ) : (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition ${
                      selectedApplication?.id === application.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        {application.basic_info?.name || "Student"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {application.basic_info?.email}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={
                        selectedApplication?.id === application.id
                          ? "default"
                          : "outline"
                      }
                      className={
                        selectedApplication?.id === application.id
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                      onClick={() => handleViewDocuments(application)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Docs
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* RIGHT PANEL */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedApplication
                  ? `Application No: ${selectedApplication.application_number}`
                  : "Select an application to view documents"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {docLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                </div>
              ) : selectedApplication ? (
                documents.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    No documents uploaded
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold">{doc.name}</p>
                        <p className="text-sm text-slate-500">
                          {doc.file_name}
                        </p>

                        <span
                          className={`inline-block text-xs px-2 py-1 rounded-full ${
                            doc.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {doc.status}
                        </span>

                        {doc.rejection_reason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {doc.rejection_reason}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
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
                    </div>
                  ))
                )
              ) : (
                <div className="text-center py-16 text-slate-400">
                  Select an application from the left panel
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
