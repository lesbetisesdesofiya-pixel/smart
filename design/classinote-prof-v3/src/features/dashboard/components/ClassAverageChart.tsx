import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import type { MoyenneClasse } from '@/shared/types';

interface ClassAverageChartProps {
  data: MoyenneClasse[];
}

const getBarColor = (moyenne: number) => {
  if (moyenne >= 14) return '#10b981';
  if (moyenne >= 10) return '#f59e0b';
  return '#ef4444';
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="font-bold text-gray-900">{payload[0].payload.classe}</p>
      <p className="text-gray-500">Moyenne: <span className="font-bold text-gray-900">{payload[0].value}/20</span></p>
    </div>
  );
};

export const ClassAverageChart: React.FC<ClassAverageChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <Card className="p-5" delay={0.2}>
      <h3 className="text-sm font-bold text-gray-900 mb-4">Moyennes par classe</h3>
      <div style={{ height: data.length * 40 + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" domain={[0, 20]} tick={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="classe"
              width={70}
              tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="moyenne" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.moyenne)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
