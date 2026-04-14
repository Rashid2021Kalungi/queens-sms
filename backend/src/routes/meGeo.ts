import { Router } from "express";
import {
  COUNTRIES,
  DISTRICTS_BY_COUNTRY,
  NATIONALITIES,
} from "../data/geoReference.js";

export function createMeGeoRouter() {
  const r = Router();

  r.get("/geo/nationalities", (_req, res) => {
    return res.json({ items: NATIONALITIES });
  });

  r.get("/geo/countries", (_req, res) => {
    return res.json({ items: COUNTRIES });
  });

  r.get("/geo/districts", (req, res) => {
    const raw = typeof req.query.country === "string" ? req.query.country.trim() : "";
    const code = raw.toUpperCase();
    if (!/^[A-Z]{2,10}$/.test(code)) {
      return res.status(400).json({ error: "Query `country` must be a country code (e.g. TZ)" });
    }
    const names = DISTRICTS_BY_COUNTRY[code] ?? [];
    return res.json({ items: names.map((name) => ({ name })) });
  });

  return r;
}
