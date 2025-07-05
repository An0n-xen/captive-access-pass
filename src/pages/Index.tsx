import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wifi, CheckCircle, Clock, Calendar, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'daily',
      name: 'Daily Pass',
      price: '₦500',
      duration: '24 hours',
      icon: Clock,
      popular: false,
      features: ['24-hour access', 'High-speed internet', 'All devices']
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '₦8,000',
      duration: '30 days',
      icon: Calendar,
      popular: true,
      features: ['30-day access', 'Priority bandwidth', 'All devices', 'Technical support']
    },
    {
      id: 'semester',
      name: 'Semester Package',
      price: '₦35,000',
      duration: '6 months',
      icon: GraduationCap,
      popular: false,
      features: ['6-month access', 'Premium bandwidth', 'All devices', '24/7 support', 'Study resources']
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setIsExistingUser(false);
  };

  const handleExistingUserLogin = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate checking existing subscription
    setTimeout(() => {
      // Mock check - in real app, this would verify against your database
      const hasActiveSubscription = Math.random() > 0.5; // 50% chance for demo
      
      if (hasActiveSubscription) {
        toast({
          title: "Access granted!",
          description: "Welcome back! You have an active subscription.",
        });
        // Here you would redirect to success page or grant internet access
      } else {
        toast({
          title: "No active subscription",
          description: "No active subscription found for this email. Please purchase a plan.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 2000);
  };

  const handlePayment = async () => {
    if (!email || !selectedPlan) {
      toast({
        title: "Missing information",
        description: "Please select a plan and enter your email",
        variant: "destructive"
      });
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    setIsLoading(true);

    // Simulate Paystack integration
    setTimeout(() => {
      toast({
        title: "Redirecting to payment",
        description: `Redirecting to Paystack for ${plan?.name} payment...`,
      });
      
      // In a real app, you would integrate with Paystack here
      console.log('Payment initiated for:', { email, plan: selectedPlan, amount: plan?.price });
      
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-full">
              <Wifi className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Campus Connect</h1>
          </div>
          <p className="text-center text-gray-600 mt-2">Choose your internet access plan</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Existing User Login Section */}
        <div className="mb-8">
          <Card className="max-w-md mx-auto bg-white/70 backdrop-blur-sm border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-green-700 flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Already have access?</span>
              </CardTitle>
              <CardDescription>
                Enter your email to log in with your existing subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={isExistingUser ? email : ''}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsExistingUser(true);
                  setSelectedPlan(null);
                }}
                className="border-green-300 focus:border-green-500"
              />
              <Button 
                onClick={handleExistingUserLogin}
                disabled={isLoading || !email || !isExistingUser}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Checking..." : "Log In"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="border-t border-gray-300 flex-1"></div>
          <span className="px-4 text-gray-500 bg-white/70 rounded-full">OR</span>
          <div className="border-t border-gray-300 flex-1"></div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Choose Your Plan
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Select the perfect internet access plan for your needs
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'bg-white/70 backdrop-blur-sm hover:bg-white/90'
                  } ${plan.popular ? 'border-blue-500' : 'border-gray-200'}`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">{plan.name}</CardTitle>
                    <CardDescription>{plan.duration}</CardDescription>
                    <div className="text-3xl font-bold text-blue-600 mt-2">
                      {plan.price}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 ${
                        isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <Card className="max-w-md mx-auto bg-white/70 backdrop-blur-sm border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="text-blue-700">Complete Your Purchase</CardTitle>
              <CardDescription>
                Enter your email and proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={!isExistingUser ? email : ''}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsExistingUser(false);
                }}
                className="border-blue-300 focus:border-blue-500"
              />
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Selected Plan:</span>
                  <span className="text-blue-600 font-bold">
                    {plans.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Amount:</span>
                  <span className="text-blue-600 font-bold text-lg">
                    {plans.find(p => p.id === selectedPlan)?.price}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handlePayment}
                disabled={isLoading || !email || isExistingUser}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Processing..." : "Pay with Paystack"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Secure payment powered by Paystack • 24/7 Technical Support</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
