import React, { useEffect, useState } from 'react';
import { initDb, getCurrentUser, logout } from './db/localDb';
import { ApplicationUser } from './db/schema';
import { MobileFrame } from './components/MobileFrame';
import { AuthScreen } from './components/AuthScreen';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { AdminPortal } from './components/AdminPortal';

function App() {
  const [currentUser, setCurrentUser] = useState<ApplicationUser | null>(null);

  // Initialize DB once on start
  useEffect(() => {
    initDb(); // auto seeds localDb if not already initialized
    setCurrentUser(getCurrentUser());
  }, []);

  const handleLoginSuccess = (user: ApplicationUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  return (
    <MobileFrame>
      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.role === 'Student' ? (
        <StudentPortal user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'Teacher' ? (
        <TeacherPortal user={currentUser} onLogout={handleLogout} />
      ) : currentUser.role === 'Admin' ? (
        <AdminPortal user={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Неизвестная роль аккаунта!</p>
          <button type="button" className="btn-danger" style={{ marginTop: '14px' }} onClick={handleLogout}>Выйти</button>
        </div>
      )}
    </MobileFrame>
  );
}

export default App;
