import React from "react";
import { useState } from "react";
import { BackendRoute } from "./Navigation";
import { User } from "./User";

import * as UI from "./UI";

type SetUserHandler = (user: User | null) => void;

function LoginError() {
  const icon = <UI.IconAlertTriangle />;
  return (
    <UI.Alert color="red" icon={icon} title="Could not log in">
      Please double check your username and password and try again.
    </UI.Alert>
  );
}

function LoginButton({ setUser }: { setUser: SetUserHandler }) {
  const [opened, setOpened] = useState<boolean>(false);
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
      console.log("a");

      const result = await response.json();
      const user = result as { username: string };

      console.log("b");
      setError(false);
      console.log("c");
      setOpened(false);
      console.log("d");
      setUser(new User(user.username));
    } catch (_) {
      setError(true);
    }
  };

  return (
    <>
      <UI.Modal
        title="Account login"
        opened={opened}
        onClose={() => setOpened(false)}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <form onSubmit={onSubmit}>
          {error && <LoginError />}
          <UI.TextInput label="Username" name="username" />
          <UI.PasswordInput label="Password" name="password" />
          <UI.Space h="xl" />
          <UI.Button type="submit" fullWidth>
            Log In
          </UI.Button>
        </form>
      </UI.Modal>

      <UI.Button onClick={() => setOpened(true)}>Login</UI.Button>
    </>
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

export function LoginSection({
  user,
  setUser,
}: {
  user: User | null;
  setUser: SetUserHandler;
}) {
  if (user === null) {
    return null;
  }
  if (user.isLoggedIn()) {
    return (
      <>
        Hi {user.getName()}!
        <LogoutButton setUser={setUser} />
      </>
    );
  }
  return <LoginButton setUser={setUser} />;
}
