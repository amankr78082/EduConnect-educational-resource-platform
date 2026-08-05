import { motion } from "framer-motion";
import {
  BookOpen,
  Video,
  Trophy,
  Users,
  CreditCard,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: BookOpen,
    title: "Syllabus-Based Content",
    description: "Access semester-wise notes, PDFs, and study materials aligned with your university curriculum.",
    color: "bg-edu-indigo",
    href: "/syllabus",
  },
  {
    icon: Video,
    title: "Live Classes",
    description: "Join interactive live sessions with expert teachers via integrated video conferencing.",
    color: "bg-edu-teal",
    href: "/dashboard",
  },
  {
    icon: Trophy,
    title: "Quizzes & Leaderboard",
    description: "Test your knowledge with daily quizzes and compete on the real-time leaderboard.",
    color: "bg-edu-orange",
    href: "/quizzes",
  },
  {
    icon: Users,
    title: "Teacher Interaction",
    description: "Connect directly with subject matter experts for personalized guidance and doubt clearing.",
    color: "bg-edu-indigo-light",
    href: "/chat",
  },
  {
    icon: CreditCard,
    title: "Freemium Model",
    description: "Start with free basic content and upgrade to premium for full access to all materials.",
    color: "bg-edu-teal-light",
    href: "/subscription",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data is protected with industry-standard security and role-based access control.",
    color: "bg-edu-indigo-dark",
    href: "/auth",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="scroll-mt-24 py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Why Choose EduConnect?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{" "}
            <span className="text-gradient">Excel</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From comprehensive study materials to live interactions with teachers,
            we provide all the tools you need for academic success.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <Link
                to={feature.href}
                className="block h-full p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;


