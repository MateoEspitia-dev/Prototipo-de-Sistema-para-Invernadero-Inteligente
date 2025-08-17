import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const GaugeChartComponent = ({ value, maxValue }) => {
  const data = [{ value }];
  return (
    <RadialBarChart width={300} height={300} innerRadius={20} outerRadius={130} data={data}>
      <PolarAngleAxis domain={[0, maxValue]} type="number" angleAxisId={0} tick={false} />
      <RadialBar minAngle={0} maxAngle={360} background clockWise={true} dataKey="value" />
    </RadialBarChart>
  );
};

export default GaugeChartComponent;