import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const courses = [
  {
    id: 1,
    title: "MCA Complete Syllabus",
    category: "MCA",
    instructor: "Semester-wise notes, PDFs & quizzes",
    duration: "4 semesters",
    students: 2341,
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=250&fit=crop",
    isPremium: true,
  },
  {
    id: 2,
    title: "B.Tech CSE Syllabus",
    category: "B.Tech",
    instructor: "Programming, DBMS, OS & networks",
    duration: "8 semesters",
    students: 1856,
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop",
    isPremium: false,
  },
  {
    id: 3,
    title: "B.Tech IT Syllabus",
    category: "B.Tech",
    instructor: "Core IT subjects with study material",
    duration: "8 semesters",
    students: 3102,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    isPremium: true,
  },
  {
    id: 4,
    title: "B.Tech AI/ML Syllabus",
    category: "B.Tech",
    instructor: "AI, ML, data science & core CS",
    duration: "8 semesters",
    students: 1245,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
    isPremium: false,
  },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="scroll-mt-24 py-24 bg-secondary/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
              Degree Syllabus
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Start Learning Today
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Browse university-wise MCA and B.Tech syllabus content with semester subjects, notes, previous papers, and quizzes.
            </p>
          </div>
          <Link to="/syllabus">
            <Button variant="outline" className="mt-4 md:mt-0 group">
              View Full Syllabus
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <Link
                to="/syllabus"
                className="block h-full bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {course.isPremium && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-edu-orange text-primary-foreground text-xs font-semibold">
                      Premium
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium">
                    {course.category}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.instructor}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;


