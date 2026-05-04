
const Footer = () => {
    return (
        <footer className="relative border-t border-blue-600/20 py-16 px-4 sm:px-6 lg:px-8 bg-linear-to-b from-navy-darker/30 to-navy-dark">
            <div className="max-w-6xl mx-auto">
                {/* Footer Top */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <h3 className="text-subheading mb-4 accent-primary">Vox Academic</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                            Transform your learning experience with AI-powered audio lessons.
                        </p>
                        <div className="flex gap-3">
                            {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                                <a key={social} href="#" className="w-10 h-10 rounded-lg bg-electric-blue/10 hover:bg-electric-blue/20 transition-all flex items-center justify-center text-xs text-electric-blue hover:text-cyan-accent">
                                    {social[0]}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-label mb-4 accent-primary font-semibold">Product</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            {["Features", "Pricing", "Security", "Performance"].map((item) => (
                                <li key={item}><a href="#" className="hover:text-white/80 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-label mb-4 accent-primary font-semibold">Resources</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            {["Documentation", "Blog", "FAQ", "API Docs"].map((item) => (
                                <li key={item}><a href="#" className="hover:text-white/80 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-label mb-4 accent-primary font-semibold">Company</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            {["About Us", "Contact", "Careers", "Blog"].map((item) => (
                                <li key={item}><a href="#" className="hover:text-white/80 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-label mb-4 accent-primary font-semibold">Legal</h4>
                        <ul className="space-y-3 text-sm text-white/60">
                            {["Privacy Policy", "Terms of Service", "Cookies", "GDPR"].map((item) => (
                                <li key={item}><a href="#" className="hover:text-white/80 transition-colors">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-blue-600/40 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-white/50">
                            © 2026 Vox Academic. All rights reserved.
                        </div>
                        <div className="text-xs text-white/40">
                            Made with <span className="text-blue-600/50">❤</span> by <a href="https://github.com/Rakibislam22" target="_blank" className="hover:text-white/80 transition-colors"> Md Rakib Ali</a> 
                        </div>
                        <div className="flex gap-4 text-sm text-white/50">
                            <span>Status: <span className="text-green-400">Development</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;