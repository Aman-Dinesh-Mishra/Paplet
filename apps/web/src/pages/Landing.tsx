import { Link } from "react-router-dom";
import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBook2,
  IconFileSearch,
  IconMessageCircle,
  IconArrowRight,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: IconBook2,
    title: "Research Library",
    description:
      "Upload and organize your research papers in one searchable workspace.",
  },
  {
    icon: IconFileSearch,
    title: "Semantic Search",
    description:
      "Find relevant information across your papers using meaning, not just keywords.",
  },
  {
    icon: IconMessageCircle,
    title: "AI Research Assistant",
    description:
      "Ask questions about your papers and receive grounded answers with citations.",
  },
];

const Landing = () => {
  const { user, loading } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const destination = user ? "/app" : "/login";
  const actionLabel = user ? "Open Workspace" : "Get Started";

  return (
    <Box>
      <Container size="lg">
        <Group justify="space-between" py="lg">
          <Group gap="xs">
            <img src="/paplet.svg" alt="Paplet" width={34} height={34} />
            <Text fw={700} size="xl">
              Paplet
            </Text>
          </Group>

          <Group gap="md">
            <Anchor href="#features" c="dimmed" underline="never">
              Features
            </Anchor>

            <SegmentedControl
              size="sm"
              radius="md"
              value={colorScheme}
              onChange={(value) =>
                setColorScheme(value as "light" | "dark" | "auto")
              }
              data={[
                { value: "light", label: <IconSun size={16} /> },
                { value: "dark", label: <IconMoon size={16} /> },
                { value: "auto", label: <IconDeviceDesktop size={16} /> },
              ]}
            />

            <Button
              component={Link}
              to={destination}
              color="teal"
              radius="md"
              loading={loading}
            >
              {actionLabel}
            </Button>
          </Group>
        </Group>

        <Divider />

        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing={50}
          verticalSpacing={40}
          py={{ base: 60, md: 100 }}
        >
          <Stack justify="center" gap="lg">
            <Text c="teal" fw={600} size="sm">
              YOUR AI-POWERED RESEARCH WORKSPACE
            </Text>

            <Title order={1} size="3rem" lh={1.15}>
              Research papers.
              <Text component="span" c="teal" inherit>
                {" "}
                Clearer answers.
              </Text>
            </Title>

            <Text c="dimmed" size="lg" maw={480}>
              Bring your research papers together, discover relevant information
              and ask questions with AI-powered answers grounded in your
              documents.
            </Text>

            <Group>
              <Button
                component={Link}
                to={destination}
                color="teal"
                size="lg"
                radius="md"
                rightSection={<IconArrowRight size={18} />}
                loading={loading}
              >
                {actionLabel}
              </Button>
            </Group>

            <Text size="xs" c="dimmed">
              Upload. Search. Understand.
            </Text>
          </Stack>

          <Paper radius="lg" p="lg" withBorder shadow="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Your research workspace</Text>
                <Text size="xs" c="teal">
                  PAPLET
                </Text>
              </Group>

              <Paper p="md" radius="md" withBorder>
                <Group gap="sm">
                  <ThemeIcon color="teal" variant="light" size="lg">
                    <IconBook2 size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text fw={500} size="sm">
                      Research Library
                    </Text>
                    <Text size="xs" c="dimmed">
                      Keep your papers organized
                    </Text>
                  </Box>
                </Group>
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={500} mb="sm">
                  Ask your research assistant
                </Text>
                <Paper p="sm" radius="md" bg="var(--mantine-color-default)">
                  <Text size="sm" c="dimmed">
                    What are the key findings in my research papers?
                  </Text>
                </Paper>
                <Group justify="flex-end" mt="sm">
                  <ThemeIcon color="teal" variant="light">
                    <IconMessageCircle size={18} />
                  </ThemeIcon>
                </Group>
              </Paper>

              <Text size="xs" c="dimmed" ta="center">
                A workspace designed around your research.
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        <Divider />

        <Stack id="features" py={60} gap="xl">
          <Stack align="center" gap="xs">
            <Text c="teal" fw={600} size="sm">
              WHAT PAPLET OFFERS
            </Text>
            <Title order={2} ta="center">
              Everything you need to explore research
            </Title>
            <Text c="dimmed" ta="center" maw={550}>
              Move from storing papers to finding and understanding the
              information inside them.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {features.map((feature) => (
              <Paper key={feature.title} p="lg" radius="lg" withBorder>
                <Stack gap="md">
                  <ThemeIcon color="teal" variant="light" size={44} radius="md">
                    <feature.icon size={24} />
                  </ThemeIcon>
                  <Text fw={600}>{feature.title}</Text>
                  <Text c="dimmed" size="sm" lh={1.6}>
                    {feature.description}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>

        <Divider />

        <Group justify="space-between" py="lg">
          <Text size="sm" c="dimmed">
            Paplet — Your AI-powered research workspace.
          </Text>
          <Text size="xs" c="dimmed">
            Built for better research.
          </Text>
        </Group>
      </Container>
    </Box>
  );
};

export default Landing;
