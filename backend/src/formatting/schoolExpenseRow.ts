import { SchoolExpense } from "../models/index.js";
import { safeLocaleDate } from "./localeDate.js";

function formatUgx(amount: number | bigint): string {
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return `UGX ${n.toLocaleString("en-US")}`;
}

export type SchoolExpenseApiRow = {
  id: string;
  type: string;
  amount: string;
  amountUgx: string;
  status: "Paid" | "Due";
  email: string;
  date: string;
};

export function schoolExpenseToApiRow(
  row: InstanceType<typeof SchoolExpense>,
): SchoolExpenseApiRow {
  return {
    id: row.referenceCode,
    type: row.expenseType,
    amount: formatUgx(row.amountUgx),
    amountUgx: String(row.amountUgx),
    status: row.status.toLowerCase() === "paid" ? "Paid" : "Due",
    email: row.contactEmail,
    date: safeLocaleDate(row.expenseDate),
  };
}
