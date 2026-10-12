import { Route, Routes } from 'react-router'
import { PublicLayout } from './components/PublicLayout'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/public/HomePage'
import { HowItWorksPage } from './pages/public/HowItWorksPage'
import { VerifyPage } from './pages/public/VerifyPage'
import { VerifyPlotPage, VerifyTransactionPage } from './pages/public/VerifyResultPage'
import { LegalPage } from './pages/public/LegalPage'
import { LoginPage } from './pages/public/LoginPage'
import { RegisterPage } from './pages/public/RegisterPage'
import { NotFoundPage } from './pages/public/NotFoundPage'
import { DashboardPage } from './pages/app/DashboardPage'
import { PlotsPage } from './pages/app/PlotsPage'
import { PlotNewPage } from './pages/app/PlotNewPage'
import { PlotDetailPage } from './pages/app/PlotDetailPage'
import { HandshakePage } from './pages/app/HandshakePage'
import { TransactionsPage } from './pages/app/TransactionsPage'
import { TransactionDetailPage } from './pages/app/TransactionDetailPage'
import { CertificatePage } from './pages/app/CertificatePage'
import { SyncPage } from './pages/app/SyncPage'
import { StaffPage } from './pages/app/StaffPage'
import { cookiePolicy, privacyPolicy, termsOfUse } from './data/policies'

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="verify/plot/:id" element={<VerifyPlotPage />} />
        <Route path="verify/tx/:id" element={<VerifyTransactionPage />} />
        <Route path="privacy" element={<LegalPage doc={privacyPolicy} />} />
        <Route path="terms" element={<LegalPage doc={termsOfUse} />} />
        <Route path="cookies" element={<LegalPage doc={cookiePolicy} />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="app" element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionDetailPage />} />
          <Route path="transactions/:id/certificate" element={<CertificatePage />} />
          <Route element={<RequireAuth roles={['mwenyekiti', 'officer']} />}>
            <Route path="plots" element={<PlotsPage />} />
            <Route path="plots/new" element={<PlotNewPage />} />
            <Route path="plots/:id" element={<PlotDetailPage />} />
          </Route>
          <Route element={<RequireAuth roles={['mwenyekiti']} />}>
            <Route path="handshake" element={<HandshakePage />} />
            <Route path="sync" element={<SyncPage />} />
          </Route>
          <Route element={<RequireAuth roles={['officer']} />}>
            <Route path="staff" element={<StaffPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
