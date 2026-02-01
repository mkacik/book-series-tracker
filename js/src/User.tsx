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
