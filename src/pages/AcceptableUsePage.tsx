import LegalPageLayout, { LegalList, LegalSection } from '../components/legal/LegalPageLayout'

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout title="Acceptable use policy" description="Activities that are not permitted on EJ TailorPro." lastUpdated="4 October 2026">
      <LegalSection title="1. Lawful use only">
        <p>You may use TailorPro only for lawful tailoring, fashion-design and related business-management activities. Use must comply with Nigerian law, including applicable data-protection, consumer-protection and cybercrime requirements.</p>
      </LegalSection>

      <LegalSection title="2. Prohibited activities">
        <LegalList>
          <li>Accessing another person’s account, records, tokens or share links without authority.</li>
          <li>Uploading malware, harmful code or content designed to disrupt, damage or secretly monitor systems.</li>
          <li>Testing or bypassing authentication, rate limits, access controls or security safeguards without written permission.</li>
          <li>Using automated scraping, excessive requests or other activity that places an unreasonable load on the service.</li>
          <li>Entering, sharing or selling personal information without a lawful basis or the required notice.</li>
          <li>Harassment, fraud, impersonation, intellectual-property infringement or any unlawful or deceptive conduct.</li>
          <li>Using TailorPro to distribute spam, unsolicited marketing or illegal material.</li>
          <li>Reselling, copying or reverse engineering the service except where the law expressly permits it.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Enforcement">
        <p>We may investigate suspected misuse, preserve relevant evidence, restrict affected functionality, revoke links, suspend accounts and cooperate with lawful authorities. Our response will be proportionate to the risk and seriousness of the conduct.</p>
      </LegalSection>

      <LegalSection title="4. Reporting concerns">
        <p>Report suspected abuse, exposed measurement links, account compromise or security vulnerabilities using the contact address below. Do not publicly disclose a vulnerability before we have had a reasonable opportunity to investigate and address it.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
