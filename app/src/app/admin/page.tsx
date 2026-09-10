"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

interface Admin {
  id: string;
  username: string;
  role: string;
}

interface Outlet {
  id: string;
  name: string;
  slug: string;
  property: {
    name: string;
  };
}

export default function DashboardPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [meRes, outletsRes] = await Promise.all([
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/outlets", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!meRes.ok || !outletsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const meData = await meRes.json();
        const outletsData = await outletsRes.json();

        setAdmin(meData.admin);
        setOutlets(outletsData.outlets);
      } catch (err) {
        setError("Failed to load dashboard");
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    router.push("/admin/login");
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.headerRight}>
          <span>{admin?.username}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <h2>Your Outlets</h2>
        <div className={styles.grid}>
          {outlets.map((outlet) => (
            <div
              key={outlet.id}
              className={styles.card}
              onClick={() => router.push(`/admin/outlets/${outlet.id}`)}
            >
              <h3>{outlet.name}</h3>
              <p className={styles.property}>{outlet.property.name}</p>
              <p className={styles.slug}>/{outlet.slug}</p>
              <button>Manage Menu →</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
