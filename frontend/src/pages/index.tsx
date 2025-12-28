import Hero from '@/components/home/Hero';
import Values from '@/components/home/Values';
import About from '@/components/home/About';
import Footer from '@/components/home/Footer';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-white">
            <Hero />
            <Values />
            <About />
            <Footer />
        </div>
    );
}
