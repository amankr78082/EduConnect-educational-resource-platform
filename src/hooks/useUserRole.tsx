import { useState, useEffect } from "react";
import { mysqlClient } from "@/integrations/mysql/client";
import type { User } from "@/integrations/mysql/client";

type AppRole = "admin" | "teacher" | "student" | "maintenance";

export const useUserRole = () => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      const { data, error } = await mysqlClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data) {
        setRoles(data.map((r) => r.role as AppRole));
      }
      setLoading(false);
    };

    const { data: { subscription } } = mysqlClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRoles(session.user.id), 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    mysqlClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher") || isAdmin;
  const isMaintenance = roles.includes("maintenance") || isAdmin;
  const isStudent = roles.includes("student") || roles.length === 0;
  // Anyone who can manage subjects (courses & schemes)
  const canManageSubjects = isAdmin || roles.includes("teacher") || roles.includes("maintenance");

  return { user, roles, isTeacher, isAdmin, isMaintenance, isStudent, canManageSubjects, loading };
};


