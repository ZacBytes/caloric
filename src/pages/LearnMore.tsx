import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Brain,
    Target,
    TrendingUp,
    Smartphone,
    BarChart3,
    Users,
    CheckCircle,
    ArrowRight,
    Zap,
    Shield,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

const LearnMore = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Brain className="h-8 w-8" />,
            title: "AI-Powered Food Recognition",
            description: "Our advanced AI instantly recognizes food items and provides accurate nutritional data from our comprehensive database of over 1 million foods.",
            benefits: ["Instant food identification", "Accurate macro calculations", "Extensive food database", "Smart serving size detection"]
        },
        {
            icon: <Target className="h-8 w-8" />,
            title: "Personalized Goal Setting",
            description: "Set custom calorie and macro targets based on your unique profile, fitness goals, and activity level for optimal results.",
            benefits: ["BMR calculation", "Activity-based adjustments", "Bulk/Cut/Maintain goals", "Dynamic target updates"]
        },
        {
            icon: <BarChart3 className="h-8 w-8" />,
            title: "Advanced Analytics",
            description: "Visualize your progress with interactive charts, trends, and insights that help you understand your nutrition patterns.",
            benefits: ["Daily intake charts", "Macro breakdown visuals", "Progress tracking", "Trend analysis"]
        },
        {
            icon: <Smartphone className="h-8 w-8" />,
            title: "Mobile-First Design",
            description: "Track your meals on-the-go with our responsive, mobile-optimized interface that works seamlessly on any device.",
            benefits: ["Responsive design", "Touch-friendly interface", "Offline capability", "Fast loading times"]
        }
    ];

    const benefits = [
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Save Time",
            description: "Quick food logging with AI recognition saves you hours each week compared to manual entry."
        },
        {
            icon: <Target className="h-6 w-6" />,
            title: "Reach Goals Faster",
            description: "Precision tracking and personalized targets help you achieve your fitness goals 3x faster."
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: "Stay Consistent",
            description: "Simple, intuitive interface makes it easy to maintain consistent tracking habits."
        },
        {
            icon: <TrendingUp className="h-6 w-6" />,
            title: "Track Progress",
            description: "Visual analytics help you understand patterns and make informed nutrition decisions."
        }
    ];

    const howItWorks = [
        {
            step: 1,
            title: "Set Your Goals",
            description: "Complete our quick onboarding to set personalized calorie and macro targets based on your profile and fitness goals."
        },
        {
            step: 2,
            title: "Log Your Meals",
            description: "Search for foods or add custom items. Our AI provides instant nutritional data and automatically calculates your daily totals."
        },
        {
            step: 3,
            title: "Track Progress",
            description: "Monitor your daily intake with interactive charts and analytics that show your progress toward your goals."
        },
        {
            step: 4,
            title: "Achieve Results",
            description: "Stay consistent with our easy-to-use interface and reach your fitness goals faster with data-driven insights."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto text-center">
                    <Badge variant="secondary" className="mb-6">
                        <Brain className="h-4 w-4 mr-2" />
                        AI-Powered Nutrition
                    </Badge>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Everything You Need to Know About{' '}
                        <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            CaloricAI
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                        Discover how our AI-powered calorie tracking platform revolutionizes nutrition monitoring
                        and helps you achieve your fitness goals with precision and ease.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={() => navigate('/auth')}>
                            Start Your Journey
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/')}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
                        <p className="text-xl text-muted-foreground">
                            Advanced technology meets intuitive design for the ultimate nutrition tracking experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="h-full">
                                <CardHeader>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            {feature.icon}
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                                    <div className="space-y-2">
                                        {feature.benefits.map((benefit, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How CaloricAI Works</h2>
                        <p className="text-xl text-muted-foreground">
                            Get started in minutes and transform your nutrition tracking experience
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {howItWorks.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                    {step.step}
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CaloricAI?</h2>
                        <p className="text-xl text-muted-foreground">
                            Experience the benefits that make CaloricAI the preferred choice for nutrition tracking
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <Card key={index} className="text-center p-6">
                                <div className="p-3 bg-primary/10 rounded-full text-primary w-fit mx-auto mb-4">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                                <p className="text-muted-foreground text-sm">{benefit.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <div id="testimonials">
                <Testimonials />
            </div>

            {/* CTA Section */}
            <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-t border-border">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                        Ready to Transform Your Nutrition Journey?
                    </h2>
                    <p className="text-xl mb-8 text-muted-foreground">
                        Join thousands of users who have already achieved their fitness goals with CaloricAI's
                        intelligent tracking and personalized insights.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => navigate('/auth')}
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => navigate('/onboarding')}
                        >
                            Try Demo
                        </Button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            2-minute setup
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Privacy protected
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            10,000+ users
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LearnMore;
