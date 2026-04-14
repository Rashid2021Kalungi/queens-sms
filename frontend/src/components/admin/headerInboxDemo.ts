export type InboxItem = {
  id: string;
  title: string;
  body: string;
  /** Short relative label, e.g. "2m ago" */
  time: string;
  read: boolean;
};

export const seedNotifications: InboxItem[] = [
  {
    id: "n1",
    title: "Staff meeting",
    body: "Friday 3:00 PM — term reports and attendance policy.",
    time: "12m",
    read: false,
  },
  {
    id: "n2",
    title: "Fee statements",
    body: "Term 2 statements will be published next week.",
    time: "1h",
    read: false,
  },
  {
    id: "n3",
    title: "Sports day",
    body: "Volunteers needed for the scoring desk.",
    time: "3h",
    read: false,
  },
  {
    id: "n4",
    title: "Library inventory",
    body: "Annual stock check scheduled for Block B.",
    read: false,
    time: "1d",
  },
  {
    id: "n5",
    title: "System maintenance",
    body: "Portal may be unavailable Sunday 2:00–4:00 AM.",
    read: false,
    time: "2d",
  },
];

export const seedMessages: InboxItem[] = [
  {
    id: "m1",
    title: "Mrs. Okello",
    body: "Please confirm P.4 field trip headcount by Thursday.",
    time: "8m",
    read: false,
  },
  {
    id: "m2",
    title: "Accounts office",
    body: "Petty cash voucher EXP-1041 awaiting your signature.",
    time: "25m",
    read: false,
  },
  {
    id: "m3",
    title: "Head Teacher",
    body: "Draft timetable changes for next term attached in SMS.",
    time: "1h",
    read: false,
  },
  {
    id: "m4",
    title: "Transport",
    body: "Bus route 2 running 15 minutes late this morning.",
    read: false,
    time: "2h",
  },
  {
    id: "m5",
    title: "Parent — Nambi",
    body: "Requesting appointment regarding learner attendance.",
    read: false,
    time: "4h",
  },
  {
    id: "m6",
    title: "IT support",
    body: "Your printer queue on Floor 2 has been cleared.",
    read: false,
    time: "6h",
  },
  {
    id: "m7",
    title: "Store",
    body: "Science kits delivery signed off — 12 boxes.",
    read: false,
    time: "1d",
  },
  {
    id: "m8",
    title: "Deputy",
    body: "Reminder: submit class observation forms by month end.",
    read: false,
    time: "2d",
  },
];

export function cloneInboxItems(items: InboxItem[]): InboxItem[] {
  return items.map((i) => ({ ...i }));
}
