import LegalPageLayout, { LegalList, LegalSection } from '../components/legal/LegalPageLayout'

export default function TermsConditionsPage() {
  return (
    <LegalPageLayout title="Terms and conditions" description="The rules governing access to and use of EJ TailorPro." lastUpdated="4 October 2026">
      <LegalSection title="1. Agreement">
        <p>These terms form an agreement between you and EJ Tech Software Solutions concerning EJ TailorPro. By creating an account or using the service, you confirm that you are at least 18 years old, have authority to accept these terms and will comply with applicable Nigerian law.</p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>TailorPro provides tools for managing client profiles, measurements, orders, calendars, reminders and shareable measurement records. We may improve, modify or discontinue features. We will take reasonable steps to avoid unnecessary disruption but do not promise uninterrupted or error-free availability.</p>
      </LegalSection>

      <LegalSection title="3. Accounts and security">
        <LegalList>
          <li>Provide accurate registration information and keep it current.</li>
          <li>Keep passwords, devices and share links secure and confidential.</li>
          <li>Notify us promptly if you suspect unauthorised access.</li>
          <li>You are responsible for activity performed through your account unless caused by our failure to use reasonable security.</li>
          <li>One person or business must not impersonate another or create accounts for unlawful purposes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Your client records">
        <p>You retain ownership of lawful content you enter. You grant us a limited licence to host, copy, process, display and transmit that content only as needed to operate and secure TailorPro.</p>
        <p>You are responsible for obtaining permission or another lawful basis before entering client information, photographs or measurements. You must keep records accurate, protect confidentiality and respond appropriately to client requests.</p>
      </LegalSection>

      <LegalSection title="5. Shareable links">
        <p>A share link allows anyone possessing the URL to view the information exposed on the public measurement page. Before creating or sending a link, confirm that you have the client’s authority and that the recipient should receive the information. Revoke a link when it is no longer needed. We are not responsible for further disclosure by a recipient you selected.</p>
      </LegalSection>

      <LegalSection title="6. Fees and subscriptions">
        <p>If paid plans are introduced or selected, prices, billing intervals, taxes and renewal terms will be shown before purchase. We will not impose an undisclosed charge. Statutory consumer rights under Nigerian law are not excluded.</p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>TailorPro’s software, interface, logo, documentation and original platform content belong to EJ Tech Software Solutions or its licensors. Except as expressly permitted, you may not copy, sell, reverse engineer, scrape, redistribute or create a competing service from protected parts of TailorPro.</p>
      </LegalSection>

      <LegalSection title="8. Suspension and termination">
        <p>You may stop using the service at any time. We may restrict or terminate access where reasonably necessary to address non-payment, security risk, unlawful activity, serious misuse or a material breach. Where practicable, we will give notice and an opportunity to remedy the issue.</p>
      </LegalSection>

      <LegalSection title="9. Disclaimers and liability">
        <p>TailorPro is a record-management tool, not legal, financial, medical or professional tailoring advice. You remain responsible for checking measurements, prices, deadlines and garment-production decisions.</p>
        <p>To the extent permitted by law, we are not liable for indirect or consequential loss, lost profit, lost opportunity, or loss caused by incorrect user entries, insecure sharing or third-party services beyond our reasonable control. Nothing in these terms excludes liability that cannot lawfully be excluded, including rights protected by the Federal Competition and Consumer Protection Act 2018.</p>
      </LegalSection>

      <LegalSection title="10. Governing law and disputes">
        <p>These terms are governed by the laws of the Federal Republic of Nigeria. Please contact us first so we can try to resolve a dispute informally. If it cannot be resolved, either party may approach a court of competent jurisdiction in Nigeria or any regulator with lawful authority.</p>
      </LegalSection>

      <LegalSection title="11. General terms">
        <p>If part of these terms is unenforceable, the remaining provisions continue to apply. A delay in enforcement is not a waiver. We may update these terms and will give reasonable notice of material changes. Continued use after the effective date constitutes acceptance, except where the law requires fresh consent.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
