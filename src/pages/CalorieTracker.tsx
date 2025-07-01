import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Plus, Settings, ChevronLeft, ChevronRight, MessageCircle, X, Send } from 'lucide-react';
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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI nutrition assistant. I can help you with meal planning, nutrition advice, and tracking your goals. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

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

  // Chatbot functions
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Check for OpenAI API key
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }

      // Get comprehensive user data using existing Supabase code
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Get today's entries
      const today = new Date().toISOString().split('T')[0];
      const { data: todayEntries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', `${today}T00:00:00`)
        .lt('logged_at', `${today}T23:59:59`)
        .order('logged_at', { ascending: false });

      // Get this week's entries
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weekEntries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', startOfWeek.toISOString())
        .order('logged_at', { ascending: false });

      // Get this month's entries
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthEntries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('logged_at', startOfMonth.toISOString())
        .order('logged_at', { ascending: false });

      // Calculate totals for different periods
      const calculateTotals = (entries: any[]) => {
        return entries?.reduce((acc, entry) => ({
          calories: acc.calories + Number(entry.calories),
          protein: acc.protein + Number(entry.protein),
          carbs: acc.carbs + Number(entry.carbs),
          fat: acc.fat + Number(entry.fat),
          count: acc.count + 1
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      };

      const todayTotals = calculateTotals(todayEntries || []);
      const weekTotals = calculateTotals(weekEntries || []);
      const monthTotals = calculateTotals(monthEntries || []);

      // Group entries by date for trend analysis
      const groupByDate = (entries: any[]) => {
        const grouped: { [key: string]: any[] } = {};
        entries?.forEach(entry => {
          const date = entry.logged_at.split('T')[0];
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(entry);
        });
        return grouped;
      };

      const weeklyGrouped = groupByDate(weekEntries || []);
      const monthlyGrouped = groupByDate(monthEntries || []);

      // Calculate averages
      const weekDays = Object.keys(weeklyGrouped).length || 1;
      const monthDays = Object.keys(monthlyGrouped).length || 1;

      const weekAverage = {
        calories: weekTotals.calories / weekDays,
        protein: weekTotals.protein / weekDays,
        carbs: weekTotals.carbs / weekDays,
        fat: weekTotals.fat / weekDays
      };

      const monthAverage = {
        calories: monthTotals.calories / monthDays,
        protein: monthTotals.protein / monthDays,
        carbs: monthTotals.carbs / monthDays,
        fat: monthTotals.fat / monthDays
      };

      // Get most common foods
      const foodFrequency: { [key: string]: number } = {};
      monthEntries?.forEach(entry => {
        foodFrequency[entry.name] = (foodFrequency[entry.name] || 0) + 1;
      });
      const topFoods = Object.entries(foodFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([food, count]) => `${food} (${count}x)`);

      // Analyze meal patterns
      const mealPatterns: { [key: string]: number } = {};
      monthEntries?.forEach(entry => {
        if (entry.meal_type) {
          mealPatterns[entry.meal_type] = (mealPatterns[entry.meal_type] || 0) + 1;
        }
      });

      // Create comprehensive context for AI
      const systemPrompt = `You are an AI nutrition assistant for a calorie tracking app. You provide personalized, encouraging nutrition advice based on user data. Keep responses concise but helpful. Always be supportive and avoid being overly prescriptive about specific medical conditions.

USER PROFILE:
- Age: ${profile?.age}
- Weight: ${profile?.weight}kg
- Height: ${profile?.height}cm
- Gender: ${profile?.gender}
- Activity Level: ${profile?.activity_level}
- Goal: ${profile?.goal}
- Target Calories: ${profile?.target_calories}
- Maintenance Calories: ${profile?.maintenance_calories}

TODAY'S INTAKE:
- Calories: ${todayTotals.calories}/${profile?.target_calories || 0} (${Math.round((todayTotals.calories / (profile?.target_calories || 1)) * 100)}%)
- Protein: ${todayTotals.protein}g
- Carbs: ${todayTotals.carbs}g
- Fat: ${todayTotals.fat}g
- Items logged: ${todayTotals.count}

WEEKLY AVERAGES:
- Calories: ${Math.round(weekAverage.calories)}
- Protein: ${Math.round(weekAverage.protein)}g
- Carbs: ${Math.round(weekAverage.carbs)}g
- Fat: ${Math.round(weekAverage.fat)}g

MONTHLY AVERAGES:
- Calories: ${Math.round(monthAverage.calories)}
- Protein: ${Math.round(monthAverage.protein)}g
- Carbs: ${Math.round(monthAverage.carbs)}g
- Fat: ${Math.round(monthAverage.fat)}g

TOP FOODS THIS MONTH:
${topFoods.length > 0 ? topFoods.join(', ') : 'No foods logged yet'}

MEAL PATTERNS:
${Object.entries(mealPatterns).length > 0 ?
          Object.entries(mealPatterns).map(([meal, count]) => `${meal}: ${count} times`).join(', ') :
          'No meal patterns yet'}`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'chatgpt-4o-latest',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: currentInput
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${errorData?.error?.message ? ` - ${errorData.error.message}` : ''}`);
      }

      const aiResponse = await response.json();
      const assistantContent = aiResponse.choices?.[0]?.message?.content;

      if (!assistantContent) {
        throw new Error('No response from AI');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending chat message:', error);

      let errorContent = 'Sorry, I\'m having trouble connecting right now. Please try again later.';

      if (error instanceof Error) {
        if (error.message.includes('API key not configured')) {
          errorContent = 'AI features are not configured. Please contact support.';
        } else if (error.message.includes('OpenAI API error')) {
          errorContent = 'There was an issue with the AI service. Please try again in a moment.';
        }
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
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

      {/* AI Chatbot */}
      {!showChatbot && (
        <Button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {showChatbot && (
        <div className={`fixed bg-background border rounded-lg shadow-xl flex flex-col ${isChatMaximized
          ? 'inset-4 z-50'
          : 'bottom-6 right-6 w-80 h-96'
          }`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">AI Nutrition Assistant</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatMaximized(!isChatMaximized)}
                title={isChatMaximized ? "Minimize" : "Maximize"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isChatMaximized ? (
                    // Minimize icon
                    <>
                      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                      <path d="m3 3 5 5" />
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                      <path d="m16 8 5-5" />
                      <path d="M8 21v-3a2 2 0 0 0-2-2H3" />
                      <path d="m3 16 5 5" />
                      <path d="M16 16h3a2 2 0 0 0 2-2v-3" />
                      <path d="m21 21-5-5" />
                    </>
                  ) : (
                    // Maximize icon
                    <>
                      <path d="M15 3h6v6" />
                      <path d="m10 14 11-11" />
                      <path d="M9 21H3v-6" />
                      <path d="m14 10-11 11" />
                    </>
                  )}
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowChatbot(false);
                  setIsChatMaximized(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${isChatMaximized ? 'max-w-[70%]' : 'max-w-[80%]'} p-3 rounded-lg ${message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}
                >
                  <p className={`${isChatMaximized ? 'text-base' : 'text-sm'}`}>{message.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <p className={`${isChatMaximized ? 'text-base' : 'text-sm'}`}>Thinking...</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4">
            <div className="relative">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className={`pr-10 ${isChatMaximized ? 'text-base py-3' : ''}`}
                disabled={isChatLoading}
              />
              <Button
                size="sm"
                className={`absolute right-1 top-1/2 -translate-y-1/2 ${isChatMaximized ? 'h-8 w-8' : 'h-7 w-7'}`}
                onClick={sendChatMessage}
                disabled={isChatLoading || !chatInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalorieTracker;