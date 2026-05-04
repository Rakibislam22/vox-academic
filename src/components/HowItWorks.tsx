
const HowItWorks = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-heading text-center mb-16">
                How It <span className="accent-primary">Works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { step: "01", title: "Upload PDF", desc: "Drop your academic paper or document" },
                    { step: "02", title: "AI Processing", desc: "Our AI analyzes and structures content" },
                    { step: "03", title: "Audio Generation", desc: "Natural voice converts to audio" },
                    { step: "04", title: "Smart Learning", desc: "Master concepts with interactive tools" },
                ].map((item, idx) => (
                    <div key={idx} className="group relative">
                        <div className="panel p-6 h-full bg-linear-to-br from-navy-dark to-navy-darker/50 border-light/40 hover:border-light/80 transition-all duration-300 cursor-pointer">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="text-4xl font-bold accent-primary opacity-60 group-hover:opacity-100 transition-opacity">
                                    {item.step}
                                </div>
                            </div>
                            <h3 className="text-subheading mb-2">{item.title}</h3>
                            <p className="text-white/60 text-sm">{item.desc}</p>
                            <div className="absolute inset-0 bg-linear-to-br from-electric-blue/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HowItWorks;