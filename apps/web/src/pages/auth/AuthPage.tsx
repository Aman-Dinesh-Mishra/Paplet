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
  TextInput,
  Title,
} from "@mantine/core";
import { supabase } from "../../lib/supabase";

function AuthPage() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate("/app");
        } else {
          setMessage(
            "Registration successful. Check your email and confirm your account before logging in.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        navigate("/app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" p="md">
      <Container size={420} w="100%">
        <Stack align="center" mb="xl" gap={6}>
          <Title order={1} c="teal">
            Paplet
          </Title>
          <Text size="sm" c="dimmed">
            Research Paper Intelligence
          </Text>
        </Stack>

        <Paper withBorder p="xl" radius="lg">
          <Stack gap="lg">
            <div>
              <Title order={3}>
                {isRegister ? "Create your account" : "Welcome back"}
              </Title>
              <Text size="sm" c="dimmed" mt={4}>
                {isRegister
                  ? "Create an account to manage your research papers."
                  : "Sign in to continue to your research workspace."}
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

                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  minLength={8}
                  required
                />

                {!isRegister && (
                  <Anchor
                    component={Link}
                    to="/forgot-password"
                    size="sm"
                    ta="right"
                  >
                    Forgot password?
                  </Anchor>
                )}

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
                  {isRegister ? "Create account" : "Sign in"}
                </Button>
              </Stack>
            </form>

            <Text size="sm" ta="center">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <Anchor
                component="button"
                type="button"
                onClick={() => {
                  setIsRegister((current) => !current);
                  setMessage("");
                  setError("");
                }}
              >
                {isRegister ? "Sign in" : "Register"}
              </Anchor>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}

export default AuthPage;
