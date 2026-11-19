import { z } from "zod";
import { apiFetch } from "./api";

const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(["processing", "ready", "failed"]),
  createdAt: z.string(),
  totalChunks: z.number().int().nonnegative(),
});

const DocumentsResponseSchema = z.object({
  documents: z.array(DocumentSchema),
});

const UploadResponseSchema = z.object({
  document: z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(["processing", "ready", "failed"]),
    created_at: z.string(),
  }),
  totalPages: z.number().int().nonnegative(),
  totalChunks: z.number().int().nonnegative(),
});

export type Document = z.infer<typeof DocumentSchema>;

const getErrorMessage = async (response: Response): Promise<string> => {
  const data = await response.json().catch(() => null);
  return data?.error ?? "Something went wrong";
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await apiFetch("/documents");

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();

  return DocumentsResponseSchema.parse(data).documents;
};

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch("/documents", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: unknown = await response.json();
  const parsed = UploadResponseSchema.parse(data);

  return {
    id: parsed.document.id,
    title: parsed.document.title,
    status: parsed.document.status,
    createdAt: parsed.document.created_at,
    totalChunks: parsed.totalChunks,
  };
};
