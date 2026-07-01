import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Landing from '../pages/Landing.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import OAuthCallback from '../pages/OAuthCallback.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx';
import KanbanBoard from '../pages/KanbanBoard.jsx';
import ApplicationsPage from '../pages/ApplicationsPage.jsx';
import ApplicationDetailPage from '../pages/ApplicationDetailPage.jsx';
import ResumeVaultPage from '../pages/ResumeVaultPage.jsx';
import AIReviewPage from '../pages/AIReviewPage.jsx';
import CoverLetterPage from '../pages/CoverLetterPage.jsx';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import BillingPage from '../pages/BillingPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';
import ContactsPage from '../pages/ContactsPage.jsx';
import JobsPage from '../pages/JobsPage.jsx';
import AIInterviewPrepPage from '../pages/AIInterviewPrepPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import ResumeBuilderPage from '../pages/ResumeBuilderPage.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminAIUsage from '../pages/admin/AdminAIUsage.jsx';
import AdminBroadcast from '../pages/admin/AdminBroadcast.jsx';
import AdminFeatureFlags from '../pages/admin/AdminFeatureFlags.jsx';
import AdminLayout from '../pages/admin/AdminLayout.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import AdminRoute from './AdminRoute.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<KanbanBoard />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/resumes" element={<ResumeVaultPage />} />
            <Route path="/ai/review" element={<AIReviewPage />} />
            <Route path="/ai/cover-letter" element={<CoverLetterPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/checkout" element={<CheckoutPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/ai/interview-prep" element={<AIInterviewPrepPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/ai-usage" element={<AdminAIUsage />} />
            <Route path="/admin/broadcast" element={<AdminBroadcast />} />
            <Route path="/admin/flags" element={<AdminFeatureFlags />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
