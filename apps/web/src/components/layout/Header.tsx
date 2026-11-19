import { useEffect, useState } from "react";
import {
  Badge,
  Burger,
  Group,
  SegmentedControl,
  useMantineColorScheme,
} from "@mantine/core";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

type HeaderProps = {
  opened: boolean;
  onToggle: () => void;
};

const Header = ({ opened, onToggle }: HeaderProps) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [health, setHealth] = useState("Checking");

  useEffect(() => {
    const url = import.meta.env.VITE_API_URL;

    if (!url) {
      setHealth("Unavailable");
      return;
    }

    const controller = new AbortController();

    fetch(`${url}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Health check failed");
        }

        return response.json();
      })
      .then((data) => {
        setHealth(data.db === "connected" ? "Connected" : "Unavailable");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setHealth("Unavailable");
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <Group
      h="100%"
      px={{ base: "md", sm: "xl" }}
      justify="space-between"
      wrap="nowrap"
    >
      <Burger
        opened={opened}
        onClick={onToggle}
        hiddenFrom="sm"
        size="sm"
        aria-label="Toggle navigation"
      />

      <Group gap="sm" wrap="nowrap">
        <Badge color={health === "Connected" ? "teal" : "gray"}>{health}</Badge>

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
      </Group>
    </Group>
  );
};

export default Header;
