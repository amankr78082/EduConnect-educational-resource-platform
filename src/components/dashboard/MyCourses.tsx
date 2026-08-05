import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface EnrolledCourse {
  id: string;
  subject_id: string;
  progress: number;
  enrolled_at: string;
  subject: {
    id: string;
    name: string;
    code: string;
    semester: number;
    description: string | null;
  };
}

interface AvailableSubject {
  id: string;
  name: string;
  code: string;
  semester: number;
  description: string | null;
}

const MyCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvailable, setShowAvailable] = useState(false);

  const fetchEnrollments = async () => {
    const { data: { user } } = await mysqlClient.auth.getUser();
    if (!user) return;

    const { data, error } = await mysqlClient
      .from("course_enrollments")
      .select(`
        id,
        subject_id,
        progress,
        enrolled_at,
        subject:subjects(id, name, code, semester, description)
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching enrollments:", error);
      return;
    }

    setEnrolledCourses(data as unknown as EnrolledCourse[]);
  };

  const fetchAvailableSubjects = async () => {
    const { data: { user } } = await mysqlClient.auth.getUser();
    if (!user) return;

    const { data: enrolledIds } = await mysqlClient
      .from("course_enrollments")
      .select("subject_id")
      .eq("user_id", user.id);

    const enrolledSubjectIds = enrolledIds?.map(e => e.subject_id) || [];

    let query = mysqlClient.from("subjects").select("*");
    
    if (enrolledSubjectIds.length > 0) {
      query = query.not("id", "in", `(${enrolledSubjectIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching subjects:", error);
      return;
    }

    setAvailableSubjects(data || []);
  };

  const refreshProgress = async () => {
    const { data: { user } } = await mysqlClient.auth.getUser();
    if (!user) return;

    const { data: enrollments } = await mysqlClient
      .from("course_enrollments")
      .select("subject_id")
      .eq("user_id", user.id);

    if (enrollments) {
      await Promise.all(
        enrollments.map((e) =>
          mysqlClient.rpc("update_enrollment_progress", {
            p_user_id: user.id,
            p_subject_id: e.subject_id,
          })
        )
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshProgress();
      await fetchEnrollments();
      await fetchAvailableSubjects();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleEnroll = async (subjectId: string) => {
    const { data: { user } } = await mysqlClient.auth.getUser();
    if (!user) {
      toast.error("Please log in to enroll");
      return;
    }

    const { error } = await mysqlClient
      .from("course_enrollments")
      .insert({ user_id: user.id, subject_id: subjectId });

    if (error) {
      toast.error("Failed to enroll");
      console.error(error);
      return;
    }

    toast.success("Enrolled successfully!");
    await fetchEnrollments();
    await fetchAvailableSubjects();
  };

  const handleUnenroll = async (enrollmentId: string) => {
    const { error } = await mysqlClient
      .from("course_enrollments")
      .delete()
      .eq("id", enrollmentId);

    if (error) {
      toast.error("Failed to unenroll");
      console.error(error);
      return;
    }

    toast.success("Unenrolled successfully");
    await fetchEnrollments();
    await fetchAvailableSubjects();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">My Courses</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">My Courses</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAvailable(!showAvailable)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {showAvailable ? "Hide Available" : "Add Course"}
        </Button>
      </div>

      {showAvailable && availableSubjects.length > 0 && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <h3 className="font-semibold mb-3">Available Courses</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availableSubjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div>
                  <p className="font-medium text-sm">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {subject.code} • Sem {subject.semester}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleEnroll(subject.id)}>
                  Enroll
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAvailable && availableSubjects.length === 0 && (
        <p className="text-muted-foreground text-sm">
          You're enrolled in all available courses!
        </p>
      )}

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-secondary/30 border border-border">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            Click "Add Course" to enroll in available subjects
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.map((enrollment) => (
            <div
              key={enrollment.id}
              className="p-5 rounded-xl bg-card border border-border hover:shadow-elevated transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-edu-indigo flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleUnenroll(enrollment.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              
              <h3 className="font-display font-semibold mb-1">
                {enrollment.subject.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {enrollment.subject.code} • Semester {enrollment.subject.semester}
              </p>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;


