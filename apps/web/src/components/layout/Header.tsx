import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Burger,
  Button,
  Group,
  SegmentedControl,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconLogout,
} from "@tabler/icons-react";
import { useAuth } from "../../context/AuthContext";

type HeaderProps = {
  opened: boolean;
  onToggle: () => void;
};

const Header = ({ opened, onToggle }: HeaderProps) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [health, setHealth] = useState("Checking");
  const [loggingOut, setLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

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

        <Button
          variant="subtle"
          color="red"
          size="sm"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
        >
          Logout
        </Button>
      </Group>
    </Group>
  );
};

export default Header;
