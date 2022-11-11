export default class Client {
  private accessToken: string | null = null;

  public constructor() {}

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public isAuthenticated(): boolean {
    return this.accessToken != null;
  }
}
