import type { Express } from "express";
import type { DatabaseSync } from "node:sqlite";
import bcrypt from "bcrypt";
import type { Logger } from "./logger.js";

// add the K2 API routes ----------------------------------------------
export function addRoutes(app: Express, db: DatabaseSync, logger: Logger): void {
    // user registration -------------
    // register a new user (quasi-AUTH)
    app.post("/api/register", async (_req, _res) => {
        try {
            // check that we got a valid req
            const { name, password } = _req.body;
            if (!name || !password) {
                logger.error("Registration failed: both a name and a password are required");
                return _res.status(400).json({
                    error: "Both a name and a password are required for registration.",
                });
            }

            // check that the name we are registering is not already in the users table
            const cleanedName: string = name.trim().toLowerCase(); // bc yes people will do this to impersonate admins...
            if (!cleanedName) {
                logger.error("Registration failed: name was empty after trim");
                return _res.status(400).json({
                    error: "Both a name and a password are required for registration.",
                });
            }

            const exists = db
                .prepare(
                    `
                    SELECT name FROM users WHERE LOWER(name) = LOWER(?)
                                           `
                )
                .get(cleanedName);
            if (exists) {
                logger.error(`Registration failed: name already claimed (${cleanedName})`);
                return _res.status(409).json({
                    error: "This name is already claimed; contact the site admin to reset the password.",
                });
            }

            // hash the user's PW before it enters the DB
            const hashedPw: string = await bcrypt.hash(password, 10);
            const row = db.prepare("SELECT MAX(user_id) AS maxId FROM users").get() as
                { maxId: number | null } | undefined;
            const nextId = (row?.maxId ?? 0) + 1;
            db.prepare(
                `
                   INSERT INTO users (user_id, name, password, registration_date)
                   VALUES (?, ?, ?, datetime('now'))
                   `
            ).run(nextId, name, hashedPw);

            logger.info(`User registered successfully: ${name} (user_id=${nextId})`);
            return _res.json({ success: true });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Registration failed: ${message}`);
            return _res
                .status(500)
                .json({ error: "Registration failed due to an internal error." });
        }
    });

    // login/session mgmt ------------
    // login/cookie endpoint (AUTH)
    app.post("/api/login", async (_req, _res) => {
        try {
            const { name, password } = _req.body;
            if (!name) {
                logger.error("Login failed: a name is required");
                return _res.status(400).json({
                    error: "A name is required to join the chat.",
                });
            }

            const cleanedName: string = name.trim().toLowerCase();
            if (!cleanedName) {
                logger.error("Login failed: name was empty after trim");
                return _res.status(400).json({
                    error: "A name is required to join the chat.",
                });
            }

            const registeredUser = db
                .prepare(`SELECT name, password FROM users WHERE LOWER(name) = LOWER(?)`)
                .get(cleanedName) as { name: string; password: string } | undefined;

            // if the name is not registered, and the user opts not to claim it, pass them a 24hr cookie to chat
            if (!registeredUser) {
                logger.info(`Issued cookie to unregistered user ${name}`);
                _res.cookie("chat_sid", name.trim(), {
                    httpOnly: true,
                    signed: true,
                    sameSite: "lax",
                    maxAge: 24 * 60 * 60 * 1000,
                });
                return _res.json({ success: true });
            }

            // if the user has an incorrect password or no password, reject them
            if (!password || !(await bcrypt.compare(password, registeredUser.password))) {
                logger.error(`Failed login for user ${name}`);
                return _res.status(401).json({
                    error: "wrong password for nickname",
                });
            }

            // if passwords match, log the user in and issue them a 24hr cookie
            logger.info(`Successful logon of user ${name}, issued cookie.`);
            _res.cookie("chat_sid", registeredUser.name, {
                httpOnly: true,
                signed: true,
                sameSite: "lax",
                maxAge: 24 * 60 * 60 * 1000,
            });
            return _res.json({ success: true });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`/api/login failed: ${message}`);
            return _res.status(500).json({
                error: "Failed to validate user logon.",
            });
        }
    });

    // admin login endpoint (AUTH)
    app.post("/api/adminLogin", async (_req, _res) => {});

    // /me endpoint (checks login state via ws/cookie) (AUTH)
    app.get("/api/me", (_req, _res) => {});

    // issue a one-time token so the browser ws can attach a session even if the upgrade req does
    // not carry cookies (e.g. a misconfigured reverse proxy)
    app.get("/api/ws-auth", (_req, _res) => {});

    // announcement API --------------
    // POST a new announcement (AUTH)
    app.post("/api/announcements", (_req, _res) => {});

    // POST a special "system" announcement (for automated announcements) (AUTH)
    app.post("/api/announcements/system", (_req, _res) => {});

    // conversation API --------------
    // get the list of existing convos (AUTH)
    app.get("/api/conversations", (_req, _res) => {});

    // create a new conversation (AUTH)
    app.post("/api/conversations", (_req, _res) => {});

    // fetch the messages in a given convo (returns up to 500 messages) (AUTH)
    app.get("/api/conversations/:conversationId/messages", (_req, _res) => {});

    // fetch convo members (AUTH)
    app.get("/api/conversations/:conversationId/members", (_req, _res) => {});

    // update conversation members (AUTH)
    app.post("/api/conversations/:conversationId/members", (_req, _res) => {});

    // update convo read state (AUTH)
    app.post("/api/conversations/:conversationId/mark-read", (_req, _res) => {});

    // remove memeber(s) from a convo (AUTH)
    app.post("/api/conversations/:conversationId/members/remove", (_req, _res) => {});

    // dms ---------------------------
    // open a new dm with another user (AUTH)
    app.post("/api/conversations/open-dm", (_req, _res) => {});

    // chat tags controls ------------
    // fetch a user's selected chat tag
    app.get("/api/chat-tag-selected", (_req, _res) => {});

    // update a selected chat tag (AUTH)
    app.post("/api/chat-tag-selected", (_req, _res) => {});

    // misc API routes ---------------------------------------------
    // get a list of currently registered users and their relevant info
    app.get("/api/names", (_req, _res) => {
        try {
            const names = db
                .prepare(
                    `
                    SELECT
                        u.user_id AS user_id,
                        u.name AS name,
                        ud.decoration AS decoration,
                        ud.color AS color,
                        ct.tag AS tag,
                        ct.style AS tag_style
                    FROM users u
                    LEFT JOIN user_decoration ud ON ud.user_id = u.user_id
                    LEFT JOIN user_chat_tags uct ON uct.user_id = u.user_id
                    LEFT JOIN chat_tags ct ON ct.tag_id = uct.active_tag
                    ORDER BY u.name COLLATE NOCASE
                    `
                )
                .all();
            return _res.json(names);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`/api/names failed: ${message}`);
            return _res.status(500).json({ error: "Failed to fetch names." });
        }
    });
}
