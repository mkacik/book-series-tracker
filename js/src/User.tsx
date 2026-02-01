export class User {
  username: string | null;

  constructor(username: string | null) {
    // can't trust undefined to not sneak in
    const sanitized = typeof username === "string" ? username : null;
    this.username = sanitized;
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

export type GetUserResult = {
  username: string;
};
