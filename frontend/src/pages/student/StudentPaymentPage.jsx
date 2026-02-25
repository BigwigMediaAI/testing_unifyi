import { useState, useEffect } from "react";
import { StudentLayout } from "../../components/layouts/StudentLayout";
import { paymentAPI, applicationAPI, studentAPI } from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const PAYMENT_STATUS = {
  pending: {
    label: "Pending",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  success: {
    label: "Successful",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Receipt,
  },
};

export default function StudentPaymentPage() {
  const [payments, setPayments] = useState([]);
  const [application, setApplication] = useState(null);
  const [registrationFee, setRegistrationFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [appsRes, paymentsRes, feeRes] = await Promise.all([
        applicationAPI.getMyApplications(),
        paymentAPI.getMyPayments(),
        studentAPI.getRegistrationFee(),
      ]);

      const apps = appsRes.data.data || [];
      if (apps.length > 0) {
        setApplication(apps[0]);
      }

      setPayments(paymentsRes.data.data || []);
      setRegistrationFee(feeRes.data);
    } catch (err) {
      console.error("Failed to load data:", err);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!registrationFee || !application) return;

    try {
      setProcessing(true);

      await paymentAPI.createOrder({
        application_id: application.id,
        amount: registrationFee.final_fee,
        fee_type: "registration",
        currency: "INR",
      });

      toast.success("Payment successful!");
      setShowPayDialog(false);
      setPaymentDetails({
        cardNumber: "",
        expiry: "",
        cvv: "",
        name: "",
      });

      loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Payment failed. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const isRegistrationPaid = payments.some(
    (p) => p.fee_type === "registration" && p.status === "success",
  );

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6" data-testid="student-payment-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Fee Payment
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Pay your fees and view payment history
            </p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {!application && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p>Please complete your application to make payments.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <IndianRupee className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-bold">
                  ₹{totalPaid.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Receipt className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <p className="text-2xl font-bold">
                  {payments.filter((p) => p.status === "pending").length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pay Fees Section */}
        <Card>
          <CardHeader>
            <CardTitle>Pay Fees</CardTitle>
            <CardDescription>
              Complete your registration payment
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {registrationFee?.fee_enabled ? (
                <Card
                  className={`transition-all ${
                    isRegistrationPaid
                      ? "border-green-200 bg-green-50"
                      : "hover:border-blue-500/50"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Registration Fee</h4>
                      {isRegistrationPaid && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>

                    <div className="space-y-1 mb-2 text-sm text-slate-600">
                      {registrationFee?.discount_amount > 0 ? (
                        <>
                          {/* Show Actual Price */}
                          <div className="flex justify-between">
                            <span>Actual</span>
                            <span>
                              ₹{registrationFee.actual_fee?.toLocaleString()}
                            </span>
                          </div>

                          {/* Show Discount */}
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>
                              -₹
                              {registrationFee.discount_amount?.toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Final Price Always Show */}
                    <p className="text-2xl font-bold mb-3">
                      ₹{registrationFee?.final_fee?.toLocaleString()}
                    </p>

                    {isRegistrationPaid ? (
                      <Badge className="bg-green-100 text-green-800">
                        Paid
                      </Badge>
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={!application}
                        onClick={() => setShowPayDialog(true)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="col-span-3 text-slate-500">
                  Registration fee not required.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent transactions</CardDescription>
          </CardHeader>

          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No payment history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const status =
                    PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-100">
                          <StatusIcon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {payment.fee_type}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(payment.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ₹{(payment.amount || 0).toLocaleString()}
                        </p>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Pay Registration Fee - ₹
              {registrationFee?.final_fee?.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayment}>
            <div className="space-y-4 py-4">
              {/* Amount Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Amount
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    ₹{registrationFee?.final_fee?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Number */}
              <div className="space-y-2">
                <Label>Card Number</Label>
                <Input
                  placeholder="4111 1111 1111 1111"
                  value={paymentDetails.cardNumber}
                  onChange={(e) =>
                    setPaymentDetails((prev) => ({
                      ...prev,
                      cardNumber: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={paymentDetails.expiry}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({
                        ...prev,
                        expiry: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>CVV</Label>
                  <Input
                    placeholder="123"
                    type="password"
                    value={paymentDetails.cvv}
                    onChange={(e) =>
                      setPaymentDetails((prev) => ({
                        ...prev,
                        cvv: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>Name on Card</Label>
                <Input
                  placeholder="John Doe"
                  value={paymentDetails.name}
                  onChange={(e) =>
                    setPaymentDetails((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                This is a demo payment form. In production, Razorpay checkout
                will be used.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayDialog(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing
                  ? "Processing..."
                  : `Pay ₹${registrationFee?.final_fee?.toLocaleString()}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
