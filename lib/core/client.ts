export default class Client {
  private authorization: string | null = null;

  public constructor() {}

  public setAccessToken(token: string) {
    this.authorization = token;
  }
}
