import MathContent from "./components/MathContent.js";
import { useEffect, useState, type FormEvent } from "react";
import {
  AppShell,
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  TextInput,
  Loader,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconSearch,
} from "@tabler/icons-react";
import { searchDocuments } from "./services/search.js";
import type { SearchResponse } from "@paplet/shared";

export default function App() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const dark = useComputedColorScheme("dark") === "dark";

  const [health, setHealth] = useState("Checking");
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const c = {
    bg: dark ? "#111312" : "#F8FAF9",
    surface: dark ? "#191D1A" : "#FFFFFF",
    border: dark ? "#303632" : "#E5EAE7",
    text: dark ? "#EDEFEF" : "#171C19",
    muted: dark ? "#929B95" : "#68736C",
  };

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL;

    if (!url) {
      setHealth("Unavailable");
      return;
    }

    const controller = new AbortController();

    fetch(`${url}/health`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Health check failed");
        return r.json();
      })
      .then((data) =>
        setHealth(data.db === "connected" ? "Connected" : "Unavailable"),
      )
      .catch((err) => {
        if (err.name !== "AbortError") setHealth("Unavailable");
      });

    return () => controller.abort();
  }, []);

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);

    try {
      setResults(
        await searchDocuments({
          query,
          topK: 5,
          ...(documentId.trim() && {
            documentIds: [documentId.trim()],
          }),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      header={{ height: 64 }}
      padding="lg"
      styles={{
        main: { background: c.bg, minHeight: "100vh" },
        header: { background: c.surface, borderColor: c.border },
      }}
    >
      <AppShell.Header>
        <Group
          h="100%"
          px={{ base: "md", sm: "xl" }}
          justify="space-between"
          wrap="nowrap"
        >
          <Group gap={10} wrap="nowrap">
            <img
              src="/paplet.svg"
              alt="Paplet"
              width={32}
              height={32}
              style={{ display: "block", flexShrink: 0 }}
            />
            <Text fw={700} size="lg" c={c.text}>
              Paplet
            </Text>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Badge color={health === "Connected" ? "teal" : "gray"}>
              {health}
            </Badge>

            <SegmentedControl
              size="sm"
              radius="md"
              value={colorScheme}
              onChange={(v) => setColorScheme(v as "light" | "dark" | "auto")}
              data={[
                { value: "light", label: <IconSun size={16} /> },
                { value: "dark", label: <IconMoon size={16} /> },
                { value: "auto", label: <IconDeviceDesktop size={16} /> },
              ]}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack maw={850} mx="auto" gap="xl">
          <Stack gap={4}>
            <Text size="xs" c={c.muted}>
              WORKSPACE / OVERVIEW
            </Text>
            <Text size="xl" fw={700} c={c.text}>
              Research workspace
            </Text>
            <Text size="sm" c={c.muted}>
              Search and retrieve knowledge from your research papers.
            </Text>
          </Stack>

          <Paper
            p="md"
            bg={c.surface}
            withBorder
            style={{ borderColor: c.border }}
          >
            <Text size="xs" c={c.muted}>
              DATABASE STATUS
            </Text>
            <Text fw={600} c={c.text} mt={5}>
              {health}
            </Text>
          </Paper>

          <Paper
            p="lg"
            bg={c.surface}
            withBorder
            style={{ borderColor: c.border }}
          >
            <form onSubmit={handleSearch}>
              <Stack gap="md">
                <Group gap="xs">
                  <IconSearch color="#3ECF8E" size={20} />
                  <Text fw={600} c={c.text}>
                    Semantic search
                  </Text>
                </Group>

                <Textarea
                  label="Ask your research papers"
                  placeholder="How does the proposed system work?"
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                  minRows={3}
                  required
                />

                <TextInput
                  label="Document ID (optional)"
                  placeholder="Enter a document UUID"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.currentTarget.value)}
                />

                <Button
                  type="submit"
                  color="teal"
                  disabled={!query.trim()}
                  loading={loading}
                >
                  Search papers
                </Button>
              </Stack>
            </form>
          </Paper>

          {error && (
            <Text c="red" size="sm">
              {error}
            </Text>
          )}

          {loading && <Loader color="teal" size="sm" />}

          {results && (
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600} c={c.text}>
                  Retrieved passages
                </Text>
                <Badge color="teal">{results.results.length} results</Badge>
              </Group>

              <Text size="xs" c={c.muted}>
                Retrieval time: {results.latencyMs.toFixed(2)} ms
              </Text>

              {results.results.length === 0 && (
                <Text size="sm" c={c.muted}>
                  No matching passages found.
                </Text>
              )}

              {results.results.map((item, i) => (
                <Paper
                  key={item.id}
                  p="md"
                  bg={c.surface}
                  withBorder
                  style={{ borderColor: c.border }}
                >
                  <Group justify="space-between">
                    <Text fw={600} size="sm" c={c.text}>
                      Passage {i + 1}
                    </Text>
                    <Badge color="teal" variant="light">
                      {item.similarity.toFixed(3)}
                    </Badge>
                  </Group>

                  <Text size="xs" c={c.muted} my="xs">
                    Pages {item.pageStart}–{item.pageEnd}
                  </Text>

                  <div style={{ color: c.text, fontSize: 14, lineHeight: 1.7 }}>
                    <MathContent content={item.content} />
                  </div>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
