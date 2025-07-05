import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  CheckCircle,
  Clock,
  Calendar,
  GraduationCap,
  Network,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: "daily",
      name: "Daily Plan",
      price: "Gh₵ 500",
      duration: "24 hours",
      icon: Clock,
      popular: false,
      features: ["24-hour access", "High-speed internet", "2 device support"],
    },
    {
      id: "monthly",
      name: "Monthly Plan",
      price: "Gh₵ 8,000",
      duration: "30 days",
      icon: Calendar,
      popular: true,
      features: ["30-day access", "High-speed internet", "2 device support"],
    },
    {
      id: "semester",
      name: "Semester Plan",
      price: "Gh₵ 35,000",
      duration: "3 months",
      icon: GraduationCap,
      popular: false,
      features: ["3-month access", "High-speed internet", "2 device support"],
    },
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
        variant: "destructive",
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
          description:
            "No active subscription found for this email. Please purchase a plan.",
          variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlan);
    setIsLoading(true);

    // Simulate Paystack integration
    setTimeout(() => {
      toast({
        title: "Redirecting to payment",
        description: `Redirecting to Paystack for ${plan?.name} payment...`,
      });

      // In a real app, you would integrate with Paystack here
      console.log("Payment initiated for:", {
        email,
        plan: selectedPlan,
        amount: plan?.price,
      });

      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Futuristic Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_80%_20%,_rgba(99,102,241,0.15),transparent_50%),radial-gradient(circle_at_40%_40%,_rgba(34,211,238,0.1),transparent_50%)]"></div>

      {/* Neural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Header */}
      <div className="relative bg-black/20 backdrop-blur-xl border-b border-blue-500/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative p-3 rounded-full ">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <img
                src="/public/logo-trans.png"
                alt="SKYNET Logo"
                className="relative w-20 h-20 object-contain filter drop-shadow-lg"
              />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                SKYNET
              </h1>
              <div className="text-blue-300 text-sm tracking-widest font-mono">
                INTERNET ACCESS PORTAL
              </div>
            </div>
          </div>
          <p className="text-center text-blue-200/80 mt-4 font-light">
            Choose your internet subscription plan
          </p>
        </div>
      </div>

      <div className="relative container mx-auto px-4 py-12">
        {/* Existing User Login Section */}
        <div className="mb-12">
          <Card className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-cyan-400 flex items-center justify-center space-x-2 text-xl">
                <CheckCircle className="h-6 w-6" />
                <span>Already Subscribed?</span>
              </CardTitle>
              <CardDescription className="text-blue-200/70">
                Enter your email to access the internet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={isExistingUser ? email : ""}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsExistingUser(true);
                  setSelectedPlan(null);
                }}
                className="bg-black/30 border-cyan-500/50 focus:border-cyan-400 text-white placeholder:text-blue-300/50 h-12"
              />
              <Button
                onClick={handleExistingUserLogin}
                disabled={isLoading || !email || !isExistingUser}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold h-12 shadow-lg shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  "Connect to Internet"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Futuristic Divider */}
        <div className="flex items-center justify-center mb-12">
          <div className="border-t border-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1 h-px"></div>
          <div className="mx-6 px-4 py-2 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-full">
            <span className="text-cyan-400 font-mono text-sm tracking-wider">
              OR
            </span>
          </div>
          <div className="border-t border-gradient-to-r from-transparent via-cyan-500/50 to-transparent flex-1 h-px"></div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Choose Your Subscription Plan
            </h2>
            <p className="text-blue-200/70 text-lg font-light">
              Select the perfect internet package for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const IconComponent = plan.icon;
              const isSelected = selectedPlan === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all duration-500 hover:scale-105 ${
                    isSelected
                      ? "ring-2 ring-cyan-400 bg-black/60 shadow-2xl shadow-cyan-500/30"
                      : "bg-black/40 backdrop-blur-xl hover:bg-black/60 shadow-xl shadow-blue-500/20"
                  } ${
                    plan.popular
                      ? "border-2 border-cyan-500/50"
                      : "border border-blue-500/30"
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 text-sm font-semibold shadow-lg">
                      MOST POPULAR
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-full w-fit border border-cyan-500/30">
                      <IconComponent className="h-10 w-10 text-cyan-400" />
                    </div>
                    <CardTitle className="text-2xl text-white font-bold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-blue-300/70 font-mono">
                      {plan.duration}
                    </CardDescription>
                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-4">
                      {plan.price}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center space-x-3 text-blue-100/90"
                        >
                          <CheckCircle className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-12 font-semibold transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/25"
                          : "bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-blue-200"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                    >
                      {isSelected ? "SELECTED" : "SELECT PLAN"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <Card className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-blue-400 text-xl">
                Complete Your Purchase
              </CardTitle>
              <CardDescription className="text-blue-200/70">
                Enter your email and proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={!isExistingUser ? email : ""}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsExistingUser(false);
                }}
                className="bg-black/30 border-blue-500/50 focus:border-blue-400 text-white placeholder:text-blue-300/50 h-12"
              />

              <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-cyan-500/30">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-blue-200">
                    Selected Plan:
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {plans.find((p) => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-200">
                    Total Amount:
                  </span>
                  <span className="text-cyan-400 font-bold text-xl">
                    {plans.find((p) => p.id === selectedPlan)?.price}
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isLoading || !email || isExistingUser}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold h-12 shadow-lg shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Pay with Paystack"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="relative bg-black/20 backdrop-blur-xl border-t border-blue-500/30 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-blue-200/60 font-mono text-sm">
            Secure payments powered by Paystack • 24/7 customer support
          </p>
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-mono">
              SKYNET STATUS: ONLINE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
