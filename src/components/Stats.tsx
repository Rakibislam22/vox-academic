
const Stats = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                {[
                    { number: "50K+", label: "Active Users" },
                    { number: "100M+", label: "Minutes Learned" },
                    { number: "95%", label: "Satisfaction Rate" },
                    { number: "24/7", label: "Support Available" },
                ].map((stat, idx) => (
                    <div key={idx} className="group">
                        <div className="text-5xl font-bold accent-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                            {stat.number}
                        </div>
                        <p className="text-white/70">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Stats;