import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogOut, ArrowLeft, Save } from 'lucide-react';

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

const Settings = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Calculate BMR using Mifflin-St Jeor Equation
    const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female') => {
        if (gender === 'male') {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    };

    // Calculate maintenance calories based on activity level
    const calculateMaintenanceCalories = (bmr: number, activityLevel: string) => {
        const activityMultipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very-active': 1.9
        };
        return Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);
    };

    // Calculate target calories based on goal
    const calculateTargetCalories = (maintenanceCalories: number, goal: 'bulk' | 'cut' | 'maintain') => {
        switch (goal) {
            case 'bulk':
                return Math.round(maintenanceCalories + 500); // Surplus for muscle gain
            case 'cut':
                return Math.round(maintenanceCalories - 500); // Deficit for fat loss
            case 'maintain':
                return maintenanceCalories;
            default:
                return maintenanceCalories;
        }
    };

    // Recalculate calories when profile changes
    const updateProfileWithCalculations = async (updatedProfile: Partial<UserProfile>) => {
        if (!profile) return;

        const newProfile = { ...profile, ...updatedProfile };

        // Recalculate if any relevant fields changed
        if (updatedProfile.weight !== undefined ||
            updatedProfile.height !== undefined ||
            updatedProfile.age !== undefined ||
            updatedProfile.gender !== undefined ||
            updatedProfile.activity_level !== undefined ||
            updatedProfile.goal !== undefined) {

            const bmr = calculateBMR(newProfile.weight, newProfile.height, newProfile.age, newProfile.gender);
            const maintenanceCalories = calculateMaintenanceCalories(bmr, newProfile.activity_level);
            const targetCalories = calculateTargetCalories(maintenanceCalories, newProfile.goal);

            newProfile.maintenance_calories = maintenanceCalories;
            newProfile.target_calories = targetCalories;

            // Auto-save to Supabase
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await supabase
                        .from('profiles')
                        .update({
                            ...newProfile
                        })
                        .eq('id', session.user.id);
                }
            } catch (error) {
                console.error('Error auto-saving profile:', error);
            }
        }

        setProfile(newProfile);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/auth');
                    return;
                }

                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;

                // Type assertion to ensure the data matches our UserProfile interface
                const typedProfile: UserProfile = {
                    weight: profileData.weight,
                    height: profileData.height,
                    age: profileData.age,
                    gender: profileData.gender as 'male' | 'female',
                    activity_level: profileData.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
                    goal: profileData.goal as 'bulk' | 'cut' | 'maintain',
                    maintenance_calories: profileData.maintenance_calories,
                    target_calories: profileData.target_calories
                };

                setProfile(typedProfile);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast({
                    title: "Error",
                    description: "Failed to load profile. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No authenticated user');
            }

            const { error } = await supabase
                .from('profiles')
                .update(profile)
                .eq('id', session.user.id);

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <Card className="max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            value={profile.weight}
                            onChange={(e) => updateProfileWithCalculations({ weight: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                            id="height"
                            type="number"
                            value={profile.height}
                            onChange={(e) => updateProfileWithCalculations({ height: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                            id="age"
                            type="number"
                            value={profile.age}
                            onChange={(e) => updateProfileWithCalculations({ age: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Gender</Label>
                        <RadioGroup
                            value={profile.gender}
                            onValueChange={(value) => updateProfileWithCalculations({ gender: value as 'male' | 'female' })}
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
                    <div className="space-y-2">
                        <Label>Activity Level</Label>
                        <RadioGroup
                            value={profile.activity_level}
                            onValueChange={(value) => updateProfileWithCalculations({ activity_level: value as any })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sedentary" id="sedentary" />
                                <Label htmlFor="sedentary">Sedentary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light">Light</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="moderate" id="moderate" />
                                <Label htmlFor="moderate">Moderate</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="active" id="active" />
                                <Label htmlFor="active">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="very-active" id="very-active" />
                                <Label htmlFor="very-active">Very Active</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Goal</Label>
                        <RadioGroup
                            value={profile.goal}
                            onValueChange={(value) => updateProfileWithCalculations({ goal: value as 'bulk' | 'cut' | 'maintain' })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bulk" id="bulk" />
                                <Label htmlFor="bulk">Bulk (+500 cal)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cut" id="cut" />
                                <Label htmlFor="cut">Cut (-500 cal)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="maintain" id="maintain" />
                                <Label htmlFor="maintain">Maintain</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Display calculated calories */}
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Maintenance Calories:</span>
                            <span className="text-sm">{profile.maintenance_calories}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Target Calories:</span>
                            <span className="text-sm font-bold">{profile.target_calories}</span>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => navigate('/tracker')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                    <Button variant="destructive" onClick={handleSignOut} className="w-full mt-4">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                    </Button>
                </CardContent >
            </Card >
        </div >
    );
};

export default Settings;