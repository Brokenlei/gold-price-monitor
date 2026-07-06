import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PriceHistory } from '../types';

interface MiniChartProps {
  data: PriceHistory[];
  isUp: boolean;
}

export function MiniChart({ data, isUp }: MiniChartProps) {
  if (data.length < 2) {
    return <div className="w-32 h-12 bg-slate-700/30 rounded" />;
  }

  const chartData = data.slice(-30).map((d, i) => ({
    ...d,
    index: i,
  }));

  const color = isUp ? '#ff4757' : '#00d4aa';

  return (
    <div className="w-32 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData} 
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          syncId="mini-chart"
        >
          <CartesianGrid strokeDasharray="2 2" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="index" 
            hide 
          />
          <YAxis 
            domain={['auto', 'auto']} 
            hide 
          />
          <Line
            type="monotone"
            dataKey="cnyPrice"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={300}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}