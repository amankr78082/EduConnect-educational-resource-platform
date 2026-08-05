import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Download,
  FileQuestion,
  FileText,
  FolderTree,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  MessageSquare,
  Moon,
  NotebookTabs,
  PlaySquare,
  Radio,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Video,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL, mysqlClient } from "@/integrations/mysql/client";
import { useTheme } from "@/components/ThemeProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { REALTIME_ACTIVITY_EVENT, type RealtimeActivity } from "@/hooks/useRealtimeActivity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MyCourses from "@/components/dashboard/MyCourses";
import TopicJumpWidget from "@/components/dashboard/TopicJumpWidget";

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  meet_link: string;
  is_live: boolean;
  started_at: string | null;
  created_by: string;
  subject_id: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface StudentSubjectSummary {
  enrollmentId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  semester: number;
  progress: number;
  teacherName: string;
}

interface SidebarGroup {
  title?: string;
  items: {
    label: string;
    icon: typeof LayoutDashboard;
    to: string;
    active?: boolean;
  }[];
}

interface StatCard {
  label: string;
  value: string;
  detail: string;
  icon: typeof LayoutDashboard;
  gradient: string;
  to?: string;
}

interface AdminMetrics {
  students: number;
  teachers: number;
  universities: number;
  courses: number;
  subjects: number;
  teacherAssignments: number;
  uploadedNotes: number;
  videoLectures: number;
  previousPapers: number;
  quizzes: number;
  pendingSubscriptions: number;
  deleteRequests: number;
}

interface TeacherMetrics {
  assignedSubjects: number;
  uploadedNotes: number;
  videoLectures: number;
  previousPapers: number;
  quizzes: number;
  enrolledStudents: number;
}

interface RecentContent {
  id: string;
  title: string;
  content_type: "notes" | "pdf" | "video";
  created_at: string;
}

const emptyAdminMetrics: AdminMetrics = {
  students: 0,
  teachers: 0,
  universities: 0,
  courses: 0,
  subjects: 0,
  teacherAssignments: 0,
  uploadedNotes: 0,
  videoLectures: 0,
  previousPapers: 0,
  quizzes: 0,
  pendingSubscriptions: 0,
  deleteRequests: 0,
};

const emptyTeacherMetrics: TeacherMetrics = {
  assignedSubjects: 0,
  uploadedNotes: 0,
  videoLectures: 0,
  previousPapers: 0,
  quizzes: 0,
  enrolledStudents: 0,
};

