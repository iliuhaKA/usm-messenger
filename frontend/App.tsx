import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<div>Login Page (TODO)</div>} />
        <Route path="/chat" element={<div>Chat Page (TODO)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Временный HomePage для тестирования
function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          USMchat
        </h1>
        <p className="text-text-muted">
          Мессенджер для Молдавского государственного университета
        </p>
        <div className="mt-8 space-x-4">
          <a 
            href="/login" 
            className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Войти
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;