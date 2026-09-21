import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-ink-50 font-sans text-ink-900">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {/* Adicionar rotas da feature auth e dashboard aqui futuramente */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
