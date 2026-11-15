// Goal planner: future cost, monthly/daily saving needed, and government options.
// Facts summarised from nsiindia.gov.in, indiapost.gov.in, mudra.org.in, kviconline.gov.in,
// scholarships.gov.in, standupmitra.in. Interest rates on small savings are reset by the
// government every quarter, so the plan uses a conservative assumed rate and says so.

export type GoalType = "education" | "marriage" | "business" | "home" | "vehicle" | "health" | "other";

export type GoalInput = {
  type: GoalType;
  target_today: number; // cost in today's rupees
  years: number;
  already_saved?: number;
  monthly_income?: number;
  for_daughter?: boolean;
  child_age?: number | null;
};

export type GoalOption = {
  id: string;
  name: { en: string; hi: string };
  what: { en: string; hi: string };
  where: string; // official site
  fit: "best" | "good" | "loan";
};

// Typical cost growth per year for each goal type (conservative assumptions).
const INFLATION: Record<GoalType, number> = {
  education: 0.1,
  marriage: 0.07,
  business: 0.06,
  home: 0.07,
  vehicle: 0.05,
  health: 0.1,
  other: 0.06,
};

const ASSUMED_RETURN = 0.07; // safe government savings, conservative

const OPTIONS: Record<string, GoalOption> = {
  ssy: {
    id: "ssy",
    name: { en: "Sukanya Samriddhi Yojana", hi: "सुकन्या समृद्धि योजना" },
    what: {
      en: "Government savings account for a daughter under 10. From ₹250 a year, up to ₹1.5 lakh. Deposit for 15 years; money can be used for her education after 18, matures at 21. Tax-free. Open at a post office or bank.",
      hi: "10 साल से छोटी बेटी के लिए सरकारी बचत खाता। साल में ₹250 से ₹1.5 लाख तक। 15 साल जमा; 18 के बाद पढ़ाई के लिए निकाल सकते हैं, 21 पर पूरा। टैक्स-फ़्री। डाकघर या बैंक में खुलता है।",
    },
    where: "nsiindia.gov.in",
    fit: "best",
  },
  rd: {
    id: "rd",
    name: { en: "Post Office Recurring Deposit (RD)", hi: "डाकघर आवर्ती जमा (RD)" },
    what: {
      en: "Save a fixed amount every month from ₹100, for 5 years. Government-backed. Good for goals 1–5 years away.",
      hi: "हर महीने ₹100 से तय रकम जमा, 5 साल के लिए। सरकार की गारंटी। 1–5 साल के लक्ष्य के लिए अच्छा।",
    },
    where: "indiapost.gov.in",
    fit: "good",
  },
  ppf: {
    id: "ppf",
    name: { en: "Public Provident Fund (PPF)", hi: "लोक भविष्य निधि (PPF)" },
    what: {
      en: "Long-term government savings, 15 years. From ₹500 a year. Tax-free. Good for goals 10+ years away.",
      hi: "लंबी अवधि की सरकारी बचत, 15 साल। साल में ₹500 से। टैक्स-फ़्री। 10+ साल के लक्ष्य के लिए।",
    },
    where: "indiapost.gov.in",
    fit: "good",
  },
  mudra: {
    id: "mudra",
    name: { en: "PM Mudra Yojana loan", hi: "PM मुद्रा योजना लोन" },
    what: {
      en: "Business loan without collateral from banks: Shishu up to ₹50,000, Kishore up to ₹5 lakh, Tarun up to ₹10 lakh. No agent or fee needed.",
      hi: "बिना गारंटी बैंक से बिज़नेस लोन: शिशु ₹50,000 तक, किशोर ₹5 लाख तक, तरुण ₹10 लाख तक। किसी एजेंट या फ़ीस की ज़रूरत नहीं।",
    },
    where: "mudra.org.in",
    fit: "loan",
  },
  pmegp: {
    id: "pmegp",
    name: { en: "PMEGP (subsidy for new business)", hi: "PMEGP (नए बिज़नेस पर सब्सिडी)" },
    what: {
      en: "Government gives 15–35% of project cost as subsidy for a new small business; bank gives the rest as loan. Apply online.",
      hi: "नए छोटे बिज़नेस की लागत का 15–35% सरकार सब्सिडी देती है; बाकी बैंक लोन। ऑनलाइन आवेदन।",
    },
    where: "kviconline.gov.in",
    fit: "loan",
  },
  standup: {
    id: "standup",
    name: { en: "Stand-Up India", hi: "स्टैंड-अप इंडिया" },
    what: {
      en: "Bank loans of ₹10 lakh to ₹1 crore for women and SC/ST entrepreneurs starting a new business.",
      hi: "महिलाओं और SC/ST उद्यमियों के नए बिज़नेस के लिए ₹10 लाख से ₹1 करोड़ तक बैंक लोन।",
    },
    where: "standupmitra.in",
    fit: "loan",
  },
  scholarship: {
    id: "scholarship",
    name: { en: "National Scholarship Portal", hi: "राष्ट्रीय छात्रवृत्ति पोर्टल" },
    what: {
      en: "Central and state scholarships for school and college students, based on income and category. Free to apply.",
      hi: "स्कूल और कॉलेज के छात्रों के लिए केंद्र और राज्य की छात्रवृत्तियाँ, आय और वर्ग के आधार पर। आवेदन मुफ़्त।",
    },
    where: "scholarships.gov.in",
    fit: "good",
  },
  vidyalaxmi: {
    id: "vidyalaxmi",
    name: { en: "PM Vidyalaxmi education loan", hi: "PM विद्यालक्ष्मी शिक्षा लोन" },
    what: {
      en: "Education loans for college through one government portal, with interest help for lower-income families.",
      hi: "कॉलेज की पढ़ाई के लिए एक सरकारी पोर्टल से शिक्षा लोन, कम आय वाले परिवारों को ब्याज में मदद।",
    },
    where: "pmvidyalaxmi.co.in",
    fit: "loan",
  },
  pmjjby: {
    id: "pmjjby",
    name: { en: "PM Jeevan Jyoti Bima (protect the goal)", hi: "PM जीवन ज्योति बीमा (लक्ष्य की सुरक्षा)" },
    what: {
      en: "₹2 lakh life cover for ₹436 a year, so the family can still reach the goal if something happens to you.",
      hi: "₹436 साल में ₹2 लाख का जीवन बीमा, ताकि आपको कुछ हो जाए तो भी परिवार लक्ष्य तक पहुँचे।",
    },
    where: "jansuraksha.gov.in",
    fit: "good",
  },
};

