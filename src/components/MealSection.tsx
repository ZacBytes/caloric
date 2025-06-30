
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  meal_type?: string;
}

interface MealSectionProps {
  title: string;
  mealType: string;
  entries: FoodEntry[];
  onAddFood: (mealType: string) => void;
  onRemoveEntry: (id: string) => void;
  icon: React.ReactNode;
}

const MealSection: React.FC<MealSectionProps> = ({
  title,
  mealType,
  entries,
  onAddFood,
  onRemoveEntry,
  icon
}) => {
  const mealEntries = entries.filter(entry => entry.meal_type === mealType);
  const totalCalories = mealEntries.reduce((sum, entry) => sum + Number(entry.calories), 0);
  const totalProtein = mealEntries.reduce((sum, entry) => sum + Number(entry.protein), 0);
  const totalCarbs = mealEntries.reduce((sum, entry) => sum + Number(entry.carbs), 0);
  const totalFat = mealEntries.reduce((sum, entry) => sum + Number(entry.fat), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {Math.round(totalCalories)} cal
            </Badge>
            <Button size="sm" onClick={() => onAddFood(mealType)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {totalCalories > 0 && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>P: {totalProtein.toFixed(1)}g</span>
            <span>C: {totalCarbs.toFixed(1)}g</span>
            <span>F: {totalFat.toFixed(1)}g</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {mealEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No items added yet
          </p>
        ) : (
          <div className="space-y-2">
            {mealEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-2 border rounded"
              >
                <div>
                  <h5 className="font-medium text-sm">{entry.name}</h5>
                  <p className="text-xs text-muted-foreground">
                    {entry.serving_size} • {Math.round(Number(entry.calories))} cal
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveEntry(entry.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MealSection;
