import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { mysqlClient } from "@/integrations/mysql/client";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Subject = {
  id: string;
  scheme_id: string | null;
  name: string;
  code: string;
  semester: number;
  description: string | null;
};

type Scheme = {
  id: string;
  name: string;
  year: number | null;
};

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

export const SubjectAdminManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [newSubject, setNewSubject] = useState({ scheme_id: "", name: "", code: "", semester: "1", description: "" });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [subjectRes, schemeRes] = await Promise.all([
      mysqlClient.from("subjects").select("id, scheme_id, name, code, semester, description").order("semester").order("code"),
      mysqlClient.from("schemes").select("id, name, year").order("year", { ascending: false }),
    ]);
    setSubjects((subjectRes.data || []) as Subject[]);
    setSchemes((schemeRes.data || []) as Scheme[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const onActivity = () => loadData();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, []);

  const filteredSubjects = useMemo(() => {
    const text = query.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSemester = semesterFilter === "all" || String(subject.semester) === semesterFilter;
      const matchesText = !text || `${subject.code} ${subject.name} ${subject.description || ""}`.toLowerCase().includes(text);
      return matchesSemester && matchesText;
    });
  }, [query, semesterFilter, subjects]);

  const addSubject = async () => {
    if (!newSubject.name.trim() || !newSubject.code.trim()) {
      toast.error("Subject name and code are required");
      return;
    }

    const { error } = await mysqlClient.from("subjects").insert({
      scheme_id: newSubject.scheme_id || null,
      name: newSubject.name.trim(),
      code: newSubject.code.trim().toUpperCase(),
      semester: Number(newSubject.semester),
      description: newSubject.description.trim() || null,
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Subject added");
      setNewSubject({ scheme_id: "", name: "", code: "", semester: "1", description: "" });
      loadData();
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    const { error } = await mysqlClient.from("subjects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Subject deleted");
      loadData();
    }
  };

  const groupedSubjects = semesters
    .map((semester) => ({
      semester,
      subjects: filteredSubjects.filter((subject) => subject.semester === semester),
    }))
    .filter((group) => group.subjects.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Subject Management
          </CardTitle>
          <CardDescription>Real subjects indexed in the academic hierarchy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
            <Input placeholder="Subject name" value={newSubject.name} onChange={(event) => setNewSubject({ ...newSubject, name: event.target.value })} />
            <Input placeholder="Code e.g. MCA 201" value={newSubject.code} onChange={(event) => setNewSubject({ ...newSubject, code: event.target.value })} />
            <Select value={newSubject.semester} onValueChange={(value) => setNewSubject({ ...newSubject, semester: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => <SelectItem key={semester} value={String(semester)}>Sem {semester}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Select value={newSubject.scheme_id} onValueChange={(value) => setNewSubject({ ...newSubject, scheme_id: value })}>
              <SelectTrigger><SelectValue placeholder="Scheme optional" /></SelectTrigger>
              <SelectContent>
                {schemes.map((scheme) => (
                  <SelectItem key={scheme.id} value={scheme.id}>{scheme.name} {scheme.year ? `(${scheme.year})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Description optional" value={newSubject.description} onChange={(event) => setNewSubject({ ...newSubject, description: event.target.value })} />
            <Button onClick={addSubject}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject code or name..." className="pl-10" />
        </div>
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {semesters.map((semester) => <SelectItem key={semester} value={String(semester)}>Semester {semester}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading subjects...</CardContent></Card>
      ) : groupedSubjects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No subjects found</CardContent></Card>
      ) : (
        <div className="space-y-5">
          {groupedSubjects.map((group) => (
            <Card key={group.semester}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Semester {group.semester}</CardTitle>
                <CardDescription>{group.subjects.length} subjects</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.subjects.map((subject) => (
                  <div key={subject.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="min-w-0">
                      <Badge variant="secondary">{subject.code}</Badge>
                      <p className="mt-2 font-semibold">{subject.name}</p>
                      {subject.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subject.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSubject(subject.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


