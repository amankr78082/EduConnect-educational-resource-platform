import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { GraduationCap, Mail, Lock, User, ArrowLeft, KeyRound, BookOpen, School, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { useToast } from "@/hooks/use-toast";

type AuthView = "login" | "signup" | "forgot" | "otp" | "otp-verify";
type SignupRole = "student" | "teacher" | "maintenance" | "admin";

const ROLE_OPTIONS: { value: SignupRole; label: string; desc: string; detail: string; Icon: typeof BookOpen }[] = [
  {
    value: "student",
    label: "Student",
    desc: "Structured learning access",
    detail: "Follow university, course, scheme, semester, subject, unit, topics, notes, videos, PYQs, quizzes, and live classes.",
    Icon: BookOpen,
  },
  {
    value: "teacher",
    label: "Teacher",
    desc: "Assigned subject content",
    detail: "Upload notes, videos, PYQs, topic-wise resources, and live links only for subjects assigned by admin.",
    Icon: School,
  },
  {
    value: "maintenance",
    label: "Maintenance",
    desc: "Hierarchy update requests",
    detail: "Suggest schemes, courses, branches, subjects, and academic structure changes for admin approval.",
    Icon: Wrench,
  },
  {
    value: "admin",
    label: "Admin",
    desc: "Super control & approvals",
    detail: "Manage hierarchy, users, teacher permissions, subscriptions, content governance, and approval workflows.",
    Icon: ShieldCheck,
  },
];

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("student");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getFriendlyAuthError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    if (lower.includes("failed to fetch")) return { title: "Network error", description: "Couldn't reach the server. Please check your connection." };
    if (lower.includes("invalid login credentials")) return { title: "Invalid credentials", description: "Email or password is incorrect." };
    if (lower.includes("user already registered") || lower.includes("already registered")) return { title: "Account exists", description: "This email is already registered. Please sign in." };
    if (lower.includes("otp") && lower.includes("expired")) return { title: "Code expired", description: "Please request a new one." };
    if (lower.includes("invalid") && lower.includes("otp")) return { title: "Invalid code", description: "The code is incorrect. Try again." };
    return { title: "Error", description: message };
  };

  useEffect(() => {
    const { data: { subscription } } = mysqlClient.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });
    mysqlClient.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (view !== "signup") return;
    const fetchAcademicOptions = async () => {
      const [universityRes, courseRes, branchRes] = await Promise.all([
        mysqlClient.from("universities").select("id, name, short_name").order("name"),
        mysqlClient.from("courses").select("id, name, university_id").order("name"),
        mysqlClient.from("branches").select("id, name, code, course_id").order("name"),
      ]);
      setUniversities((universityRes.data || []) as any[]);
      setCourses((courseRes.data || []) as any[]);
      setBranches((branchRes.data || []) as any[]);
    };
    fetchAcademicOptions();
  }, [view]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "signup" && (!fullName.trim() || !phone.trim() || !gender)) {
      toast({ title: "Missing profile details", description: "Please enter name, phone number and gender.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await mysqlClient.auth.signInWithOtp({ email });
      if (error) throw error;
      toast({ title: "Code sent!", description: "Check your email for the 6-digit code." });
      setView("otp-verify");
    } catch (error: any) {
      toast({ ...getFriendlyAuthError(error), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await mysqlClient.auth.verifyOtp({ email, token: otpCode, type: "email" });
      if (error) throw error;
      toast({ title: "Welcome!", description: "Signed in successfully." });
    } catch (error: any) {
      toast({ ...getFriendlyAuthError(error), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "forgot") {
        const { error } = await mysqlClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link sent." });
        setView("login");
      } else if (view === "login") {
        const { error } = await mysqlClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Logged in successfully." });
      } else {
        // Signup with role
        const { data, error } = await mysqlClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              role: signupRole,
              phone,
              gender,
              date_of_birth: dateOfBirth || undefined,
              address,
              university_id: universityId || undefined,
              course_id: courseId || undefined,
              branch_id: branchId || undefined,
              semester: semester ? Number(semester) : null,
            }
          }
        });
        if (error) throw error;
        
        // Assign role in user_roles table
        if (data.user) {
          await mysqlClient.from("user_roles").insert({
            user_id: data.user.id,
            role: signupRole,
          });
        }
        
        toast({ title: "Account created!", description: `Welcome to EduConnect as a ${signupRole}!` });
      }
    } catch (error: any) {
      toast({ ...getFriendlyAuthError(error), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const getHeading = () => {
    switch (view) {
      case "forgot": return "Reset password";
      case "login": return "Welcome back!";
      case "signup": return "Create account";
      case "otp": return "Sign in with OTP";
      case "otp-verify": return "Enter verification code";
    }
  };

  const getSubheading = () => {
    switch (view) {
      case "forgot": return "Enter your email and we'll send you a reset link";
      case "login": return "Enter your credentials to access your account";
      case "signup": return "Choose your RBAC role and create your EduConnect account";
      case "otp": return "We'll send a 6-digit code to your email";
      case "otp-verify": return `Enter the code sent to ${email}`;
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={view} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">EduConnect</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">{getHeading()}</h1>
          <p className="text-muted-foreground mb-8">{getSubheading()}</p>

          {/* OTP - Enter email */}
          {view === "otp" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="otp-email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending code..." : "Send OTP Code"}
              </Button>
            </form>
          )}

          {/* OTP - Verify */}
          {view === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                    <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading || otpCode.length !== 6}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn't receive the code?{" "}
                <button type="button" onClick={() => { setOtpCode(""); setView("otp"); }} className="text-primary font-semibold hover:underline">Resend</button>
              </p>
            </form>
          )}

          {/* Standard forms */}
          {(view === "login" || view === "signup" || view === "forgot") && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection for Signup */}
                {view === "signup" && (
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ROLE_OPTIONS.map(({ value, label, desc, Icon }) => {
                        const active = signupRole === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSignupRole(value)}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              active
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              active ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <Icon className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <span className={`font-semibold text-sm ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                            <span className="text-xs text-muted-foreground text-center leading-snug">{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        {ROLE_OPTIONS.find((role) => role.value === signupRole)?.label} access
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {ROLE_OPTIONS.find((role) => role.value === signupRole)?.detail}
                      </p>
                    </div>
                    {(signupRole === "admin" || signupRole === "maintenance") && (
                      <p className="text-xs text-muted-foreground">
                        Note: {signupRole === "admin" ? "Admin" : "Maintenance"} accounts should be approved before full platform access is granted.
                      </p>
                    )}
                  </div>
                )}

                {view === "signup" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input id="name" placeholder="Aman Kumar" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={gender} onValueChange={setGender} required>
                          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Current Semester</Label>
                        <Select value={semester} onValueChange={setSemester}>
                          <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Currently Pursuing Degree</Label>
                      <Select value={courseId} onValueChange={(value) => { setCourseId(value); setBranchId(""); }}>
                        <SelectTrigger><SelectValue placeholder="Select degree/course" /></SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>University</Label>
                        <Select value={universityId} onValueChange={setUniversityId}>
                          <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                          <SelectContent>
                            {universities.map((university) => (
                              <SelectItem key={university.id} value={university.id}>
                                {university.short_name ? `${university.short_name} - ${university.name}` : university.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Program / Branch</Label>
                        <Select value={branchId} onValueChange={setBranchId} disabled={!courseId}>
                          <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                          <SelectContent>
                            {branches
                              .filter((branch) => !courseId || branch.course_id === courseId)
                              .map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.code ? `${branch.code} - ${branch.name}` : branch.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="City, State" value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>

                {view !== "forgot" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {view === "login" && (
                        <button type="button" onClick={() => setView("forgot")} className="text-xs text-primary hover:underline">Forgot password?</button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Please wait..." : view === "forgot" ? "Send Reset Link" : view === "login" ? "Sign In" : `Sign Up as ${ROLE_OPTIONS.find(r => r.value === signupRole)?.label ?? "User"}`}
                </Button>
              </form>

              {view === "login" && (
                <div className="mt-4">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full" size="lg" onClick={() => setView("otp")}>
                    <KeyRound className="w-4 h-4 mr-2" /> Sign in with Email OTP
                  </Button>
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-center text-muted-foreground">
            {(view === "forgot" || view === "otp" || view === "otp-verify") ? (
              <button type="button" onClick={() => { setView("login"); setOtpCode(""); }} className="text-primary font-semibold hover:underline">Back to sign in</button>
            ) : (
              <>
                {view === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => setView(view === "login" ? "signup" : "login")} className="text-primary font-semibold hover:underline">
                  {view === "login" ? "Sign up" : "Sign in"}
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex w-1/2 gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <h2 className="font-display text-4xl font-bold mb-6">Role-Based Access Control</h2>
          <p className="text-lg opacity-80">
            Admin controls the platform, maintenance raises academic requests, teachers manage assigned subjects, and students access structured learning.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;


