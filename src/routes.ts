import express from "express";

const app = express();

// Katharine routes --------------------------------------------

// user registration -------------
// register a new user (quasi-AUTH)
app.post("/api/register", (_req, _res) => {});

// login/session mgmt ------------
// login/cookie endpoint (AUTH)
app.post("/api/login", async (_req, _res) => {});

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
app.get("/api/names", (_req, _res) => {});
