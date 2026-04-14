import { Router } from "express";
import { Op, Sequelize, type WhereOptions } from "sequelize";
import { parseQueryToIsoDate } from "../formatting/localeDate.js";
import { schoolExpenseToApiRow } from "../formatting/schoolExpenseRow.js";
import { SchoolExpense } from "../models/index.js";

/** Strip LIKE wildcards from user input to avoid accidental full scans / injection quirks */
function sanitizeLikeFragment(s: string): string {
  return s.replace(/\\/g, "").replace(/%/g, "").replace(/_/g, "");
}

export function createMeExpensesRouter() {
  const r = Router();

  r.get("/expenses", async (req, res) => {
    try {
      const qRaw =
        typeof req.query.q === "string" ? req.query.q.trim() : "";
      const sortKey = req.query.sortBy;
      const sortColumn =
        sortKey === "id"
          ? "reference_code"
          : sortKey === "status"
            ? "status"
            : "expense_date";
      const sortDir = req.query.sortDir === "asc" ? "ASC" : "DESC";
      const lim = Number.parseInt(String(req.query.limit ?? "100"), 10);
      const limit = Number.isFinite(lim)
        ? Math.min(500, Math.max(1, lim))
        : 100;

      let where: WhereOptions<SchoolExpense> = {};
      if (qRaw.length > 0) {
        const simple = sanitizeLikeFragment(qRaw);
        const iso = parseQueryToIsoDate(qRaw);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const or: any[] = [];
        if (simple.length > 0) {
          const pattern = { [Op.like]: `%${simple}%` };
          or.push(
            { reference_code: pattern },
            { expense_type: pattern },
            { contact_email: pattern },
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("status")),
              Op.like,
              `%${simple.toLowerCase()}%`,
            ),
          );
        }
        if (iso) {
          or.push({ expense_date: iso });
        }
        if (or.length === 0) {
          return res.json({ items: [] });
        }
        where = { [Op.or]: or };
      }

      const rows = await SchoolExpense.findAll({
        where,
        order: [[sortColumn, sortDir]],
        limit,
      });

      return res.json({ items: rows.map(schoolExpenseToApiRow) });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Database unavailable" });
    }
  });

  return r;
}
