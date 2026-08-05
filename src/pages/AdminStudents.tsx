import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, GraduationCap, Loader2, Search, Users } from "lucide-react";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StudentRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  semester: number | null;
  university_id: string | null;
  course_id: string | null;
  branch_id: string | null;
  enrolledSubjects: number;
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AdminStudents = () => {
  const { user, isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/dashboard");
  }, [user, isAdmin, loading, navigate]);

  const loadStudents = useCallback(async () => {
    if (!isAdmin) return;
    setBusy(true);
    const [roleRes, userRes, profileRes, enrollmentRes] = await Promise.all([
      mysqlClient.from("user_roles").select("user_id").eq("role", "student"),
      mysqlClient.from("app_users").select("id, email"),
      mysqlClient.from("profiles").select("user_id, full_name, phone, semester, university_id, course_id, branch_id"),
      mysqlClient.from("course_enrollments").select("user_id, subject_id"),
    ]);

    const studentIds = new Set((roleRes.data || []).map((role) => role.user_id));
    const profileByUser = new Map((profileRes.data || []).map((profile) => [profile.user_id, profile]));
    const accountByUser = new Map((userRes.data || []).map((account) => [account.id, account]));
    const enrollmentCount = new Map<string, number>();
    (enrollmentRes.data || []).forEach((enrollment) => {
      enrollmentCount.set(enrollment.user_id, (enrollmentCount.get(enrollment.user_id) || 0) + 1);
    });

    const rowIds = new Set<string>();
    (userRes.data || [])
      .filter((account) => studentIds.has(account.id))
      .filter((account) => !String(account.email || "").endsWith("@educonnect.local"))
      .forEach((account) => rowIds.add(account.id));

    if (rowIds.size === 0) {
      (profileRes.data || [])
        .filter((profile) => studentIds.has(profile.user_id))
        .forEach((profile) => rowIds.add(profile.user_id));
    }

    const rows = Array.from(rowIds).map((userId) => {
        const profile = profileByUser.get(userId);
        const account = accountByUser.get(userId);
        return {
          user_id: userId,
          email: account?.email || "Email not available until API restart",
          full_name: profile?.full_name || account?.email || "Student",
          phone: profile?.phone || null,
          semester: profile?.semester || null,
          university_id: profile?.university_id || null,
          course_id: profile?.course_id || null,
          branch_id: profile?.branch_id || null,
          enrolledSubjects: enrollmentCount.get(userId) || 0,
        };
      });

    setStudents(rows);
    setBusy(false);
  }, [isAdmin]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    const onActivity = () => loadStudents();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return students;
    return students.filter((student) =>
      `${student.full_name || ""} ${student.email} ${student.phone || ""}`.toLowerCase().includes(text),
    );
  }, [query, students]);

  if (loading || busy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] dark:bg-slate-950">
      <nav className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071733] text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display font-bold leading-tight">Student Management</p>
                <p className="text-xs text-muted-foreground">Real student accounts linked with login records</p>
              </div>
            </Link>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <Users className="mr-1 h-3 w-3" /> {students.length} Students
          </Badge>
        </div>
      </nav>

      <main className="container space-y-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-3xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-3xl font-bold">{students.reduce((total, student) => total + student.enrolledSubjects, 0)}</p>
              <p className="text-sm text-muted-foreground">Subject enrollments</p>
            </CardContent>
          </Card>
          <Card className="rounded-3xl">
            <CardContent className="p-5">
              <p className="text-3xl font-bold">{students.filter((student) => student.phone).length}</p>
              <p className="text-sm text-muted-foreground">Profiles with phone</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student name, email or phone..." className="pl-10" />
        </div>

        <div className="grid gap-4">
          {filteredStudents.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No students found</CardContent></Card>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.user_id} className="rounded-3xl">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{initialsFor(student.full_name || student.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{student.full_name || "Student"}</p>
                      <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                      {student.phone && <p className="text-xs text-muted-foreground">{student.phone}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Semester {student.semester || "Not set"}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <BookOpen className="h-3 w-3" /> {student.enrolledSubjects} subjects
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminStudents;


