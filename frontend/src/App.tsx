import './App.css';
import { BrowserRouter as Router } from 'react-router-dom';
import ConfigRoutes from './routes';
import theme from './styles/Theme';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

function App() {
  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <Router>
        <ConfigRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
