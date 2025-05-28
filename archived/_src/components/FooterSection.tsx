import { Heart, Code } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-maroon-400 mb-4">planu.mn</h3>
            <p className="text-slate-300 leading-relaxed">
              The modern graduation planner built by UMN students to replace the outdated official tools.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Drag & Drop Planning</li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Live Course Data</li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">SRT Integration</li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Prerequisite Checking</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a 
                  href="/plan/hadi2025" 
                  target="_blank"
                  className="hover:text-maroon-400 transition-colors"
                >
                  Try Demo
                </a>
              </li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Documentation</li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Support</li>
              <li className="hover:text-maroon-400 transition-colors cursor-pointer">Feedback</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>and</span>
            <Code className="w-4 h-4 text-blue-500" />
            <span>by UMN students</span>
          </div>
          <p className="text-slate-500 text-sm">
            Built with Next.js, Chakra UI, and lots of caffeine. 
            Not affiliated with the University of Minnesota.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;