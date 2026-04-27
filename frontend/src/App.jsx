import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Starfield from './components/Starfield';
import StockChart from './components/StockChart';
import { Search, TrendingUp, TrendingDown, DollarSign, Calendar, Info } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(7);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef(null);

  const durations = [
    { label: '1W', value: 7 },
    { label: '2W', value: 14 },
    { label: '1M', value: 30 },
    { label: '6M', value: 180 },
  ];

  const fetchData = async (symbol, days = duration) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/stock/${symbol}`, {
        params: { days }
      });
      setStockData(response.data);
    } catch (err) {
      setError('Ticker not found or API error. Try something like AAPL, TSLA, or BTC-USD.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE}/api/search`, { params: { q } });
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Suggestion error:', err);
    }
  };

  useEffect(() => {
    fetchData(ticker, duration);
  }, [ticker, duration]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput) fetchSuggestions(searchInput);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTicker(searchInput.toUpperCase());
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol) => {
    setTicker(symbol);
    setSearchInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="App">
      <Starfield />
      
      <div className="container">
        <header className="animate-fade">
          <div className="logo">JewPeter</div>
          
          <div className="search-wrapper" ref={searchRef}>
            <form className="search-input-group" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search markets (AAPL, TSLA, BTC...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
              />
              <Search size={18} style={{ position: 'absolute', right: '15px', opacity: 0.4 }} />
            </form>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-list">
                {suggestions.map((item) => (
                  <div 
                    key={item.symbol} 
                    className="suggestion-item"
                    onClick={() => selectSuggestion(item.symbol)}
                  >
                    <div>
                      <span className="symbol">{item.symbol}</span>
                      <span className="name" style={{ marginLeft: '10px' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main>
          {loading && !stockData && (
            <div className="card animate-fade" style={{ textAlign: 'center', padding: '5rem' }}>
              <div className="logo" style={{ fontSize: '1.2rem', opacity: 0.6 }}>Synchronizing with Galaxy Data...</div>
            </div>
          )}

          {error && (
            <div className="card animate-fade" style={{ borderColor: 'rgba(246, 79, 240, 0.3)', color: '#f64ff0' }}>
              <Info size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> {error}
            </div>
          )}

          {stockData && (
            <div className={`dashboard animate-fade ${loading ? 'loading' : ''}`} style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
              <div className="card">
                <div className="flex-between">
                  <div>
                    <h3>{stockData.ticker} • {stockData.currency}</h3>
                    <h1>{stockData.name}</h1>
                    <div className="price-main">
                      {stockData.current_price.toFixed(2)}
                      <span className="price-currency">{stockData.currency}</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div className="duration-selector">
                      {durations.map((d) => (
                        <button
                          key={d.value}
                          className={`duration-btn ${duration === d.value ? 'active' : ''}`}
                          onClick={() => setDuration(d.value)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.5 }}>
                      <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 
                      Forecast: {duration} Days
                    </div>
                  </div>
                </div>

                <div className="chart-container">
                  <StockChart data={stockData.forecast} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(77, 238, 234, 0.1)', borderRadius: '12px' }}>
                      <TrendingUp size={20} className="accent-cyan" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Celestial Trajectory</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    Our XGBoost model has processed technical signals and volume variance. 
                    The current trajectory indicates a {stockData.forecast[stockData.forecast.length-1].predicted > stockData.current_price ? 'positive shift' : 'downward adjustment'} in the upcoming cycle.
                  </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '10px', background: 'rgba(123, 97, 255, 0.1)', borderRadius: '12px' }}>
                      <TrendingDown size={20} className="accent-purple" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Market Resonance</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    Liquidity pools and volatility indexes are showing {Math.abs((stockData.forecast[stockData.forecast.length-1].predicted / stockData.current_price) - 1) > 0.05 ? 'elevated' : 'stable'} resonance patterns. Predictions are recalibrated based on celestial market movements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ marginTop: '5rem', textAlign: 'center', opacity: 0.3, fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          JEWPETER • CELESTIAL DATA INTERFACE • {new Date().getFullYear()} • NOT FINANCIAL ADVICE
        </footer>
      </div>
    </div>
  );
}

export default App;
