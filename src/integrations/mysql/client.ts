type Filter = { op: string; column: string; value: unknown };
type Order = { column: string; ascending?: boolean };
export type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};
type Session = { user: User } | null;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const SESSION_KEY = "educonnect_mysql_session";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return { data: null, error: payload.error || "Request failed" } as T;
  return payload as T;
}

function getSessionValue(): Session {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSessionValue(session: unknown) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

class MysqlQueryBuilder {
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private selected = "*";
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private values: unknown = null;
  private limitCount: number | null = null;
  private singleMode = false;
  private maybeSingleMode = false;
  private returning = false;
  private countMode: string | null = null;
  private headMode = false;

  constructor(private table: string) {}

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.selected = columns;
    this.countMode = options?.count || null;
    this.headMode = Boolean(options?.head);
    if (this.action !== "select") this.returning = true;
    return this;
  }

  insert(values: unknown) {
    this.action = "insert";
    this.values = values;
    return this;
  }

  update(values: unknown) {
    this.action = "update";
    this.values = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(values: unknown) {
    this.action = "upsert";
    this.values = values;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ op: "in", column, value });
    return this;
  }

  or() {
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push({ op: "gt", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ op: "gte", column, value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push({ op: "lt", column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ op: "lte", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleMode = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    if (this.action === "select") {
      return postJson(`/db/${this.table}/query`, {
        select: this.selected,
        filters: this.filters,
        orders: this.orders,
        limit: this.limitCount,
        single: this.singleMode,
        maybeSingle: this.maybeSingleMode,
        count: this.countMode,
        head: this.headMode,
      });
    }

    return postJson(`/db/${this.table}/mutate`, {
      action: this.action,
      values: this.values,
      filters: this.filters,
      returning: this.returning,
      single: this.singleMode,
      actor_id: getSessionValue()?.user?.id || null,
    });
  }
}

const authListeners = new Set<(event: string, session: unknown) => void>();

function notifyAuth(event: string, session: unknown) {
  authListeners.forEach((listener) => listener(event, session));
}

export const mysqlClient = {
  from(table: string) {
    return new MysqlQueryBuilder(table);
  },

  auth: {
    async getSession() {
      return { data: { session: getSessionValue() }, error: null };
    },

    async getUser() {
      const session = getSessionValue();
      return { data: { user: session?.user || null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: unknown) => void) {
      authListeners.add(callback);
      setTimeout(() => callback("INITIAL_SESSION", getSessionValue()), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(callback),
          },
        },
      };
    },

    async signInWithPassword(credentials: { email: string; password: string }) {
      const response = await postJson<{ data: { session: unknown; user: unknown }; error: string | null }>("/auth/signin", credentials);
      if (!response.error) {
        setSessionValue(response.data.session);
        notifyAuth("SIGNED_IN", response.data.session);
      }
      return response;
    },

    async signUp(options: {
      email: string;
      password: string;
      options?: {
        emailRedirectTo?: string;
        data?: {
          full_name?: string;
          phone?: string;
          gender?: string;
          date_of_birth?: string;
          address?: string;
          university_id?: string;
          course_id?: string;
          branch_id?: string;
          semester?: number | null;
        };
      };
    }) {
      const response = await postJson<{ data: { session: unknown; user: unknown }; error: string | null }>("/auth/signup", {
        email: options.email,
        password: options.password,
        fullName: options.options?.data?.full_name,
        phone: options.options?.data?.phone,
        gender: options.options?.data?.gender,
        dateOfBirth: options.options?.data?.date_of_birth,
        address: options.options?.data?.address,
        universityId: options.options?.data?.university_id,
        courseId: options.options?.data?.course_id,
        branchId: options.options?.data?.branch_id,
        semester: options.options?.data?.semester,
      });
      if (!response.error) {
        setSessionValue(response.data.session);
        notifyAuth("SIGNED_IN", response.data.session);
      }
      return response;
    },

    async signOut() {
      setSessionValue(null);
      notifyAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async signInWithOtp(options: { email: string }) {
      return this.signInWithPassword({ email: options.email, password: "" });
    },

    async verifyOtp(options: { email: string }) {
      return this.signInWithPassword({ email: options.email, password: "" });
    },

    async resetPasswordForEmail() {
      return { data: null, error: null };
    },

    async updateUser() {
      return { data: { user: getSessionValue()?.user || null }, error: null };
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(filePath: string, file?: File) {
          if (!file) return { data: { path: `${bucket}/${filePath}` }, error: null };
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
          return postJson(`/upload`, { bucket, filePath, dataUrl });
        },
        getPublicUrl(filePath: string) {
          return { data: { publicUrl: `/uploads/${bucket}/${filePath}` } };
        },
      };
    },
  },

  async rpc(name: string, params?: unknown) {
    return postJson(`/rpc/${name}`, params || {});
  },

  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    };
  },

  removeChannel() {
    return null;
  },
};


