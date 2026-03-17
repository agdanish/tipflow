import { Zap, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-surface-1/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">TipFlow</h3>
                <p className="text-[10px] text-text-muted">v1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              AI-Powered Multi-Chain Tipping Agent. Send tips across Ethereum and TON
              with intelligent chain selection and fee optimization.
            </p>
          </div>

          {/* Built With */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Built With</h4>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Tether WDK
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                React + TypeScript
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Tailwind CSS
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Node.js + Express
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Links</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="https://github.com/agdanish/tipflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/agdanish/tipflow/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors"
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold">AP</span>
                  Apache 2.0 License
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://wdk.tether.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Tether WDK Docs
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-text-muted text-center sm:text-left">
            Built for <span className="text-accent font-medium">Tether Hackathon Galactica: WDK Edition 1</span>
          </p>
          <p className="text-[11px] text-text-muted">
            &copy; 2026 TipFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
