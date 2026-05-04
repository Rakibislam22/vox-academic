
const UseCase = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-heading text-center mb-16">
                Perfect For <span className="accent-primary">Everyone</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { role: "Students", color: "from-yellow-500/10", emoji: "👨‍🎓" },
                    { role: "Researchers", color: "from-cyan-500/10", emoji: "👨‍🔬" },
                    { role: "Professionals", color: "from-purple-500/10", emoji: "👔" },
                ].map((usecase, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-xl border-light transition-all duration-300 cursor-pointer">
                        <div className={`absolute inset-0 bg-linear-to-br ${usecase.color} to-transparent`} />
                        <div className="relative p-8 h-64 flex flex-col justify-between">
                            <div className="text-6xl group-hover:scale-125 transition-transform duration-300 opacity-60 group-hover:opacity-100">
                                {usecase.emoji}
                            </div>
                            <div>
                                <h3 className="text-subheading mb-3">{usecase.role}</h3>
                                <div className="space-y-2 text-sm text-white/70">
                                    <p>• Boost comprehension</p>
                                    <p>• Save study time</p>
                                    <p>• Learn on-the-go</p>
                                </div>
                            </div>
                            <button className="text-sm text-electric-blue hover:text-cyan-accent transition-colors">
                                Learn more →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UseCase;