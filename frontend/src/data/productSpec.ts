/** Demo learner rows for dashboard cards; replace with API when endpoints exist */

export type DemoLearner = {
  title: string;
  name: string;
  gender: string;
  roll: string;
  admissionId: string;
  admissionDate: string;
  className: string;
  section: string;
};

export const demoLearners: DemoLearner[] = [
  {
    title: "Learner profile 01",
    name: "Nakato Grace A.",
    gender: "Female",
    roll: "12",
    admissionId: "QJS-2024-0142",
    admissionDate: "Feb 12, 2024",
    className: "P.4",
    section: "East",
  },
  {
    title: "Learner profile 02",
    name: "Mugisha Daniel K.",
    gender: "Male",
    roll: "08",
    admissionId: "QJS-2023-0098",
    admissionDate: "Jan 22, 2023",
    className: "P.6",
    section: "West",
  },
];
