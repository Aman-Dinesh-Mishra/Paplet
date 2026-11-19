import { Group, NavLink, Stack, Text } from "@mantine/core";
import { NavLink as RouterNavLink } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconLibrary,
  IconMessageCircle,
} from "@tabler/icons-react";

type SidebarProps = {
  onNavigate: () => void;
};

const Sidebar = ({ onNavigate }: SidebarProps) => {
  return (
    <Stack h="100%" p="md" gap="lg" bg="var(--mantine-color-body)">
      <Group gap="xs">
        <img src="/paplet.svg" alt="" width={30} height={30} />
        <Text fw={600} size="lg">
          Paplet
        </Text>
      </Group>

      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed">
          WORKSPACE
        </Text>

        <NavLink
          component={RouterNavLink}
          to="/app"
          label="Overview"
          leftSection={<IconLayoutDashboard size={18} />}
          color="teal"
          end
          onClick={onNavigate}
        />

        <NavLink
          component={RouterNavLink}
          to="/app/library"
          label="Library"
          leftSection={<IconLibrary size={18} />}
          color="teal"
          end
          onClick={onNavigate}
        />

        <NavLink
          component={RouterNavLink}
          to="/app/research"
          label="Research"
          leftSection={<IconMessageCircle size={18} />}
          color="teal"
          end
          onClick={onNavigate}
        />
      </Stack>
    </Stack>
  );
};

export default Sidebar;
