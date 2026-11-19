import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Anchor,
  Button,
  Center,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { supabase } from "../../lib/supabase";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setMessage(
        "If an account exists for this email, a password reset link will be sent.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to process request",
      );
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
              <Title order={3}>Forgot password?</Title>
              <Text size="sm" c="dimmed" mt={4}>
                Enter your registered email address to receive a password reset
                link.
              </Text>
            </div>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Email address"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
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
                  Send reset link
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

export default ForgotPassword;
