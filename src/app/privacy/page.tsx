export default function PrivacyPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: '#374151',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Privacy Policy
          </h1>

          <div style={{ fontSize: '1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Last updated:</strong> December 2024
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We collect information you provide directly to us, such as when you create an account, make a purchase, 
              or contact us for support. This may include:
            </p>
            <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }}>
              <li>Name and email address</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Usage data and preferences</li>
              <li>Communication history</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }}>
              <li>Provide and maintain our services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important updates and notifications</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              3. Information Sharing
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We do not sell, trade, or otherwise transfer your personal information to third parties except:
            </p>
            <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }}>
              <li>With your explicit consent</li>
              <li>To trusted third-party service providers (e.g., Stripe for payments)</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and safety</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              4. Data Security
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              5. Your Rights (GDPR)
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul style={{ marginBottom: '1rem', paddingLeft: '2rem' }}>
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> Object to processing of your data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              6. Data Retention
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
              policy, unless a longer retention period is required by law.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              7. Cookies and Tracking
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized 
              content. You can control cookie settings through your browser preferences.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              8. International Data Transfers
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate 
              safeguards are in place to protect your data in accordance with GDPR requirements.
            </p>

                          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              9. Children&apos;s Privacy
              </h2>
            <p style={{ marginBottom: '1rem' }}>
              Our services are not intended for children under 16. We do not knowingly collect personal information 
              from children under 16.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              10. Changes to This Policy
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We may update this privacy policy from time to time.               We will notify you of any changes by posting the 
              new policy on this page and updating the &quot;Last updated&quot; date.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              11. Contact Us
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have any questions about this privacy policy or wish to exercise your GDPR rights, please contact us:
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <strong>Data Protection Officer:</strong><br />
              Email: privacy@ai-prompt-templates.com<br />
              Address: [Your Business Address]<br />
              Phone: [Your Phone Number]
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
              12. Supervisory Authority
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you believe we have not addressed your concerns adequately, you have the right to lodge a complaint 
              with your local data protection supervisory authority.
            </p>

            <div style={{ 
              marginTop: '3rem', 
              padding: '1.5rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                This privacy policy is compliant with GDPR requirements and protects your fundamental rights and freedoms 
                regarding the processing of your personal data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
