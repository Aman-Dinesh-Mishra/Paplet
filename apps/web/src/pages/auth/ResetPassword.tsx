import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Anchor,
  Button,
  Center,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { supabase } from "../../lib/supabase";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data.session) {
        throw new Error(
          "Password reset session is invalid or expired. Request a new reset link.",
        );
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage("Your password has been updated successfully.");

      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" p="md">
      <Container size={420} w="100%">
        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <div>
              <Title order={3}>Reset your password</Title>
              <Text size="sm" c="dimmed" mt={4}>
                Enter and confirm your new password.
              </Text>
            </div>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <PasswordInput
                  label="New password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  minLength={8}
                  required
                />

                <PasswordInput
                  label="Confirm password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                  minLength={8}
                  required
                />

                {message && (
                  <Text size="sm" c="teal">
                    {message}
                  </Text>
                )}
                {error && (
                  <Text size="sm" c="red">
                    {error}
                  </Text>
                )}

                <Button type="submit" fullWidth loading={loading}>
                  Update password
                </Button>
              </Stack>
            </form>

            <Anchor component={Link} to="/login" size="sm" ta="center">
              Back to sign in
            </Anchor>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}

export default ResetPassword;
