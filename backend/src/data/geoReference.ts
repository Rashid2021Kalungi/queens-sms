/** ISO 3166-1 alpha-2 → English name */
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "TZ", name: "Tanzania" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
  { code: "BI", name: "Burundi" },
  { code: "SS", name: "South Sudan" },
  { code: "CD", name: "DR Congo" },
  { code: "ZM", name: "Zambia" },
  { code: "MW", name: "Malawi" },
  { code: "MZ", name: "Mozambique" },
  { code: "ZA", name: "South Africa" },
  { code: "ET", name: "Ethiopia" },
  { code: "SO", name: "Somalia" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "OTHER", name: "Other / not listed" },
];

/** Region or district names per country (expand as needed). */
export const DISTRICTS_BY_COUNTRY: Record<string, string[]> = {
  TZ: [
    "Arusha",
    "Dar es Salaam",
    "Dodoma",
    "Geita",
    "Iringa",
    "Kagera",
    "Katavi",
    "Kigoma",
    "Kilimanjaro",
    "Lindi",
    "Manyara",
    "Mara",
    "Mbeya",
    "Mjini Magharibi",
    "Morogoro",
    "Mtwara",
    "Mwanza",
    "Njombe",
    "Pemba North",
    "Pemba South",
    "Rukwa",
    "Ruvuma",
    "Shinyanga",
    "Simiyu",
    "Singida",
    "Songwe",
    "Tabora",
    "Tanga",
  ],
  KE: [
    "Nairobi",
    "Mombasa",
    "Kisumu",
    "Nakuru",
    "Eldoret",
    "Kiambu",
    "Machakos",
    "Kakamega",
    "Meru",
    "Nyeri",
    "Garissa",
    "Bungoma",
  ],
  UG: [
    "Kampala",
    "Wakiso",
    "Mukono",
    "Jinja",
    "Mbarara",
    "Gulu",
    "Lira",
    "Mbale",
    "Arua",
    "Fort Portal",
    "Masaka",
  ],
  RW: ["Kigali", "Southern", "Western", "Northern", "Eastern"],
  BI: ["Bujumbura", "Gitega", "Ngozi", "Muyinga", "Ruyigi"],
  ZM: ["Lusaka", "Copperbelt", "Central", "Eastern", "Northern", "North-Western", "Southern", "Western"],
  MW: ["Central", "Northern", "Southern"],
  SS: ["Central Equatoria", "Eastern Equatoria", "Jonglei", "Lakes", "Northern Bahr el Ghazal", "Unity", "Upper Nile", "Warrap", "Western Bahr el Ghazal", "Western Equatoria"],
  ET: ["Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa", "Gambela", "Harari", "Oromia", "Sidama", "Somali", "Southern Nations", "Tigray"],
  OTHER: ["Not specified"],
};

/** Common nationalities for dropdowns (add more anytime). */
export const NATIONALITIES: string[] = [
  "Afghan",
  "Algerian",
  "American",
  "Angolan",
  "Bangladeshi",
  "British",
  "Burundian",
  "Cameroonian",
  "Chinese",
  "Congolese (DRC)",
  "Egyptian",
  "Ethiopian",
  "Filipino",
  "French",
  "German",
  "Ghanaian",
  "Indian",
  "Kenyan",
  "Malawian",
  "Mozambican",
  "Nigerian",
  "Pakistani",
  "Rwandan",
  "Somali",
  "South African",
  "South Sudanese",
  "Sudanese",
  "Tanzanian",
  "Ugandan",
  "Zambian",
  "Zimbabwean",
  "Other",
].sort((a, b) => a.localeCompare(b));

export function countryNameFromCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const u = code.toUpperCase();
  return COUNTRIES.find((c) => c.code === u)?.name ?? null;
}

export function isKnownCountryCode(code: string): boolean {
  return COUNTRIES.some((c) => c.code === code.toUpperCase());
}

export function districtAllowedForCountry(countryCode: string, district: string): boolean {
  const c = countryCode.toUpperCase();
  const list = DISTRICTS_BY_COUNTRY[c];
  if (!list || list.length === 0) return true;
  return list.some((d) => d.toLowerCase() === district.trim().toLowerCase());
}
