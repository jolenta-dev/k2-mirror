import { describe, expect, it } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import type { Server } from "node:http";
import { initTables } from "./dbs.js";
import { addRoutes } from "./routes.js";
import type { Logger } from "./logger.js";

type LogEntry = { level: "info" | "error"; message: string };

function createCapturingLogger(): { logger: Logger; entries: LogEntry[] } {
    const entries: LogEntry[] = [];
    return {
        entries,
        logger: {
            info: (message) => entries.push({ level: "info", message }),
            error: (message) => entries.push({ level: "error", message }),
        },
    };
}

async function withTestServer(
    setup: (db: ReturnType<typeof initTables>) => void,
    run: (baseUrl: string, logs: LogEntry[]) => Promise<void>
): Promise<void> {
    const app = express();
    app.use(express.json());
    app.use(cookieParser("k2-test-secret"));
    const db = initTables(":memory:");
    setup(db);
    const { logger, entries } = createCapturingLogger();
    addRoutes(app, db, logger);

    const server = await new Promise<Server>((resolve) => {
        const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("expected a TCP listen address");
    }

    try {
        await run(`http://127.0.0.1:${address.port}`, entries);
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }
}

describe("POST /api/register", () => {
    it("returns success for a valid registration", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual({ success: true });
                expect(logs).toContainEqual({
                    level: "info",
                    message: "User registered successfully: alice (user_id=1)",
                });
            }
        );
    });
});

describe("POST /api/login", () => {
    it("issues a guest cookie for an unregistered name", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "guest" }),
                });

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual({ success: true });
                expect(res.headers.getSetCookie().join(";")).toMatch(/chat_sid=/);
                expect(logs).toContainEqual({
                    level: "info",
                    message: "Issued cookie to unregistered user guest",
                });
            }
        );
    });

    it("logs in a registered user with the correct password", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                const res = await fetch(`${baseUrl}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual({ success: true });
                expect(res.headers.getSetCookie().join(";")).toMatch(/chat_sid=/);
                expect(logs).toContainEqual({
                    level: "info",
                    message: "Successful logon of user alice, issued cookie.",
                });
            }
        );
    });

    it("rejects a registered user with the wrong password", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                const res = await fetch(`${baseUrl}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "nope" }),
                });

                expect(res.status).toBe(401);
                expect(await res.json()).toEqual({ error: "wrong password for nickname" });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Failed login for user alice",
                });
            }
        );
    });

    it("rejects a missing name", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: "secret" }),
                });

                expect(res.status).toBe(400);
                expect(await res.json()).toEqual({
                    error: "A name is required to join the chat.",
                });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Login failed: a name is required",
                });
            }
        );
    });
});

describe("POST /api/adminLogin", () => {
    it("logs in admin with the correct password", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });

                const res = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual({ success: true });
                expect(res.headers.getSetCookie().join(";")).toMatch(/chat_sid=/);
                expect(logs).toContainEqual({
                    level: "info",
                    message: "Successful logon by admin on /adminLogin.",
                });
            }
        );
    });

    it("rejects a missing name or password", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin" }),
                });

                expect(res.status).toBe(400);
                expect(await res.json()).toEqual({
                    error: "Both a name and password are required.",
                });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Attempted null login on /adminLogin.",
                });
            }
        );
    });

    it("rejects a name not in users", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });

                expect(res.status).toBe(400);
                expect(await res.json()).toEqual({ error: "name not found" });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Login blocked for admin on /adminLogin: not found.",
                });
            }
        );
    });

    it("rejects an incorrect password", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });

                const res = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "nope" }),
                });

                expect(res.status).toBe(401);
                expect(await res.json()).toEqual({ error: "Incorrect password" });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Login with incorrect password for admin attempted on /adminLogin.",
                });
            }
        );
    });

    it("rejects a non-admin user", async () => {
        await withTestServer(
            () => {},
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                const res = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                expect(res.status).toBe(403);
                expect(await res.json()).toEqual({ error: "Not Authorized" });
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Unauthorized login attempted by alice on /adminLogin.",
                });
            }
        );
    });
});

