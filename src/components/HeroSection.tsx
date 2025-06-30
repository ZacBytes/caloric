import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-full">
            <Brain className="h-12 w-12 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          AI-Powered Calorie Tracking
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Transform your nutrition journey with intelligent food tracking, personalized goals, and AI-driven insights to reach your fitness targets.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth')}
          >
            Start Tracking Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => navigate('/learn-more')}
          >
            Learn More
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="p-6 bg-card rounded-lg border">
            <Target className="h-8 w-8 text-primary mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Smart Goal Setting</h3>
            <p className="text-muted-foreground">AI calculates your perfect calorie targets based on your goals, whether bulking, cutting, or maintaining.</p>
          </div>

          <div className="p-6 bg-card rounded-lg border">
            <Brain className="h-8 w-8 text-primary mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Intelligent Tracking</h3>
            <p className="text-muted-foreground">Simply search for food and get instant nutritional data with macro breakdowns automatically calculated.</p>
          </div>

          <div className="p-6 bg-card rounded-lg border">
            <TrendingUp className="h-8 w-8 text-primary mb-4 mx-auto" />
            <h3 className="text-lg font-semibold mb-2">Progress Analytics</h3>
            <p className="text-muted-foreground">Visualize your daily intake with interactive charts and track your journey toward your fitness goals.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
