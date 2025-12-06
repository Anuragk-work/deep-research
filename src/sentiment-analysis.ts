import { generateObject } from 'ai';
import { z } from 'zod';
import { getModel, trimPrompt } from './ai/providers';
import { systemPrompt } from './prompt';

export type SentimentScore = {
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  score: number; // -1.0 to 1.0
  confidence: number; // 0 to 1.0
  aspects: {
    reputation: number;
    products: number;
    customerSatisfaction: number;
    innovation: number;
    growth: number;
  };
};

export type SentimentAnalysis = {
  sentiment: SentimentScore;
  positivePoints: string[];
  negativePoints: string[];
  neutralPoints: string[];
  controversies: string[];
  awards: string[];
  customerFeedback: string[];
  marketPerception: string;
  summary: string;
};

/**
 * Analyze sentiment from research learnings and report
 */
export async function analyzeSentiment({
  companyName,
  domain,
  learnings,
  report,
}: {
  companyName: string;
  domain: string;
  learnings: string[];
  report: string;
}): Promise<SentimentAnalysis> {
  const learningsString = learnings
    .map(learning => `<learning>\n${learning}\n</learning>`)
    .join('\n');

  const res = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: trimPrompt(
      `Analyze the public sentiment and perception of the company "${companyName}" (${domain}) based on the research findings below.

Provide a comprehensive sentiment analysis covering:

1. **Overall Sentiment Score**: Rate from -1.0 (very negative) to +1.0 (very positive)
2. **Aspect Scores**: Rate individual aspects (reputation, products, customer satisfaction, innovation, growth)
3. **Positive Points**: List specific positive findings, achievements, praise
4. **Negative Points**: List specific criticisms, problems, complaints
5. **Neutral Points**: List factual observations without clear positive/negative tone
6. **Controversies**: Any scandals, legal issues, or controversies
7. **Awards & Recognition**: Industry awards, certifications, accolades
8. **Customer Feedback**: What customers/users say (reviews, testimonials, complaints)
9. **Market Perception**: How the market/industry views this company
10. **Summary**: Brief sentiment summary

Be objective and base your analysis only on the evidence from the research. If information is limited, indicate that clearly.

<learnings>
${learningsString}
</learnings>

<report>
${report.slice(0, 15000)}
</report>`,
    ),
    schema: z.object({
      overallSentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).describe('Overall sentiment classification'),
      sentimentScore: z.number().min(-1).max(1).describe('Overall sentiment score from -1.0 to 1.0'),
      confidence: z.number().min(0).max(1).describe('Confidence in sentiment analysis (0-1)'),
      
      aspectScores: z.object({
        reputation: z.number().min(-1).max(1).describe('Company reputation score'),
        products: z.number().min(-1).max(1).describe('Product/service quality score'),
        customerSatisfaction: z.number().min(-1).max(1).describe('Customer satisfaction score'),
        innovation: z.number().min(-1).max(1).describe('Innovation and technology score'),
        growth: z.number().min(-1).max(1).describe('Growth and market position score'),
      }).describe('Sentiment scores for different aspects'),

      positivePoints: z.array(z.string()).describe('List of specific positive findings (5-15 items)'),
      negativePoints: z.array(z.string()).describe('List of specific negative findings (0-10 items)'),
      neutralPoints: z.array(z.string()).describe('List of neutral factual observations (3-10 items)'),
      controversies: z.array(z.string()).describe('List of controversies, scandals, or issues (0-5 items)'),
      awards: z.array(z.string()).describe('List of awards, certifications, or recognition (0-10 items)'),
      customerFeedback: z.array(z.string()).describe('List of customer feedback quotes or summaries (3-10 items)'),
      
      marketPerception: z.string().describe('How the market/industry perceives this company (1-2 paragraphs)'),
      summary: z.string().describe('Brief sentiment summary (2-3 sentences)'),
    }),
  });

  return {
    sentiment: {
      overall: res.object.overallSentiment,
      score: res.object.sentimentScore,
      confidence: res.object.confidence,
      aspects: res.object.aspectScores,
    },
    positivePoints: res.object.positivePoints,
    negativePoints: res.object.negativePoints,
    neutralPoints: res.object.neutralPoints,
    controversies: res.object.controversies,
    awards: res.object.awards,
    customerFeedback: res.object.customerFeedback,
    marketPerception: res.object.marketPerception,
    summary: res.object.summary,
  };
}

/**
 * Generate sentiment-focused research query
 */
export function createSentimentResearchQuery(companyName: string, domain: string): string {
  return `Research public sentiment, reputation, and perception of "${companyName}" (domain: ${domain}).

Focus specifically on:

1. **REPUTATION & SENTIMENT**
   - Overall public perception and reputation
   - Media coverage tone (positive/negative/neutral)
   - Social media sentiment and discussions
   - Industry reputation and standing
   - Trust and credibility indicators

2. **CUSTOMER REVIEWS & FEEDBACK**
   - Customer reviews on review platforms (G2, Capterra, Trustpilot, etc.)
   - User testimonials and case studies
   - Common complaints and issues
   - Customer satisfaction ratings
   - Net Promoter Score (NPS) if available
   - Churn rate or retention metrics

3. **PRODUCT/SERVICE PERCEPTION**
   - Product quality reviews
   - Feature satisfaction and gaps
   - Ease of use and user experience feedback
   - Pricing perception (value for money)
   - Competitive comparisons from users

4. **POSITIVE INDICATORS**
   - Awards and recognition received
   - Industry certifications and accreditations
   - Positive press coverage and media mentions
   - Success stories and achievements
   - Growth indicators and milestones
   - Innovation and thought leadership

5. **NEGATIVE INDICATORS & CONTROVERSIES**
   - Controversies, scandals, or legal issues
   - Customer complaints and negative reviews
   - Service outages or technical problems
   - Layoffs or organizational issues
   - Negative press coverage
   - Competitive disadvantages

6. **MARKET PERCEPTION**
   - Analyst ratings and reports
   - Investor sentiment (if applicable)
   - Partner and ecosystem feedback
   - Competitor positioning
   - Market share trends
   - Industry analyst commentary

7. **EMPLOYEE SENTIMENT** (if available)
   - Glassdoor ratings and reviews
   - Employee satisfaction scores
   - Company culture perception
   - Leadership ratings
   - Work-life balance feedback

8. **RECENT SENTIMENT TRENDS (2023-2025)**
   - Recent positive/negative news
   - Sentiment changes over time
   - Emerging issues or improvements
   - Customer feedback trends
   - Market perception shifts

Gather specific quotes, ratings, statistics, and examples. Include sources for all claims.`;
}








