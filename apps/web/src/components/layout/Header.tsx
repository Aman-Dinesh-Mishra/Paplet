import { useState } from "react";
import {
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type HeaderProps = {
  opened: boolean;
  onToggle: () => void;
};

const Header = ({ opened, onToggle }: HeaderProps) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
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
          color="gray"
          size="sm"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          loading={loggingOut}
        >
          Logout
        </Button>
      </Group>
    </Group>
  );
};

export default Header;
