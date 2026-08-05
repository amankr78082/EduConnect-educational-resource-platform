import { useEffect, useState } from "react";
import type { User } from "@/integrations/mysql/client";
import { mysqlClient } from "@/integrations/mysql/client";

export const useAuthReady = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let sessionResolved = false;

    const applySession = (nextUser: User | null, markReady = false) => {
      if (!isMounted) return;

      setUser(nextUser);

      if (markReady || sessionResolved) {
        setIsReady(true);
      }
    };

    const {
      data: { subscription },
    } = mysqlClient.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    mysqlClient.auth.getSession().then(({ data: { session } }) => {
      sessionResolved = true;
      applySession(session?.user ?? null, true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isReady,
  };
};

