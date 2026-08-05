import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
}

interface SubjectSelectorProps {
  selectedSemester: number | null;
  selectedSubject: string | null;
  onSemesterChange: (semester: number | null) => void;
  onSubjectChange: (subjectId: string | null) => void;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const SubjectSelector = ({
  selectedSemester,
  selectedSubject,
  onSemesterChange,
  onSubjectChange,
}: SubjectSelectorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedSemester) {
        setSubjects([]);
        return;
      }
      
      setLoading(true);
      const { data, error } = await mysqlClient
        .from("subjects")
        .select("*")
        .eq("semester", selectedSemester)
        .order("name");

      if (!error && data) {
        setSubjects(data);
      }
      setLoading(false);
    };

    fetchSubjects();
    onSubjectChange(null);
  }, [selectedSemester]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Semester</Label>
        <Select
          value={selectedSemester?.toString() || ""}
          onValueChange={(v) => onSemesterChange(v ? parseInt(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select semester" />
          </SelectTrigger>
          <SelectContent>
            {SEMESTERS.map((sem) => (
              <SelectItem key={sem} value={sem.toString()}>
                Semester {sem}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Select
          value={selectedSubject || ""}
          onValueChange={(v) => onSubjectChange(v || null)}
          disabled={!selectedSemester || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : "Select subject"} />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};


