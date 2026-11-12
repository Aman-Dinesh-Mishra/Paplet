import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
  db: string;
  time: string;
};
export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        console.log("Vite environment:", import.meta.env);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);

        if (!response.ok) {
          throw new Error("API or database connection failed");
        }

        const data: HealthResponse = await response.json();
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <main>
      <h1>Paplet</h1>
      <p>Ask questions about your research papers.</p>

      <section>
        <h2>System Status</h2>

        {loading && <p>Checking connection...</p>}

        {health && (
          <div>
            <p>API: Connected</p>
            <p>Database: {health.db}</p>
            <p>Last checked: {health.time}</p>
          </div>
        )}

        {error && <p>Error: {error}</p>}
      </section>
    </main>
  );
}
