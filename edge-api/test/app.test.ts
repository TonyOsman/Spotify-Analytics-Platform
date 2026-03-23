import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

describe("edge app", () => {
  it("requires auth for /me/summary", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/me/summary" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("supports dev login and session read", async () => {
    const app = await buildApp();
    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/session/dev-login",
      payload: { userId: "test-user", email: "test@example.com" }
    });
    expect(loginResponse.statusCode).toBe(200);
    const cookie = loginResponse.cookies.find((item) => item.name === "app_session");
    expect(cookie).toBeDefined();

    const meResponse = await app.inject({
      method: "GET",
      url: "/auth/session/me",
      cookies: {
        app_session: cookie!.value
      }
    });
    expect(meResponse.statusCode).toBe(200);
    await app.close();
  });

  it("rejects invalid spotify callback state", async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/auth/spotify/callback?state=invalid"
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("exposes OpenAPI contract with key routes", async () => {
    const app = await buildApp();
    const response = await app.inject({ method: "GET", url: "/docs/json" });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { paths: Record<string, unknown> };
    expect(body.paths["/me/summary"]).toBeDefined();
    expect(body.paths["/sync/spotify/start"]).toBeDefined();
    await app.close();
  });
});
