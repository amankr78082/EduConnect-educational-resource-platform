import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Building2, GraduationCap, Layers3, Loader2, LogOut } from "lucide-react";
import { mysqlClient } from "@/integrations/mysql/client";
import { HierarchyManager } from "@/components/admin/HierarchyManager";
import { UnitManager } from "@/components/admin/UnitManager";
import { SubjectAdminManager } from "@/components/admin/SubjectAdminManager";

const AdminHierarchy = () => {
  const { user, isAdmin, isMaintenance, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAccess = isAdmin || isMaintenance;

  if (!canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-4 w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You need Admin or Maintenance privileges.</CardDescription>
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Academic Hierarchy</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground md:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await mysqlClient.auth.signOut();
                navigate("/");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-3xl font-bold">Academic Hierarchy</h1>
          <p className="text-muted-foreground">
            Manage Universities, Courses, Programs, Schemes, Subjects and Units
          </p>
        </div>

        <Tabs defaultValue="hierarchy" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Hierarchy</span>
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Subjects</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              <span className="hidden sm:inline">Units</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hierarchy">
            <HierarchyManager />
          </TabsContent>
          <TabsContent value="subjects">
            <SubjectAdminManager />
          </TabsContent>
          <TabsContent value="units">
            <UnitManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminHierarchy;


