import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Crown, Check, Lock, ArrowLeft, LogOut, Loader2, Sparkles, Zap,
  IndianRupee, Copy, MessageCircle, Phone, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const SEMESTERS = [
  { num: 1, label: "1st Semester", subjects: "OS, C Programming, Mathematics + more" },
  { num: 2, label: "2nd Semester", subjects: "DSA, Java, DBMS + more" },
  { num: 3, label: "3rd Semester", subjects: "Networks, Software Eng, AI + more" },
  { num: 4, label: "4th Semester", subjects: "Cloud, Cyber Security, Project + more" },
];

const FREE_FEATURES = [
  "Full syllabus index for every subject",
  "First unit/topic preview content",
  "20 quiz questions per subject",
  "1 PYQ/sample paper per subject",
  "Community support",
];

const PREMIUM_FEATURES = [
  "All subjects unlocked for the semester",
  "50+ quiz questions per subject",
  "Full video lectures & playlists",
  "Download notes as PDF",
  "All PYQs and teacher solutions",
  "Priority doubt resolution",
];

const paymentQrImage = "/phonepe-qr-aman-kumar.jpeg";

const Subscription = () => {
  const { user, loading: authLoading, isTeacher } = useUserRole();
  const navigate = useNavigate();
  const { subscriptions, hasPremium, loading: subLoading, requestSubscription } = useSubscription(user?.id);
  const [activating, setActivating] = useState<number | null>(null);
  const [pendingSemesters, setPendingSemesters] = useState<number[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const premiumAmount = 299;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Fetch pending subscriptions
  useEffect(() => {
    if (!user) return;
    mysqlClient
      .from("subscriptions")
      .select("semester, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => {
        setPendingSemesters((data || []).map((s: any) => s.semester));
      });
  }, [user, subscriptions]);

  const isPending = (semester: number) => pendingSemesters.includes(semester);

  const handleActivate = async (semester: number) => {
    if (selectedSemester !== semester) {
      setSelectedSemester(semester);
      return;
    }
    if (!transactionId.trim() || !paymentScreenshot) {
      toast.error("Payment proof required", {
        description: "Please enter transaction ID and upload payment screenshot before submitting.",
      });
      return;
    }
    setActivating(semester);
    let screenshotUrl: string | null = null;
    const screenshotPath = `payment-screenshots/${user.id}_${semester}_${Date.now()}_${paymentScreenshot.name}`;
    const { error: uploadError } = await mysqlClient.storage
      .from("educational-content")
      .upload(screenshotPath, paymentScreenshot);
    if (uploadError) {
      toast.error("Screenshot upload failed", { description: uploadError.message });
      setActivating(null);
      return;
    }
    const { data: urlData } = mysqlClient.storage
      .from("educational-content")
      .getPublicUrl(screenshotPath);
    screenshotUrl = urlData.publicUrl;

    const result = await requestSubscription(semester, {
      amount: premiumAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim(),
      payment_screenshot_url: screenshotUrl,
    });
    if (result?.error) {
      toast.error("Failed to send request");
    } else {
      setPendingSemesters((prev) => [...prev, semester]);
      setTransactionId("");
      setPaymentScreenshot(null);
      setSelectedSemester(null);
      toast.success(`Request sent for Semester ${semester}! Admin will activate after payment verification.`);
    }
    setActivating(null);
  };

  const handleLogout = async () => {
    await mysqlClient.auth.signOut();
    navigate("/");
  };

  if (authLoading || subLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">EduConnect</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />Logout
          </Button>
        </div>
      </nav>

      <main className="container py-12 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">Premium Subscription</h1>
          <p className="text-lg text-muted-foreground">
            Semester-wise premium access. Har semester ke liye alag subscription — sirf wahi lo jiska zaroorat hai!
          </p>
        </div>

        {/* Plans Comparison */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="p-6 border-2">
            <div className="mb-6">
              <Badge variant="secondary" className="mb-3">Free Plan</Badge>
              <h3 className="font-display text-2xl font-bold">₹0</h3>
              <p className="text-muted-foreground text-sm mt-1">Limited access per semester</p>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-muted-foreground shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              RECOMMENDED
            </div>
            <div className="mb-6">
              <Badge className="mb-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                <Crown className="w-3 h-3 mr-1" /> Premium
              </Badge>
              <h3 className="font-display text-3xl font-bold">₹{premiumAmount}</h3>
              <p className="text-muted-foreground text-sm mt-1">Per semester - full access to all subjects in that semester</p>
            </div>
            <ul className="space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Semester-wise Activation */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">Activate by Semester</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {SEMESTERS.map((sem) => {
              const isPrem = hasPremium(sem.num);
              const isPend = isPending(sem.num);
              return (
                <motion.div key={sem.num} whileHover={{ scale: 1.02 }}>
                  <Card className={`p-5 transition-all ${isPrem ? "border-primary bg-primary/5" : isPend ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10" : "hover:border-primary/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isPrem ? "bg-gradient-to-br from-amber-400 to-orange-500" : isPend ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                        }`}>
                          {isPrem ? <Crown className="w-5 h-5 text-white" /> : <span className="font-bold text-muted-foreground">{sem.num}</span>}
                        </div>
                        <div>
                          <h3 className="font-semibold">{sem.label}</h3>
                          <p className="text-xs text-muted-foreground">{sem.subjects}</p>
                        </div>
                      </div>
                      {isPrem && <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">Active</Badge>}
                      {isPend && <Badge variant="outline" className="border-amber-400 text-amber-600">Pending</Badge>}
                    </div>
                    {isPrem ? (
                      <p className="text-sm text-primary font-medium flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> All subjects unlocked
                      </p>
                    ) : isPend ? (
                      <p className="text-sm text-amber-600 font-medium flex items-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin" /> Waiting for admin approval after payment
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedSemester === sem.num && (
                          <div className="rounded-xl border bg-background p-3 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label>Amount Paid</Label>
                                <Input value={`₹${premiumAmount}`} disabled />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Payment Method</Label>
                                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="UPI / PhonePe / GPay" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Transaction ID / UTR</Label>
                              <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter payment transaction ID" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Payment Screenshot</Label>
                              <Input type="file" accept="image/*,.pdf" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} />
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => handleActivate(sem.num)}
                          disabled={activating === sem.num}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          {activating === sem.num ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          {activating === sem.num
                            ? "Submitting..."
                            : selectedSemester === sem.num
                              ? "Submit Payment Proof"
                              : "Pay & Request Premium"}
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        {/* Payment Instructions */}
        <Card className="max-w-4xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <IndianRupee className="h-5 w-5 text-primary" />
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold">Pay via UPI</p>
                  <p className="text-sm text-muted-foreground">Send the semester fee to the UPI ID below</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold">Click "Request Premium"</p>
                  <p className="text-sm text-muted-foreground">Select the semester you paid for and submit a request</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold">Wait for Activation</p>
                  <p className="text-sm text-muted-foreground">Your HOD/Admin will verify the payment and activate your subscription</p>
                </div>
              </div>
            </div>

            {/* UPI Details */}
            <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[260px_1fr]">
              <div className="rounded-xl border bg-black p-3">
                <img
                  src={paymentQrImage}
                  alt="PhonePe QR code for EduConnect subscription payment"
                  className="max-h-[360px] w-full rounded-lg object-contain"
                />
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" /> PhonePe / UPI Payment Details
                </h4>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Receiver Name</p>
                  <p className="font-semibold text-lg">Aman Kumar</p>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Mode</p>
                    <p className="font-mono font-semibold text-lg">Scan QR using PhonePe / UPI app</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      toast.success("Scan the QR from any UPI app, then upload screenshot above.");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" /> QR Ready
                  </Button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  After payment, select your semester above, enter transaction ID / UTR, upload payment screenshot, and submit request.
                  Admin will verify this exact screenshot before activating premium access.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-400">Payment पर कोई doubt?</p>
                <p className="text-amber-700 dark:text-amber-500">
                  WhatsApp करें: <span className="font-semibold">+91 XXXXX XXXXX</span> या अपने department HOD से contact करें।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Admin Section - Manage subscriptions */}
        {isTeacher && <AdminSubscriptionManager />}
      </main>
    </div>
  );
};

const AdminSubscriptionManager = () => {
  const [allSubs, setAllSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mysqlClient
      .from("subscriptions")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAllSubs(data || []);
        setLoading(false);
      });
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "expired" : "active";
    const { error } = await mysqlClient
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) {
      setAllSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
      toast.success(`Subscription ${newStatus === "active" ? "activated" : "deactivated"}`);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display text-2xl font-bold mb-4">Manage Subscriptions (Admin)</h2>
      {allSubs.length === 0 ? (
        <p className="text-muted-foreground">No subscription requests yet.</p>
      ) : (
        <div className="space-y-3">
          {allSubs.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{sub.profiles?.full_name || "Unknown User"}</p>
                  <p className="text-sm text-muted-foreground">
                    Semester {sub.semester} • {sub.plan_type} •{" "}
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                  </p>
                </div>
                <Button
                  variant={sub.status === "active" ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleStatus(sub.id, sub.status)}
                >
                  {sub.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscription;


