
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
    goal: 'bulk' | 'cut' | 'maintain';
    maintenance_calories: number;
    target_calories: number;
}

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        weight: 0,
        height: 0,
        age: 0,
        gender: 'male',
        activity_level: 'moderate',
        goal: 'maintain',
        maintenance_calories: 0,
        target_calories: 0,
    });

    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/auth');
            }
        };
        checkAuth();
    }, [navigate]);

    const calculateMaintenanceCalories = () => {
        // Harris-Benedict Equation
        let bmr;
        if (profile.gender === 'male') {
            bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
        } else {
            bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
        }

        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            'very-active': 1.9,
        };

        const maintenanceCalories = Math.round(bmr * activityMultipliers[profile.activity_level]);

        let targetCalories = maintenanceCalories;
        if (profile.goal === 'bulk') {
            targetCalories = maintenanceCalories + 500;
        } else if (profile.goal === 'cut') {
            targetCalories = maintenanceCalories - 500;
        }

        setProfile(prev => ({
            ...prev,
            maintenance_calories: maintenanceCalories,
            target_calories: targetCalories,
        }));
    };

    const handleNext = () => {
        if (step === 2) {
            calculateMaintenanceCalories();
        }
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleComplete = async () => {
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No authenticated user');
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    weight: profile.weight,
                    height: profile.height,
                    age: profile.age,
                    gender: profile.gender,
                    activity_level: profile.activity_level,
                    goal: profile.goal,
                    maintenance_calories: profile.maintenance_calories,
                    target_calories: profile.target_calories,
                });

            if (error) throw error;

            toast({
                title: "Profile Created!",
                description: "Your profile has been saved successfully.",
            });

            navigate('/tracker');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast({
                title: "Error",
                description: "Failed to save your profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return profile.weight > 0 && profile.height > 0 && profile.age > 0;
            case 2:
                return true;
            case 3:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to CaloricAI</CardTitle>
                    <CardDescription>
                        Let's set up your profile to calculate your caloric needs
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    value={profile.weight || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, weight: Number(e.target.value) }))}
                                    placeholder="Enter your weight"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    value={profile.height || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, height: Number(e.target.value) }))}
                                    placeholder="Enter your height"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={profile.age || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, age: Number(e.target.value) }))}
                                    placeholder="Enter your age"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <RadioGroup
                                    value={profile.gender}
                                    onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value as 'male' | 'female' }))}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="male" id="male" />
                                        <Label htmlFor="male">Male</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="female" id="female" />
                                        <Label htmlFor="female">Female</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Activity & Goals</h3>

                            <div className="space-y-2">
                                <Label>Activity Level</Label>
                                <RadioGroup
                                    value={profile.activity_level}
                                    onValueChange={(value) => setProfile(prev => ({ ...prev, activity_level: value as any }))}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sedentary" id="sedentary" />
                                        <Label htmlFor="sedentary">Sedentary (little/no exercise)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="light" id="light" />
                                        <Label htmlFor="light">Light (1-3 days/week)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="moderate" id="moderate" />
                                        <Label htmlFor="moderate">Moderate (3-5 days/week)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="active" id="active" />
                                        <Label htmlFor="active">Active (6-7 days/week)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="very-active" id="very-active" />
                                        <Label htmlFor="very-active">Very Active (2x/day)</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Goal</Label>
                                <RadioGroup
                                    value={profile.goal}
                                    onValueChange={(value) => setProfile(prev => ({ ...prev, goal: value as 'bulk' | 'cut' | 'maintain' }))}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cut" id="cut" />
                                        <Label htmlFor="cut">Cut (Lose Weight)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="maintain" id="maintain" />
                                        <Label htmlFor="maintain">Maintain Weight</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="bulk" id="bulk" />
                                        <Label htmlFor="bulk">Bulk (Gain Weight)</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Your Caloric Plan</h3>

                            <div className="space-y-3 p-4 bg-muted rounded-lg">
                                <div className="flex justify-between">
                                    <span>Maintenance Calories:</span>
                                    <span className="font-semibold">{profile.maintenance_calories} kcal</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Target Calories:</span>
                                    <span className="font-semibold text-primary">{profile.target_calories} kcal</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {profile.goal === 'bulk' && 'Surplus of 500 calories for weight gain'}
                                    {profile.goal === 'cut' && 'Deficit of 500 calories for weight loss'}
                                    {profile.goal === 'maintain' && 'Maintenance calories to maintain current weight'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                                Back
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!isStepValid() || loading}
                                className="ml-auto"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} className="ml-auto" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Setup
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
