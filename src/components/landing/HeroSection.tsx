import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Radio, ExternalLink, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { mysqlClient } from "@/integrations/mysql/client";
import heroImage from "@/assets/hero-students.jpg";

interface LiveSessionData {
  title: string;
  meet_link: string;
  description: string | null;
}

interface HeroStats {
  students: number | null;
  videos: number | null;
  teachers: number | null;
}

const formatStat = (value: number | null) => {
  if (value === null) return "...";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(".0", "")}K+`;
  return value.toString();
};

const HeroSection = () => {
  const [liveSession, setLiveSession] = useState<LiveSessionData | null>(null);
  const [stats, setStats] = useState<HeroStats>({
    students: null,
    videos: null,
    teachers: null,
  });

  useEffect(() => {
    const fetchLive = async () => {
      const { data } = await mysqlClient
        .from("live_sessions")
        .select("title, meet_link, description")
        .eq("is_live", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setLiveSession(data);
      }
    };
    fetchLive();

    const fetchStats = async () => {
      try {
        const [studentsResult, videosResult, teachersResult] = await Promise.all([
          mysqlClient.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
          mysqlClient.from("content").select("id", { count: "exact", head: true }).eq("content_type", "video"),
          mysqlClient.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
        ]);

        setStats({
          students: studentsResult.count ?? 0,
          videos: videosResult.count ?? 0,
          teachers: teachersResult.count ?? 0,
        });
      } catch (error) {
        console.error("[HeroSection] Failed to load homepage stats", error);
        setStats({ students: 0, videos: 0, teachers: 0 });
      }
    };
    fetchStats();

    const channel = mysqlClient
      .channel("hero-live-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, () => {
        fetchLive();
      })
      .subscribe();

    return () => {
      mysqlClient.removeChannel(channel);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-90" />

      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      <div className="absolute top-20 right-20 w-72 h-72 bg-edu-teal/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-edu-orange/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="container relative z-10 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground/90 text-sm font-medium mb-6 border border-primary-foreground/20"
            >
              Welcome to the Future of Learning
            </motion.span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Learn Smarter with{" "}
              <span className="relative">
                <span className="relative z-10">EduConnect</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-edu-teal/40 -z-0" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto lg:mx-0 font-body">
              Your one-stop platform for syllabus-based content, live classes, quizzes, and direct teacher interaction.
              Built for B.Tech, MCA, MBA students.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex items-center gap-8 justify-center lg:justify-start"
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{formatStat(stats.students)}</p>
                <p className="text-sm text-primary-foreground/70">Active Students</p>
              </div>
              <div className="w-px h-12 bg-primary-foreground/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{formatStat(stats.videos)}</p>
                <p className="text-sm text-primary-foreground/70">Video Lessons</p>
              </div>
              <div className="w-px h-12 bg-primary-foreground/20" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{formatStat(stats.teachers)}</p>
                <p className="text-sm text-primary-foreground/70">Expert Teachers</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-accent opacity-20 rounded-3xl blur-2xl transform rotate-6" />
              <img
                src={heroImage}
                alt="Students learning together on EduConnect platform"
                className="relative rounded-3xl shadow-2xl border border-primary-foreground/10"
              />

              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6"
              >
                {liveSession ? (
                  <a
                    href={liveSession.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card p-4 rounded-2xl shadow-elevated block hover:scale-105 transition-transform cursor-pointer border-2 border-red-400/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center relative">
                        <Radio className="w-5 h-5 text-white animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          Live Now
                        </p>
                        <p className="text-sm text-muted-foreground max-w-[160px] truncate">{liveSession.title}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground ml-1" />
                    </div>
                  </a>
                ) : (
                  <div className="glass-card p-4 rounded-2xl shadow-elevated">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                        <Video className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Live Classes</p>
                        <p className="text-sm text-muted-foreground">Join anytime</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -top-4 -right-4 glass-card p-4 rounded-2xl shadow-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center">
                    <span className="text-lg">🎓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">RGPV Syllabus</p>
                    <p className="text-sm text-muted-foreground">MCA • B.Tech • MBA</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;


