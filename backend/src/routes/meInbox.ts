import { Router } from "express";
import { Op } from "sequelize";
import { UserMessage, UserNotification } from "../models/index.js";

function toIso(d: Date): string {
  return d.toISOString();
}

function serializeNotification(row: UserNotification) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.readAt != null,
    createdAt: toIso(row.createdAt),
  };
}

function serializeMessage(row: UserMessage) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    read: row.readAt != null,
    createdAt: toIso(row.createdAt),
    senderUserId: row.senderUserId,
  };
}

export function createMeInboxRouter() {
  const r = Router();

  r.get("/notifications", async (req, res) => {
    const userId = req.userId!;
    const unreadOnly =
      req.query.unreadOnly === "1" || req.query.unreadOnly === "true";
    try {
      const rows = await UserNotification.findAll({
        where: unreadOnly
          ? { userId, readAt: { [Op.is]: null } }
          : { userId },
        order: [["createdAt", "DESC"]],
      });
      return res.json({ items: rows.map(serializeNotification) });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.get("/notifications/:id", async (req, res) => {
    const userId = req.userId!;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    try {
      const row = await UserNotification.findOne({
        where: { id, userId },
      });
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(serializeNotification(row));
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.patch("/notifications/:id/read", async (req, res) => {
    const userId = req.userId!;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    try {
      const [n] = await UserNotification.update(
        { readAt: new Date() },
        { where: { id, userId } },
      );
      if (n === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.post("/notifications/read-all", async (req, res) => {
    const userId = req.userId!;
    try {
      await UserNotification.update(
        { readAt: new Date() },
        { where: { userId, readAt: { [Op.is]: null } } },
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.get("/messages", async (req, res) => {
    const userId = req.userId!;
    const unreadOnly =
      req.query.unreadOnly === "1" || req.query.unreadOnly === "true";
    try {
      const rows = await UserMessage.findAll({
        where: unreadOnly
          ? { recipientUserId: userId, readAt: { [Op.is]: null } }
          : { recipientUserId: userId },
        order: [["createdAt", "DESC"]],
      });
      return res.json({ items: rows.map(serializeMessage) });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.get("/messages/:id", async (req, res) => {
    const userId = req.userId!;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    try {
      const row = await UserMessage.findOne({
        where: { id, recipientUserId: userId },
      });
      if (!row) return res.status(404).json({ error: "Not found" });
      return res.json(serializeMessage(row));
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.patch("/messages/:id/read", async (req, res) => {
    const userId = req.userId!;
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    try {
      const [n] = await UserMessage.update(
        { readAt: new Date() },
        { where: { id, recipientUserId: userId } },
      );
      if (n === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  r.post("/messages/read-all", async (req, res) => {
    const userId = req.userId!;
    try {
      await UserMessage.update(
        { readAt: new Date() },
        { where: { recipientUserId: userId, readAt: { [Op.is]: null } } },
      );
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  return r;
}
