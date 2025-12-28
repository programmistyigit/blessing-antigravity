import { motion } from 'framer-motion';

export default function About() {
    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    {/* Image Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full md:w-1/2"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                alt="Jamoaviy ish"
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent" />
                        </div>
                    </motion.div>

                    {/* Text Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full md:w-1/2 space-y-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                            Har bir xodim <br />
                            <span className="text-blue-600">o‘z o‘rniga ega</span>
                        </h2>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Blessing kompaniyasida biz shunchaki mahsulot ishlab chiqarmaymiz, biz imkoniyatlar yaratamiz.
                            Sizning har bir harakatingiz ulkan mexanizmning muhim qismidir.
                        </p>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Biz mehnatni qadrlaymiz va rivojlanishni qo‘llab-quvvatlaymiz.
                            Sizning xavfsizligingiz, sharoitingiz va kelajagingiz biz uchun birinchi o'rinda.
                        </p>

                        <div className="pt-4 border-l-4 border-blue-600 pl-6">
                            <p className="text-xl font-medium text-gray-800 italic">
                                "Katta maqsadlarga faqat ahil jamoa bilan erishiladi."
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
