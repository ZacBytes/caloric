import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Brain, Sparkles, BarChart3, Calendar, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: Date;
}

interface AIChatbotProps {
    className?: string;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Add welcome message when first opened
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: '1',
                content: "Hi! I'm your AI fitness assistant 🤖✨ Ask me about your daily nutrition summary, monthly progress, or any fitness questions!",
                isUser: false,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, messages.length]);

    const quickActions = [
        { icon: <BarChart3 className="h-4 w-4" />, text: "Daily Summary", action: "Give me a summary of today's nutrition" },
        { icon: <Calendar className="h-4 w-4" />, text: "Monthly Progress", action: "Show my monthly fitness progress" },
        { icon: <User className="h-4 w-4" />, text: "Fitness Tips", action: "Give me personalized fitness tips" },
    ];

    const getUserData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            // Get today's food entries
            const { data: todayEntries } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('logged_at', `${today}T00:00:00`)
                .lt('logged_at', `${today}T23:59:59`);

            // Get this week's entries
            const { data: weekEntries } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('logged_at', sevenDaysAgo.toISOString());

            // Get this month's entries
            const { data: monthEntries } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('logged_at', thirtyDaysAgo.toISOString());

            return { profile, todayEntries, weekEntries, monthEntries };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };

    const formatUserDataForAI = (userData: any) => {
        if (!userData) return 'No user data available.';

        const { profile, todayEntries, weekEntries, monthEntries } = userData;

        // Calculate today's totals
        const todayTotals = todayEntries?.reduce((acc: any, entry: any) => ({
            calories: acc.calories + Number(entry.calories),
            protein: acc.protein + Number(entry.protein),
            carbs: acc.carbs + Number(entry.carbs),
            fat: acc.fat + Number(entry.fat)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        // Calculate weekly averages
        const weekTotals = weekEntries?.reduce((acc: any, entry: any) => ({
            calories: acc.calories + Number(entry.calories),
            protein: acc.protein + Number(entry.protein),
            carbs: acc.carbs + Number(entry.carbs),
            fat: acc.fat + Number(entry.fat)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        const weekDays = Math.min(7, new Set(weekEntries?.map((entry: any) => entry.logged_at.split('T')[0])).size || 1);
        const weekAverages = {
            calories: Math.round(weekTotals.calories / weekDays),
            protein: Math.round(weekTotals.protein / weekDays),
            carbs: Math.round(weekTotals.carbs / weekDays),
            fat: Math.round(weekTotals.fat / weekDays)
        };

        // Calculate monthly averages
        const monthTotals = monthEntries?.reduce((acc: any, entry: any) => ({
            calories: acc.calories + Number(entry.calories),
            protein: acc.protein + Number(entry.protein),
            carbs: acc.carbs + Number(entry.carbs),
            fat: acc.fat + Number(entry.fat)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

        const monthDays = Math.min(30, new Set(monthEntries?.map((entry: any) => entry.logged_at.split('T')[0])).size || 1);
        const monthAverages = {
            calories: Math.round(monthTotals.calories / monthDays),
            protein: Math.round(monthTotals.protein / monthDays),
            carbs: Math.round(monthTotals.carbs / monthDays),
            fat: Math.round(monthTotals.fat / monthDays)
        };

        return `
USER PROFILE:
- Target Calories: ${profile?.target_calories || 'Not set'}
- Maintenance Calories: ${profile?.maintenance_calories || 'Not set'}
- Goal: ${profile?.goal || 'Not set'}
- Age: ${profile?.age || 'Not set'}
- Gender: ${profile?.gender || 'Not set'}
- Weight: ${profile?.weight || 'Not set'} lbs
- Height: ${profile?.height || 'Not set'} inches
- Activity Level: ${profile?.activity_level || 'Not set'}

TODAY'S NUTRITION (${todayEntries?.length || 0} food entries):
- Calories: ${todayTotals.calories}/${profile?.target_calories || 'N/A'} (${profile?.target_calories ? Math.round((todayTotals.calories / profile.target_calories) * 100) : 0}%)
- Protein: ${todayTotals.protein}g
- Carbs: ${todayTotals.carbs}g
- Fat: ${todayTotals.fat}g
- Foods logged today: ${todayEntries?.map((entry: any) => `${entry.name} (${entry.calories} cal)`).join(', ') || 'None'}

WEEKLY AVERAGES (Last 7 days, ${weekDays} days with data):
- Average Calories: ${weekAverages.calories}/day
- Average Protein: ${weekAverages.protein}g/day
- Average Carbs: ${weekAverages.carbs}g/day
- Average Fat: ${weekAverages.fat}g/day
- Total entries: ${weekEntries?.length || 0}

MONTHLY AVERAGES (Last 30 days, ${monthDays} days with data):
- Average Calories: ${monthAverages.calories}/day
- Average Protein: ${monthAverages.protein}g/day
- Average Carbs: ${monthAverages.carbs}g/day
- Average Fat: ${monthAverages.fat}g/day
- Total entries: ${monthEntries?.length || 0}

RECENT FOOD ENTRIES (Last 5):
${weekEntries?.slice(-5).map((entry: any) =>
            `- ${entry.name}: ${entry.calories} cal, ${entry.protein}g protein (${entry.logged_at.split('T')[0]})`
        ).join('\n') || 'No recent entries'}
`;
    };

    const sendMessage = async (messageContent: string = inputMessage) => {
        if (!messageContent.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: messageContent,
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const userData = await getUserData();
            const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!openaiApiKey) {
                throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
            }

            const userDataContext = formatUserDataForAI(userData);

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a helpful AI fitness and nutrition assistant. You have access to the user's complete nutrition data including their profile, daily intake, weekly and monthly averages. 

Provide personalized advice based on their data. Be encouraging, specific, and actionable. Use emojis to make responses friendly. Focus on:
- Analyzing their nutrition patterns
- Comparing intake to goals
- Identifying trends and improvements
- Giving practical tips
- Celebrating progress

Here's the user's current data:
${userDataContext}`
                        },
                        {
                            role: 'user',
                            content: messageContent
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: aiResponse,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`,
                isUser: false,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);

            toast({
                title: "Error",
                description: "Failed to get AI response. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage();
    };

    const handleQuickAction = (action: string) => {
        sendMessage(action);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${className}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative">
                    <MessageCircle className="h-6 w-6" />
                    {isHovered && (
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                        </div>
                    )}
                </div>
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl border-2 z-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Fitness Assistant
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                <div className="p-3 border-b bg-gray-50">
                    <div className="grid grid-cols-3 gap-2">
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAction(action.action)}
                                className="text-xs p-2 h-auto flex flex-col items-center gap-1"
                                disabled={isLoading}
                            >
                                {action.icon}
                                <span className="text-[10px]">{action.text}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg ${message.isUser
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                    <div className={`text-xs mt-1 opacity-70`}>
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </ScrollArea>

                <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                        <Input
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask about your nutrition..."
                            disabled={isLoading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AIChatbot;
