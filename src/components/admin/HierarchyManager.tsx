import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Building2, GraduationCap, Network, Layers } from "lucide-react";
import { toast } from "sonner";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";

interface University { id: string; name: string; short_name: string | null; }
interface Course { id: string; university_id: string; name: string; total_semesters: number; }
interface Branch { id: string; course_id: string; name: string; code: string | null; }
interface Scheme { id: string; branch_id: string; name: string; year: number | null; is_active: boolean; }

export const HierarchyManager = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  const [selUni, setSelUni] = useState<string>("");
  const [selCourse, setSelCourse] = useState<string>("");
  const [selBranch, setSelBranch] = useState<string>("");

  const [newUni, setNewUni] = useState({ name: "", short_name: "" });
  const [newCourse, setNewCourse] = useState({ name: "", total_semesters: 4 });
  const [newBranch, setNewBranch] = useState({ name: "", code: "" });
  const [newScheme, setNewScheme] = useState({ name: "", year: new Date().getFullYear() });

  const loadAll = async () => {
    const [u, c, b, s] = await Promise.all([
      mysqlClient.from("universities").select("*").order("name"),
      mysqlClient.from("courses").select("*").order("name"),
      mysqlClient.from("branches").select("*").order("name"),
      mysqlClient.from("schemes").select("*").order("year", { ascending: false }),
    ]);
    setUniversities(u.data || []);
    setCourses(c.data || []);
    setBranches(b.data || []);
    setSchemes(s.data || []);
    if (!selUni && u.data?.length) setSelUni(u.data[0].id);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const onActivity = () => loadAll();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, []);

  const filteredCourses = courses.filter(c => c.university_id === selUni);
  const filteredBranches = branches.filter(b => b.course_id === selCourse);
  const filteredSchemes = schemes.filter(s => s.branch_id === selBranch);

  const addUni = async () => {
    if (!newUni.name.trim()) return toast.error("University name required");
    const { error } = await mysqlClient.from("universities").insert({ name: newUni.name, short_name: newUni.short_name || null });
    if (error) return toast.error(error.message);
    toast.success("University added");
    setNewUni({ name: "", short_name: "" });
    loadAll();
  };

  const addCourse = async () => {
    if (!selUni) return toast.error("Select a university");
    if (!newCourse.name.trim()) return toast.error("Course name required");
    const { error } = await mysqlClient.from("courses").insert({
      university_id: selUni,
      name: newCourse.name,
      total_semesters: newCourse.total_semesters,
      duration_years: Math.ceil(newCourse.total_semesters / 2),
    });
    if (error) return toast.error(error.message);
    toast.success("Course added");
    setNewCourse({ name: "", total_semesters: 4 });
    loadAll();
  };

  const addBranch = async () => {
    if (!selCourse) return toast.error("Select a course");
    if (!newBranch.name.trim()) return toast.error("Branch name required");
    const { error } = await mysqlClient.from("branches").insert({
      course_id: selCourse,
      name: newBranch.name,
      code: newBranch.code || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Branch added");
    setNewBranch({ name: "", code: "" });
    loadAll();
  };

  const addScheme = async () => {
    if (!selBranch) return toast.error("Select a branch");
    if (!newScheme.name.trim()) return toast.error("Scheme name required");
    const { error } = await mysqlClient.from("schemes").insert({
      branch_id: selBranch,
      name: newScheme.name,
      year: newScheme.year,
    });
    if (error) return toast.error(error.message);
    toast.success("Scheme added");
    setNewScheme({ name: "", year: new Date().getFullYear() });
    loadAll();
  };

  const remove = async (table: "universities" | "courses" | "branches" | "schemes", id: string) => {
    if (!confirm("Delete this and all nested items?")) return;
    const { error } = await mysqlClient.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    loadAll();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* UNIVERSITIES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Universities</CardTitle>
          <CardDescription>Top-level institution (e.g. RGPV)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="University name" value={newUni.name} onChange={e => setNewUni({ ...newUni, name: e.target.value })} />
            <Input placeholder="Short name (RGPV)" value={newUni.short_name} onChange={e => setNewUni({ ...newUni, short_name: e.target.value })} />
          </div>
          <Button onClick={addUni} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add University</Button>

          <div className="space-y-2 pt-2">
            {universities.map(u => (
              <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border ${selUni === u.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <button onClick={() => { setSelUni(u.id); setSelCourse(""); setSelBranch(""); }} className="text-left flex-1">
                  <p className="font-medium">{u.name}</p>
                  {u.short_name && <p className="text-xs text-muted-foreground">{u.short_name}</p>}
                </button>
                <Button variant="ghost" size="sm" onClick={() => remove("universities", u.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* COURSES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Courses</CardTitle>
          <CardDescription>Programs under selected university (MCA, B.Tech, MBA)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Course name" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} />
            <div>
              <Label className="text-xs">Total Semesters</Label>
              <Input type="number" min={1} max={12} value={newCourse.total_semesters} onChange={e => setNewCourse({ ...newCourse, total_semesters: parseInt(e.target.value) || 4 })} />
            </div>
          </div>
          <Button onClick={addCourse} className="w-full" disabled={!selUni}><Plus className="w-4 h-4 mr-2" /> Add Course</Button>

          <div className="space-y-2 pt-2">
            {filteredCourses.map(c => (
              <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${selCourse === c.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <button onClick={() => { setSelCourse(c.id); setSelBranch(""); }} className="text-left flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.total_semesters} semesters</p>
                </button>
                <Button variant="ghost" size="sm" onClick={() => remove("courses", c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {selUni && filteredCourses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No courses yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* BRANCHES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5 text-primary" /> Branches</CardTitle>
          <CardDescription>Specializations (CSE, IT, AI/ML, General)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Branch name (CSE)" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} />
            <Input placeholder="Code (CS)" value={newBranch.code} onChange={e => setNewBranch({ ...newBranch, code: e.target.value })} />
          </div>
          <Button onClick={addBranch} className="w-full" disabled={!selCourse}><Plus className="w-4 h-4 mr-2" /> Add Branch</Button>

          <div className="space-y-2 pt-2">
            {filteredBranches.map(b => (
              <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg border ${selBranch === b.id ? "border-primary bg-primary/5" : "border-border"}`}>
                <button onClick={() => setSelBranch(b.id)} className="text-left flex-1">
                  <p className="font-medium">{b.name}</p>
                  {b.code && <p className="text-xs text-muted-foreground">{b.code}</p>}
                </button>
                <Button variant="ghost" size="sm" onClick={() => remove("branches", b.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {selCourse && filteredBranches.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No branches yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* SCHEMES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Schemes</CardTitle>
          <CardDescription>Curriculum versions (2020 Scheme, 2024 Scheme)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Scheme name (2024 Scheme)" value={newScheme.name} onChange={e => setNewScheme({ ...newScheme, name: e.target.value })} />
            <Input type="number" placeholder="Year" value={newScheme.year} onChange={e => setNewScheme({ ...newScheme, year: parseInt(e.target.value) || 0 })} />
          </div>
          <Button onClick={addScheme} className="w-full" disabled={!selBranch}><Plus className="w-4 h-4 mr-2" /> Add Scheme</Button>

          <div className="space-y-2 pt-2">
            {filteredSchemes.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-medium">{s.name}</p>
                  {s.year && <p className="text-xs text-muted-foreground">Year: {s.year}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove("schemes", s.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {selBranch && filteredSchemes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No schemes yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


