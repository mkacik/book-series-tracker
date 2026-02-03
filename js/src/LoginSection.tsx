import React from "react";
import { useState } from "react";
import { BackendRoute } from "./Navigation";
import { User } from "./User";

import * as UI from "./UI";

type SetUserHandler = (user: User | null) => void;

function LoginError({ dismiss }: { dismiss: () => void }) {
  const icon = <UI.IconAlertTriangle />;
  return (
    <UI.Alert
      color="red"
      icon={icon}
      title="Login failed"
      withCloseButton
      onClose={dismiss}
      p="xs"
    ></UI.Alert>
  );
}

function LoginForm({ setUser }: { setUser: SetUserHandler }) {
  const [error, setError] = useState<boolean>(false);

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const response = await fetch(BackendRoute.Login, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error();
      }

      const result = await response.json();
      const user = result as { username: string };

      setError(false);
      setUser(new User(user.username));
    } catch (_error) {
      setError(true);
    }
  };

  return (
    <UI.Flex direction="column" gap="md">
      {error && <LoginError dismiss={() => setError(false)} />}
      <form onSubmit={onSubmit}>
        <UI.TextInput label="Username" name="username" />
        <UI.PasswordInput label="Password" name="password" />
        <UI.Space h="xl" />
        <UI.Button type="submit" fullWidth>
          Log In
        </UI.Button>
      </form>
    </UI.Flex>
  );
}

export function LoginSection({ setUser }: { setUser: SetUserHandler }) {
  return (
    <UI.Center>
      <UI.Flex direction="column" gap="md" w="440">
        <UI.Text>Account login</UI.Text>
        <LoginForm setUser={setUser} />
      </UI.Flex>
    </UI.Center>
  );
}

function LogoutButton({ setUser }: { setUser: SetUserHandler }) {
  const logout = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const response = await fetch(BackendRoute.Logout);
    if (response.ok) {
      setUser(new User(null));
    }
  };

  return (
    <UI.Button variant="outline" onClick={logout}>
      Logout
    </UI.Button>
  );
}

export function LogoutSection({
  user,
  setUser,
}: {
  user: User | null;
  setUser: SetUserHandler;
}) {
  const loggedIn = user !== null && user.isLoggedIn();
  if (!loggedIn) {
    return null;
  }

  return (
    <>
      Hi {user.getName()}!
      <LogoutButton setUser={setUser} />
    </>
  );
}
