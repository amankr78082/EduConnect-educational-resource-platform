import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";
import { ContentUploadForm } from "@/components/cms/ContentUploadForm";
import { ContentList } from "@/components/cms/ContentList";
import { SubjectManager } from "@/components/cms/SubjectManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Upload, BookOpen, FolderPlus, LogOut, ArrowLeft, Loader2, BookmarkPlus, FileText } from "lucide-react";
import { mysqlClient } from "@/integrations/mysql/client";
import { ContentTopicsManager } from "@/components/admin/ContentTopicsManager";
import PaperUploadForm from "@/components/papers/PaperUploadForm";

const TeacherCMS = () => {
  const { user, isTeacher, isMaintenance, canManageSubjects, loading } = useUserRole();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await mysqlClient.auth.signOut();
    navigate("/");
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher && !canManageSubjects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You need teacher or maintenance privileges to access this page. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Maintenance-only users see only the Subjects tab (manage courses & schemes)
  const maintenanceOnly = !isTeacher && isMaintenance;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Content Manager</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Content Management</h1>
          <p className="text-muted-foreground">Upload and manage educational content for students</p>
        </motion.div>

        <Tabs defaultValue={maintenanceOnly ? "subjects" : "upload"} className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl ${maintenanceOnly ? "grid-cols-1" : "grid-cols-5"}`}>
            {!maintenanceOnly && (
              <>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger value="topics" className="flex items-center gap-2">
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF Topics</span>
                </TabsTrigger>
                <TabsTrigger value="pyq" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PYQ</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
          </TabsList>

          {!maintenanceOnly && (
            <>
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Content</CardTitle>
                    <CardDescription>
                      Add notes, PDFs, or video links organized by semester and subject
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentUploadForm onSuccess={handleRefresh} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Content</CardTitle>
                    <CardDescription>View and manage uploaded educational materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentList refreshTrigger={refreshTrigger} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topics">
                <ContentTopicsManager />
              </TabsContent>

              <TabsContent value="pyq">
                <Card>
                  <CardHeader>
                    <CardTitle>Previous Year Papers</CardTitle>
                    <CardDescription>Upload PYQs by subject and year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaperUploadForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Add New Subject / Course</CardTitle>
                <CardDescription>Create subjects and schemes for organizing content by semester</CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectManager onSuccess={handleRefresh} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherCMS;


