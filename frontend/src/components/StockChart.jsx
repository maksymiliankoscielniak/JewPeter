import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="neon-card" style={{ padding: '10px', background: 'rgba(5, 5, 5, 0.9)', border: '1px solid #00f2ff' }}>
        <p style={{ color: '#fff', marginBottom: '5px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '0.9rem' }}>
            {entry.name}: {entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StockChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="neon-card">No data available</div>;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fontSize: 12 }}
            minTickGap={30}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            name="Actual Price"
            type="monotone"
            dataKey="actual"
            stroke="#00f2ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, stroke: '#00f2ff', strokeWidth: 2, fill: '#050505' }}
          />
          <Line
            name="Predicted Price"
            type="monotone"
            dataKey="predicted"
            stroke="#ff00ff"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 6, stroke: '#ff00ff', strokeWidth: 2, fill: '#050505' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
