import type { Express, Request, Response } from "express";
import type { DatabaseSync } from "node:sqlite";
import bcrypt from "bcrypt";
import type { Logger } from "./logger.js";

type UserRow = { name: string; password: string };

type NameRow = {
    user_id: number;
    name: string;
    decoration: string | null;
    color: string | null;
    tag: string | null;
    tag_style: string | null;
};

function findUserByName(db: DatabaseSync, name: string): UserRow | undefined {
    return db.prepare(`SELECT name, password FROM users WHERE LOWER(name) = LOWER(?)`).get(name) as
        UserRow | undefined;
}

function issueCookie(res: Response, name: string): void {
    res.cookie("chat_sid", name, {
        httpOnly: true,
        signed: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });
}

// add the K2 API routes ----------------------------------------------
export function addRoutes(app: Express, db: DatabaseSync, logger: Logger): void {
    // user registration -------------
    // register a new user (quasi-AUTH)
    app.post("/api/register", async (_req: Request, _res: Response): Promise<void> => {
        try {
            // check that we got a valid req
            const { name, password }: { name?: string; password?: string } = _req.body;
            if (!name || !password) {
                logger.error("Registration failed: both a name and a password are required");
                _res.status(400).json({
                    error: "Both a name and a password are required for registration.",
                });
                return;
            }

            // check that the name we are registering is not already in the users table
            const cleanedName: string = name.trim().toLowerCase(); // bc yes people will do this to impersonate admins...
            if (!cleanedName) {
                logger.error("Registration failed: name was empty after trim");
                _res.status(400).json({
                    error: "Both a name and a password are required for registration.",
                });
                return;
            }

            const exists: { name: string } | undefined = db
                .prepare(
                    `
                    SELECT name FROM users WHERE LOWER(name) = LOWER(?)
                                           `
                )
                .get(cleanedName) as { name: string } | undefined;
            if (exists) {
                logger.error(`Registration failed: name already claimed (${cleanedName})`);
                _res.status(409).json({
                    error: "This name is already claimed; contact the site admin to reset the password.",
                });
                return;
            }

            // hash the user's PW before it enters the DB
            const hashedPw: string = await bcrypt.hash(password, 10);
            const row: { maxId: number | null } | undefined = db
                .prepare("SELECT MAX(user_id) AS maxId FROM users")
                .get() as { maxId: number | null } | undefined;
            const nextId: number = (row?.maxId ?? 0) + 1;
            db.prepare(
                `
                   INSERT INTO users (user_id, name, password, registration_date)
                   VALUES (?, ?, ?, datetime('now'))
                   `
            ).run(nextId, name, hashedPw);

            logger.info(`User registered successfully: ${name} (user_id=${nextId})`);
            _res.json({ success: true });
            return;
        } catch (err: unknown) {
            const message: string = err instanceof Error ? err.message : String(err);
            logger.error(`Registration failed: ${message}`);
            _res.status(500).json({ error: "Registration failed due to an internal error." });
            return;
        }
    });

    // login/session mgmt ------------
    // login/cookie endpoint (AUTH)
    app.post("/api/login", async (_req: Request, _res: Response): Promise<void> => {
        try {
            const { name, password }: { name?: string; password?: string } = _req.body;
            if (!name) {
                logger.error("Login failed: a name is required");
                _res.status(400).json({
                    error: "A name is required to join the chat.",
                });
                return;
            }

            const cleanedName: string = name.trim().toLowerCase();
            if (!cleanedName) {
                logger.error("Login failed: name was empty after trim");
                _res.status(400).json({
                    error: "A name is required to join the chat.",
                });
                return;
            }

            const registeredUser: UserRow | undefined = findUserByName(db, cleanedName);

            // if the name is not registered, and the user opts not to claim it, pass them a 24hr cookie to chat
            if (!registeredUser) {
                logger.info(`Issued cookie to unregistered user ${name}`);
                issueCookie(_res, name.trim());
                _res.json({ success: true });
                return;
            }

            // if the user has an incorrect password or no password, reject them
            if (!password || !(await bcrypt.compare(password, registeredUser.password))) {
                logger.error(`Failed login for user ${name}`);
                _res.status(401).json({
                    error: "wrong password for nickname",
                });
                return;
            }

            // if passwords match, log the user in and issue them a 24hr cookie
            logger.info(`Successful logon of user ${name}, issued cookie.`);
            issueCookie(_res, registeredUser.name);
            _res.json({ success: true });
            return;
        } catch (err: unknown) {
            const message: string = err instanceof Error ? err.message : String(err);
            logger.error(`/api/login failed: ${message}`);
            _res.status(500).json({
                error: "Failed to validate user logon.",
            });
            return;
        }
    });

    // admin login endpoint (AUTH)
    app.post("/api/adminLogin", async (_req: Request, _res: Response): Promise<void> => {
        try {
            const { name, password }: { name?: string; password?: string } = _req.body;
            if (!name || !password) {
                logger.error(`Attempted null login on /adminLogin.`);
                _res.status(400).json({
                    error: "Both a name and password are required.",
                });
                return;
            }

            const registeredName: UserRow | undefined = findUserByName(db, name);
            if (!registeredName) {
                logger.error(`Login blocked for ${name} on /adminLogin: not found.`);
                _res.status(400).json({
                    error: "name not found",
                });
                return;
            }

            let passwordsMatch: boolean = false;
            try {
                passwordsMatch = await bcrypt.compare(password, registeredName.password);
            } catch {
                logger.error(`Password check failed for ${name} on /adminLogin.`);
                _res.status(500).json({
                    error: "Password check failed",
                });
                return;
            }

            if (!passwordsMatch) {
                logger.error(`Login with incorrect password for ${name} attempted on /adminLogin.`);
                _res.status(401).json({
                    error: "Incorrect password",
                });
                return;
            }

            if (registeredName.name.toLowerCase() !== "admin") {
                logger.error(`Unauthorized login attempted by ${name} on /adminLogin.`);
                _res.status(403).json({
                    error: "Not Authorized",
                });
                return;
            }

            issueCookie(_res, registeredName.name);
            logger.info(`Successful logon by ${name} on /adminLogin.`);
            _res.json({
                success: true,
            });
            return;
        } catch (err: unknown) {
            const message: string = err instanceof Error ? err.message : String(err);
            logger.error(`/api/adminLogin failed: ${message}`);
            _res.status(500).json({
                error: "Failed to validate admin logon.",
            });
            return;
        }
    });

    // /me endpoint (checks login state via ws/cookie) (AUTH)
    app.get("/api/me", (_req: Request, _res: Response): void => {});

    // issue a one-time token so the browser ws can attach a session even if the upgrade req does
    // not carry cookies (e.g. a misconfigured reverse proxy)
    app.get("/api/ws-auth", (_req: Request, _res: Response): void => {});

    // announcement API --------------
    // POST a new announcement (AUTH)
    app.post("/api/announcements", (_req: Request, _res: Response): void => {
        try {
            const name: string = (_req.signedCookies.chat_sid || "").toLowerCase().trim();
            if (name !== "admin") {
                logger.error(`Attempted unauthorized announcement POST by ${name}`);
                _res.status(403).json({ error: "403 forbidden." });
                return;
            }

            const { message, scope }: { message?: string; scope?: string } = _req.body || {};
            if (!message || !String(message).trim()) {
                logger.error(`Failed to send announcement from ${name} due to empty message`);
                _res.status(400).json({ error: "a message is required" });
                return;
            }

            const adminUser: { user_id: number } | undefined = db
                .prepare(`SELECT user_id FROM users WHERE LOWER(name) = LOWER(?)`)
                .get(name) as { user_id: number } | undefined;
            if (!adminUser) {
                logger.error(`Attempted unauthorized announcement POST by ${name}`);
                _res.status(403).json({ error: "403 forbidden." });
                return;
            }

            const normalizedScope: string =
                scope === "public" || scope === "here" ? scope : "global";
            const row: { maxId: number | null } | undefined = db
                .prepare("SELECT MAX(announcement_id) AS maxId FROM announcements")
                .get() as { maxId: number | null } | undefined;
            const nextId: number = (row?.maxId ?? 0) + 1;

            db.prepare(
                `
                   INSERT INTO announcements (announcement_id, message, timestamp, sender, scope)
                   VALUES (?, ?, datetime('now'), ?, ?)
                   `
            ).run(nextId, message.trim(), adminUser.user_id, normalizedScope);

            _res.json({ success: true });
            return;
        } catch (err: unknown) {
            const message: string = err instanceof Error ? err.message : String(err);
            logger.error(`/api/announcements failed: ${message}`);
            _res.status(500).json({ error: "Failed to create announcement." });
            return;
        }
    });

    // POST a special "system" announcement (for automated announcements) (AUTH)
    app.post("/api/announcements/system", (_req: Request, _res: Response): void => {});

    // conversation API --------------
    // get the list of existing convos (AUTH)
    app.get("/api/conversations", (_req: Request, _res: Response): void => {});

    // create a new conversation (AUTH)
    app.post("/api/conversations", (_req: Request, _res: Response): void => {});

    // fetch the messages in a given convo (returns up to 500 messages) (AUTH)
    app.get(
        "/api/conversations/:conversationId/messages",
        (_req: Request, _res: Response): void => {}
    );

    // fetch convo members (AUTH)
    app.get(
        "/api/conversations/:conversationId/members",
        (_req: Request, _res: Response): void => {}
    );

    // update conversation members (AUTH)
    app.post(
        "/api/conversations/:conversationId/members",
        (_req: Request, _res: Response): void => {}
    );

    // update convo read state (AUTH)
    app.post(
        "/api/conversations/:conversationId/mark-read",
        (_req: Request, _res: Response): void => {}
    );

    // remove memeber(s) from a convo (AUTH)
    app.post(
        "/api/conversations/:conversationId/members/remove",
        (_req: Request, _res: Response): void => {}
    );

    // dms ---------------------------
    // open a new dm with another user (AUTH)
    app.post("/api/conversations/open-dm", (_req: Request, _res: Response): void => {});

    // chat tags controls ------------
    // fetch a user's selected chat tag
    app.get("/api/chat-tag-selected", (_req: Request, _res: Response): void => {});

    // update a selected chat tag (AUTH)
    app.post("/api/chat-tag-selected", (_req: Request, _res: Response): void => {});

    // misc API routes ---------------------------------------------
    // get a list of currently registered users and their relevant info
    app.get("/api/names", (_req: Request, _res: Response): void => {
        try {
            const names: NameRow[] = db
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
                .all() as NameRow[];
            _res.json(names);
            return;
        } catch (err: unknown) {
            const message: string = err instanceof Error ? err.message : String(err);
            logger.error(`/api/names failed: ${message}`);
            _res.status(500).json({ error: "Failed to fetch names." });
            return;
        }
    });
}
