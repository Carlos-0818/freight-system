import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { requireAuth } from "../src/middleware/auth.middleware.js";
import { requireRoles } from "../src/middleware/role.middleware.js";

app.get(
  "/api/rbac-check",
  requireAuth,
  requireRoles("CLERK", "SUPERVISOR"),
  (req, res) => {
    res.status(200).json({
      role: req.user.role,
    });
  },
);

const server = app.listen(0, "127.0.0.1");

try {
  await once(server, "listening");

  const password = process.env.SEED_PASSWORD;

  assert.ok(password, "Missing SEED_PASSWORD.");

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const anonymousResponse = await fetch(`${baseUrl}/api/rbac-check`);

  assert.equal(anonymousResponse.status, 401);
  assert.equal((await anonymousResponse.json()).error.code, "UNAUTHORIZED");

  console.log("Missing token: HTTP 401 PASS");

  const cases = [
    {
      username: "driver01",
      role: "DRIVER",
      expected: 403,
    },
    {
      username: "linehaul01",
      role: "LINEHAUL_DRIVER",
      expected: 403,
    },
    {
      username: "clerk01",
      role: "CLERK",
      expected: 200,
    },
    {
      username: "supervisor01",
      role: "SUPERVISOR",
      expected: 200,
    },
  ];

  let driverToken;

  for (const item of cases) {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: item.username,
        password,
      }),
    });

    assert.equal(loginResponse.status, 200, `Login failed: ${item.username}`);

    const login = await loginResponse.json();

    assert.equal(login.user.role, item.role);
    assert.ok(login.accessToken);

    if (item.username === "driver01") {
      driverToken = login.accessToken;
    }

    const response = await fetch(`${baseUrl}/api/rbac-check`, {
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
      },
    });

    assert.equal(
      response.status,
      item.expected,
      `Unexpected status: ${item.username}`,
    );

    const result = await response.json();

    if (item.expected === 403) {
      assert.equal(result.error.code, "FORBIDDEN");
    } else {
      assert.equal(result.role, item.role);
    }

    console.log(`${item.username}: HTTP ${response.status} PASS`);
  }

  const forgedRoleResponse = await fetch(
    `${baseUrl}/api/rbac-check?role=SUPERVISOR`,
    {
      headers: {
        Authorization: `Bearer ${driverToken}`,
      },
    },
  );

  assert.equal(forgedRoleResponse.status, 403);
  assert.equal((await forgedRoleResponse.json()).error.code, "FORBIDDEN");

  console.log("Client role parameter ignored: HTTP 403 PASS");
  console.log("RBAC verification completed.");
} catch (error) {
  console.error("RBAC verification failed:", error.message);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
}
