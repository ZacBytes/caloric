import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Progress } from '@/components/ui/progress';

interface DailyChartProps {
  target: number;
  current: number;
  protein: number;
  carbs: number;
  fat: number;
}

const CircularProgress: React.FC<{ value: number; isOverTarget: boolean }> = ({ value, isOverTarget }) => {
  const radius = 100;
  const strokeWidth = 15;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke={isOverTarget ? '#ef4444' : '#22c55e'}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
    </div>
  );
};

const DailyChart: React.FC<DailyChartProps> = ({ target, current, protein, carbs, fat }) => {
  const calorieProgress = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;

  const calorieData = [
    {
      name: 'Consumed',
      calories: current,
    },
    {
      name: 'Target',
      calories: target,
    },
  ];

  const macroData = [
    {
      name: 'Protein',
      value: protein * 4,
      grams: protein,
      color: '#8b5cf6',
      percentage: current > 0 ? ((protein * 4) / current * 100) : 0,
    },
    {
      name: 'Carbs',
      value: carbs * 4,
      grams: carbs,
      color: '#06b6d4',
      percentage: current > 0 ? ((carbs * 4) / current * 100) : 0,
    },
    {
      name: 'Fat',
      value: fat * 9,
      grams: fat,
      color: '#f59e0b',
      percentage: current > 0 ? ((fat * 9) / current * 100) : 0,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-primary">
            {`${payload[0].value.toFixed(0)} calories`}
          </p>
        </div>
      );
    }
    return null;
  };

  const MacroTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p>{`${data.grams.toFixed(1)}g (${data.percentage.toFixed(1)}%)`}</p>
          <p className="text-sm text-muted-foreground">{`${data.value.toFixed(0)} calories`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Calorie Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circular Progress */}
        <div className="flex flex-col items-center space-y-4">
          <h4 className="text-lg font-semibold">Daily Calorie Goal</h4>
          <div className="relative">
            <CircularProgress value={calorieProgress} isOverTarget={isOverTarget} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(calorieProgress)}%</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(current)} / {target}
              </span>
            </div>
          </div>
          {isOverTarget && (
            <p className="text-sm text-red-600 text-center">
              {Math.round(current - target)} calories over target
            </p>
          )}
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Calorie Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="calories"
                fill={isOverTarget ? '#ef4444' : '#22c55e'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macronutrient Section */}
      {(protein + carbs + fat) > 0 && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold">Macronutrient Breakdown</h4>

          {/* Macro Progress Bars */}
          <div className="space-y-4">
            {macroData.map((macro) => (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: macro.color }}
                    />
                    {macro.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {macro.grams.toFixed(1)}g ({macro.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={macro.percentage}
                  className="h-2"
                  style={{
                    '--progress-background': macro.color,
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </div>

          {/* Pie Chart */}
          <div className="flex justify-center">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => percentage > 5 ? `${name}` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<MacroTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Protein</p>
          <p className="text-xl font-bold text-purple-600">{protein.toFixed(1)}g</p>
          <p className="text-xs text-muted-foreground">{((protein * 4 / current) * 100 || 0).toFixed(0)}% of calories</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Carbs</p>
          <p className="text-xl font-bold text-cyan-600">{carbs.toFixed(1)}g</p>
          <p className="text-xs text-muted-foreground">{((carbs * 4 / current) * 100 || 0).toFixed(0)}% of calories</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Fat</p>
          <p className="text-xl font-bold text-amber-600">{fat.toFixed(1)}g</p>
          <p className="text-xs text-muted-foreground">{((fat * 9 / current) * 100 || 0).toFixed(0)}% of calories</p>
        </div>
      </div>
    </div>
  );
};

export default DailyChart;
