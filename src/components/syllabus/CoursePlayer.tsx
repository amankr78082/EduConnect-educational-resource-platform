import { useEffect, useState } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import { trackContentView } from "@/hooks/useContentView";
import { REALTIME_ACTIVITY_EVENT } from "@/hooks/useRealtimeActivity";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  ListChecks,
  Lock,
  PanelLeft,
  PanelLeftClose,
  Play,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  description: string | null;
  is_free: boolean;
}

interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: "notes" | "pdf" | "video";
  file_url: string | null;
  video_url: string | null;
  notes_content: string | null;
  created_at: string;
  subject_id: string;
  unit_id: string | null;
  syllabus_topic_id: string | null;
  approval_status: string | null;
}

interface Unit {
  id: string;
  subject_id: string;
  unit_number: number;
  name: string;
  description: string | null;
}

interface SyllabusTopic {
  id: string;
  unit_id: string;
  title: string;
  topic_order: number;
  description: string | null;
}

interface ContentTopic {
  id: string;
  title: string;
  page_number: number | null;
}

interface CoursePlayerProps {
  subject: Subject;
  userId: string;
  hasPremiumAccess: boolean;
  onBack: () => void;
  initialContentId?: string | null;
  initialPage?: number | null;
}

const parseYouTubeTime = (value: string | null) => {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return null;
  const [, h, m, s] = match;
  const seconds = Number(h || 0) * 3600 + Number(m || 0) * 60 + Number(s || 0);
  return seconds || null;
};

const getYouTubeEmbedUrl = (url: string) => {
  const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&#]+)/);
  if (!videoMatch) return null;

  const params = new URLSearchParams(url.split("?")[1] || "");
  const start = parseYouTubeTime(params.get("start") || params.get("t"));
  const end = parseYouTubeTime(params.get("end"));
  const embedParams = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });
  if (start !== null) embedParams.set("start", String(start));
  if (end !== null) embedParams.set("end", String(end));

  return `https://www.youtube.com/embed/${videoMatch[1]}?${embedParams.toString()}`;
};

const notesMarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="mb-5 border-b border-slate-200 pb-4 text-3xl font-extrabold tracking-normal text-slate-950">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mt-8 mb-3 flex items-center gap-2 text-xl font-extrabold tracking-normal text-slate-950">
      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shadow-sm" />
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mt-6 mb-2 text-lg font-bold tracking-normal text-slate-900">{children}</h3>
  ),
  p: ({ children }: any) => (
    <p className="mb-4 text-[16px] leading-8 text-slate-700">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-5 ml-5 list-disc space-y-2 text-[16px] leading-8 text-slate-700 marker:text-indigo-600">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-5 ml-5 list-decimal space-y-2 text-[16px] leading-8 text-slate-700 marker:font-bold marker:text-indigo-600">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  strong: ({ children }: any) => <strong className="font-bold text-slate-950">{children}</strong>,
  code: ({ children }: any) => (
    <code className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-sm text-indigo-900">{children}</code>
  ),
  pre: ({ children }: any) => (
    <pre className="mb-6 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm leading-7 text-slate-100 shadow-xl">
      {children}
    </pre>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="mb-5 rounded-2xl border-l-4 border-indigo-600 bg-indigo-50 px-5 py-4 text-slate-700">
      {children}
    </blockquote>
  ),
};

