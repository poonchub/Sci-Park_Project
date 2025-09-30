import './App.css';
import React from 'react';
import { BrowserRouter as Router} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import theme from './styles/Theme';
import AppRoutes from './routes';
import CookieConsent from './components/CookieConsent/CookieConsent';

const AppContent: React.FC = () => {
  return (
    <div className="App">
      <AppRoutes />
      <CookieConsent />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme} defaultMode="light">
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App;
