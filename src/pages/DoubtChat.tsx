import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, GraduationCap, LogOut, Loader2, Send, MessageSquarePlus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  student_id: string;
  teacher_id: string;
  last_message_at: string;
  other_name?: string;
}
interface Msg {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
interface TeacherProfile { user_id: string; full_name: string | null; }

const DoubtChat = () => {
  const { user, isTeacher, isStudent, loading } = useUserRole();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [searchT, setSearchT] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const loadThreads = async () => {
    if (!user) return;
    const { data } = await mysqlClient
      .from("chat_threads")
      .select("*")
      .or(`student_id.eq.${user.id},teacher_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (!data) return;
    const otherIds = data.map((t) => t.student_id === user.id ? t.teacher_id : t.student_id);
    const { data: profs } = await mysqlClient.from("profiles").select("user_id, full_name").in("user_id", otherIds);
    const map = new Map(profs?.map((p) => [p.user_id, p.full_name]));
    setThreads(data.map((t) => ({
      ...t,
      other_name: map.get(t.student_id === user.id ? t.teacher_id : t.student_id) || "User",
    })));
  };

  useEffect(() => { if (user) loadThreads(); }, [user]);

  // Realtime: refresh threads on any new chat_message
  useEffect(() => {
    if (!user) return;
    const ch = mysqlClient.channel("threads-sync")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        loadThreads();
        if (activeThread) loadMessages(activeThread.id);
      })
      .subscribe();
    return () => { mysqlClient.removeChannel(ch); };
  }, [user, activeThread?.id]);

  const loadMessages = async (threadId: string) => {
    const { data } = await mysqlClient
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const openThread = async (t: Thread) => {
    setActiveThread(t);
    await loadMessages(t.id);
    // mark unread as read
    await mysqlClient.from("chat_messages").update({ is_read: true })
      .eq("thread_id", t.id).neq("sender_id", user!.id).eq("is_read", false);
  };

  const send = async () => {
    if (!draft.trim() || !activeThread) return;
    setSending(true);
    const { error } = await mysqlClient.from("chat_messages").insert({
      thread_id: activeThread.id,
      sender_id: user!.id,
      body: draft.trim(),
    });
    if (error) toast.error(error.message);
    else { setDraft(""); loadMessages(activeThread.id); }
    setSending(false);
  };

  const loadTeachers = async () => {
    // Use user_roles + profiles
    const { data: roles } = await mysqlClient.from("user_roles").select("user_id").eq("role", "teacher");
    if (!roles) return;
    const ids = roles.map((r) => r.user_id);
    const { data: profs } = await mysqlClient.from("profiles").select("user_id, full_name").in("user_id", ids);
    setTeachers(profs || []);
  };

  const startThread = async (teacher: TeacherProfile) => {
    if (!user) return;
    // Check existing
    const { data: existing } = await mysqlClient.from("chat_threads")
      .select("*").eq("student_id", user.id).eq("teacher_id", teacher.user_id).maybeSingle();
    let thread = existing;
    if (!thread) {
      const { data, error } = await mysqlClient.from("chat_threads")
        .insert({ student_id: user.id, teacher_id: teacher.user_id })
        .select().single();
      if (error) { toast.error(error.message); return; }
      thread = data;
    }
    setOpenNew(false);
    await loadThreads();
    openThread({ ...thread!, other_name: teacher.full_name || "Teacher" });
  };

  if (loading || !user) return null;

  const filteredTeachers = teachers.filter((t) =>
    (t.full_name || "").toLowerCase().includes(searchT.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Doubt Chat</span>
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await mysqlClient.auth.signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="container py-6 flex-1 grid md:grid-cols-[300px_1fr] gap-4 min-h-0">
        {/* Threads list */}
        <Card className="flex flex-col min-h-0">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold text-sm">Chats</h2>
            {!isTeacher && (
              <Dialog open={openNew} onOpenChange={(o) => { setOpenNew(o); if (o) loadTeachers(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><MessageSquarePlus className="w-4 h-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Start Chat with Teacher</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Search teacher..." value={searchT} onChange={(e) => setSearchT(e.target.value)} />
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-1">
                      {filteredTeachers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No teachers found</p>
                      ) : filteredTeachers.map((t) => (
                        <button key={t.user_id} onClick={() => startThread(t)}
                          className="w-full p-2 rounded-md hover:bg-accent flex items-center gap-2 text-left">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {(t.full_name || "T").split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{t.full_name || "Teacher"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-6">
                {isTeacher ? "No student doubts yet" : "Start a chat with a teacher"}
              </p>
            ) : threads.map((t) => (
              <button key={t.id} onClick={() => openThread(t)}
                className={cn("w-full p-3 border-b hover:bg-accent flex items-center gap-3 text-left",
                  activeThread?.id === t.id && "bg-accent")}>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {(t.other_name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.other_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.last_message_at).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Messages */}
        <Card className="flex flex-col min-h-0">
          {!activeThread ? (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a chat to start messaging
            </CardContent>
          ) : (
            <>
              <div className="p-3 border-b">
                <p className="font-semibold text-sm">{activeThread.other_name}</p>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.sender_id === user.id ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                      m.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Type a message..." />
                <Button onClick={send} disabled={sending || !draft.trim()}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default DoubtChat;


