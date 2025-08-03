import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; // Import useNavigate
// import heroImg from "../assets/rewards.png";

// Custom icons to replace react-icons
const RecycleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.82 15.42l-2.82-4.42h2.82c.55 0 1-.45 1-1s-.45-1-1-1h-4.18l-2.82-4.42c-.18-.28-.49-.46-.82-.46s-.64.18-.82.46L10.36 9H6.18c-.55 0-1 .45-1 1s.45 1 1 1h2.82l-2.82 4.42c-.18.28-.18.64 0 .92.18.28.49.46.82.46s.64-.18.82-.46L10.64 12h2.72l2.82 4.42c.18.28.49.46.82.46s.64-.18.82-.46c.18-.28.18-.64 0-.92z"/>
  </svg>
);

const CoinsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const GiftIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-4.5-2.6c-.34.2-.66.45-.95.75-.29-.3-.61-.55-.95-.75A2.996 2.996 0 0 0 7.18 5c0 .35.07.69.18 1H5c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h1v9c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-9h1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
  </svg>
);

const ArrowRight = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Welcome() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: RecycleIcon,
      title: "Sort & Collect",
      description: "Separate recyclables from your daily waste and bring them to our collection points",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100"
    },
    {
      icon: CoinsIcon,
      title: "Earn EcoPoints",
      description: "Get verified points for every item you contribute to our recycling program",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      icon: GiftIcon,
      title: "Redeem Rewards",
      description: "Exchange your points for essential goods, groceries, and community benefits",
      color: "text-rose-600",
      bgColor: "bg-rose-100"
    }
  ];

  const stats = [
    { number: "10K+", label: "Items Recycled", color: "text-emerald-600" },
    { number: "500+", label: "Active Members", color: "text-blue-600" },
    { number: "₱25K+", label: "Rewards Given", color: "text-purple-600" },
    { number: "85%", label: "Waste Reduced", color: "text-orange-600" }
  ];

  const benefits = [
    "Real rewards for your recycling efforts",
    "Help reduce community waste by 85%",
    "Connect with eco-conscious neighbors",
    "Track your environmental impact",
    "Access to exclusive sustainability workshops"
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-green-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-gradient-to-br from-lime-200/40 to-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-gradient-to-br from-green-200/30 to-lime-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce delay-300">♻️</div>
      <div className="absolute bottom-32 right-16 text-5xl opacity-25 animate-bounce delay-700">🌱</div>
      <div className="absolute top-16 right-24 text-4xl opacity-15 animate-bounce delay-1000">🗂️</div>
      <div className="absolute left-1/4 bottom-20 text-7xl opacity-10 animate-bounce delay-500">🌍</div>

      {/* Navigation Header */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                E
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                ECOSORT
              </span>
            </div>
             <button
              onClick={() => navigate('/signup')} // Navigate to signup page
              className="px-6 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              Sign Up   
              </button>
            <button
              onClick={() => navigate('/login')} // Navigate to login page
              className="px-6 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              Sign In
            </button>
           
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative z-10 px-4 sm:px-6 lg:px-8 py-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Now serving Brgy. T. Alonzo
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 bg-clip-text text-transparent">
                    Transform Waste
                  </span>
                  <br />
                  <span className="text-gray-800">Into Rewards</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Join the recycling revolution! Sort your waste, earn valuable points, and redeem them for essential goods while helping create a sustainable future for our community.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/signup')} // Navigate to signup page
                  className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Start Recycling Today
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-2xl font-semibold hover:bg-white transition-all duration-300 border border-gray-200 hover:border-emerald-300">
                  Learn How It Works
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="relative z-10 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-3xl p-8 backdrop-blur-sm border border-white/20">
                <div className="aspect-square bg-gradient-to-br from-emerald-100 to-green-200 rounded-2xl flex items-center justify-center">
                  {/* Placeholder for hero image */}
                  <div className="text-center space-y-4">
                    <div className="text-8xl">♻️</div>
                    <div className="text-2xl font-bold text-emerald-700">EcoSort</div>
                    <div className="text-emerald-600">Recycling Made Rewarding</div>
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg animate-float">
                <CoinsIcon className="w-8 h-8 text-amber-500" />
                <div className="text-sm font-semibold mt-2">+50 Points</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg animate-float-reverse">
                <GiftIcon className="w-8 h-8 text-rose-500" />
                <div className="text-sm font-semibold mt-2">Rewards Ready</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-20 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              How ECOSORT Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to start making a difference in your community while earning valuable rewards
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isActive = activeStep === index;
              
              return (
                <div
                  key={index}
                  className={`relative p-8 rounded-3xl transition-all duration-500 transform ${
                    isActive 
                      ? 'bg-white shadow-2xl scale-105 border-2 border-emerald-200' 
                      : 'bg-white/60 shadow-lg hover:shadow-xl hover:scale-102'
                  }`}
                >
                  <div className="text-center space-y-6">
                    <div className={`w-20 h-20 ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                      <IconComponent className={`w-10 h-10 ${step.color}`} />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Step number */}
                    <div className={`absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-colors ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
                  Why Choose ECOSORT?
                </h2>
                <p className="text-xl text-gray-600">
                  Join thousands of community members who are already making a difference and earning rewards for their environmental efforts.
                </p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/signup')} // Navigate to signup page
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Join ECOSORT Today
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-green-200 rounded-3xl p-8 h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                  <div className="text-6xl">🌍</div>
                  <div className="text-2xl font-bold text-emerald-700">Make an Impact</div>
                  <div className="text-emerald-600">Every item counts toward a cleaner future</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-emerald-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Eco Journey?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join our community today and start earning rewards for your recycling efforts
          </p>
          <button
            onClick={() => navigate('/signup')} // Navigate to signup page
            className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all duration-300 transform hover:-translate-y-1 shadow-xl"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
                  E
                </div>
                <span className="text-xl font-bold">ECOSORT</span>
              </div>
              <p className="text-gray-400">
                Transforming communities through sustainable recycling and meaningful rewards.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-emerald-400">Collection Schedule</h4>
              <p className="text-gray-400">Every Thursday Morning</p>
              <p className="text-gray-400">Brgy. T. Alonzo</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-emerald-400">Contact Us</h4>
              <p className="text-gray-400">talonzo@gmail.com</p>
              <p className="text-gray-400">0912 345 6789</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ECOSORT. Making recycling rewarding for everyone.</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 8s ease-in-out infinite; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}
