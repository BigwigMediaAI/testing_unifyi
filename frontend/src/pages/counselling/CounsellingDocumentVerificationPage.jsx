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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">
              Document Verification
            </h1>
            <p className="text-indigo-100 mt-2 text-sm md:text-base">
              Review and verify submitted student documents
            </p>
          </div>
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* LEFT PANEL */}
          <div className="xl:col-span-1">
            <Card className="rounded-2xl shadow-lg border-0 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Submitted Applications
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-slate-500 text-center py-6 text-sm">
                    No submitted applications found
                  </p>
                ) : (
                  applications.map((application) => (
                    <div
                      key={application.id}
                      onClick={() => handleViewDocuments(application)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                        selectedApplication?.id === application.id
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">
                            {application.basic_info?.name || "Student"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {application.basic_info?.email}
                          </p>
                        </div>

                        {selectedApplication?.id === application.id && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </div>

                      <p className="text-xs mt-2 text-blue-600 font-medium">
                        Click to review documents
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL */}
          <div className="xl:col-span-3">
            <Card className="rounded-2xl shadow-lg border-0 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {selectedApplication
                    ? `Application No: ${selectedApplication.application_number}`
                    : "Select an application to view documents"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {docLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
                  </div>
                ) : selectedApplication ? (
                  documents.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      No documents uploaded
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-6 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {doc.file_name}
                              </p>
                            </div>

                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${
                                doc.status === "verified"
                                  ? "bg-green-100 text-green-700"
                                  : doc.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>

                          {doc.rejection_reason && (
                            <p className="text-xs text-red-600 mt-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                              Reason: {doc.rejection_reason}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-5">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </a>

                            {doc.status === "uploaded" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 rounded-lg"
                                  onClick={() => handleVerify(doc.id)}
                                  disabled={processing}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-lg"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setRejectDialog(true);
                                  }}
                                  disabled={processing}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    Select an application from the left panel
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Reject Dialog */}
        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Reject Document
              </DialogTitle>
            </DialogHeader>

            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="rounded-xl"
            />

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialog(false);
                  setRejectionReason("");
                }}
                className="rounded-lg"
              >
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700 rounded-lg"
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
