import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, BookOpen, BarChart3 } from "lucide-react";

const DemoSection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            See it in <span className="text-maroon-700">action</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Experience the difference with our interactive demo. See how easy course planning can be.
          </p>
          <Button 
            size="lg"
            className="bg-maroon-700 hover:bg-maroon-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => window.open('/plan/hadi2025', '_blank')}
          >
            Try Live Demo
            <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Demo Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 p-3 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-full h-full text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Semester Planning</h3>
            <p className="text-slate-600">
              Drag courses between semesters and see your entire academic journey laid out visually.
            </p>
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-400 to-green-600 p-3 mb-6 group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-full h-full text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">Course Discovery</h3>
            <p className="text-slate-600">
              Search and discover courses with autocomplete, prerequisites, and live enrollment data.
            </p>
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 p-3 mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-full h-full text-white" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">SRT Integration</h3>
            <p className="text-slate-600">
              See Student Rating of Teaching scores alongside course info to make informed decisions.
            </p>
          </Card>
        </div>

        {/* Screenshot placeholder */}
        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden shadow-2xl border-0">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-12 text-center">
              <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
                <Calendar className="w-16 h-16 text-maroon-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Interactive Demo</h3>
                <p className="text-slate-600 mb-6">See the actual planu.mn interface in action</p>
                <Button 
                  className="bg-maroon-700 hover:bg-maroon-800 text-white"
                  onClick={() => window.open('/plan/hadi2025', '_blank')}
                >
                  Launch Demo
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;