const r100 = (n: number) => Math.ceil(n / 100) * 100;
const r10 = (n: number) => Math.ceil(n / 10) * 10;

/** Monthly deposit needed to reach `fv` in `months` at monthly rate `r`, starting from `pv`. */
function monthlyNeeded(fv: number, pv: number, months: number, r: number) {
  const grownPv = pv * Math.pow(1 + r, months);
  const remaining = Math.max(0, fv - grownPv);
  if (months <= 0) return remaining;
  if (r === 0) return remaining / months;
  return (remaining * r) / (Math.pow(1 + r, months) - 1);
}

export function planGoal(input: GoalInput) {
  const years = Math.min(30, Math.max(0.5, input.years));
  const months = Math.round(years * 12);
  const saved = Math.max(0, input.already_saved ?? 0);
  const infl = INFLATION[input.type] ?? 0.06;
  const futureCost = r100(input.target_today * Math.pow(1 + infl, years));
  const monthly = r10(monthlyNeeded(futureCost, saved, months, ASSUMED_RETURN / 12));
  const daily = r10(monthly / 26); // ~26 working days a month
  const income = input.monthly_income ?? 0;
  const shareOfIncome = income > 0 ? Math.round((monthly / income) * 100) : null;
  const affordable = shareOfIncome === null || shareOfIncome <= 20;

  // If it's too much, how many years would make it ~15% of income?
  let stretchYears: number | null = null;
  if (!affordable && income > 0) {
    for (let y = Math.ceil(years) + 1; y <= 25; y++) {
      const fc = input.target_today * Math.pow(1 + infl, y);
      if (monthlyNeeded(fc, saved, y * 12, ASSUMED_RETURN / 12) <= income * 0.15) {
        stretchYears = y;
        break;
      }
    }
  }

  // What a comfortable 15% of income would reach by then (the rest: scholarship / loan / subsidy).
  let reachableAt15pct: number | null = null;
  let comfortableMonthly: number | null = null;
  if (!affordable && income > 0) {
    const r = ASSUMED_RETURN / 12;
    comfortableMonthly = r10(income * 0.15);
    reachableAt15pct = r100(saved * Math.pow(1 + r, months) + (comfortableMonthly * (Math.pow(1 + r, months) - 1)) / r);
  }

  // Options
  const opts: GoalOption[] = [];
  const daughterSSY = input.for_daughter && (input.child_age ?? 99) < 10 && (input.type === "education" || input.type === "marriage");
  if (daughterSSY) opts.push(OPTIONS.ssy);
  if (input.type === "business") opts.push(OPTIONS.mudra, OPTIONS.pmegp, OPTIONS.standup, OPTIONS.rd);
  else if (years <= 5) opts.push(OPTIONS.rd);
  else opts.push(years >= 10 ? OPTIONS.ppf : OPTIONS.rd);
  if (input.type === "education") opts.push(OPTIONS.scholarship, OPTIONS.vidyalaxmi);
  opts.push(OPTIONS.pmjjby);

  // Legal note for marriage goals for a child.
  const childAgeAtGoal = input.child_age != null ? input.child_age + years : null;
  const legalNote =
    input.type === "marriage" && childAgeAtGoal != null && childAgeAtGoal < (input.for_daughter ? 18 : 21)
      ? input.for_daughter
        ? "Legal marriage age in India is 18 for girls. Plan the date for after she turns 18."
        : "Legal marriage age in India is 21 for boys. Plan the date for after he turns 21."
      : null;

  return {
    type: input.type,
    years,
    target_today: Math.round(input.target_today),
    future_cost: futureCost,
    cost_growth_per_year_pct: Math.round(infl * 100),
    assumed_return_pct: ASSUMED_RETURN * 100,
    already_saved: saved,
    monthly_saving: monthly,
    daily_saving: daily,
    share_of_income_pct: shareOfIncome,
    affordable,
    stretch_years_to_make_affordable: stretchYears,
    comfortable_monthly_saving: comfortableMonthly,
    comfortable_daily_saving: comfortableMonthly != null ? r10(comfortableMonthly / 26) : null,
    reachable_with_comfortable_saving: reachableAt15pct,
    gap_to_cover_with_scholarship_loan_or_subsidy: reachableAt15pct != null ? Math.max(0, futureCost - reachableAt15pct) : null,
    options: opts.map((o) => ({ id: o.id, name: o.name.en, what: o.what.en, apply_at: o.where, kind: o.fit })),
    legal_note: legalNote,
    notes: [
      "Keep emergency savings going first so you don't break the goal money in a crisis.",
      "Small-savings interest rates are set by the government every quarter; check the current rate at the post office or nsiindia.gov.in.",
      "Never pay an agent to open these accounts. They are free at a post office or bank.",
    ],
  };
}

export type GoalPlan = ReturnType<typeof planGoal>;
export const goalOption = (id: string) => OPTIONS[id];
