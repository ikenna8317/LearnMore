import React from 'react';
import { Card, Button } from './UIComponents';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack}>← Back to Settings</Button>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to Learn More. We value your privacy and are committed to protecting your personal data. 
              Please note that Learn More is currently in a <strong>Beta</strong> phase. This means our features and this policy may evolve as we improve the application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Data We Collect</h2>
            <p className="mb-2">To provide you with the best study experience, we collect the following information:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Account Information:</strong> Your email address, name, and username.</li>
              <li><strong>Uploaded Content:</strong> Documents, notes, and text you upload for processing.</li>
              <li><strong>Generated Content:</strong> Study materials (notes, quizzes, flashcards) created by the app.</li>
              <li><strong>Activity Data:</strong> Your study progress, quiz scores, XP, and usage statistics.</li>
              <li><strong>Feedback:</strong> Any feedback, ratings, or issue reports you submit.</li>
              <li><strong>Billing Metadata:</strong> If you use paid features, we store basic metadata (e.g., plan status, renewal date). We do <strong>not</strong> store credit card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To provide the core functionality of generating study aids from your documents.</li>
              <li>To personalize your learning experience and track your progress.</li>
              <li>To identify and fix bugs during the Beta phase.</li>
              <li>To manage your account and, where applicable, process subscriptions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Payments & Billing</h2>
            <p>
              We use secure third-party payment providers (such as Stripe) to handle all financial transactions. 
              Learn More does not process or store your credit or debit card details directly. 
              We only retain necessary billing metadata to ensure your access to paid features is maintained.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Data Sharing</h2>
            <p>
              <strong>We do not sell your personal data.</strong> We do not use your content for advertising purposes.
              Data is only shared with trusted third-party service providers strictly necessary to operate the app (e.g., hosting services, AI processing providers, and payment processors).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. AI & Uploaded Content</h2>
            <p>
              Your uploaded documents are processed by AI models solely to generate study materials for you. 
              This content remains private to your account. You retain ownership of your original uploads. 
              The study materials generated are for your personal educational use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">7. Data Retention</h2>
            <p>
              We store your data for as long as your account remains active. 
              Because the app is in Beta, we may occasionally need to reset certain data structures as features evolve, though we aim to minimize disruption. 
              You may request the deletion of your account and associated data at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your data, please reach out to us via the Feedback page within the app.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
};
