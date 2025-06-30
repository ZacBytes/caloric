import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FoodSearch from '@/components/FoodSearch';
import DailyChart from '@/components/DailyChart';
import CustomFoodForm from '@/components/CustomFoodForm';
import MealSection from '@/components/MealSection';

interface UserProfile {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activity_level: string;
  goal: 'bulk' | 'cut' | 'maintain';
  maintenance_calories: number;
  target_calories: number;
}

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  logged_at: string;
  meal_type?: string;
}

const CalorieTracker = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todaysEntries, setTodaysEntries] = useState<FoodEntry[]>([]);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadEntriesForDate = async (date: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: entriesData, error: entriesError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', `${date}T00:00:00`)
        .lt('logged_at', `${date}T23:59:59`)
        .order('logged_at', { ascending: false });

      if (entriesError) {
        console.error('Entries error:', entriesError);
      } else {
        setTodaysEntries(entriesData || []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          navigate('/onboarding');
          return;
        }

        // Cast the database types to match our interface
        const typedProfile: UserProfile = {
          weight: profileData.weight,
          height: profileData.height,
          age: profileData.age,
          gender: profileData.gender as 'male' | 'female',
          activity_level: profileData.activity_level,
          goal: profileData.goal as 'bulk' | 'cut' | 'maintain',
          maintenance_calories: profileData.maintenance_calories,
          target_calories: profileData.target_calories,
        };

        setProfile(typedProfile);

        // Load entries for selected date
        await loadEntriesForDate(selectedDate);

      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load your data. Please try refreshing.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [navigate, selectedDate]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  const goToPreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDisplayDate = (date: string) => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (date === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const addFoodEntry = async (food: Omit<FoodEntry, 'id' | 'logged_at'> & { meal_type?: string }, mealType?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create the logged_at timestamp using the selected date
      const loggedAt = new Date(selectedDate + 'T' + new Date().toTimeString().split(' ')[0]);

      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: session.user.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          serving_size: food.serving_size,
          meal_type: food.meal_type || mealType || selectedMealType,
          logged_at: loggedAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTodaysEntries(prev => [data, ...prev]);
      setShowFoodSearch(false);
      setShowCustomFood(false);
      setSelectedMealType('');

      toast({
        title: "Food Added",
        description: `${food.name} has been added to your daily log.`,
      });
    } catch (error) {
      console.error('Error adding food:', error);
      toast({
        title: "Error",
        description: "Failed to add food entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodaysEntries(prev => prev.filter(entry => entry.id !== id));

      toast({
        title: "Food Removed",
        description: "Food item has been removed from your daily log.",
      });
    } catch (error) {
      console.error('Error removing food:', error);
      toast({
        title: "Error",
        description: "Failed to remove food entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddFood = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowFoodSearch(true);
  };

  const handleAddCustomFood = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowCustomFood(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Loading your profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>No profile found. Please complete the onboarding process.</p>
            <Button onClick={() => navigate('/onboarding')} className="mt-4">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCalories = todaysEntries.reduce((sum, entry) => sum + Number(entry.calories), 0);
  const totalProtein = todaysEntries.reduce((sum, entry) => sum + Number(entry.protein), 0);
  const totalCarbs = todaysEntries.reduce((sum, entry) => sum + Number(entry.carbs), 0);
  const totalFat = todaysEntries.reduce((sum, entry) => sum + Number(entry.fat), 0);

  const caloriesProgress = Math.min((totalCalories / profile.target_calories) * 100, 100);
  const remainingCalories = Math.max(profile.target_calories - totalCalories, 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CaloricAI Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium">{formatDisplayDate(selectedDate)}</p>
                </div>
                {selectedDate !== new Date().toISOString().split('T')[0] && (
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
              <div className="text-sm text-muted-foreground">of {profile.target_calories}</div>
              <Progress value={caloriesProgress} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(remainingCalories)} remaining
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProtein.toFixed(1)}g</div>
              <Badge variant="secondary" className="mt-2">
                {((totalProtein * 4 / totalCalories) * 100 || 0).toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCarbs.toFixed(1)}g</div>
              <Badge variant="secondary" className="mt-2">
                {((totalCarbs * 4 / totalCalories) * 100 || 0).toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFat.toFixed(1)}g</div>
              <Badge variant="secondary" className="mt-2">
                {((totalFat * 9 / totalCalories) * 100 || 0).toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Intake Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyChart
              target={profile.target_calories}
              current={totalCalories}
              protein={totalProtein}
              carbs={totalCarbs}
              fat={totalFat}
            />
          </CardContent>
        </Card>

        {/* Meal Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's Meals</h2>
            <Button onClick={() => setShowCustomFood(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Food
            </Button>
          </div>

          <div className="grid gap-4">
            <MealSection
              title="Breakfast"
              mealType="breakfast"
              entries={todaysEntries}
              onAddFood={handleAddFood}
              onRemoveEntry={removeEntry}
              icon={<div className="w-5 h-5 bg-yellow-500 rounded-full" />}
            />

            <MealSection
              title="Lunch"
              mealType="lunch"
              entries={todaysEntries}
              onAddFood={handleAddFood}
              onRemoveEntry={removeEntry}
              icon={<div className="w-5 h-5 bg-orange-500 rounded-full" />}
            />

            <MealSection
              title="Dinner"
              mealType="dinner"
              entries={todaysEntries}
              onAddFood={handleAddFood}
              onRemoveEntry={removeEntry}
              icon={<div className="w-5 h-5 bg-red-500 rounded-full" />}
            />

            <MealSection
              title="Snacks"
              mealType="snacks"
              entries={todaysEntries}
              onAddFood={handleAddFood}
              onRemoveEntry={removeEntry}
              icon={<div className="w-5 h-5 bg-green-500 rounded-full" />}
            />
          </div>
        </div>

        {/* Food Search Modal */}
        {showFoodSearch && (
          <FoodSearch
            onAddFood={(food) => addFoodEntry(food, selectedMealType)}
            onClose={() => {
              setShowFoodSearch(false);
              setSelectedMealType('');
            }}
          />
        )}

        {/* Custom Food Modal */}
        {showCustomFood && (
          <CustomFoodForm
            onAddFood={(food) => addFoodEntry(food)}
            onClose={() => {
              setShowCustomFood(false);
              setSelectedMealType('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CalorieTracker;
