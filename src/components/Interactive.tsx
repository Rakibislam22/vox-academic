
const Interactive = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-heading text-center mb-16">
                Powerful <span className="accent-primary">Features</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { icon: "🎙️", title: "Natural Voice", desc: "Choose from multiple voices with authentic pronunciation" },
                    { icon: "⚡", title: "Lightning Fast", desc: "Convert PDFs to audio in seconds, not hours" },
                    { icon: "🧠", title: "Smart Summaries", desc: "AI generates key takeaways automatically" },
                    { icon: "📱", title: "Mobile Ready", desc: "Learn anywhere with offline audio support" },
                    { icon: "🔄", title: "Sync Playback", desc: "Real-time highlighting syncs with audio" },
                    { icon: "🌐", title: "Multi-Language", desc: "Support for 50+ languages and accents" },
                ].map((feature, idx) => (
                    <div key={idx} className="group relative panel p-6 hover:border-light/60 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_rgba(26,140,255,0.2)]">
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                        <h3 className="text-subheading mb-2">{feature.title}</h3>
                        <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
                        <div className="absolute inset-0 bg-linear-to-br from-electric-blue/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Interactive;