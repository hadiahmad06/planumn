import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-maroon-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto px-4 text-center z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main headline with typing animation */}
          <div className="mb-6">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-4">
              <span className="inline-block font-mono text-maroon-700 relative">
                planu.mn
                <span className="animate-cursor absolute">|</span>
              </span>
            </h1>
            <div className="text-xl md:text-2xl text-slate-600 font-light">
              <span className="inline-block overflow-hidden whitespace-nowrap border-r-2 border-maroon-500 animate-typing">
                plan your grad
              </span>
            </div>
          </div>

          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            The fast, visual graduation planner built by UMN students, for UMN students. 
            Replace the clunky official Grad Planner with drag-and-drop course planning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <Button 
              size="lg" 
              className="bg-maroon-700 hover:bg-maroon-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              onClick={() => window.open('/plan/hadi2025', '_blank')}
            >
              Try Live Demo
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-slate-300 hover:border-maroon-300 text-slate-700 px-8 py-4 text-lg rounded-xl hover:bg-maroon-50 transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-500 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live course data
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              SRT scores included
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-maroon-500 rounded-full animate-pulse" />
              Built by students
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;