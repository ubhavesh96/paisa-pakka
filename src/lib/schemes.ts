// Scheme facts are summarised from official sites (eshram.gov.in, maandhan.in,
// jansuraksha.gov.in, npscra.nsdl.co.in, pmjay.gov.in). Prototype data:
// re-verify before any public launch.

type L = { en: string; hi: string };

export type SchemeInput = { age: number; monthlyIncome: number; hasBank: boolean; informal: boolean };
export type Eligibility = { status: "yes" | "check" | "no"; why: L };

export type Scheme = {
  id: string;
  name: L;
  short: L;
  desc: L;
  docs: L[];
  steps: L[];
  site: string;
  url: string;
  helpline: string;
  trackerSteps: L[];
  eligible: (p: SchemeInput) => Eligibility;
};

export const INCOME_MID: Record<string, number> = { under10: 8000, "10to15": 12500, "15to25": 20000, over25: 30000 };

const AADHAAR: L = { en: "Aadhaar card", hi: "आधार कार्ड" };
const MOBILE: L = { en: "Mobile number linked to Aadhaar", hi: "आधार से जुड़ा मोबाइल नंबर" };
const BANK: L = { en: "Bank account + IFSC", hi: "बैंक खाता + IFSC" };

export const SCHEMES: Scheme[] = [
  {
    id: "eshram",
    name: { en: "e-Shram card", hi: "e-Shram कार्ड" },
    short: { en: "Government ID card for informal workers. Free.", hi: "असंगठित कामगारों का सरकारी पहचान कार्ड। मुफ़्त।" },
    desc: {
      en: "Government ID card (UAN) for informal workers. It makes pension and insurance schemes easier to get.",
      hi: "असंगठित कामगारों का सरकारी पहचान कार्ड (UAN)। इससे पेंशन, बीमा जैसी योजनाओं में आसानी होती है।",
    },
    docs: [AADHAAR, MOBILE, BANK],
    steps: [
      { en: "Tap “Register” on eshram.gov.in", hi: "eshram.gov.in पर “Register” दबाएँ" },
      { en: "Enter OTP only on the government website", hi: "OTP सिर्फ़ सरकारी वेबसाइट पर डालें" },
      { en: "Fill work and bank details, download the card", hi: "काम और बैंक की जानकारी भरें, कार्ड डाउनलोड करें" },
    ],
    site: "eshram.gov.in",
    url: "https://eshram.gov.in",
    helpline: "14434",
    trackerSteps: [
      { en: "Documents ready", hi: "कागज़ तैयार" },
      { en: "Form filled", hi: "फ़ॉर्म भरा" },
      { en: "Card downloaded", hi: "कार्ड डाउनलोड" },
    ],
    eligible: ({ age, informal }) =>
      age >= 16 && age <= 59 && informal
        ? { status: "yes", why: { en: "age 16–59 · informal work", hi: "उम्र 16–59 · असंगठित काम" } }
        : { status: "no", why: { en: "only for age 16–59, informal work", hi: "सिर्फ़ 16–59 उम्र, असंगठित काम" } },
  },
  {
    id: "pmsym",
    name: { en: "PM Shram Yogi Maandhan", hi: "PM श्रम योगी मानधन" },
    short: { en: "₹3000/month pension after age 60.", hi: "60 की उम्र के बाद ₹3000 महीना पेंशन।" },
    desc: {
      en: "Pension scheme for informal workers. You pay ₹55–200 a month (by age); the government adds the same. ₹3000/month after 60.",
      hi: "असंगठित कामगारों की पेंशन योजना। आप उम्र के हिसाब से ₹55–200 महीना देते हैं, सरकार उतना ही जोड़ती है। 60 के बाद ₹3000 महीना।",
    },
    docs: [AADHAAR, { en: "Savings bank account + IFSC", hi: "बचत खाता + IFSC" }],
    steps: [
      { en: "Go to a CSC centre or maandhan.in", hi: "CSC केंद्र या maandhan.in पर जाएँ" },
      { en: "Give Aadhaar and bank details there yourself", hi: "आधार और बैंक जानकारी वहीं ख़ुद दें" },
      { en: "First monthly amount is paid in cash; then auto-debit", hi: "पहली किस्त नकद, फिर अपने-आप खाते से" },
    ],
    site: "maandhan.in",
    url: "https://maandhan.in",
    helpline: "14434",
    trackerSteps: [
      { en: "e-Shram done", hi: "e-Shram बना" },
      { en: "Enrol at CSC / website", hi: "CSC / साइट पर नामांकन" },
      { en: "First instalment", hi: "पहली किस्त" },
    ],
    eligible: ({ age, monthlyIncome, informal }) =>
      age >= 18 && age <= 40 && monthlyIncome <= 15000 && informal
        ? { status: "yes", why: { en: "age 18–40 · earning up to ₹15,000", hi: "उम्र 18–40 · कमाई ₹15,000 तक" } }
        : { status: "no", why: { en: "only for age 18–40 earning up to ₹15,000", hi: "सिर्फ़ 18–40 उम्र, ₹15,000 तक कमाई" } },
  },
  {
    id: "pmsby",
    name: { en: "PM Suraksha Bima", hi: "PM सुरक्षा बीमा" },
    short: { en: "₹2 lakh accident cover for ₹20 a year.", hi: "₹20 साल में ₹2 लाख का दुर्घटना बीमा।" },
    desc: {
      en: "Accident insurance: ₹2 lakh for accidental death or full disability, ₹1 lakh for partial disability. ₹20 a year, auto-debited.",
      hi: "दुर्घटना बीमा: मृत्यु या पूरी विकलांगता पर ₹2 लाख, आंशिक पर ₹1 लाख। ₹20 साल, खाते से अपने-आप।",
    },
    docs: [AADHAAR, BANK],
    steps: [
      { en: "Fill the PMSBY form at your bank or post office", hi: "बैंक या डाकघर में PMSBY फ़ॉर्म भरें" },
      { en: "₹20 is taken from your account every year", hi: "₹20 हर साल खाते से कटेंगे" },
      { en: "Don’t pay any agent extra", hi: "किसी एजेंट को अलग से पैसे न दें" },
    ],
    site: "jansuraksha.gov.in",
    url: "https://jansuraksha.gov.in",
    helpline: "1800-180-1111",
    trackerSteps: [
      { en: "Visit bank / post office", hi: "बैंक / डाकघर जाएँ" },
      { en: "Form submitted", hi: "फ़ॉर्म जमा" },
      { en: "₹20 auto-debit set", hi: "₹20 अपने-आप कटना शुरू" },
    ],
    eligible: ({ age, hasBank }) =>
      age >= 18 && age <= 70 && hasBank
        ? { status: "yes", why: { en: "age 18–70 · bank account", hi: "उम्र 18–70 · बैंक खाता" } }
        : { status: "no", why: { en: "needs age 18–70 and a bank account", hi: "18–70 उम्र और बैंक खाता चाहिए" } },
  },
  {
    id: "pmjjby",
    name: { en: "PM Jeevan Jyoti Bima", hi: "PM जीवन ज्योति बीमा" },
    short: { en: "₹2 lakh life cover for ₹436 a year.", hi: "₹436 साल में ₹2 लाख का जीवन बीमा।" },
    desc: {
      en: "Life insurance: your family gets ₹2 lakh if anything happens to you. ₹436 a year, auto-debited.",
      hi: "जीवन बीमा: आपको कुछ हो जाए तो परिवार को ₹2 लाख। ₹436 साल, खाते से अपने-आप।",
    },
    docs: [AADHAAR, BANK],
    steps: [
      { en: "Ask for the PMJJBY form at your bank", hi: "बैंक में PMJJBY फ़ॉर्म माँगें" },
      { en: "₹436 is taken from your account every year", hi: "₹436 हर साल खाते से कटेंगे" },
      { en: "Add a nominee from your family", hi: "परिवार से एक नॉमिनी जोड़ें" },
    ],
    site: "jansuraksha.gov.in",
    url: "https://jansuraksha.gov.in",
    helpline: "1800-180-1111",
    trackerSteps: [
      { en: "Visit bank", hi: "बैंक जाएँ" },
      { en: "Form + nominee", hi: "फ़ॉर्म + नॉमिनी" },
      { en: "₹436 auto-debit set", hi: "₹436 अपने-आप कटना शुरू" },
    ],
    eligible: ({ age, hasBank }) =>
      age >= 18 && age <= 50 && hasBank
        ? { status: "yes", why: { en: "age 18–50 · bank account", hi: "उम्र 18–50 · बैंक खाता" } }
        : { status: "no", why: { en: "needs age 18–50 and a bank account", hi: "18–50 उम्र और बैंक खाता चाहिए" } },
  },
  {
    id: "ayushman",
    name: { en: "Ayushman Bharat", hi: "आयुष्मान भारत" },
    short: { en: "Free treatment up to ₹5 lakh. Eligibility depends on family records.", hi: "₹5 लाख तक मुफ़्त इलाज। योग्यता परिवार के रिकॉर्ड पर।" },
    desc: {
      en: "Free hospital treatment up to ₹5 lakh per family per year. Whether you qualify depends on government family lists, so check on the official site.",
      hi: "हर परिवार को साल में ₹5 लाख तक मुफ़्त इलाज। योग्यता सरकारी परिवार सूची पर निर्भर है, सरकारी साइट पर जाँचें।",
    },
    docs: [AADHAAR, { en: "Ration card (if any)", hi: "राशन कार्ड (अगर हो)" }],
    steps: [
      { en: "Open beneficiary.nha.gov.in and check your name", hi: "beneficiary.nha.gov.in खोलें और अपना नाम देखें" },
      { en: "If listed, get the card at a CSC or empanelled hospital", hi: "नाम हो तो CSC या सूची वाले अस्पताल से कार्ड बनवाएँ" },
      { en: "Helpline 14555 if unsure", hi: "शक हो तो हेल्पलाइन 14555" },
    ],
    site: "pmjay.gov.in",
    url: "https://beneficiary.nha.gov.in",
    helpline: "14555",
    trackerSteps: [
      { en: "Name checked", hi: "नाम जाँचा" },
      { en: "Card made", hi: "कार्ड बना" },
      { en: "Ready to use", hi: "इस्तेमाल के लिए तैयार" },
    ],
    eligible: () => ({ status: "check", why: { en: "depends on family records", hi: "परिवार के रिकॉर्ड पर निर्भर" } }),
  },
  {
    id: "apy",
    name: { en: "Atal Pension Yojana", hi: "अटल पेंशन योजना" },
    short: { en: "₹1000–5000/month pension after 60.", hi: "60 के बाद ₹1000–5000 महीना पेंशन।" },
    desc: {
      en: "Pension through your bank. Choose ₹1000 to ₹5000 a month after 60; your monthly payment depends on your age and choice. Not for income-tax payers.",
      hi: "बैंक से पेंशन। 60 के बाद ₹1000 से ₹5000 महीना चुनें; किस्त उम्र और चुनाव पर निर्भर। आयकर देने वालों के लिए नहीं।",
    },
    docs: [AADHAAR, BANK],
    steps: [
      { en: "Ask for the APY form at your bank", hi: "बैंक में APY फ़ॉर्म माँगें" },
      { en: "Pick your pension amount", hi: "पेंशन की रकम चुनें" },
      { en: "Monthly amount is auto-debited", hi: "किस्त अपने-आप खाते से कटेगी" },
    ],
    site: "npscra.nsdl.co.in",
    url: "https://npscra.nsdl.co.in/scheme-details.php",
    helpline: "1800-110-069",
    trackerSteps: [
      { en: "Visit bank", hi: "बैंक जाएँ" },
      { en: "Pension amount chosen", hi: "पेंशन रकम चुनी" },
      { en: "Auto-debit set", hi: "अपने-आप कटना शुरू" },
    ],
    eligible: ({ age, hasBank, monthlyIncome }) =>
      age >= 18 && age <= 40 && hasBank && monthlyIncome < 100000
        ? { status: "yes", why: { en: "age 18–40 · bank account", hi: "उम्र 18–40 · बैंक खाता" } }
        : { status: "no", why: { en: "needs age 18–40 and a bank account", hi: "18–40 उम्र और बैंक खाता चाहिए" } },
  },
];

export const schemeById = (id: string) => SCHEMES.find((s) => s.id === id);

export function matchSchemes(p: SchemeInput) {
  return SCHEMES.map((s) => ({ scheme: s, ...s.eligible(p) })).filter((m) => m.status !== "no");
}
