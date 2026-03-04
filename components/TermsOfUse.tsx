import React from 'react';
import { Card, Button } from './UIComponents';

interface TermsOfUseProps {
  onBack: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack}>← Back to Settings</Button>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms of Use</h1>
          <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Beta Disclaimer</h2>
            <p>
              Learn More is currently in <strong>Beta</strong>. The application is provided "as is" and "as available". 
              Features may change, be removed, or behave unexpectedly. We appreciate your patience and feedback as we work to improve the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Free & Paid Features</h2>
            <p>
              Some features of Learn More are available for free, while others may require a paid subscription or one-time payment. 
              We reserve the right to modify which features are paid or free at any time. 
              Specific feature availability may vary depending on your selected plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Payments & Subscriptions</h2>
            <p className="mb-2">If you choose to purchase a plan:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Pricing:</strong> Prices and plans are subject to change. We will provide notice of significant price changes.</li>
              <li><strong>Billing:</strong> Payments are processed by secure third-party providers. You agree to provide current and accurate billing information.</li>
              <li><strong>Refunds:</strong> Refunds are generally discretionary unless required by local law. Please contact support if you believe there has been a billing error.</li>
              <li><strong>Non-payment:</strong> Failure to pay applicable fees may result in the suspension of access to paid features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Educational Disclaimer</h2>
            <p>
              Learn More is strictly a study aid. While we strive for accuracy in AI-generated materials, we cannot guarantee that all content is 100% correct or complete. 
              Use of this app does not guarantee specific grades, exam results, or academic performance. Always verify critical information with your primary study resources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You must have the legal right to upload any documents or content you provide to the app.</li>
              <li>You agree not to use the app for any illegal, harmful, or abusive purposes.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Availability</h2>
            <p>
              We do not guarantee uninterrupted access to the service. Access may be temporarily suspended for maintenance, updates, or in the event of technical issues. 
              We are not liable for any loss of data or study time resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Learn More application, brand, and code belong to the developer. 
              You retain full ownership of the documents you upload. 
              The study materials generated for you are licensed to you for your personal use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, the developer shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the app, especially considering its Beta nature.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the service.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};
