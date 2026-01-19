import React from "react";
import { createContext, useContext } from "react";

export class User {
  username: string | null;

  constructor(username: string | null) {
    this.username = username;
  }

  isLoggedIn() {
    return this.username !== null;
  }

  getName(): string {
    if (this.username === null) {
      throw new Error("Cannot request user name when user is not logged in!");
    }
    return this.username;
  }
}

export const UserContext = createContext<User | null>(null);

export const useUserContext = (): User => {
  const user = useContext(UserContext);
  if (user === null) {
    throw new Error("UserContext requested but not provided");
  }
  return user;
};
