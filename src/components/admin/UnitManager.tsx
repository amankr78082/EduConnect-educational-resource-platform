import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Layers3 } from "lucide-react";
import { toast } from "sonner";

interface Subject { id: string; name: string; code: string; semester: number; }
interface Unit { id: string; subject_id: string; unit_number: number; name: string; description: string | null; }

export const UnitManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selSubject, setSelSubject] = useState<string>("");
  const [newUnit, setNewUnit] = useState({ unit_number: 1, name: "", description: "" });

  const loadSubjects = async () => {
    const { data } = await mysqlClient.from("subjects").select("id, name, code, semester").order("semester").order("name");
    setSubjects(data || []);
  };

  const loadUnits = async () => {
    if (!selSubject) { setUnits([]); return; }
    const { data } = await mysqlClient.from("units").select("*").eq("subject_id", selSubject).order("unit_number");
    setUnits(data || []);
    setNewUnit({ unit_number: (data?.length || 0) + 1, name: "", description: "" });
  };

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { loadUnits(); }, [selSubject]);

  const addUnit = async () => {
    if (!selSubject) return toast.error("Select a subject");
    if (!newUnit.name.trim()) return toast.error("Unit name required");
    const { error } = await mysqlClient.from("units").insert({
      subject_id: selSubject,
      unit_number: newUnit.unit_number,
      name: newUnit.name,
      description: newUnit.description || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Unit added");
    loadUnits();
  };

  const removeUnit = async (id: string) => {
    if (!confirm("Delete this unit?")) return;
    const { error } = await mysqlClient.from("units").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    loadUnits();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Layers3 className="w-5 h-5 text-primary" /> Manage Units</CardTitle>
        <CardDescription>Define units (chapters) inside each subject</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Subject</Label>
          <Select value={selSubject} onValueChange={setSelSubject}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map(s => (
                <SelectItem key={s.id} value={s.id}>Sem {s.semester} • {s.code} - {s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selSubject && (
          <>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-2">
                <Label className="text-xs">Unit #</Label>
                <Input type="number" min={1} value={newUnit.unit_number} onChange={e => setNewUnit({ ...newUnit, unit_number: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Unit Name</Label>
                <Input placeholder="Introduction" value={newUnit.name} onChange={e => setNewUnit({ ...newUnit, name: e.target.value })} />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Description (optional)</Label>
                <Input placeholder="Brief description" value={newUnit.description} onChange={e => setNewUnit({ ...newUnit, description: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Button onClick={addUnit} className="w-full"><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              {units.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Unit {u.unit_number}: {u.name}</p>
                    {u.description && <p className="text-xs text-muted-foreground">{u.description}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeUnit(u.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {units.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No units yet for this subject</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};


