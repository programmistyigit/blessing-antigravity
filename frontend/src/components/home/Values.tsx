import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, HeartHandshake } from 'lucide-react';

const values = [
    {
        title: "Jamoa",
        description: "Biz birgalikda ishlaymiz va bir-birimizni qo‘llab-quvvatlaymiz. Yolg'iz yo'l yurgandan ko'ra, birga tog' oshgan yaxshi.",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Mas’uliyat",
        description: "Har bir vazifa ishonch bilan bajariladi. Biz sifat va o'z vaqtida bajarilgan ish uchun javobgarmiz.",
        icon: ShieldCheck,
        color: "text-green-600",
        bg: "bg-green-50"
    },
    {
        title: "Halollik",
        description: "Ishimizda ochiqlik va adolat muhim. Sof niyat va toza mehnat — muvaffaqiyatimiz garovi.",
        icon: HeartHandshake,
        color: "text-orange-600",
        bg: "bg-orange-50"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function Values() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Bizning Qadriyatlarimiz</h2>
                    <p className="text-xl text-gray-500">Bizni birlashtirib turadigan ustunlar</p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {values.map((val, index) => (
                        <motion.div key={index} variants={item}>
                            <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader className="flex flex-col items-center pt-8 pb-4">
                                    <div className={`p-4 rounded-full ${val.bg} mb-4`}>
                                        <val.icon className={`h-10 w-10 ${val.color}`} />
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-gray-900">{val.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center pb-8 px-8">
                                    <p className="text-gray-600 leading-relaxed">
                                        {val.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
