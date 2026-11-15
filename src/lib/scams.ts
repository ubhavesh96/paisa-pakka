// Known fraud patterns for India, used by the agent's check_scam_patterns tool.
// Sources are public advisories (cybercrime.gov.in, RBI, PIB Fact Check, NPCI).

export type ScamPattern = {
  id: string;
  name: string;
  keywords: string[]; // lowercase; English, Hindi, Hinglish
  redFlag: string;
  advice: string;
  sources: string[];
};

export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: "advance-fee-scheme",
    name: "Pay a fee to get a government benefit",
    keywords: ["deposit", "jama", "जमा", "fee", "processing", "registration fee", "pm scheme", "pm yojana", "योजना", "kisan", "किसान", "6000", "subsidy"],
    redFlag: "Government schemes never ask for a fee, deposit or ‘processing charge’ to release money. Real benefits arrive by DBT into your bank account.",
    advice: "Don’t pay. Block the number. If money is lost, call 1930 or report on cybercrime.gov.in.",
    sources: ["pmkisan.gov.in", "cybercrime.gov.in"],
  },
  {
    id: "lottery-prize",
    name: "Lottery / KBC / lucky draw prize",
    keywords: ["lottery", "लॉटरी", "kbc", "kaun banega", "lucky draw", "prize", "इनाम", "inaam", "jeeta", "जीता", "won", "25 lakh", "winner"],
    redFlag: "KBC, Jio, or company ‘lucky draws’ on WhatsApp are fake. You can’t win a lottery you never entered, and real prizes never need a fee or tax paid first.",
    advice: "Don’t reply or pay any ‘tax’ or ‘GST’. Block and report the number on sancharsaathi.gov.in (Chakshu).",
    sources: ["cybercrime.gov.in", "sancharsaathi.gov.in"],
  },
  {
    id: "otp-kyc",
    name: "Share OTP / KYC update / account blocked",
    keywords: ["otp", "ओटीपी", "kyc", "केवाईसी", "blocked", "band ho", "बंद", "suspend", "update pan", "link aadhaar", "pin", "upi pin", "sim block"],
    redFlag: "No bank, telecom company, or government office asks for your OTP, UPI PIN, or card details on a call or message. ‘Account will be blocked’ is a pressure trick.",
    advice: "Never share OTP or PIN. Hang up and call the number printed on your passbook or card.",
    sources: ["rbi.org.in", "cybercrime.gov.in"],
  },
  {
    id: "collect-request",
    name: "UPI ‘receive money’ that needs your PIN",
    keywords: ["collect request", "scan", "qr", "receive money", "paise bhej raha", "refund", "galti se", "गलती से", "wrong transfer", "cashback"],
    redFlag: "You never need to enter your UPI PIN or scan a QR code to RECEIVE money. PIN is only for sending.",
    advice: "Decline the request. Don’t scan unknown QR codes. Call 1930 if money left your account.",
    sources: ["npci.org.in", "cybercrime.gov.in"],
  },
  {
    id: "task-job",
    name: "Work-from-home task / like-and-earn job",
    keywords: ["part time", "work from home", "ghar baithe", "घर बैठे", "task", "like", "youtube", "review", "telegram", "daily income", "earn per day", "job offer", "security deposit"],
    redFlag: "Jobs that pay you for likes or reviews, then ask you to ‘invest’ or pay a deposit to unlock earnings, are task scams.",
    advice: "Don’t pay any deposit. Real employers don’t charge to hire. Report on cybercrime.gov.in.",
    sources: ["cybercrime.gov.in", "pib.gov.in"],
  },
  {
    id: "instant-loan-app",
    name: "Instant loan app with harassment / hidden charges",
    keywords: ["loan app", "instant loan", "बिना कागज़", "bina document", "5 minute loan", "loan approved", "pre-approved", "processing fee"],
    redFlag: "Unregistered loan apps charge huge hidden fees, access your contacts and harass you. Check the lender is an RBI-registered bank or NBFC.",
    advice: "Use only loans from banks, registered NBFCs, or self-help groups. Check lenders on sachet.rbi.org.in.",
    sources: ["rbi.org.in", "sachet.rbi.org.in"],
  },
  {
    id: "free-phone-link",
    name: "Free phone / recharge / laptop link",
    keywords: ["free phone", "free mobile", "फ़्री मोबाइल", "free recharge", "free laptop", "link khole", "लिंक", "click here", "apply now", "yojana link"],
    redFlag: "Messages offering free phones, recharges or laptops ‘from the government’ with a link usually steal data or install malware. Government schemes are announced on .gov.in sites and PIB.",
    advice: "Don’t open the link or fill details. Check PIB Fact Check (pib.gov.in/factcheck).",
    sources: ["pib.gov.in"],
  },
  {
    id: "digital-arrest",
    name: "‘Digital arrest’ / fake police or courier call",
    keywords: ["digital arrest", "police", "cbi", "customs", "parcel", "courier", "drugs", "arrest", "video call", "case", "fedex"],
    redFlag: "Police, CBI or customs never ‘arrest’ anyone on a video call or ask for money to settle a case. This is a common extortion scam.",
    advice: "Hang up. Don’t pay. Call 1930 immediately and tell family.",
    sources: ["cybercrime.gov.in", "pib.gov.in"],
  },
  {
    id: "electricity-bill",
    name: "Electricity / gas connection will be cut tonight",
    keywords: ["electricity", "bijli", "बिजली", "connection cut", "bill pending", "tonight", "aaj raat", "gas connection"],
    redFlag: "Power companies don’t send threats from personal mobile numbers asking you to call or install an app.",
    advice: "Don’t call the number or install apps. Check your bill on the official board website or office.",
    sources: ["cybercrime.gov.in"],
  },
];

export function matchPatterns(text: string) {
  const q = text.toLowerCase();
  return SCAM_PATTERNS.map((p) => ({ p, hits: p.keywords.filter((k) => q.includes(k)) }))
    .filter((m) => m.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length)
    .slice(0, 3)
    .map(({ p, hits }) => ({ id: p.id, name: p.name, matched: hits, redFlag: p.redFlag, advice: p.advice, sources: p.sources }));
}
