import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  FileInput,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconFileTypePdf,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react";
import PageHeader from "../components/ui/PageHeader";
import {
  getDocuments,
  uploadDocument,
  type Document,
} from "../services/documents";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const Library = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      setError(null);
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The PDF must be 10 MB or smaller.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const uploadedDocument = await uploadDocument(file);

      setDocuments((current) => [
        uploadedDocument,
        ...current.filter((document) => document.id !== uploadedDocument.id),
      ]);

      setFile(null);
      setSuccess(`${uploadedDocument.title} uploaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack gap="lg" maw={1000}>
      <PageHeader
        title="Library"
        description="Upload and manage your research papers."
      />

      <Card withBorder radius="lg" padding="lg">
        <Stack gap="md">
          <Group gap="xs">
            <IconUpload size={20} />
            <Text fw={600}>Upload a research paper</Text>
          </Group>

          <FileInput
            label="Select PDF"
            placeholder="Choose a PDF file"
            accept="application/pdf,.pdf"
            value={file}
            onChange={setFile}
            leftSection={<IconFileTypePdf size={18} />}
            clearable
          />

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              PDF only · Maximum file size 10 MB
            </Text>

            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleUpload}
              disabled={!file || uploading}
              loading={uploading}
            >
              Upload PDF
            </Button>
          </Group>
        </Stack>
      </Card>

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert color="green" title="Upload successful">
          {success}
        </Alert>
      )}

      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={3}>Your papers</Title>
          <Text size="sm" c="dimmed">
            {documents.length} uploaded documents
          </Text>
        </Stack>

        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconRefresh size={16} />}
          onClick={() => void loadDocuments()}
          loading={loading}
        >
          Refresh
        </Button>
      </Group>

      {loading ? (
        <Loader />
      ) : documents.length === 0 ? (
        <Card withBorder radius="lg" padding="xl">
          <Stack align="center" gap="xs">
            <IconFileTypePdf size={28} />
            <Text fw={600}>No papers yet</Text>
            <Text size="sm" c="dimmed">
              Upload your first research paper to get started.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap="sm">
          {documents.map((document) => (
            <Card key={document.id} withBorder radius="lg" padding="md">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <IconFileTypePdf size={24} color="#3ECF8E" />
                  <Stack gap={2}>
                    <Text fw={500} lineClamp={1}>
                      {document.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {document.totalChunks} chunks ·{" "}
                      {new Date(document.createdAt).toLocaleDateString()}
                    </Text>
                  </Stack>
                </Group>

                <Badge
                  color={
                    document.status === "ready"
                      ? "teal"
                      : document.status === "failed"
                        ? "red"
                        : "yellow"
                  }
                >
                  {document.status}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default Library;
