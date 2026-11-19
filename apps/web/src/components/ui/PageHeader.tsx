import { Stack, Text, Title } from "@mantine/core";

type PageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

const PageHeader = ({ title, description, eyebrow }: PageHeaderProps) => (
  <Stack gap={4}>
    {eyebrow && (
      <Text size="xs" c="dimmed">
        {eyebrow}
      </Text>
    )}
    <Title order={2}>{title}</Title>
    <Text size="sm" c="dimmed">
      {description}
    </Text>
  </Stack>
);

export default PageHeader;
