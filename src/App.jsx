import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Cards from './pages/Cards';
import Transactions from './pages/Transactions';
import Debts from './pages/Debts';
import Todos from './pages/Todos';
import Statistics from './pages/Statistics';
import Goals from './pages/Goals';
import Navbar from './components/Navbar';
import SecurityLock from './components/SecurityLock';

function App() {
  return (
    <Router>
      <SecurityLock>
        <div className="min-h-screen bg-dark text-white font-cairo">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/goals" element={<Goals />} />
          </Routes>
          <Navbar />
        </div>
      </SecurityLock>
    </Router>
  );
}

export default App;