const CoursePlayer = ({ subject, userId, hasPremiumAccess, onBack, initialContentId, initialPage }: CoursePlayerProps) => {
  const [contents, setContents] = useState<Content[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [pdfPage, setPdfPage] = useState<number | null>(initialPage ?? null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const [contentRes, unitsRes, topicsRes, viewsRes, bookmarkRes] = await Promise.all([
        mysqlClient.from("content").select("*").eq("subject_id", subject.id).eq("approval_status", "approved").order("created_at", { ascending: true }),
        mysqlClient
          .from("units")
          .select("id, subject_id, unit_number, name, description")
          .eq("subject_id", subject.id)
          .order("unit_number", { ascending: true }),
        mysqlClient.from("syllabus_topics").select("id, unit_id, title, topic_order, description").order("topic_order", { ascending: true }),
        mysqlClient.from("content_views").select("content_id").eq("user_id", userId),
        mysqlClient.from("bookmarks").select("content_id").eq("user_id", userId),
      ]);

      const allContent = (contentRes.data || []) as Content[];
      const allUnits = (unitsRes.data || []) as Unit[];
      const unitIds = new Set(allUnits.map(unit => unit.id));
      const allSyllabusTopics = ((topicsRes.data || []) as SyllabusTopic[]).filter(topic => unitIds.has(topic.unit_id));

      setContents(allContent);
      setUnits(allUnits);
      setSyllabusTopics(allSyllabusTopics);
      setViewedIds(new Set((viewsRes.data || []).map(view => view.content_id)));
      setBookmarkedIds(new Set((bookmarkRes.data || []).map(bookmark => bookmark.content_id)));

      const expanded: Record<string, boolean> = {};
      allUnits.forEach(unit => {
        expanded[unit.id] = true;
      });
      if (allContent.some(item => !item.unit_id)) expanded.__unmapped__ = true;
      setExpandedGroups(expanded);

      const canOpenInitialContent = (item: Content) => {
        if (hasPremiumAccess) return true;
        const unit = item.unit_id ? allUnits.find(entry => entry.id === item.unit_id) : null;
        const topic = item.syllabus_topic_id ? allSyllabusTopics.find(entry => entry.id === item.syllabus_topic_id) : null;
        if (unit?.unit_number === 1) return true;
        if (topic && topic.topic_order <= 2) return true;
        return false;
      };

      const requestedInitial = initialContentId && allContent.find(item => item.id === initialContentId);
      const initial = (requestedInitial && canOpenInitialContent(requestedInitial) ? requestedInitial : null) ||
        allContent.find(canOpenInitialContent) ||
        allContent[0];
      if (initial) {
        setActiveContent(initial);
        if (initialPage) setPdfPage(initialPage);
        trackContentView(initial.id, subject.id);
        setViewedIds(prev => new Set(prev).add(initial.id));
        const { data: topicsData } = await mysqlClient
          .from("content_topics")
          .select("id, title, page_number")
          .eq("content_id", initial.id)
          .order("topic_order");
        setTopics(topicsData || []);
      }

      setLoading(false);
    };

    fetchAll();

    const onActivity = () => fetchAll();
    window.addEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
    return () => window.removeEventListener(REALTIME_ACTIVITY_EVENT, onActivity);
  }, [subject.id, userId, hasPremiumAccess, initialContentId, initialPage]);

  const selectContent = (content: Content) => {
    if (!canAccessContent(content)) {
      toast.error("Premium required", {
        description: `Subscribe to Semester ${subject.semester} to unlock the full ${subject.code} learning pack.`,
        action: { label: "Upgrade", onClick: () => { window.location.href = "/subscription"; } },
      });
      return;
    }
    setActiveContent(content);
    setPdfPage(null);
    trackContentView(content.id, subject.id);
    setViewedIds(prev => new Set(prev).add(content.id));
    mysqlClient
      .from("content_topics")
      .select("id, title, page_number")
      .eq("content_id", content.id)
      .order("topic_order")
      .then(({ data }) => {
        setTopics(data || []);
      });
  };

  const toggleBookmark = async (contentId: string) => {
    if (bookmarkedIds.has(contentId)) {
      await mysqlClient.from("bookmarks").delete().eq("user_id", userId).eq("content_id", contentId);
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
      toast.success("Bookmark removed");
      return;
    }

    await mysqlClient.from("bookmarks").insert({ user_id: userId, content_id: contentId });
    setBookmarkedIds(prev => new Set(prev).add(contentId));
    toast.success("Bookmarked!");
  };

  const navigateContent = (direction: "prev" | "next") => {
    if (!activeContent) return;
    const accessibleContents = contents.filter(canAccessContent);
    const index = accessibleContents.findIndex(item => item.id === activeContent.id);
    const target = direction === "prev" ? accessibleContents[index - 1] : accessibleContents[index + 1];
    if (target) selectContent(target);
  };

  const moduleGroups = units.map(unit => {
    const unitTopics = syllabusTopics
      .filter(topic => topic.unit_id === unit.id)
      .map(topic => ({
        ...topic,
        items: contents.filter(item => item.syllabus_topic_id === topic.id),
      }));

    const looseItems = contents.filter(item => item.unit_id === unit.id && !item.syllabus_topic_id);
    const itemCount = unitTopics.reduce((total, topic) => total + topic.items.length, 0) + looseItems.length;
    const unitViewedCount =
      unitTopics.reduce((total, topic) => total + topic.items.filter(item => viewedIds.has(item.id)).length, 0) +
      looseItems.filter(item => viewedIds.has(item.id)).length;

    return { unit, topics: unitTopics, looseItems, itemCount, viewedCount: unitViewedCount };
  });

  const unmappedItems = contents.filter(item => !item.unit_id);
  const viewedCount = contents.filter(item => viewedIds.has(item.id)).length;
  const progressPct = contents.length > 0 ? Math.round((viewedCount / contents.length) * 100) : 0;
  const currentIdx = activeContent ? contents.findIndex(item => item.id === activeContent.id) : -1;
  const activeSyllabusTopic = activeContent?.syllabus_topic_id
    ? syllabusTopics.find(topic => topic.id === activeContent.syllabus_topic_id)
    : null;
  const activeUnit = activeSyllabusTopic
    ? units.find(unit => unit.id === activeSyllabusTopic.unit_id)
    : activeContent?.unit_id
      ? units.find(unit => unit.id === activeContent.unit_id)
      : null;
  const activeTypeLabel = activeContent?.content_type === "pdf"
    ? "PDF Notes"
    : activeContent?.content_type === "notes"
      ? "Smart Notes"
      : "Video Lecture";
  const activeTopicItems = activeSyllabusTopic
    ? contents.filter(item => item.syllabus_topic_id === activeSyllabusTopic.id)
    : activeUnit
      ? contents.filter(item => item.unit_id === activeUnit.id)
      : [];
  const activeTopicVideos = activeTopicItems.filter(item => item.content_type === "video");
  const activeTopicNotes = activeTopicItems.filter(item => item.content_type === "notes" || item.content_type === "pdf");
  const syllabusTopicCount = syllabusTopics.length;
  const videoCount = contents.filter(item => item.content_type === "video").length;
  const notesCount = contents.filter(item => item.content_type === "notes" || item.content_type === "pdf").length;
  const getContentUnit = (item: Content) => (
    item.unit_id
      ? units.find(unit => unit.id === item.unit_id)
      : item.syllabus_topic_id
        ? units.find(unit => unit.id === syllabusTopics.find(topic => topic.id === item.syllabus_topic_id)?.unit_id)
        : null
  );
  const getContentTopic = (item: Content) => (
    item.syllabus_topic_id ? syllabusTopics.find(topic => topic.id === item.syllabus_topic_id) : null
  );
  const isPreviewContent = (item: Content) => {
    const unit = getContentUnit(item);
    const topic = getContentTopic(item);
    if (unit?.unit_number === 1) return true;
    if (topic && topic.topic_order <= 2) return true;
    return false;
  };
  const canAccessContent = (item: Content) => hasPremiumAccess || isPreviewContent(item);
  const accessibleContents = contents.filter(canAccessContent);
  const accessibleContentCount = accessibleContents.length;
  const accessibleCurrentIdx = activeContent ? accessibleContents.findIndex(item => item.id === activeContent.id) : -1;
  const activeAccessibleTopicVideos = activeTopicVideos.filter(canAccessContent);
  const activeAccessibleTopicNotes = activeTopicNotes.filter(canAccessContent);
  const accessibleVideoFallback = accessibleContents.filter(item => item.content_type === "video");
  const accessibleNotesFallback = accessibleContents.filter(item => item.content_type === "notes" || item.content_type === "pdf");

  const syllabusSheet = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ListChecks className="h-4 w-4" />
          View Syllabus
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white">
          <SheetHeader className="space-y-3 text-left">
            <div className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-100">
              Full Syllabus
            </div>
            <SheetTitle className="text-2xl font-extrabold text-white">{subject.name}</SheetTitle>
            <SheetDescription className="text-slate-300">
              {subject.code} - Semester {subject.semester}. Use this text view to understand the complete unit and topic coverage.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-2xl font-black">{units.length}</p>
              <p className="text-xs text-slate-300">Units</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-2xl font-black">{syllabusTopicCount}</p>
              <p className="text-xs text-slate-300">Topics</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-2xl font-black">{videoCount + notesCount}</p>
              <p className="text-xs text-slate-300">Resources</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-5">
          {moduleGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No syllabus text has been added for this subject yet.
            </div>
          ) : (
            moduleGroups.map(group => (
              <section key={group.unit.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      Unit {group.unit.unit_number}
                    </span>
                    <h3 className="mt-3 text-xl font-extrabold text-slate-950">{group.unit.name}</h3>
                    {group.unit.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{group.unit.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                    {group.topics.length} topics
                  </div>
                </div>

                <div className="space-y-3">
                  {group.topics.map(topic => {
                    const topicVideos = topic.items.filter(item => item.content_type === "video").length;
                    const topicNotes = topic.items.filter(item => item.content_type === "notes" || item.content_type === "pdf").length;

                    return (
                      <div key={topic.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-start gap-3">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {topic.topic_order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold leading-snug text-slate-950">{topic.title}</h4>
                            {topic.description && (
                              <p className="mt-1 text-sm leading-6 text-slate-600">{topic.description}</p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                                {topicVideos} videos
                              </span>
                              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                {topicNotes} notes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {group.topics.length === 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      No topics added under this unit yet.
                    </p>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  const getIcon = (type: string, isActive: boolean) => {
    const className = `h-4 w-4 ${isActive ? "text-white" : "text-current"}`;
    if (type === "video") return <Play className={className} />;
    if (type === "notes") return <BookOpen className={className} />;
    return <FileText className={className} />;
  };

  const downloadNotesAsPdf = () => {
    if (!activeContent) return;
    const printWindow = window.open("", "_blank");
    const notesEl = document.getElementById("notes-content");
    if (!printWindow || !notesEl) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${activeContent.title}</title><style>body{font-family:'Segoe UI',system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 32px;color:#1a1a1a;line-height:1.7}h1{font-size:1.8em;border-bottom:2px solid #4f46e5;padding-bottom:8px}h2{font-size:1.4em;margin-top:1.5em}pre{background:#f4f4f5;padding:16px;border-radius:8px;overflow-x:auto;font-size:.85em;border:1px solid #e4e4e7}code{background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:.9em}pre code{background:none;padding:0}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #d4d4d8;padding:8px 12px;text-align:left}th{background:#f4f4f5;font-weight:600}blockquote{border-left:4px solid #4f46e5;margin:1em 0;padding:.5em 1em;background:#f8f8ff}@media print{body{padding:20px}}</style></head><body><h1>${activeContent.title}</h1>${notesEl.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const renderLessonButton = (item: Content) => {
    const isActive = activeContent?.id === item.id;
    const isViewed = viewedIds.has(item.id);
    const isLocked = !canAccessContent(item);

    return (
      <button
        key={item.id}
        onClick={() => selectContent(item)}
        className={`group w-full rounded-xl border px-3 py-3 text-left transition-all ${
          isActive
            ? "border-indigo-400/60 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/30"
            : isLocked
              ? "border-amber-400/20 bg-slate-900/55 text-slate-400 hover:border-amber-300/50 hover:bg-slate-800"
            : "border-white/5 bg-slate-900/70 text-slate-200 hover:border-indigo-400/40 hover:bg-slate-800"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
              isActive
                ? "bg-white/18 text-white"
                : "bg-slate-800 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-200"
            }`}
          >
            {getIcon(item.content_type, isActive)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`line-clamp-2 text-sm font-semibold leading-snug ${isActive ? "text-white" : isLocked ? "text-slate-400" : "text-slate-100"}`}>
              {item.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {item.content_type === "pdf" ? "PDF" : item.content_type}
              </span>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                  <Lock className="h-3 w-3" /> Premium
                </span>
              ) : isViewed && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isActive ? "text-emerald-100" : "text-emerald-400"}`}>
                  <CheckCircle2 className="h-3 w-3" /> Done
                </span>
              )}
              {!isLocked && !hasPremiumAccess && (
                <span className="text-[11px] font-semibold text-cyan-300">Free preview</span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 dark:bg-slate-950">
      <div
        className={`${sidebarOpen ? "w-[340px] min-w-[300px]" : "w-0 min-w-0"} flex flex-col overflow-hidden border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-all duration-300`}
      >
        <div className="shrink-0 border-b border-slate-800 bg-slate-900 p-4">
          <button onClick={onBack} className="mb-3 flex items-center gap-1 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to syllabus index
          </button>
          <h2 className="font-display text-xl font-bold leading-tight text-white">{subject.name}</h2>
          <p className="mt-1 text-sm text-slate-400">{subject.code} - Semester {subject.semester}</p>
          <div className="mt-4 rounded-xl bg-slate-800/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Course progress</span>
              <span className="font-bold text-indigo-200">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2 bg-slate-700" />
          </div>
          {!hasPremiumAccess && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-50">
              <span className="inline-flex items-center gap-1 font-bold"><Lock className="h-3.5 w-3.5" /> Preview</span>
              <Button size="sm" className="h-7 bg-amber-500 px-3 text-xs text-white hover:bg-amber-600" onClick={() => { window.location.href = "/subscription"; }}>
                Unlock
              </Button>
            </div>
          )}
          <div className="mt-3 [&_button]:w-full [&_button]:border-slate-700 [&_button]:bg-slate-900 [&_button]:text-slate-100 [&_button:hover]:bg-slate-800">
            {syllabusSheet}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-3 p-3">
            {moduleGroups.map(group => (
              <div key={group.unit.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
                <button
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.unit.id]: !prev[group.unit.id] }))}
                  className="w-full px-4 py-4 text-left transition-colors hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 px-2.5 py-1 text-xs font-bold text-white shadow-md shadow-indigo-950/40">
                          U{group.unit.unit_number}
                        </span>
                        <span className="text-sm font-bold leading-tight text-white">{group.unit.name}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                        <span>{group.viewedCount}/{group.itemCount} completed</span>
                        <span>{group.topics.length} topics</span>
                      </div>
                    </div>
                    {expandedGroups[group.unit.id] ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedGroups[group.unit.id] && (
                  <div className="space-y-3 border-t border-slate-800 bg-slate-950/60 p-3">
                    {group.topics.map((topic, topicIndex) => (
                      <div key={topic.id} className="rounded-xl bg-slate-950 p-2 ring-1 ring-white/5">
                        <div className="mb-2 flex items-start gap-2 px-1">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                            {topicIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-snug text-slate-100">{topic.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{topic.items.length} lessons</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {topic.items.length > 0 ? (
                            topic.items.map(renderLessonButton)
                          ) : (
                            <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                              No notes or videos added yet
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {group.looseItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="px-1 text-xs font-semibold text-slate-400">Unit resources</p>
                        {group.looseItems.map(renderLessonButton)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {unmappedItems.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border bg-background/70 shadow-sm">
                <button
                  onClick={() => setExpandedGroups(prev => ({ ...prev, __unmapped__: !prev.__unmapped__ }))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/30"
                >
                  <span className="text-sm font-bold">Extra Resources</span>
                  {expandedGroups.__unmapped__ ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {expandedGroups.__unmapped__ && <div className="space-y-2 border-t border-border/60 p-3">{unmappedItems.map(renderLessonButton)}</div>}
              </div>
            )}

            {contents.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">No content added yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-[4.5rem] z-10 rounded-r-lg border border-slate-700 bg-slate-900 p-1.5 text-white shadow-lg transition-colors hover:bg-slate-800"
        style={{ left: sidebarOpen ? "340px" : "0px" }}
      >
        {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </button>

      <div className="flex flex-1 flex-col overflow-hidden">
        {activeContent && (
          <div className="shrink-0 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 font-semibold text-white">Learning</span>
                  <span className="font-medium">{subject.code}</span>
                  {activeUnit && <span className="font-medium">Unit {activeUnit.unit_number}</span>}
                  {activeSyllabusTopic && <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{activeSyllabusTopic.title}</span>}
                </div>
                <h1 className="truncate text-xl font-extrabold tracking-normal text-slate-950 dark:text-white">{activeContent.title}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {syllabusSheet}
                <Button variant="outline" size="sm" disabled={accessibleCurrentIdx <= 0} onClick={() => navigateContent("prev")}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={accessibleCurrentIdx >= accessibleContentCount - 1} onClick={() => navigateContent("next")}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleBookmark(activeContent.id)}
                  className={bookmarkedIds.has(activeContent.id) ? "text-amber-500 hover:text-amber-600" : ""}
                >
                  {bookmarkedIds.has(activeContent.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!activeContent ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Play className="mx-auto mb-4 h-16 w-16 opacity-20" />
                <p className="text-lg font-medium">Select a lesson from the sidebar</p>
                <p className="text-sm">Choose any video, notes, or PDF to start learning</p>
              </div>
            </div>
          ) : (
            <div>
              {activeContent.content_type === "video" && activeContent.video_url && (
                <div className="bg-slate-950 px-4 py-4 md:px-6 md:py-5">
                  {getYouTubeEmbedUrl(activeContent.video_url) ? (
                    <div className="mx-auto aspect-video max-w-6xl overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl shadow-slate-950/40">
                      <iframe
                        src={getYouTubeEmbedUrl(activeContent.video_url)!}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={activeContent.title}
                      />
                    </div>
                  ) : (
                    <div className="mx-auto flex aspect-video max-w-6xl items-center justify-center rounded-2xl border border-slate-800 bg-black">
                      <div className="text-center">
                        <Video className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                        <Button asChild>
                          <a href={activeContent.video_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Open Video
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeContent.content_type === "video" && (
                <div className="bg-slate-100 px-4 py-4 dark:bg-slate-950 md:px-6">
                  <div className="mx-auto grid max-w-6xl gap-3 xl:grid-cols-[1.15fr_.85fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Topic Learning Pack</p>
                          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                            {activeSyllabusTopic?.title || activeContent.title}
                          </h2>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          {activeTopicItems.length || 1} resources
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(activeAccessibleTopicNotes.length ? activeAccessibleTopicNotes : accessibleNotesFallback.slice(0, 2)).map(item => (
                          <button
                            key={item.id}
                            onClick={() => selectContent(item)}
                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/60"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
                              {item.content_type === "pdf" ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-bold text-slate-950 dark:text-white">{item.title}</p>
                              <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{item.content_type === "pdf" ? "PDF Notes" : "Smart Notes"}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Up next</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        {accessibleContents.slice(accessibleCurrentIdx + 1, accessibleCurrentIdx + 5).map(item => (
                          <button
                            key={item.id}
                            onClick={() => selectContent(item)}
                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {getIcon(item.content_type, false)}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
                              <p className="text-xs uppercase text-slate-500">{item.content_type}</p>
                            </div>
                          </button>
                        ))}
                        {accessibleContents.slice(accessibleCurrentIdx + 1, accessibleCurrentIdx + 5).length === 0 && (
                          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950">No next lesson available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeContent.content_type === "notes" && activeContent.notes_content && (
                <div className="bg-gradient-to-b from-slate-100 to-white px-4 py-6 md:px-8 md:py-8">
                  <div className="mx-auto max-w-6xl">
                    <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl shadow-slate-900/20">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-100">
                              Smart Notes
                            </span>
                            {activeUnit && (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                                Unit {activeUnit.unit_number}
                              </span>
                            )}
                          </div>
                          <h2 className="text-2xl font-extrabold tracking-normal text-white md:text-3xl">{activeContent.title}</h2>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                            Read the mapped topic notes, revise key points, and download a clean PDF copy from the same place.
                          </p>
                        </div>
                        {activeContent.file_url ? (
                          <Button asChild size="lg" className="shrink-0 bg-white text-slate-950 hover:bg-slate-100">
                            <a href={activeContent.file_url} download target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Download PDF
                            </a>
                          </Button>
                        ) : (
                          <Button size="lg" onClick={downloadNotesAsPdf} className="shrink-0 bg-white text-slate-950 hover:bg-slate-100">
                            <Download className="mr-2 h-4 w-4" /> Save Notes
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <article id="notes-content" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-10">
                        <ReactMarkdown components={notesMarkdownComponents}>{activeContent.notes_content}</ReactMarkdown>
                      </article>

                      <aside className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Topic Pack</p>
                          <h3 className="mt-1 text-lg font-extrabold text-slate-950">{activeSyllabusTopic?.title || "Subject Resources"}</h3>
                          <div className="mt-4 space-y-2">
                            {(activeAccessibleTopicVideos.length ? activeAccessibleTopicVideos : accessibleVideoFallback.slice(0, 3)).map(item => (
                              <button
                                key={item.id}
                                onClick={() => selectContent(item)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                              >
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose-500 text-white">
                                  <Play className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-sm font-bold text-slate-950">{item.title}</p>
                                  <p className="text-xs font-semibold uppercase text-slate-500">Video</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progress</p>
                          <div className="mt-3 flex items-end justify-between">
                            <span className="text-3xl font-black text-slate-950">{progressPct}%</span>
                            <span className="text-xs font-semibold text-slate-500">{viewedCount}/{contents.length} done</span>
                          </div>
                          <Progress value={progressPct} className="mt-3 h-2" />
                        </div>
                      </aside>
                    </div>
                  </div>
                </div>
              )}

              {activeContent.content_type === "pdf" && activeContent.file_url && (
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1">
                    <iframe
                      key={`${activeContent.id}-${pdfPage ?? "start"}`}
                      src={`${activeContent.file_url}${pdfPage ? `#page=${pdfPage}` : ""}`}
                      className="h-[70vh] w-full"
                      title={activeContent.title}
                    />
                    <div className="border-t border-border p-4 text-center">
                      <Button asChild variant="outline">
                        <a href={`${activeContent.file_url}${pdfPage ? `#page=${pdfPage}` : ""}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
                        </a>
                      </Button>
                    </div>
                  </div>

                  {topics.length > 0 && (
                    <div className="max-h-[70vh] overflow-y-auto border-l border-border bg-muted/20 p-4 lg:w-72">
                      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                        <BookOpen className="h-4 w-4 text-primary" /> PDF Index
                      </h3>
                      <div className="space-y-1">
                        {topics.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => setPdfPage(topic.page_number || 1)}
                            className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              pdfPage === topic.page_number ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                            }`}
                          >
                            <div className="font-medium leading-tight">{topic.title}</div>
                            {topic.page_number && (
                              <div className={`text-xs ${pdfPage === topic.page_number ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                Page {topic.page_number}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeContent.description && (
                <div className="border-t border-border px-6 py-4">
                  <p className="text-sm text-muted-foreground">{activeContent.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;


