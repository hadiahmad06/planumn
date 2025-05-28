
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, Shield, Smartphone, Database, Share } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Planning",
    description: "Drag and drop courses across semesters. No more clicking through endless forms.",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    icon: Database,
    title: "Live Course Data",
    description: "Real course information and Student Rating of Teaching (SRT) scores, updated automatically.",
    gradient: "from-blue-400 to-blue-600"
  },
  {
    icon: Shield,
    title: "Smart Rule Enforcement",
    description: "Automatically prevents prerequisite violations and scheduling conflicts.",
    gradient: "from-green-400 to-green-600"
  },
  {
    icon: Target,
    title: "Visual Autocomplete",
    description: "Type to find courses instantly with intelligent search and suggestions.",
    gradient: "from-purple-400 to-purple-600"
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Plan on the go with a responsive design that works perfectly on any device.",
    gradient: "from-pink-400 to-rose-500"
  },
  {
    icon: Share,
    title: "Easy Sharing",
    description: "Export your plan or share it directly with advisors and friends.",
    gradient: "from-indigo-400 to-indigo-600"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Everything you need to 
            <span className="text-maroon-700"> plan smart</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Built from the ground up to solve the real problems UMN students face with course planning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <CardContent className="p-8">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} p-3 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;