import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop")',
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl space-y-6"
                >
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                        Biz bir oilamiz. <br />
                        <span className="text-blue-400">Mehnat — bizning kuchimiz.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-gray-200 font-light max-w-2xl mx-auto">
                        Har bir xodim muhim. Har bir ish qadrlanadi.
                        Keling, kelajakni birgalikda quramiz.
                    </p>

                    <div className="pt-8">
                        <Button
                            size="lg"
                            onClick={() => navigate('/login')}
                            className="px-10 py-7 text-xl rounded-full bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-900/20"
                        >
                            Kirish
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator (Optional) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce"
            >
                <span className="text-sm">Pastga suring</span>
            </motion.div>
        </div>
    );
}