describe("POST /api/announcements", () => {
    it("adds a new announcement to the announcements SQLite table", async () => {
        let dbRef: ReturnType<typeof initTables> | undefined;
        await withTestServer(
            (db) => {
                dbRef = db;
            },
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });

                const loginRes = await fetch(`${baseUrl}/api/adminLogin`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "admin", password: "secret" }),
                });
                const cookie = loginRes.headers.getSetCookie().join("; ");

                const res = await fetch(`${baseUrl}/api/announcements`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ message: "hello chat", scope: "global" }),
                });

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual({ success: true });

                const rows = dbRef!
                    .prepare(`SELECT announcement_id, message, sender, scope FROM announcements`)
                    .all() as Array<{
                    announcement_id: number;
                    message: string;
                    sender: number;
                    scope: string;
                }>;
                expect(rows).toEqual([
                    {
                        announcement_id: 1,
                        message: "hello chat",
                        sender: 1,
                        scope: "global",
                    },
                ]);
                expect(logs).not.toContainEqual(expect.objectContaining({ level: "error" }));
            }
        );
    });

    it("rejects a non-admin user attempting to POST", async () => {
        let dbRef: ReturnType<typeof initTables> | undefined;
        await withTestServer(
            (db) => {
                dbRef = db;
            },
            async (baseUrl, logs) => {
                await fetch(`${baseUrl}/api/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });

                const loginRes = await fetch(`${baseUrl}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "alice", password: "secret" }),
                });
                const cookie = loginRes.headers.getSetCookie().join("; ");

                const res = await fetch(`${baseUrl}/api/announcements`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Cookie: cookie,
                    },
                    body: JSON.stringify({ message: "hello chat", scope: "global" }),
                });

                expect(res.status).toBe(403);
                expect(await res.json()).toEqual({ error: "403 forbidden." });
                expect(dbRef!.prepare(`SELECT COUNT(*) AS count FROM announcements`).get()).toEqual(
                    { count: 0 }
                );
                expect(logs).toContainEqual({
                    level: "error",
                    message: "Attempted unauthorized announcement POST by alice",
                });
            }
        );
    });
});

describe("GET /api/names", () => {
    it("returns registered users with decoration and chat tag info", async () => {
        await withTestServer(
            (db) => {
                db.prepare(
                    `INSERT INTO users (user_id, name, password, registration_date)
                     VALUES (1, 'alice', 'hash', datetime('now'))`
                ).run();
                db.prepare(
                    `INSERT INTO users (user_id, name, password, registration_date)
                     VALUES (2, 'bob', 'hash', datetime('now'))`
                ).run();
                db.prepare(
                    `INSERT INTO user_decoration (user_id, decoration, color)
                     VALUES (1, '★', '#ff00aa')`
                ).run();
                db.prepare(
                    `INSERT INTO chat_tags (tag_id, tag, style)
                     VALUES (1, '(VIP)', 'font-weight: bold')`
                ).run();
                db.prepare(
                    `INSERT INTO user_chat_tags (user_id, active_tag)
                     VALUES (1, 1)`
                ).run();
            },
            async (baseUrl, logs) => {
                const res = await fetch(`${baseUrl}/api/names`);

                expect(res.status).toBe(200);
                expect(await res.json()).toEqual([
                    {
                        user_id: 1,
                        name: "alice",
                        decoration: "★",
                        color: "#ff00aa",
                        tag: "(VIP)",
                        tag_style: "font-weight: bold",
                    },
                    {
                        user_id: 2,
                        name: "bob",
                        decoration: null,
                        color: null,
                        tag: null,
                        tag_style: null,
                    },
                ]);
                expect(logs).toEqual([]);
            }
        );
    });
});
