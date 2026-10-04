import LegalPageLayout, { LEGAL_EMAIL, LegalList, LegalSection } from '../components/legal/LegalPageLayout'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy policy" description="How EJ TailorPro collects, uses, protects and shares personal information." lastUpdated="4 October 2026">
      <LegalSection title="1. Who we are">
        <p>EJ TailorPro is a tailoring and fashion-business management service provided by EJ Tech Software Solutions (“EJ TailorPro”, “we”, “us” or “our”). This policy applies when you create an account, use our website or application, contact us, or open a measurement link shared through the service.</p>
        <p>For personal data processed to operate your TailorPro account, EJ Tech Software Solutions acts as the data controller. Tailors using TailorPro may separately control the information they enter about their own clients.</p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <LegalList>
          <li>Account details such as your name, email address, phone number, password hash and profile photograph.</li>
          <li>Authentication information, including Google account identifiers when you choose Google sign-in, verification codes, refresh tokens and security logs.</li>
          <li>Business records you enter, including client names and contact information, body measurements, orders, prices, due dates, notes and uploaded images.</li>
          <li>Notification information, including browser push-subscription details and reminder preferences.</li>
          <li>Technical data such as IP address, device/browser information, request logs, cookies and service-security events.</li>
          <li>Support messages and other information you voluntarily send to us.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Why we use information">
        <p>We process information where necessary to perform our contract with you, comply with legal obligations, pursue legitimate interests such as security and service improvement, or where you have given consent.</p>
        <LegalList>
          <li>Create and secure accounts, verify email addresses and provide sign-in and password recovery.</li>
          <li>Store and display clients, measurements, orders, calendars and reminders.</li>
          <li>Create temporary read-only measurement links when requested by the account owner.</li>
          <li>Send transactional messages, verification codes, security notices and service communications.</li>
          <li>Prevent fraud, abuse, unauthorised access and violations of our terms.</li>
          <li>Diagnose faults, maintain the platform and improve performance.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Tailors and their clients">
        <p>If a tailor records information about a client, the tailor is responsible for having an appropriate legal basis, giving any required notice, keeping the record accurate and responding to the client’s privacy requests. Tailors must not enter information they are not authorised to collect.</p>
      </LegalSection>

      <LegalSection title="5. Sharing and service providers">
        <p>We do not sell personal data. We may disclose limited information to providers that help us supply hosting, databases, image storage, email delivery, authentication, monitoring and notifications. These providers may only process information for the contracted service and must apply appropriate safeguards.</p>
        <p>We may also disclose information where required by Nigerian law, a valid court order, or to protect users, the public, our rights or the security of the service. A measurement is shared publicly only when an authorised user deliberately creates a share link. Anyone holding that link may view the limited information exposed by it until it expires or is revoked.</p>
      </LegalSection>

      <LegalSection title="6. International transfers">
        <p>Some technology providers may process data outside Nigeria. Where this happens, we will use safeguards required by the Nigeria Data Protection Act 2023, including an adequacy basis, contractual protection, consent where appropriate, or another lawful transfer mechanism.</p>
      </LegalSection>

      <LegalSection title="7. Retention and security">
        <p>We retain information only for as long as reasonably necessary to provide the service, meet legal obligations, resolve disputes and enforce agreements. Retention periods depend on the record and why it is held. Account owners should delete client records they no longer need.</p>
        <p>We use reasonable technical and organisational controls, including access controls, encrypted connections, password hashing, rate limiting and logging. No internet service is completely secure, so users must protect their passwords and promptly report suspected compromise.</p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>Subject to the Nigeria Data Protection Act 2023, you may request access, correction, deletion, restriction, objection, portability, withdrawal of consent and information about automated decision-making where applicable. You may also complain to the Nigeria Data Protection Commission.</p>
        <p>Send a request to <a className="font-bold text-[#557466]" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. We may verify your identity before acting. If your information was entered by a tailor, contact that tailor first because they control that client record.</p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>TailorPro is intended for business users aged 18 or older. We do not knowingly invite children to create accounts. Users must obtain any legally required parental or guardian authority before recording a minor’s measurements or other personal data.</p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>We may update this policy when the service or applicable law changes. We will publish the revised version with a new effective date and provide additional notice where a change is material.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
