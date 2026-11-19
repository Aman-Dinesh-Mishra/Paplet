import { useState, type FormEvent } from "react";
import {
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Loader,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import MathContent from "../components/MathContent";
import PageHeader from "../components/ui/PageHeader";
import { searchDocuments } from "../services/search";
import type { SearchResponse } from "@paplet/shared";

const Overview = () => {
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <Stack maw={850} mx="auto" gap="xl">
      <PageHeader
        eyebrow="WORKSPACE / OVERVIEW"
        title="Research workspace"
        description="Search and retrieve knowledge from your research papers."
      />

      <Paper p="lg" withBorder>
        <form onSubmit={handleSearch}>
          <Stack gap="md">
            <Group gap="xs">
              <IconSearch color="#3ECF8E" size={20} />
              <Text fw={600}>Semantic search</Text>
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
              disabled={!query.trim() || loading}
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
            <Text fw={600}>Retrieved passages</Text>
            <Badge color="teal">{results.results.length} results</Badge>
          </Group>

          <Text size="xs" c="dimmed">
            Retrieval time: {results.latencyMs.toFixed(2)} ms
          </Text>

          {results.results.length === 0 && (
            <Text size="sm" c="dimmed">
              No matching passages found.
            </Text>
          )}

          {results.results.map((item, index) => (
            <Paper key={item.id} p="md" withBorder>
              <Group justify="space-between">
                <Text fw={600} size="sm">
                  Passage {index + 1}
                </Text>
                <Badge color="teal" variant="light">
                  {item.similarity.toFixed(3)}
                </Badge>
              </Group>

              <Text size="xs" c="dimmed" my="xs">
                Pages {item.pageStart}–{item.pageEnd}
              </Text>

              <MathContent content={item.content} />
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default Overview;
