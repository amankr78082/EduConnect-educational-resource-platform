import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { mysqlClient } from "@/integrations/mysql/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, BookOpen, FileText, Play, ArrowLeft,
  LogOut, Loader2, Bookmark, Trash2
} from "lucide-react";
import { toast } from "sonner";

interface BookmarkedContent {
  id: string;
  content_id: string;
  created_at: string;
  content: {
    id: string;
    title: string;
    description: string | null;
    content_type: "notes" | "pdf" | "video";
    subject_id: string;
  };
  subject: {
    name: string;
    code: string;
    semester: number;
  } | null;
}

const Bookmarks = () => {
  const { user, loading: authLoading } = useUserRole();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    setLoading(true);
    const { data, error } = await mysqlClient
      .from("bookmarks")
      .select("id, content_id, created_at, content(id, title, description, content_type, subject_id)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch subject info for each content
    const subjectIds = [...new Set((data || []).map((b: any) => b.content?.subject_id).filter(Boolean))];
    let subjectMap: Record<string, any> = {};
    if (subjectIds.length > 0) {
      const { data: subjects } = await mysqlClient
        .from("subjects")
        .select("id, name, code, semester")
        .in("id", subjectIds);
      if (subjects) {
        subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
      }
    }

    setBookmarks(
      (data || [])
        .filter((b: any) => b.content)
        .map((b: any) => ({
          ...b,
          subject: subjectMap[b.content.subject_id] || null,
        }))
    );
    setLoading(false);
  };

  const removeBookmark = async (bookmarkId: string) => {
    await mysqlClient.from("bookmarks").delete().eq("id", bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    toast.success("Bookmark removed");
  };

  const openContent = (b: BookmarkedContent) => {
    if (b.subject) {
      navigate(`/syllabus?sem=${b.subject.semester}&subject=${b.content.subject_id}&content=${b.content.id}`);
    }
  };

  const handleLogout = async () => {
    await mysqlClient.auth.signOut();
    navigate("/");
  };

  if (authLoading || !user) return (
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
              <span className="font-display text-xl font-bold">My Bookmarks</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Saved Bookmarks</h1>
          <p className="text-muted-foreground">Quick access to your saved notes and videos</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bookmarks.length === 0 ? (
          <Card className="p-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-4">
              Save notes and videos from the syllabus page to access them quickly here.
            </p>
            <Link to="/syllabus">
              <Button>Browse Syllabus</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 hover:shadow-md transition-all border hover:border-primary/20">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl shrink-0 cursor-pointer ${
                        b.content.content_type === "notes" ? "bg-emerald-500/10 text-emerald-600" :
                        b.content.content_type === "pdf" ? "bg-orange-500/10 text-orange-600" :
                        "bg-blue-500/10 text-blue-600"
                      }`}
                      onClick={() => openContent(b)}
                    >
                      {b.content.content_type === "notes" ? <BookOpen className="w-5 h-5" /> :
                       b.content.content_type === "pdf" ? <FileText className="w-5 h-5" /> :
                       <Play className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openContent(b)}>
                      <h3 className="font-semibold truncate">{b.content.title}</h3>
                      {b.subject && (
                        <p className="text-sm text-muted-foreground">
                          {b.subject.code} • {b.subject.name} • Sem {b.subject.semester}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 capitalize">{b.content.content_type}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBookmark(b.id)}
                      className="shrink-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;