const adminSidebar: SidebarGroup[] = [
  { items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", active: true }] },
  {
    title: "Academic Management",
    items: [
      { label: "Academic Hierarchy", icon: FolderTree, to: "/admin/hierarchy" },
      { label: "Courses & Semesters", icon: Layers, to: "/admin/hierarchy" },
      { label: "Subject Management", icon: LibraryBig, to: "/admin/hierarchy" },
      { label: "Teacher Assignment", icon: UserCheck, to: "/admin/teacher-assignments" },
    ],
  },
  {
    title: "User Management",
    items: [
      { label: "Teacher Management", icon: GraduationCap, to: "/admin/teachers" },
      { label: "Student Management", icon: Users, to: "/admin/students" },
    ],
  },
  {
    title: "Approval Center",
    items: [
      { label: "Notes Approval", icon: FileText, to: "/admin/content-approvals" },
      { label: "Video Approval", icon: PlaySquare, to: "/admin/content-approvals" },
      { label: "Quiz Approval", icon: Trophy, to: "/admin/content-approvals" },
      { label: "Delete Requests", icon: ClipboardCheck, to: "/admin/delete-requests" },
    ],
  },
  {
    items: [
      { label: "Subscriptions", icon: Crown, to: "/manage-subscriptions" },
      { label: "Analytics", icon: BarChart3, to: "/admin/audit-log" },
      { label: "Notifications", icon: Bell, to: "/dashboard" },
      { label: "Settings", icon: Settings, to: "/settings" },
    ],
  },
];

const teacherSidebar: SidebarGroup[] = [
  { items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", active: true }] },
  { items: [{ label: "My Assigned Subjects", icon: BookOpen, to: "/cms" }] },
  {
    title: "Content Management",
    items: [
      { label: "Upload Notes", icon: Upload, to: "/cms" },
      { label: "Upload PYQs", icon: FileQuestion, to: "/manage-papers" },
      { label: "Video Lectures", icon: Video, to: "/cms" },
      { label: "Study Materials", icon: NotebookTabs, to: "/cms" },
    ],
  },
  {
    title: "Teaching Tools",
    items: [
      { label: "Quiz Management", icon: Trophy, to: "/teacher/quizzes" },
      { label: "Live Classes", icon: Radio, to: "/dashboard" },
      { label: "Assignments", icon: ClipboardCheck, to: "/dashboard" },
    ],
  },
  {
    title: "Student Interaction",
    items: [
      { label: "Student Performance", icon: BarChart3, to: "/teacher/quiz-analytics" },
      { label: "Attendance", icon: CheckCircle2, to: "/dashboard" },
      { label: "Discussion Section", icon: MessageSquare, to: "/chat" },
    ],
  },
  { items: [{ label: "Notifications", icon: Bell, to: "/dashboard" }, { label: "Profile Settings", icon: Settings, to: "/settings" }] },
];

const studentSidebar: SidebarGroup[] = [
  { items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", active: true }] },
  { items: [{ label: "My Subjects", icon: BookOpen, to: "/syllabus" }] },
  {
    title: "Learning Resources",
    items: [
      { label: "Notes", icon: FileText, to: "/syllabus" },
      { label: "PYQs", icon: FileQuestion, to: "/previous-papers" },
      { label: "Video Lectures", icon: PlaySquare, to: "/syllabus" },
      { label: "Downloads", icon: Download, to: "/bookmarks" },
    ],
  },
  {
    title: "Interactive Learning",
    items: [
      { label: "Live Classes", icon: Radio, to: "/dashboard" },
      { label: "Quizzes", icon: Trophy, to: "/quizzes" },
      { label: "Leaderboard", icon: BarChart3, to: "/quizzes" },
    ],
  },
  {
    title: "Progress Tracking",
    items: [
      { label: "Quiz Performance", icon: Activity, to: "/quizzes" },
      { label: "Attendance", icon: CheckCircle2, to: "/dashboard" },
      { label: "Learning Activity", icon: Sparkles, to: "/dashboard" },
    ],
  },
  { items: [{ label: "Notifications", icon: Bell, to: "/dashboard" }, { label: "Profile Settings", icon: Settings, to: "/settings" }] },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const DashboardShell = ({
  children,
  displayName,
  initials,
  profile,
  roleLabel,
  searchPlaceholder,
  sidebar,
  theme,
  setTheme,
  onLogout,
}: {
  children: ReactNode;
  displayName: string;
  initials: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
  roleLabel: string;
  searchPlaceholder: string;
  sidebar: SidebarGroup[];
  theme: string | undefined;
  setTheme: (theme: string) => void;
  onLogout: () => void;
}) => (
  <div className="min-h-screen bg-[#f5f7fb] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#071733] text-white lg:flex">
      <div className="flex h-24 items-center gap-4 border-b border-white/10 px-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div>
          <p className="font-display text-2xl font-bold leading-none">EduConnect</p>
          <p className="mt-1 text-sm text-blue-200">ERP + LMS {roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {sidebar.map((group, groupIndex) => (
          <div key={group.title || groupIndex}>
            {group.title && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-white/12 text-white shadow-inner"
                      : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>

    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
        <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#071733] text-white lg:hidden">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="relative max-w-2xl flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative rounded-xl">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link
            to="/settings"
            className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5 sm:flex"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="max-w-[140px]">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-xl">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>
);

const StatGrid = ({ stats }: { stats: StatCard[] }) => (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
    {stats.map((stat, index) => {
      const content = (
        <>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg transition-transform group-hover:scale-110`}>
          <stat.icon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-3xl font-bold">{stat.value}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">{stat.label}</p>
          {stat.to && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
        </>
      );

      const className = `group rounded-3xl border border-white/70 bg-white/90 p-5 text-left shadow-sm backdrop-blur-xl transition-all hover:border-primary/25 hover:shadow-xl hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 ${stat.to ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40" : ""}`;

      return (
        <motion.div
          key={stat.label}
          {...fadeUp}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -4 }}
        >
          {stat.to ? (
            <Link to={stat.to} className={`block h-full ${className}`}>
              {content}
            </Link>
          ) : (
            <div className={className}>{content}</div>
          )}
        </motion.div>
      );
    })}
  </section>
);

const WorkflowCard = ({
  title,
  description,
  icon: Icon,
  to,
}: {
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  to: string;
}) => (
  <Link
    to={to}
    className="group rounded-3xl border border-slate-100 bg-slate-50/80 p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
  >
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/15">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold group-hover:text-primary">{title}</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  </Link>
);

const LiveSessionsPanel = ({
  liveSessions,
  userId,
  onEndSession,
}: {
  liveSessions: LiveSession[];
  userId: string;
  onEndSession: (sessionId: string) => void;
}) => {
  if (!liveSessions.length) return null;

  return (
    <Card className="rounded-3xl border-red-200 bg-red-50/80 shadow-sm dark:border-red-500/20 dark:bg-red-500/10">
      <CardContent className="p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-red-700 dark:text-red-200">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          Live Classes Running
        </h2>
        <div className="mt-4 grid gap-3">
          {liveSessions.map((session) => (
            <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-white/5">
              <div>
                <p className="font-semibold">{session.title}</p>
                {session.description && <p className="text-sm text-muted-foreground">{session.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <a href={session.meet_link} target="_blank" rel="noopener noreferrer">
                    Join
                  </a>
                </Button>
                {session.created_by === userId && (
                  <Button variant="outline" size="sm" onClick={() => onEndSession(session.id)}>
                    End
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user, isAdmin, isTeacher, roles, loading } = useUserRole();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<StudentSubjectSummary[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>(emptyAdminMetrics);
  const [teacherMetrics, setTeacherMetrics] = useState<TeacherMetrics>(emptyTeacherMetrics);
  const [recentUploads, setRecentUploads] = useState<RecentContent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [liveForm, setLiveForm] = useState({ title: "", description: "", meet_link: "", subject_id: "" });

  const isAdminOnly = isAdmin;
  const isTeacherOnly = !isAdmin && !roles.includes("maintenance") && roles.includes("teacher");
  const isStudentView = !isAdmin && !roles.includes("maintenance") && !roles.includes("teacher");
  const roleLabel = isAdminOnly ? "Admin" : isTeacherOnly ? "Teacher" : roles.includes("maintenance") ? "Maintenance" : "Student";

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!user) return;

    refreshDashboardData(user.id);

    mysqlClient
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user, isAdminOnly, isTeacherOnly]);

  useEffect(() => {
    if (!user) return;
    const refreshMs = isAdminOnly ? 10000 : 15000;
    const intervalId = window.setInterval(() => {
      refreshDashboardData(user.id, true);
    }, refreshMs);

    const onFocus = () => refreshDashboardData(user.id, true);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, isAdminOnly, isTeacherOnly]);

  useEffect(() => {
    if (!user) return;

    const onActivity = (event: Event) => {
      const activity = (event as CustomEvent<RealtimeActivity>).detail;
      if (!activity) return;
      refreshDashboardData(user.id, true);
    };

    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [user, isAdminOnly, isTeacherOnly]);

  const refreshDashboardData = async (userId: string, silent = false) => {
    if (!silent) setRefreshing(true);
    await Promise.all([
      fetchLiveSessions(),
      fetchSubjects(),
      fetchStudentSubjectSummary(userId),
      fetchDashboardMetrics(userId),
    ]);
    setLastUpdated(new Date());
    if (!silent) setRefreshing(false);
  };

  const fetchLiveSessions = async () => {
    const { data } = await mysqlClient
      .from("live_sessions")
      .select("*")
      .eq("is_live", true)
      .order("started_at", { ascending: false });
    setLiveSessions(data || []);
  };

  const fetchSubjects = async () => {
    if (isTeacherOnly && user?.id) {
      const { data: assignments } = await mysqlClient
        .from("teacher_assignments")
        .select("subject_id")
        .eq("teacher_id", user.id)
        .eq("is_active", true);

      const subjectIds = (assignments || []).map((assignment) => assignment.subject_id).filter(Boolean);
      if (subjectIds.length === 0) {
        setSubjects([]);
        return;
      }

      const { data } = await mysqlClient
        .from("subjects")
        .select("id, name, code")
        .in("id", subjectIds)
        .order("name");
      setSubjects(data || []);
      return;
    }

    const { data } = await mysqlClient.from("subjects").select("id, name, code").order("name");
    setSubjects(data || []);
  };

  const fetchStudentSubjectSummary = async (userId: string) => {
    const { data: enrollments } = await mysqlClient
      .from("course_enrollments")
      .select("id, subject_id, progress")
      .eq("user_id", userId);

    const subjectIds = [...new Set((enrollments || []).map((enrollment) => enrollment.subject_id).filter(Boolean))];
    if (subjectIds.length === 0) {
      setStudentSubjects([]);
      return;
    }

    const [subjectRes, assignmentRes] = await Promise.all([
      mysqlClient.from("subjects").select("id, name, code, semester").in("id", subjectIds),
      mysqlClient.from("teacher_assignments").select("teacher_id, subject_id, is_active").in("subject_id", subjectIds).eq("is_active", true),
    ]);

    const teacherIds = [...new Set((assignmentRes.data || []).map((assignment) => assignment.teacher_id).filter(Boolean))];
    const profileRes = teacherIds.length
      ? await mysqlClient.from("profiles").select("user_id, full_name").in("user_id", teacherIds)
      : { data: [] as { user_id: string; full_name: string | null }[] };

    const subjectById = new Map((subjectRes.data || []).map((subject) => [subject.id, subject]));
    const assignmentBySubject = new Map((assignmentRes.data || []).map((assignment) => [assignment.subject_id, assignment]));
    const profileByUserId = new Map((profileRes.data || []).map((profile) => [profile.user_id, profile]));

    setStudentSubjects(
      (enrollments || [])
        .map((enrollment) => {
          const subject = subjectById.get(enrollment.subject_id);
          if (!subject) return null;
          const assignment = assignmentBySubject.get(enrollment.subject_id);
          const teacher = assignment ? profileByUserId.get(assignment.teacher_id) : null;

          return {
            enrollmentId: enrollment.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            semester: subject.semester,
            progress: Number(enrollment.progress || 0),
            teacherName: teacher?.full_name || "Teacher not assigned",
          };
        })
        .filter(Boolean) as StudentSubjectSummary[],
    );
  };

  const countRows = async (table: string, filters: { column: string; value: unknown }[] = []) => {
    let query = mysqlClient.from(table).select("id", { count: "exact", head: true });
    filters.forEach((filter) => {
      query = query.eq(filter.column, filter.value);
    });
    const { count } = await query;
    return Number(count || 0);
  };

  const fetchDashboardMetrics = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-metrics`);
      if (!response.ok) throw new Error("Metrics endpoint unavailable");
      const metrics = await response.json();
      setAdminMetrics({
        students: Number(metrics.students || 0),
        teachers: Number(metrics.teachers || 0),
        universities: Number(metrics.universities || 0),
        courses: Number(metrics.courses || 0),
        subjects: Number(metrics.subjects || 0),
        teacherAssignments: Number(metrics.teacherAssignments || 0),
        uploadedNotes: Number(metrics.uploadedNotes || 0),
        videoLectures: Number(metrics.videoLectures || 0),
        previousPapers: Number(metrics.previousPapers || 0),
        quizzes: Number(metrics.quizzes || 0),
        pendingSubscriptions: Number(metrics.pendingSubscriptions || 0),
        deleteRequests: Number(metrics.deleteRequests || 0),
      });
    } catch {
      const [studentRoles, teacherRoles, users, profiles, universities, courses, subjectsCount, teacherAssignments, uploadedNotes, videoLectures, previousPapers, quizzes, pendingSubscriptions, deleteRequests] = await Promise.all([
        mysqlClient.from("user_roles").select("user_id").eq("role", "student"),
        mysqlClient.from("user_roles").select("user_id").eq("role", "teacher"),
        mysqlClient.from("app_users").select("id, email"),
        mysqlClient.from("profiles").select("user_id"),
        countRows("universities"),
        countRows("courses"),
        countRows("subjects"),
        countRows("teacher_assignments", [{ column: "is_active", value: true }]),
        countRows("content", [{ column: "content_type", value: "notes" }]),
        countRows("content", [{ column: "content_type", value: "video" }]),
        countRows("previous_papers"),
        countRows("quizzes"),
        countRows("subscriptions", [{ column: "status", value: "pending" }]),
        countRows("delete_requests"),
      ]);
      const validAccounts = (users.data || [])
        .filter((account) => !String(account.email || "").endsWith("@educonnect.local"))
        .map((account) => account.id)
        .filter(Boolean);
      const fallbackProfiles = (profiles.data || []).map((profile) => profile.user_id).filter(Boolean);
      const realUserIds = new Set(validAccounts.length > 0 ? validAccounts : fallbackProfiles);
      const studentCount = new Set((studentRoles.data || []).map((role) => role.user_id).filter((id) => realUserIds.has(id))).size;
      const teacherCount = new Set((teacherRoles.data || []).map((role) => role.user_id).filter((id) => realUserIds.has(id))).size;

      setAdminMetrics({
        students: studentCount,
        teachers: teacherCount,
        universities,
        courses,
        subjects: subjectsCount,
        teacherAssignments,
        uploadedNotes,
        videoLectures,
        previousPapers,
        quizzes,
        pendingSubscriptions,
        deleteRequests,
      });
    }

    const { data: platformRecent } = await mysqlClient
      .from("content")
      .select("id, title, content_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (isAdminOnly) {
      setRecentUploads((platformRecent || []) as RecentContent[]);
    }

    const { data: assignments } = await mysqlClient
      .from("teacher_assignments")
      .select("subject_id")
      .eq("teacher_id", userId)
      .eq("is_active", true);
    const assignedSubjectIds = (assignments || []).map((assignment) => assignment.subject_id).filter(Boolean);

    const [teacherNotes, teacherVideos, teacherPapers, teacherQuizzes, teacherRecent] = await Promise.all([
      countRows("content", [{ column: "created_by", value: userId }, { column: "content_type", value: "notes" }]),
      countRows("content", [{ column: "created_by", value: userId }, { column: "content_type", value: "video" }]),
      countRows("previous_papers", [{ column: "uploaded_by", value: userId }]),
      countRows("quizzes", [{ column: "created_by", value: userId }]),
      mysqlClient
        .from("content")
        .select("id, title, content_type, created_at")
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    let enrolledStudents = 0;
    if (assignedSubjectIds.length > 0) {
      const { count } = await mysqlClient
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .in("subject_id", assignedSubjectIds);
      enrolledStudents = Number(count || 0);
    }

    setTeacherMetrics({
      assignedSubjects: assignedSubjectIds.length,
      uploadedNotes: teacherNotes,
      videoLectures: teacherVideos,
      previousPapers: teacherPapers,
      quizzes: teacherQuizzes,
      enrolledStudents,
    });
    if (!isAdminOnly) {
      setRecentUploads((teacherRecent.data || []) as RecentContent[]);
    }
  };

  const handleGoLive = async () => {
    if (!isTeacherOnly) {
      toast.error("Only teachers can start live classes");
      return;
    }

    if (!liveForm.title || !liveForm.meet_link) {
      toast.error("Title and Google Meet link are required");
      return;
    }

    if (!liveForm.subject_id) {
      toast.error("Select one of your assigned subjects");
      return;
    }

    setSubmitting(true);
    const { error } = await mysqlClient.from("live_sessions").insert({
      title: liveForm.title,
      description: liveForm.description || null,
      meet_link: liveForm.meet_link,
      subject_id: liveForm.subject_id || null,
      created_by: user!.id,
      is_live: true,
      started_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("Failed to start live session");
    } else {
      toast.success("Live class started");
      setShowGoLive(false);
      setLiveForm({ title: "", description: "", meet_link: "", subject_id: "" });
      fetchLiveSessions();
      window.open(liveForm.meet_link, "_blank");
    }
    setSubmitting(false);
  };

  const handleEndSession = async (sessionId: string) => {
    await mysqlClient.from("live_sessions").update({ is_live: false, ended_at: new Date().toISOString() }).eq("id", sessionId);
    toast.success("Live session ended");
    fetchLiveSessions();
  };

  const handleLogout = async () => {
    await mysqlClient.auth.signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || roleLabel;
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const adminStats = useMemo<StatCard[]>(
    () => [
      { label: "Registered Students", value: String(adminMetrics.students), detail: "Open student records", icon: Users, gradient: "from-blue-500 to-cyan-500", to: "/admin/students" },
      { label: "Approved Teachers", value: String(adminMetrics.teachers), detail: "Distinct teacher accounts", icon: GraduationCap, gradient: "from-violet-500 to-purple-500", to: "/admin/teachers" },
      { label: "Indexed Subjects", value: String(adminMetrics.subjects), detail: "Subjects in academic hierarchy", icon: LibraryBig, gradient: "from-emerald-500 to-teal-500", to: "/admin/hierarchy" },
      { label: "Active Assignments", value: String(adminMetrics.teacherAssignments), detail: "Subject-wise teacher mapping", icon: UserCheck, gradient: "from-amber-500 to-orange-500", to: "/admin/teacher-assignments" },
      { label: "Live Classes", value: String(liveSessions.length), detail: "Currently running sessions", icon: Radio, gradient: "from-rose-500 to-red-500", to: "#live-sessions" },
      { label: "Payment Reviews", value: String(adminMetrics.pendingSubscriptions), detail: "Pending subscription requests", icon: WalletCards, gradient: "from-indigo-500 to-blue-600", to: "/manage-subscriptions" },
    ],
    [adminMetrics, liveSessions.length],
  );

  const teacherStats = useMemo<StatCard[]>(
    () => [
      { label: "Assigned Subjects", value: String(teacherMetrics.assignedSubjects), detail: "Admin mapped teaching access", icon: BookOpen, gradient: "from-blue-500 to-cyan-500" },
      { label: "Uploaded Notes", value: String(teacherMetrics.uploadedNotes), detail: "Notes created by this teacher", icon: FileText, gradient: "from-violet-500 to-purple-500" },
      { label: "Video Lectures", value: String(teacherMetrics.videoLectures), detail: "Videos created by this teacher", icon: Video, gradient: "from-emerald-500 to-teal-500" },
      { label: "Enrolled Students", value: String(teacherMetrics.enrolledStudents), detail: "Students in assigned subjects", icon: Users, gradient: "from-rose-500 to-red-500" },
      { label: "Quizzes", value: String(teacherMetrics.quizzes), detail: "Quizzes created by this teacher", icon: Trophy, gradient: "from-amber-500 to-orange-500" },
      { label: "PYQs", value: String(teacherMetrics.previousPapers), detail: "Previous papers uploaded", icon: FileQuestion, gradient: "from-indigo-500 to-blue-600" },
    ],
    [teacherMetrics],
  );

  const studentStats = useMemo<StatCard[]>(
    () => [
      {
        label: "Continue Learning",
        value: studentSubjects[0]?.subjectCode || "None",
        detail: studentSubjects[0] ? `${studentSubjects[0].subjectName} with ${studentSubjects[0].teacherName}` : "Enroll in a subject to begin",
        icon: BookOpen,
        gradient: "from-blue-500 to-cyan-500",
      },
      {
        label: "Enrolled Subjects",
        value: String(studentSubjects.length),
        detail: "Only subjects enrolled by this student",
        icon: LibraryBig,
        gradient: "from-violet-500 to-purple-500",
      },
      { label: "Live Classes", value: String(liveSessions.length), detail: "Currently running sessions", icon: Radio, gradient: "from-rose-500 to-red-500" },
      {
        label: "Assigned Teachers",
        value: String(new Set(studentSubjects.map((subject) => subject.teacherName).filter((name) => name !== "Teacher not assigned")).size),
        detail: "Teachers mapped to your subjects",
        icon: GraduationCap,
        gradient: "from-amber-500 to-orange-500",
      },
      {
        label: "Progress",
        value: studentSubjects.length
          ? `${Math.round(studentSubjects.reduce((total, subject) => total + subject.progress, 0) / studentSubjects.length)}%`
          : "0%",
        detail: "Average enrolled subject progress",
        icon: Activity,
        gradient: "from-emerald-500 to-teal-500",
      },
      { label: "Quizzes", value: "20", detail: "Free questions before premium", icon: Trophy, gradient: "from-amber-500 to-orange-500", to: "/quizzes" },
    ],
    [liveSessions.length, studentSubjects],
  );

  if (loading || !user) return null;

  if (isAdminOnly) {
    return (
      <DashboardShell
        displayName={displayName}
        initials={initials}
        profile={profile}
        roleLabel="Admin"
        searchPlaceholder="Search students, teachers, hierarchy, approvals..."
        sidebar={adminSidebar}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      >
        <motion.section {...fadeUp} className="overflow-hidden rounded-[1.75rem] border border-white/40 bg-gradient-to-br from-[#2448e8] via-[#4f46e5] to-[#6d28d9] p-7 text-white shadow-xl shadow-blue-500/15">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">Admin Workspace</Badge>
              <h1 className="mt-4 font-display text-3xl font-bold tracking-normal sm:text-4xl">EduConnect Admin Dashboard</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-blue-50/85">
                Monitor real academic data, teacher access, subscriptions, approvals and live learning activity from one clean ERP console.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="w-fit rounded-2xl bg-white/15 px-4 text-white hover:bg-white/25"
              onClick={() => user && refreshDashboardData(user.id)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-blue-50/90 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Academic Structure", `${adminMetrics.universities} universities, ${adminMetrics.courses} courses`],
              ["Teaching Access", `${adminMetrics.teacherAssignments} active mappings`],
              ["Learning Library", `${adminMetrics.uploadedNotes + adminMetrics.videoLectures + adminMetrics.previousPapers} resources`],
              ["Approval Queue", `${adminMetrics.pendingSubscriptions + adminMetrics.deleteRequests} pending actions`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                <p className="text-xs uppercase tracking-[0.12em] text-blue-100/70">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <StatGrid stats={adminStats} />

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Admin Workflow</h2>
              <p className="text-sm text-muted-foreground">Admin monitors and approves. Uploading content belongs to teachers.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <WorkflowCard title="Manage Academic Hierarchy" description="Universities, courses, semesters, subjects, units and topics." icon={FolderTree} to="/admin/hierarchy" />
                <WorkflowCard title="Assign Teachers" description="Map faculty subject-wise with limited access." icon={UserCheck} to="/admin/teacher-assignments" />
                <WorkflowCard title="Approve Content" description="Review notes and videos before students can access them." icon={ClipboardCheck} to="/admin/content-approvals" />
                <WorkflowCard title="Subscriptions & Payments" description="Verify payment screenshots and activate access." icon={Crown} to="/manage-subscriptions" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Recent Uploaded Content</h2>
              <p className="text-sm text-muted-foreground">Latest teacher uploads from the database.</p>
              <div className="mt-5 space-y-4">
                {recentUploads.length > 0 ? (
                  recentUploads.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-white hover:shadow-sm dark:bg-white/5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {item.content_type === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          <span className="shrink-0 text-xs capitalize text-muted-foreground">{item.content_type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
                    No teacher uploads found yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <div id="live-sessions">
          <LiveSessionsPanel liveSessions={liveSessions} userId={user.id} onEndSession={handleEndSession} />
        </div>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5 xl:col-span-2">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Real LMS Content Snapshot</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {[
                  ["Notes", adminMetrics.uploadedNotes],
                  ["Videos", adminMetrics.videoLectures],
                  ["PYQs", adminMetrics.previousPapers],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{label}</p>
                      <span className="text-sm font-bold text-primary">{value}</span>
                    </div>
                    <Progress value={adminMetrics.uploadedNotes + adminMetrics.videoLectures + adminMetrics.previousPapers > 0 ? (Number(value) / (adminMetrics.uploadedNotes + adminMetrics.videoLectures + adminMetrics.previousPapers)) * 100 : 0} className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Action Queue</h2>
              <div className="mt-5 space-y-3">
                {[
                  ["Pending subscriptions", adminMetrics.pendingSubscriptions],
                  ["Delete requests", adminMetrics.deleteRequests],
                  ["Quizzes", adminMetrics.quizzes],
                  ["Universities", adminMetrics.universities],
                  ["Courses", adminMetrics.courses],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-white/5">
                    <span className="text-sm">{label}</span>
                    <span className="text-sm font-semibold text-primary">{value}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </DashboardShell>
    );
  }

  if (isTeacherOnly) {
    return (
      <DashboardShell
        displayName={displayName}
        initials={initials}
        profile={profile}
        roleLabel="Teacher"
        searchPlaceholder="Search assigned subjects, uploads, students..."
        sidebar={teacherSidebar}
        theme={theme}
        setTheme={setTheme}
        onLogout={handleLogout}
      >
        <motion.section {...fadeUp} className="rounded-[2rem] bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-7 text-white shadow-2xl shadow-blue-500/20">
          <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">Teacher LMS Workspace</Badge>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Teach assigned subjects with clarity</h1>
          <p className="mt-3 max-w-3xl text-blue-50/85">
            Access is controlled by admin subject assignment. Upload academic content, create quizzes, schedule live classes and track performance only for assigned subjects.
          </p>
          <Dialog open={showGoLive} onOpenChange={setShowGoLive}>
            <DialogTrigger asChild>
              <Button className="mt-6 rounded-2xl bg-white text-blue-700 hover:bg-blue-50">
                <Radio className="mr-2 h-4 w-4" /> Schedule or Start Live Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Start Live Class</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Title</Label>
                  <Input value={liveForm.title} onChange={(event) => setLiveForm({ ...liveForm, title: event.target.value })} placeholder="DBMS Unit 1 Live Class" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={liveForm.description} onChange={(event) => setLiveForm({ ...liveForm, description: event.target.value })} placeholder="Short class description" />
                </div>
                <div className="space-y-2">
                  <Label>Google Meet Link</Label>
                  <Input value={liveForm.meet_link} onChange={(event) => setLiveForm({ ...liveForm, meet_link: event.target.value })} placeholder="https://meet.google.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Subject</Label>
                  <Select value={liveForm.subject_id} onValueChange={(value) => setLiveForm({ ...liveForm, subject_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.code} - {subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subjects.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No assigned subjects found. Admin must assign a subject before you can go live.
                    </p>
                  )}
                </div>
                <Button onClick={handleGoLive} disabled={submitting || subjects.length === 0} className="w-full">
                  {submitting ? "Starting..." : "Start Live Class"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.section>

        <StatGrid stats={teacherStats} />
        <LiveSessionsPanel liveSessions={liveSessions} userId={user.id} onEndSession={handleEndSession} />

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Subject-wise Management</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <WorkflowCard title="Upload Notes" description="Submit PDFs and smart notes for admin approval." icon={Upload} to="/cms" />
                <WorkflowCard title="Upload PYQs" description="Add previous year papers for assigned subjects." icon={FileQuestion} to="/manage-papers" />
                <WorkflowCard title="Create Quizzes" description="Build quizzes for syllabus topics." icon={Trophy} to="/teacher/quizzes" />
                <WorkflowCard title="Student Doubts" description="Respond to subject-related discussion threads." icon={MessageSquare} to="/chat" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-semibold">Recent Uploads</h2>
              <div className="mt-5 space-y-3">
                {recentUploads.length > 0 ? (
                  recentUploads.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold">{item.title}</p>
                        <Badge variant="secondary" className="capitalize">{item.content_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
                    No uploads yet. Upload notes or a video from Content Management.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      displayName={displayName}
      initials={initials}
      profile={profile}
      roleLabel={roleLabel}
      searchPlaceholder="Search subjects, notes, videos, PYQs..."
      sidebar={studentSidebar}
      theme={theme}
      setTheme={setTheme}
      onLogout={handleLogout}
    >
      <motion.section {...fadeUp} className="rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 p-7 text-white shadow-2xl shadow-violet-500/20">
        <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">Student LMS Dashboard</Badge>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Continue your syllabus-based learning</h1>
        <p className="mt-3 max-w-3xl text-violet-50/85">
          Follow the structured path from university to course, semester, subject, unit and topic with notes, PYQs, videos, quizzes and live classes.
        </p>
      </motion.section>

      <StatGrid stats={studentStats} />
      <LiveSessionsPanel liveSessions={liveSessions} userId={user.id} onEndSession={handleEndSession} />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
              <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">Interactive Learning</Badge>
              <h2 className="mt-4 font-display text-2xl font-bold">Practice with syllabus quizzes</h2>
              <p className="mt-2 text-sm leading-6 text-amber-50">
                Attempt topic-wise quizzes, check score instantly, and use semester premium for the full question bank.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl bg-white text-orange-700 hover:bg-orange-50">
                  <Link to="/quizzes"><Trophy className="mr-2 h-4 w-4" /> Open Quiz Arena</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/subscription"><Crown className="mr-2 h-4 w-4" /> Upgrade Attempts</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <h2 className="font-display text-2xl font-semibold">Quiz Access</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="text-sm font-semibold">Free Plan</p>
                <p className="mt-1 text-sm text-muted-foreground">20 quiz questions per subject with instant score.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="text-sm font-semibold">Premium Plan</p>
                <p className="mt-1 text-sm">50+ quiz questions plus full notes, videos and PYQs.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <h2 className="font-display text-2xl font-semibold">Learning Resources</h2>
            {studentSubjects.length > 0 ? (
              <div className="mt-5 space-y-3">
                {studentSubjects.slice(0, 4).map((subject) => (
                  <Link
                    key={subject.enrollmentId}
                    to={`/syllabus?sem=${subject.semester}&subject=${subject.subjectId}`}
                    className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-primary/30 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{subject.subjectCode} - {subject.subjectName}</p>
                        <p className="text-sm text-muted-foreground">Semester {subject.semester} | Teacher: {subject.teacherName}</p>
                      </div>
                      <Badge variant="secondary">{subject.progress}% progress</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50 p-5 text-sm text-muted-foreground dark:bg-white/5">
                No enrolled subjects yet. Use My Courses below to enroll, then this intro will show only your real subjects and assigned teachers.
              </div>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <WorkflowCard title="Open Syllabus" description="Browse university, course, semester, subject, unit and topic." icon={BookOpen} to="/syllabus" />
              <WorkflowCard title="Download Notes" description="Access smart notes and saved resources." icon={FileText} to="/bookmarks" />
              <WorkflowCard title="Watch Lectures" description="Continue topic-wise video learning." icon={PlaySquare} to="/syllabus" />
              <WorkflowCard title="Attempt Quizzes" description="Practice and compare leaderboard rank." icon={Trophy} to="/quizzes" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="p-6">
            <h2 className="font-display text-2xl font-semibold">Progress Analytics</h2>
            <div className="mt-5 space-y-4">
              {studentSubjects.length > 0 ? (
                studentSubjects.slice(0, 5).map((subject) => (
                  <div key={subject.enrollmentId} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="mb-3 flex justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{subject.subjectCode}</p>
                        <p className="text-xs text-muted-foreground">{subject.teacherName}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} />
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground dark:bg-white/5">
                  Progress appears after the student enrolls in subjects.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <TopicJumpWidget />
      <MyCourses />
    </DashboardShell>
  );
};

export default Dashboard;


