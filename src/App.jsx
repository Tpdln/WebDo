import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import AdminDashboard from './pages/AdminDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  return (
    <BrowserRouter>
      <CssBaseline />
      <Routes>
        
        <Route path="/" element={<Login />} />
        
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/advisor" element={<AdvisorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


