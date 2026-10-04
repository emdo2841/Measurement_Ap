import LegalPageLayout, { LegalList, LegalSection } from '../components/legal/LegalPageLayout'

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie policy" description="How TailorPro uses cookies and similar browser technologies." lastUpdated="4 October 2026">
      <LegalSection title="1. What cookies are">
        <p>Cookies are small text files stored by a browser. Similar technologies include local storage, session storage and device identifiers. They help websites remember settings, maintain secure sessions and understand technical performance.</p>
      </LegalSection>

      <LegalSection title="2. Technologies TailorPro uses">
        <LegalList>
          <li><strong>Strictly necessary:</strong> authentication, refresh-token cookies, security controls, request routing and fraud prevention.</li>
          <li><strong>Preferences:</strong> settings such as notification choices or interface preferences.</li>
          <li><strong>Local storage:</strong> TailorPro may store an access token in your browser so the application can authenticate API requests.</li>
          <li><strong>Third-party authentication:</strong> Google sign-in may set or read its own cookies according to Google’s policies when you choose that option.</li>
        </LegalList>
        <p>TailorPro should not activate non-essential advertising or analytics cookies without any consent required by applicable law. If such tools are introduced, this policy and the consent controls should be updated first.</p>
      </LegalSection>

      <LegalSection title="3. Managing cookies">
        <p>You can block or delete cookies through your browser settings. Blocking necessary cookies may prevent login, password refresh, Google authentication or other core features from working correctly. Removing local storage may sign you out.</p>
      </LegalSection>

      <LegalSection title="4. Retention and updates">
        <p>Session technologies expire when the session ends, while persistent technologies remain for the period configured or until deleted. Security and authentication records may be retained separately as described in our Privacy Policy. We will update this policy if our use of cookies materially changes.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
