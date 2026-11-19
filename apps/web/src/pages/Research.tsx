import { useState, type FormEvent } from "react";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconMessageCircle,
  IconSend,
} from "@tabler/icons-react";
import MathContent from "../components/MathContent";
import PageHeader from "../components/ui/PageHeader";
import { askQuestion } from "../services/ask";

type Answer = Awaited<ReturnType<typeof askQuestion>>;

type Conversation = {
  id: number;
  question: string;
  answer: Answer;
};

const Research = () => {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const answer = await askQuestion({ question: trimmedQuestion });

      setConversations((current) => [
        ...current,
        {
          id: Date.now(),
          question: trimmedQuestion,
          answer,
        },
      ]);

      setQuestion("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate an answer",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg" maw={900}>
      <PageHeader
        title="Research"
        description="Ask questions and explore insights from your uploaded research papers."
      />

      {conversations.length === 0 && (
        <Paper withBorder radius="lg" p="xl">
          <Stack align="center" gap="sm">
            <IconMessageCircle size={32} />
            <Text fw={600}>Start your research</Text>
            <Text c="dimmed" size="sm" ta="center">
              Ask a question about the research papers in your library. Paplet
              will retrieve relevant passages and generate a grounded answer.
            </Text>
          </Stack>
        </Paper>
      )}

      {conversations.map((conversation) => (
        <Stack key={conversation.id} gap="sm">
          <Paper withBorder radius="lg" p="md">
            <Text size="xs" c="dimmed" mb="xs">
              YOUR QUESTION
            </Text>
            <Text fw={500}>{conversation.question}</Text>
          </Paper>

          <Paper withBorder radius="lg" p="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Paplet</Text>
              <Badge
                color={conversation.answer.is_answerable ? "teal" : "gray"}
              >
                {conversation.answer.is_answerable
                  ? "Grounded answer"
                  : "Insufficient evidence"}
              </Badge>
            </Group>

            <MathContent content={conversation.answer.answer} />

            {conversation.answer.citations.length > 0 && (
              <Stack gap="xs" mt="lg">
                <Text fw={600} size="sm">
                  Sources ({conversation.answer.citations.length})
                </Text>

                <Accordion variant="contained">
                  {conversation.answer.citations.map((citation, index) => (
                    <Accordion.Item
                      key={citation.chunkId}
                      value={citation.chunkId}
                    >
                      <Accordion.Control>
                        <Text size="sm">Source {index + 1}</Text>
                      </Accordion.Control>

                      <Accordion.Panel>
                        <Paper
                          p="sm"
                          radius="md"
                          bg="var(--mantine-color-default-hover)"
                        >
                          <Text size="sm">{citation.quote}</Text>
                        </Paper>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Stack>
            )}
          </Paper>
        </Stack>
      ))}

      {error && (
        <Alert
          color="red"
          icon={<IconAlertCircle size={18} />}
          title="Unable to answer"
        >
          {error}
        </Alert>
      )}

      <Paper withBorder radius="lg" p="md">
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <Textarea
              placeholder="Ask a question about your research papers..."
              value={question}
              onChange={(event) => setQuestion(event.currentTarget.value)}
              minRows={3}
              maxRows={7}
              autosize
              disabled={loading}
            />

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Answers are grounded in retrieved paper content.
              </Text>

              <Button
                type="submit"
                leftSection={<IconSend size={16} />}
                loading={loading}
                disabled={!question.trim()}
              >
                Ask Paplet
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
};

export default Research;
