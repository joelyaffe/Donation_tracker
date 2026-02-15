import Anthropic from "@anthropic-ai/sdk";

export interface DonationParsed {
  organization: string;
  amount: number;
  donationDate: string; // YYYY-MM-DD or empty string
}

// Lazy initialization to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function parseDonation(
  text: string
): Promise<DonationParsed> {
  const anthropic = getClient();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a donation parsing assistant. Parse the following text describing a charitable donation and extract the organization name, donation amount, and date.

Text: "${text}"

Today's date is ${todayStr} for reference when interpreting relative dates like "yesterday" or "last week".

Rules:
- Extract the organization/charity name exactly as mentioned
- Extract the dollar amount as a number (no dollar sign, no commas)
- Extract the date in YYYY-MM-DD format if one is mentioned
- If NO date is mentioned or implied in the text, use an empty string for donationDate
- If a relative date is used (e.g., "yesterday", "last Tuesday"), convert it to YYYY-MM-DD based on today's date
- If the amount is unclear, make your best estimate from context

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "organization": "Organization Name",
  "amount": 100.00,
  "donationDate": "2026-01-15"
}

If no date is provided or implied:
{
  "organization": "Organization Name",
  "amount": 100.00,
  "donationDate": ""
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    return JSON.parse(content.text) as DonationParsed;
  } catch {
    throw new Error("Failed to parse donation response");
  }
}
