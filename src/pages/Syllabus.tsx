import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, BookOpen, ChevronRight,
  ArrowLeft, Loader2,
  BookMarked, Building2, Layers, Network, Calendar,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { hierarchyApi, type Branch, type Course, type Scheme, type Subject, type University } from "@/services/hierarchyApi";
import { mysqlClient } from "@/integrations/mysql/client";
import CoursePlayer from "@/components/syllabus/CoursePlayer";
import { useSubscription } from "@/hooks/useSubscription";

const Syllabus = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const universityId = searchParams.get("u");
  const courseId = searchParams.get("c");
  const branchId = searchParams.get("b");
  const schemeId = searchParams.get("sc");
  const activeSemester = searchParams.get("sem") ? parseInt(searchParams.get("sem")!) : null;
  const activeSubjectId = searchParams.get("subject") || null;
  const activeContentId = searchParams.get("content") || null;
  const activePage = searchParams.get("page") ? parseInt(searchParams.get("page")!) : null;

  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const subscription = useSubscription(userId || undefined);

  // Load every university returned by the backend so the selector stays dynamic.
  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const data = await hierarchyApi.getUniversities();
        console.log("[Syllabus] universities API response:", data);
        setUniversities(data);
        console.log("[Syllabus] universities after assignment:", data);
      } catch (error) {
        console.error("[Syllabus] failed to load universities:", error);
        toast.error("Unable to load universities");
        setUniversities([]);
      } finally {
        setLoadingList(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!universityId) { setCourses([]); return; }
    setLoadingList(true);
    (async () => {
      try {
        setCourses(await hierarchyApi.getCourses(universityId));
      } catch (error) {
        console.error("[Syllabus] failed to load courses:", error);
        toast.error("Unable to load courses");
        setCourses([]);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [universityId]);

  useEffect(() => {
    if (!courseId) { setBranches([]); return; }
    setLoadingList(true);
    (async () => {
      try {
        setBranches(await hierarchyApi.getBranches(courseId));
      } catch (error) {
        console.error("[Syllabus] failed to load branches:", error);
        toast.error("Unable to load branches");
        setBranches([]);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [courseId]);

  useEffect(() => {
    if (!branchId) { setSchemes([]); return; }
    setLoadingList(true);
    (async () => {
      try {
        setSchemes(await hierarchyApi.getSchemes(branchId));
      } catch (error) {
        console.error("[Syllabus] failed to load schemes:", error);
        toast.error("Unable to load schemes");
        setSchemes([]);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [branchId]);

  const [availableSemesters, setAvailableSemesters] = useState<number[]>([]);
  useEffect(() => {
    if (!schemeId) { setAvailableSemesters([]); return; }
    hierarchyApi.getSemesters(schemeId)
      .then(setAvailableSemesters)
      .catch((error) => {
        console.error("[Syllabus] failed to load semesters:", error);
        toast.error("Unable to load semesters");
        setAvailableSemesters([]);
      });
  }, [schemeId]);

  useEffect(() => {
    if (!schemeId || !activeSemester) { setSubjects([]); return; }
    setLoadingList(true);
    hierarchyApi.getSubjects(schemeId, activeSemester)
      .then(setSubjects)
      .catch((error) => {
        console.error("[Syllabus] failed to load subjects:", error);
        toast.error("Unable to load subjects");
        setSubjects([]);
      })
      .finally(() => setLoadingList(false));
  }, [schemeId, activeSemester]);

  useEffect(() => {
    mysqlClient.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next);
  };

  const goBack = () => {
    if (activeSubjectId) setParam({ subject: null });
    else if (activeSemester) setParam({ sem: null });
    else if (schemeId) setParam({ sc: null, sem: null });
    else if (branchId) setParam({ b: null, sc: null });
    else if (courseId) setParam({ c: null, b: null });
    else if (universityId) setParam({ u: null, c: null });
  };

  const handleLogout = () => navigate("/");

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const activeCourse = courses.find((c) => c.id === courseId);
  const activeBranch = branches.find((b) => b.id === branchId);
  const activeScheme = schemes.find((s) => s.id === schemeId);
  const activeUniversity = universities.find((u) => u.id === universityId);
  if (activeSubjectId && activeSubject) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">EduConnect</span>
            </Link>
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </nav>
        {userId && subscription.loading ? (
          <main className="container flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        ) : userId ? (
          <CoursePlayer
            subject={activeSubject}
            userId={userId}
            hasPremiumAccess={subscription.hasPremium(activeSubject.semester)}
            initialContentId={activeContentId}
            initialPage={activePage}
            onBack={() => setParam({ subject: null, content: null, page: null })}
          />
        ) : (
          <main className="container flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        )}
      </div>
    );
  }

  type Step = {
    title: string;
    subtitle: string;
    items: { id: string; title: string; subtitle?: string }[];
    onSelect: (id: string) => void;
    icon: React.ReactNode;
    accent: string;
    emptyText: string;
  };

  let step: Step | null = null;

  if (!universityId) {
    console.log("[Syllabus] before rendering university cards:", universities);
    step = {
      title: "Choose your University",
      subtitle: "Select the university you're enrolled in",
      items: universities.map((u) => ({ id: u.id, title: u.name, subtitle: u.short_name || undefined })),
      onSelect: (id) => setParam({ u: id }),
      icon: <Building2 className="w-6 h-6" />,
      accent: "from-blue-500 to-cyan-500",
      emptyText: "No universities added yet.",
    };
  } else if (!courseId) {
    step = {
      title: "Choose your Course",
      subtitle: `${activeUniversity?.name || "University"} • Select your programme`,
      items: courses.map((c) => ({ id: c.id, title: c.name, subtitle: `${c.total_semesters} Semesters` })),
      onSelect: (id) => setParam({ c: id }),
      icon: <GraduationCap className="w-6 h-6" />,
      accent: "from-violet-500 to-purple-500",
      emptyText: "No courses available for this university yet.",
    };
  } else if (!branchId) {
    step = {
      title: "Choose your Branch",
      subtitle: `${activeCourse?.name} • Select specialization / college branch`,
      items: branches.map((b) => ({ id: b.id, title: b.name, subtitle: b.code || undefined })),
      onSelect: (id) => setParam({ b: id }),
      icon: <Network className="w-6 h-6" />,
      accent: "from-emerald-500 to-teal-500",
      emptyText: "No branches added yet.",
    };
  } else if (!schemeId) {
    step = {
      title: "Choose your Scheme / Syllabus",
      subtitle: `${activeBranch?.name} • Pick the year/scheme you study`,
      items: schemes.map((s) => ({ id: s.id, title: s.name, subtitle: s.year ? `Year ${s.year}` : undefined })),
      onSelect: (id) => setParam({ sc: id }),
      icon: <Layers className="w-6 h-6" />,
      accent: "from-orange-500 to-amber-500",
      emptyText: "No schemes added yet.",
    };
  } else if (!activeSemester) {
    step = {
      title: "Choose Semester",
      subtitle: `${activeScheme?.name} • Select your semester`,
      items: availableSemesters.map((n) => ({ id: String(n), title: `Semester ${n}` })),
      onSelect: (id) => setParam({ sem: id }),
      icon: <Calendar className="w-6 h-6" />,
      accent: "from-pink-500 to-rose-500",
      emptyText: "No semesters with subjects yet.",
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {(universityId || courseId || branchId || schemeId || activeSemester) && (
              <button onClick={goBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Syllabus</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Home</Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <button onClick={() => setSearchParams({})} className="hover:text-foreground">Home</button>
          {activeUniversity && (<><ChevronRight className="w-4 h-4" /><button onClick={() => setParam({ c: null, b: null, sc: null, sem: null })} className="hover:text-foreground">{activeUniversity.short_name || activeUniversity.name}</button></>)}
          {activeCourse && (<><ChevronRight className="w-4 h-4" /><button onClick={() => setParam({ b: null, sc: null, sem: null })} className="hover:text-foreground">{activeCourse.name}</button></>)}
          {activeBranch && (<><ChevronRight className="w-4 h-4" /><button onClick={() => setParam({ sc: null, sem: null })} className="hover:text-foreground">{activeBranch.name}</button></>)}
          {activeScheme && (<><ChevronRight className="w-4 h-4" /><button onClick={() => setParam({ sem: null })} className="hover:text-foreground">{activeScheme.name}</button></>)}
          {activeSemester && (<><ChevronRight className="w-4 h-4" /><span className="text-foreground font-medium">Semester {activeSemester}</span></>)}
        </div>

        <AnimatePresence mode="wait">
          {step && (
            <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold mb-2">{step.title}</h1>
                <p className="text-muted-foreground">{step.subtitle}</p>
              </div>
              {loadingList ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : step.items.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{step.emptyText}</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {step.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -4 }}
                      onClick={() => step!.onSelect(item.id)}
                      className="cursor-pointer"
                    >
                      <Card className="p-5 hover:shadow-elevated transition-all border-2 hover:border-primary/30 overflow-hidden relative h-full">
                        <div className={`absolute inset-0 bg-gradient-to-br ${step!.accent} opacity-5`} />
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step!.accent} flex items-center justify-center mb-4 text-white`}>
                            {step!.icon}
                          </div>
                          <h3 className="font-display text-lg font-bold mb-1">{item.title}</h3>
                          {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
                          <div className="flex items-center gap-1 mt-3 text-primary font-medium text-sm">
                            Continue <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SUBJECTS */}
          {schemeId && activeSemester && !activeSubjectId && (
            <motion.div key="subjects" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold mb-2">Semester {activeSemester} Subjects</h1>
                <p className="text-muted-foreground">{activeScheme?.name} • {activeBranch?.name}</p>
              </div>
              {loadingList ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : subjects.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookMarked className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No subjects added yet</h3>
                  <p className="text-muted-foreground">Subjects for this semester will appear here once added.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {subjects.map((subject, i) => {
                    const hasPremiumAccess = subscription.hasPremium(subject.semester);
                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        onClick={() => {
                          if (subscription.loading) return;
                          setParam({ subject: subject.id });
                        }}
                        className="cursor-pointer"
                      >
                        <Card className="p-5 hover:shadow-elevated transition-all border h-full relative hover:border-primary/30">
                          {hasPremiumAccess ? (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs">Premium Active</Badge>
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3">
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Lock className="w-3 h-3" /> Preview
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                              <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="mb-2 text-xs">{subject.code}</Badge>
                              <h3 className="font-display font-semibold text-lg leading-tight mb-1">{subject.name}</h3>
                              {subject.description && <p className="text-sm text-muted-foreground line-clamp-2">{subject.description}</p>}
                              <div className="flex items-center gap-1 mt-3 text-primary font-medium text-sm">
                                Open Learning Preview <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Syllabus;


