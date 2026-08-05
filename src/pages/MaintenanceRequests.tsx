import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, BookOpenCheck, GraduationCap, Layers, Link2Off, Loader2, Send, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";

type TargetTable = "universities" | "courses" | "branches" | "schemes" | "subjects";
type RequestType = "academic_addition" | "correction" | "broken_resource" | "content_quality";

const requestTypes: Record<RequestType, { title: string; description: string; icon: any; actionType: "create" | "update" }> = {
  academic_addition: {
    title: "Academic Addition",
    description: "Suggest a new university, course, scheme, subject, unit, or syllabus topic.",
    icon: Layers,
    actionType: "create",
  },
  correction: {
    title: "Correction Request",
    description: "Report spelling mistakes, wrong subject codes, wrong unit order, or syllabus mismatch.",
    icon: Wrench,
    actionType: "update",
  },
  broken_resource: {
    title: "Broken Link Report",
    description: "Report a video, notes, PDF, or PYQ link that does not work or opens the wrong content.",
    icon: Link2Off,
    actionType: "update",
  },
  content_quality: {
    title: "Content Quality Issue",
    description: "Report duplicate, poor, outdated, or incorrectly mapped learning material.",
    icon: BookOpenCheck,
    actionType: "update",
  },
};

const targetLabels: Record<TargetTable, string> = {
  universities: "University",
  courses: "Course",
  branches: "Branch / Program",
  schemes: "Scheme / Syllabus",
  subjects: "Subject / Unit / Topic / Content",
};

const MaintenanceRequests = () => {
  const { user, isMaintenance, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState<RequestType>("correction");
  const [target, setTarget] = useState<TargetTable>("subjects");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [proposedChange, setProposedChange] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const loadRequests = async () => {
    if (!user) return;
    const { data } = await mysqlClient
      .from("hierarchy_requests")
      .select("*")
      .eq("requested_by", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
  };

  useEffect(() => {
    if (user) loadRequests();
  }, [user]);

  const submit = async () => {
    if (!title.trim()) return toast.error("Request title is required");
    if (!location.trim()) return toast.error("Location/context is required");
    if (!proposedChange.trim()) return toast.error("Proposed change or issue detail is required");
    if (!user) return toast.error("Please login again");

    const meta = requestTypes[requestType];
    const payload = {
      request_type: requestType,
      title: title.trim(),
      location: location.trim(),
      current_value: currentValue.trim() || null,
      proposed_change: proposedChange.trim(),
      category_label: meta.title,
      target_label: targetLabels[target],
      auto_publish: false,
    };

    setSubmitting(true);
    const { error } = await mysqlClient.from("hierarchy_requests").insert({
      requested_by: user.id,
      target_table: target,
      action_type: meta.actionType,
      payload,
      notes: notes.trim() || meta.description,
      diff_snapshot: { current: currentValue || null, proposed: payload, captured_at: new Date().toISOString() },
    });
    setSubmitting(false);

    if (error) return toast.error(error.message);
    toast.success("Request sent to Admin for review");
    setTitle("");
    setLocation("");
    setCurrentValue("");
    setProposedChange("");
    setNotes("");
    loadRequests();
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isMaintenance && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>Maintenance role required.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link to="/dashboard">Dashboard</Link></Button></CardContent>
        </Card>
      </div>
    );
  }

  const activeMeta = requestTypes[requestType];
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-10 border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/maintenance/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary"><GraduationCap className="h-6 w-6 text-primary-foreground" /></div>
              <span className="font-display text-xl font-bold">Maintenance Request</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container grid gap-6 py-8 lg:grid-cols-[1fr_.85fr]">
        <Card className="rounded-3xl border-white bg-white shadow-sm">
          <CardHeader>
            <Badge className="w-fit bg-indigo-600 hover:bg-indigo-600">Admin approval required</Badge>
            <CardTitle className="font-display text-3xl">Create Maintenance Request</CardTitle>
            <CardDescription>
              Use this when academic data or learning resources need correction. You submit, admin reviews, then the platform is updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.entries(requestTypes) as [RequestType, typeof requestTypes[RequestType]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const selected = requestType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setRequestType(key)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`mb-3 h-5 w-5 ${selected ? "text-indigo-700" : "text-slate-500"}`} />
                    <p className="font-bold text-slate-950">{meta.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{meta.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <div className="flex items-start gap-3">
                <ActiveIcon className="mt-1 h-5 w-5 text-indigo-300" />
                <div>
                  <p className="font-bold">{activeMeta.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{activeMeta.description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Area</Label>
                <Select value={target} onValueChange={(value) => setTarget(value as TargetTable)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(targetLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Short title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: DBMS Unit 2 topic order issue" />
              </div>
            </div>

            <div>
              <Label>Where is the issue?</Label>
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Example: RGPV > MCA > Sem 1 > MCA 101 > Unit 2" />
            </div>

            <div>
              <Label>Current value / problem</Label>
              <Textarea value={currentValue} onChange={(event) => setCurrentValue(event.target.value)} placeholder="What is currently wrong or missing?" />
            </div>

            <div>
              <Label>Proposed correction / details</Label>
              <Textarea value={proposedChange} onChange={(event) => setProposedChange(event.target.value)} placeholder="What should admin add, fix, or verify?" />
            </div>

            <div>
              <Label>Extra notes</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional: source, reason, reference, or screenshot description." />
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit for Admin Review
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <Card className="rounded-3xl border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-bold text-amber-950">Maintenance does not publish directly</p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Your request goes to Admin. Admin approves, rejects, or applies the change after verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle>My Recent Requests</CardTitle>
              <CardDescription>Only requests submitted from this maintenance account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No requests yet.</p>
              ) : (
                requests.slice(0, 8).map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{request.payload?.title || request.payload?.request_type || request.target_table}</p>
                        <p className="text-xs text-slate-500">{request.payload?.location || request.target_table}</p>
                      </div>
                      <Badge variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-600">{request.payload?.proposed_change || request.notes}</p>
                    {request.review_notes && <p className="mt-2 text-xs font-medium text-indigo-700">Admin: {request.review_notes}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default MaintenanceRequests;
