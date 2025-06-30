
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, Search, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
}

interface FoodSearchProps {
  onAddFood: (food: FoodItem) => void;
  onClose: () => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onAddFood, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchFood = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a food item to search for.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', searchQuery);
      
      const { data, error } = await supabase.functions.invoke('estimate-nutrition', {
        body: { foodQuery: searchQuery },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        toast({
          title: "Nutrition Estimated",
          description: `Found ${data.results.length} nutrition estimate(s) for "${searchQuery}".`,
        });
      } else {
        throw new Error('Invalid response format from nutrition service');
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to estimate nutrition. Please try again.",
        variant: "destructive",
      });
      
      // Fallback result
      setSearchResults([{
        name: `${searchQuery} (estimated)`,
        calories: 100,
        protein: 5,
        carbs: 15,
        fat: 3,
        serving_size: "100g"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFood();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Search Food</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter any food item (e.g., chicken breast, apple, pizza slice)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={searchFood} disabled={loading}>
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {searchResults.map((food, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium capitalize">{food.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Serving: {food.serving_size}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {Math.round(food.calories)} cal
                      </Badge>
                      <Badge variant="outline">
                        P: {food.protein.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline">
                        C: {food.carbs.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline">
                        F: {food.fat.toFixed(1)}g
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAddFood(food)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
            
            {searchResults.length === 0 && searchQuery && !loading && (
              <p className="text-center text-muted-foreground py-8">
                No results found. Try a different search term.
              </p>
            )}

            {searchResults.length === 0 && !searchQuery && (
              <p className="text-center text-muted-foreground py-8">
                Enter a food item above to get AI-powered nutrition estimates.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FoodSearch;
