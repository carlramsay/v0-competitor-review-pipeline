"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { saveReview } from "@/lib/store"
import { ReviewRecord } from "@/lib/types"

const MOCK_REVIEW: ReviewRecord = {
  id: "mock-001",
  submittedAt: "2025-04-10T14:32:00.000Z",
  formData: {
    reviewerName: "Jamie H.",
    competitorName: "FlirtCo",
    competitorUrl: "https://flirtco.example.com",
    date: "2025-04-10",
    deviceUsed: "Both",

    // Signup & Verification
    q1: "Signup was quick — just an email and a username. No friction at all. The flow took under 90 seconds with a clean two-step wizard.",
    q2: "Only email verification required. A confirmation link was sent immediately and worked first time. No ID or phone required.",
    q3: "There was a soft upsell after signup offering a 'Premium Trial' for $4.99, but it was easy to dismiss and not blocking.",
    q4: "Approximately 2 minutes from landing page to fully signed in.",
    q5: "No bugs. The mobile keyboard occasionally pushed the CTA button off-screen on iOS Safari but it was still tappable.",

    // Interface & Navigation
    q6: "Dark-themed UI with a grid of host cards on the homepage. Very visual, image-heavy. Feels modern but slightly cluttered on mobile.",
    q7: "Host discovery was easy — large thumbnails with names and a short bio snippet. Clicking opens a profile with a 'Start Chat' button.",
    q8: "The filter/sort bar had an unexplained 'Boost' option that opened a paid upsell modal with no explanation of what it does.",
    q9: "Mobile experience was slightly degraded — images took longer to load and the chat input sat behind the browser nav bar on some devices.",

    // Pricing & Value
    q10: "Credit-based system. Credits are purchased in bundles ($10, $25, $50). Chat costs 10 credits/min with most hosts.",
    q11: "12",
    q12: "Pricing is shown on the host profile page before starting. However the per-minute rate is in credits, not dollars, which obscures the real cost.",
    q13: "Borderline. $1/min is on the high end. The conversations were decent but the value felt thin for longer sessions.",

    // Chat Quality
    q14: "2",
    q15: "Responses felt mostly human. One host sent what appeared to be a templated opener ('Hey handsome, glad you found me') but subsequent messages were personalised.",
    q16: "Conversation quality was above average. The host asked follow-up questions and remembered things mentioned earlier in the session.",
    q17: "Proactive initially, but after the first couple of exchanges the host seemed to wait for the user to steer the conversation.",
    q18: "The opening message was clearly scripted. One transition to a paid video feature felt like a rehearsed pitch.",
    q19: "Positive: Host remembered my username and referenced it naturally. Negative: Mid-conversation prompt to upgrade to video felt abrupt.",

    // Privacy & Safety
    q20: "Privacy policy exists and is accessible from the footer. It is reasonably detailed and references GDPR compliance.",
    q21: "Accounts can be deleted from Settings. The policy states data is not sold to third parties, though ad-tracking pixels are present.",
    q22: "Block and report buttons are visible on every profile. Content filter options exist in account settings but are opt-in only.",
    q23: "Nothing overtly unsafe, but the lack of clear age verification beyond a checkbox could be a concern.",

    // Overall Impression
    overallRating: "7",
    oneLineVerdict: "Good for casual users who value chat quality, but credit pricing is misleading and mobile experience needs work.",
    q24: "A competent mid-tier competitor. Polished enough to attract new users, but credit obfuscation and limited host variety hold it back.",
    q25: "18–35 males. Likely people who've graduated from free apps and want a more premium experience without committing to a subscription.",
    q26: "Cleaner UX than most competitors at this price point. Host response quality is genuinely good.",
    q27: "Credit pricing is opaque. Host variety is limited — mostly one demographic. No free trial chat option.",
    q28: "Cautiously yes, for users who value conversation quality over quantity. Arousr still wins on host variety and transparent pricing.",

    // Scores
    scores: [
      { feature: "Ease of Signup",       competitorScore: 8, arousrScore: 9, notes: "Both quick, Arousr slightly cleaner" },
      { feature: "Interface / UX",        competitorScore: 7, arousrScore: 8, notes: "FlirtCo is visual but cluttered on mobile" },
      { feature: "Mobile Experience",     competitorScore: 6, arousrScore: 9, notes: "iOS keyboard issue, slow image loads" },
      { feature: "Host Variety",          competitorScore: 5, arousrScore: 9, notes: "FlirtCo has limited demographic range" },
      { feature: "Response Time",         competitorScore: 8, arousrScore: 8, notes: "Both averaged ~2 min response" },
      { feature: "Chat Quality",          competitorScore: 7, arousrScore: 8, notes: "Good but scripted opener noted" },
      { feature: "Pricing Transparency",  competitorScore: 5, arousrScore: 9, notes: "Credit system hides real cost" },
      { feature: "Privacy & Safety",      competitorScore: 7, arousrScore: 8, notes: "Policy exists, no ID verification" },
    ],

    // Meta
    q29: "Google search",
    q30: "FlirtCo ranks for several high-intent keywords Arousr currently doesn't appear on page 1 for. Their blog content is thin but they dominate with paid ads.",
  },
  generated: {
    blogPost: `# FlirtCo Review: How Does It Stack Up Against Arousr?

We spent time on FlirtCo so you don't have to. Here's our honest, in-depth take on this adult chat platform.

## Signup & Verification

Signing up for FlirtCo was impressively straightforward. The process was just an email and a username — no friction at all. The flow took under 90 seconds with a clean two-step wizard that got us from landing page to fully signed in in approximately 2 minutes.

Email verification was the only requirement. A confirmation link was sent immediately and worked on the first try. No phone or ID verification was needed, keeping the barrier to entry low.

After signup, there was a soft upsell offering a "Premium Trial" for $4.99. The good news: it was easy to dismiss and didn't block access to the platform. The only minor friction we encountered was on iOS Safari, where the mobile keyboard occasionally pushed the call-to-action button off-screen — though it remained tappable, so not a deal-breaker.

## Interface & Navigation

FlirtCo uses a dark-themed UI with a grid of host cards on the homepage. The design is very visual and image-heavy, which feels modern but can feel slightly cluttered on mobile devices. 

Host discovery was easy. Large thumbnails with names and short bio snippets make browsing straightforward. Clicking a profile opens a detailed page with a prominent "Start Chat" button. One confusing element stood out: the filter bar includes an unexplained "Boost" option that opens a paid upsell modal with no explanation of what it actually does.

The gap between desktop and mobile was noticeable. Images took longer to load on mobile, and the chat input occasionally sat behind the browser navigation bar on some devices, adding unnecessary friction.

## Pricing & Value

FlirtCo uses a credit-based system. Credits are purchased in bundles ($10, $25, $50), and chat costs 10 credits per minute with most hosts. For our test session, a typical 10-minute session cost about $12.

Here's the catch: while pricing is shown on the host profile page before you start, the per-minute rate is displayed in credits, not dollars — which obscures the real cost. At roughly $1 per minute, it's on the expensive side. The conversations were decent, but the value felt thin for longer sessions.

Whether the pricing is fair depends on what you value. We found it borderline — the experience was solid, but the cost adds up quickly if you're having longer chats.

## Chat Quality

Average response time from hosts was about 2 minutes, which is competitive. This is where FlirtCo shines relative to many competitors.

The responses felt mostly human. One host sent what appeared to be a templated opener ("Hey handsome, glad you found me"), but subsequent messages were personalized and natural. Overall conversation quality was above average — the host asked follow-up questions and remembered things mentioned earlier in the session. 

However, the host was proactive initially but seemed to shift into a more passive mode after the first couple of exchanges, waiting for us to steer the conversation rather than driving it forward.

Some scripting did emerge. The opening message was clearly templated, and one transition to a paid video feature felt like a rehearsed pitch — a bit jarring. On the positive side, one host remembered our username and referenced it naturally throughout, which added a personal touch.

## Privacy & Safety

A privacy policy exists and is accessible from the footer. It's reasonably detailed and references GDPR compliance, which is reassuring. Accounts can be deleted from Settings, and the policy states that data is not sold to third parties — though ad-tracking pixels are present on the site.

Safety features are in place: block and report buttons are visible on every profile, and content filter options exist in account settings (though they're opt-in only, which puts the burden on users).

One concern: there's a lack of clear age verification beyond a checkbox, which could be a red flag depending on your risk tolerance.

## Overall Impression

FlirtCo is a competent mid-tier competitor. It's polished enough to attract new users, but credit obfuscation and limited host variety hold it back from being a standout choice.

The platform appears to target 18–35 males — likely people who've graduated from free apps and want a more premium experience without committing to a subscription. They're willing to pay for quality but may not realize how much they're spending due to the credit obfuscation.

**What FlirtCo does well:** Cleaner UX than most competitors at this price point. Host response quality is genuinely good, and the average 2-minute response time is competitive.

**Main weaknesses:** Credit pricing is opaque and makes it harder to track real costs. Host variety is limited — mostly one demographic. And there's no free trial chat option to test the platform before spending.

**Would we recommend it?** Cautiously yes, for users who value conversation quality over quantity and don't mind the premium pricing. But Arousr still wins on host variety and transparent pricing.

## Comparison Table

| Feature | FlirtCo | Arousr | Notes |
|---------|---------|--------|-------|
| Ease of Signup | 8/10 | 9/10 | Both quick, Arousr slightly cleaner |
| Interface / UX | 7/10 | 8/10 | FlirtCo is visual but cluttered on mobile |
| Mobile Experience | 6/10 | 9/10 | iOS keyboard issue, slow image loads |
| Host Variety | 5/10 | 9/10 | FlirtCo has limited demographic range |
| Response Time | 8/10 | 8/10 | Both averaged ~2 min response |
| Chat Quality | 7/10 | 8/10 | Good but scripted opener noted |
| Pricing Transparency | 5/10 | 9/10 | Credit system hides real cost |
| Privacy & Safety | 7/10 | 8/10 | Policy exists, no ID verification |

## Conclusion

FlirtCo is a legitimate competitor with genuine strengths in interface design and chat quality. However, its pricing opacity, limited host variety, and mobile experience gaps are real weaknesses that impact the overall value proposition.

If you're comparing options, the choice often comes down to what matters most to you. Value transparent pricing where you know exactly what you're spending? Arousr shows costs in actual dollars. Want a wider range of hosts to choose from? Arousr's host roster is significantly more diverse. Need a consistent mobile experience? Arousr's mobile functionality works reliably across devices.

For users willing to pay premium rates and okay with limited host options, FlirtCo is worth a try. But for most, Arousr remains the stronger overall choice.`,

    videoScript: `So I spent a week testing FlirtCo, and honestly, it's solid in a lot of ways. The signup was quick — under two minutes — and the interface is clean and easy to navigate. Finding hosts wasn't a problem at all.

But here's where it gets tricky. The pricing model uses credits, which means you don't see a real dollar amount until you've already committed to buying a bundle. Ten credits per minute might sound reasonable until you realize that's roughly a dollar a minute. Do the math on a longer session and it adds up fast.

The chat quality itself was good — hosts responded quickly, usually within two minutes — but you could tell some messages were templated. The conversation felt mostly human, though.

On mobile, there were some friction points. iOS had keyboard issues, and images took a while to load. The host variety was also pretty limited compared to other platforms.

Overall? FlirtCo is a legitimate option if you're okay with premium pricing and limited host selection. But if you want transparent pricing where you see the cost per minute in actual dollars, plus a much wider range of hosts, Arouser is the better choice.`,

    tweetSnippet: `Spent a week testing FlirtCo so you don't have to.

TL;DR: good chat quality, but the credit pricing hides what you're actually spending.

Full breakdown vs Arousr 👇`,

    instagramSnippet: `Honest review time. FlirtCo has a clean interface and responsive hosts — but their credit system makes it genuinely hard to track your spend in real dollars.

We compared them to Arousr across 8 categories including pricing transparency, mobile experience, and host variety.

Spoiler: the gap is bigger than you'd expect. Full review linked in bio.`,

    redditSnippet: `**Tested FlirtCo for a week — here's an honest breakdown vs Arousr**

I went through the full signup, spent time chatting, and scored both platforms on 8 criteria. Quick summary:

- **Signup:** Both easy, FlirtCo slightly faster
- **Chat quality:** FlirtCo is good, hosts are responsive
- **Pricing:** This is where it falls down. Credits instead of dollars = easy to overspend
- **Mobile:** FlirtCo had issues on iOS Safari, Arousr was smoother
- **Host variety:** Arousr wins by a mile

Happy to answer questions. Full written review in my post history.`,
  },
}

export default function SeedPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "done">("idle")

  useEffect(() => {
    saveReview(MOCK_REVIEW).then(() => {
      setStatus("done")
      setTimeout(() => router.push("/reviews"), 1500)
    })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        {status === "idle" ? (
          <p className="text-muted-foreground text-sm">Seeding mock review...</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-foreground font-medium">Mock review created.</p>
            <p className="text-muted-foreground text-sm">Redirecting to reviews...</p>
          </div>
        )}
      </div>
    </div>
  )
}
