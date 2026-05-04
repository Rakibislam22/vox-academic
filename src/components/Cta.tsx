import Link from "next/link";

const Cta = () => {
    return (
        <div className="max-w-4xl mx-auto text-center panel p-12 border-light bg-linear-to-r from-electric-blue/5 to-cyan-accent/5">
            <h2 className="text-heading mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Join thousands of students and researchers who are studying smarter with
                Vox Academic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                    <button className="btn-primary px-10 py-4 text-lg">
                        Get Started Free
                    </button>
                </Link>
                <button className="btn-secondary px-10 py-4 text-lg">
                    Schedule Demo
                </button>
            </div>
        </div>
    );
};

export default Cta;