import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
};

type UserRole = {
  id: string;
  user_id: string;
  role: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
  semester: number;
  scheme_id: string | null;
};

type Assignment = {
  id: string;
  teacher_id: string;
  subject_id: string;
  assigned_by: string | null;
  is_active: boolean;
  created_at: string;
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AdminTeachers = ({ mode = "management" }: { mode?: "management" | "assignments" }) => {
  const { user, loading } = useUserRole();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [query, setQuery] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    const [profileRes, roleRes, subjectRes, assignmentRes] = await Promise.all([
      mysqlClient.from("profiles").select("*").order("full_name"),
      mysqlClient.from("user_roles").select("*").order("role"),
      mysqlClient.from("subjects").select("id, name, code, semester, scheme_id").order("semester").order("code"),
      mysqlClient.from("teacher_assignments").select("*").order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) toast.error(profileRes.error);
    if (roleRes.error) toast.error(roleRes.error);
    if (subjectRes.error) toast.error(subjectRes.error);
    if (assignmentRes.error) toast.error(assignmentRes.error);

    setProfiles((profileRes.data || []) as Profile[]);
    setRoles((roleRes.data || []) as UserRole[]);
    setSubjects((subjectRes.data || []) as Subject[]);
    setAssignments((assignmentRes.data || []) as Assignment[]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, navigate, user]);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const onActivity = () => loadAll();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [user]);

  const roleMap = useMemo(() => {
    const map = new Map<string, string[]>();
    roles.forEach((role) => {
      map.set(role.user_id, [...(map.get(role.user_id) || []), role.role]);
    });
    return map;
  }, [roles]);

  const teachers = useMemo(
    () => profiles.filter((profile) => roleMap.get(profile.user_id)?.includes("teacher")),
    [profiles, roleMap],
  );

  const nonTeacherProfiles = useMemo(
    () => profiles.filter((profile) => !roleMap.get(profile.user_id)?.includes("teacher")),
    [profiles, roleMap],
  );

  const filteredTeachers = teachers.filter((teacher) => {
    const text = `${teacher.full_name || ""} ${teacher.user_id}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const profileByUserId = useMemo(() => new Map(profiles.map((profile) => [profile.user_id, profile])), [profiles]);
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  const approveAsTeacher = async (profile: Profile) => {
    setSaving(true);
    const { error: roleError } = await mysqlClient.from("user_roles").insert({
      user_id: profile.user_id,
      role: "teacher",
    });

    if (roleError) {
      toast.error(roleError);
      setSaving(false);
      return;
    }

    await mysqlClient.from("profiles").update({ role: "teacher" }).eq("user_id", profile.user_id);
    toast.success(`${profile.full_name || "User"} is now a teacher`);
    await loadAll();
    setSaving(false);
  };

  const assignSubject = async () => {
    if (!teacherId || !subjectId) {
      toast.error("Select teacher and subject");
      return;
    }

    setSaving(true);
    const { error } = await mysqlClient.from("teacher_assignments").upsert({
      teacher_id: teacherId,
      subject_id: subjectId,
      assigned_by: user?.id || null,
      is_active: true,
    });

    if (error) toast.error(error);
    else {
      toast.success("Subject assigned to teacher");
      setSubjectId("");
      await loadAll();
    }
    setSaving(false);
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this teacher assignment?")) return;
    const { error } = await mysqlClient.from("teacher_assignments").delete().eq("id", assignmentId);
    if (error) toast.error(error);
    else {
      toast.success("Assignment removed");
      await loadAll();
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <nav className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#071733] text-white flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display font-bold leading-tight">Teacher Administration</p>
                <p className="text-xs text-muted-foreground">Management and subject assignment</p>
              </div>
            </Link>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <ShieldCheck className="w-3 h-3 mr-1" /> Admin
          </Badge>
        </div>
      </nav>

      <main className="container py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teachers.length}</p>
                <p className="text-sm text-muted-foreground">Approved Teachers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length}</p>
                <p className="text-sm text-muted-foreground">Subject Assignments</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{nonTeacherProfiles.length}</p>
                <p className="text-sm text-muted-foreground">Non-teacher Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {mode === "management" ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Approved Teachers</CardTitle>
                <CardDescription>Teachers who can access teacher dashboard and content tools.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search teachers..." value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <div className="space-y-3">
                  {filteredTeachers.map((teacher) => {
                    const teacherAssignments = assignments.filter((assignment) => assignment.teacher_id === teacher.user_id);
                    return (
                      <div key={teacher.user_id} className="rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{initialsFor(teacher.full_name || "Teacher")}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{teacher.full_name || "Unnamed Teacher"}</p>
                              <p className="text-xs text-muted-foreground">{teacher.user_id}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{teacherAssignments.length} subjects</Badge>
                        </div>
                        {teacherAssignments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {teacherAssignments.map((assignment) => {
                              const subject = subjectById.get(assignment.subject_id);
                              return (
                                <Badge key={assignment.id} variant="outline">
                                  {subject ? `${subject.code} - ${subject.name}` : "Unknown subject"}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredTeachers.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">No approved teachers found.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Approve Teacher Access</CardTitle>
                <CardDescription>Promote a registered user to teacher role.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {nonTeacherProfiles.map((profile) => (
                  <div key={profile.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{profile.full_name || "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground">{roleMap.get(profile.user_id)?.join(", ") || "No role"}</p>
                    </div>
                    <Button size="sm" disabled={saving} onClick={() => approveAsTeacher(profile)}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                ))}
                {nonTeacherProfiles.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No users waiting for teacher access.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1fr]">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Assign Subject</CardTitle>
                <CardDescription>Teacher will manage only assigned subjects in the EduConnect workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Teacher</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.user_id} value={teacher.user_id}>
                          {teacher.full_name || teacher.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          Sem {subject.semester} | {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" disabled={saving} onClick={assignSubject}>
                  <Plus className="w-4 h-4 mr-2" /> Assign Subject
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
                <CardDescription>Subject-wise teacher access mapping.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.map((assignment) => {
                  const teacher = profileByUserId.get(assignment.teacher_id);
                  const subject = subjectById.get(assignment.subject_id);
                  return (
                    <div key={assignment.id} className="rounded-2xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{teacher?.full_name || "Unknown Teacher"}</p>
                          <p className="text-sm text-muted-foreground">
                            {subject ? `Sem ${subject.semester} | ${subject.code} - ${subject.name}` : "Unknown subject"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                            <UserCheck className="w-3 h-3 mr-1" /> Active
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => removeAssignment(assignment.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {assignments.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No teacher assignments yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTeachers;


