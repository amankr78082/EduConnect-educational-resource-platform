import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TeacherCMS from "./pages/TeacherCMS";
import TeacherQuizzes from "./pages/TeacherQuizzes";
import TeacherQuizAnalytics from "./pages/TeacherQuizAnalytics";
import Quizzes from "./pages/Quizzes";
import QuizTake from "./pages/QuizTake";
import Syllabus from "./pages/Syllabus";
import Bookmarks from "./pages/Bookmarks";
import Subscription from "./pages/Subscription";
import ManageSubscriptions from "./pages/ManageSubscriptions";
import PreviousYearPapers from "./pages/PreviousYearPapers";
import ManagePapers from "./pages/ManagePapers";
import AdminHierarchy from "./pages/AdminHierarchy";
import AdminDeleteRequests from "./pages/AdminDeleteRequests";
import AdminAuditLog from "./pages/AdminAuditLog";
import AdminContentApprovals from "./pages/AdminContentApprovals";
import AdminHierarchyRequests from "./pages/AdminHierarchyRequests";
import AdminTeachers from "./pages/AdminTeachers";
import AdminStudents from "./pages/AdminStudents";
import MaintenanceRequests from "./pages/MaintenanceRequests";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import DoubtChat from "./pages/DoubtChat";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ChatAssistant from "./components/chat/ChatAssistant";
import RoleRoute from "./components/auth/RoleRoute";
import { useRealtimeActivity } from "./hooks/useRealtimeActivity";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
      retry: 1,
    },
  },
});

const RealtimeBridge = () => {
  useRealtimeActivity();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RealtimeBridge />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cms" element={<RoleRoute allow={["teacher", "maintenance"]}><TeacherCMS /></RoleRoute>} />
            <Route path="/teacher/quizzes" element={<RoleRoute allow={["teacher"]}><TeacherQuizzes /></RoleRoute>} />
            <Route path="/teacher/quiz-analytics" element={<RoleRoute allow={["teacher"]}><TeacherQuizAnalytics /></RoleRoute>} />
            <Route path="/syllabus" element={<RoleRoute><Syllabus /></RoleRoute>} />
            <Route path="/bookmarks" element={<RoleRoute allow={["student"]}><Bookmarks /></RoleRoute>} />
            <Route path="/subscription" element={<RoleRoute allow={["student"]}><Subscription /></RoleRoute>} />
            <Route path="/manage-subscriptions" element={<RoleRoute allow={["admin"]}><ManageSubscriptions /></RoleRoute>} />
            <Route path="/previous-papers" element={<RoleRoute><PreviousYearPapers /></RoleRoute>} />
            <Route path="/manage-papers" element={<RoleRoute allow={["teacher"]}><ManagePapers /></RoleRoute>} />
            <Route path="/admin/hierarchy" element={<RoleRoute allow={["admin", "maintenance"]}><AdminHierarchy /></RoleRoute>} />
            <Route path="/admin/delete-requests" element={<RoleRoute allow={["admin"]}><AdminDeleteRequests /></RoleRoute>} />
            <Route path="/admin/content-approvals" element={<RoleRoute allow={["admin"]}><AdminContentApprovals /></RoleRoute>} />
            <Route path="/admin/audit-log" element={<RoleRoute allow={["admin"]}><AdminAuditLog /></RoleRoute>} />
            <Route path="/admin/hierarchy-requests" element={<RoleRoute allow={["admin"]}><AdminHierarchyRequests /></RoleRoute>} />
            <Route path="/admin/teachers" element={<RoleRoute allow={["admin"]}><AdminTeachers /></RoleRoute>} />
            <Route path="/admin/students" element={<RoleRoute allow={["admin"]}><AdminStudents /></RoleRoute>} />
            <Route path="/admin/teacher-assignments" element={<RoleRoute allow={["admin"]}><AdminTeachers mode="assignments" /></RoleRoute>} />
            <Route path="/maintenance/requests" element={<RoleRoute allow={["maintenance", "admin"]}><MaintenanceRequests /></RoleRoute>} />
            <Route path="/maintenance/dashboard" element={<RoleRoute allow={["maintenance", "admin"]}><MaintenanceDashboard /></RoleRoute>} />
            <Route path="/chat" element={<DoubtChat />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:quizId" element={<QuizTake />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


