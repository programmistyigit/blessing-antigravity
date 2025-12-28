import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import api from '@/services/api';
import type { LoginResponse } from '@/types/auth.types';

const loginSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(5),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function DirectorLoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post<LoginResponse>('/auth/login', data);
            const { token, user } = response.data;
            login(token, user);
            navigate('/profile');
        } catch (err: any) {
            setError('Kirish imkonsiz. Ma\'lumotlarni tekshiring.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-white">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-sm"
            >
                <Card className="w-full bg-slate-800 border-slate-700 text-white shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-center text-slate-100">Boshqaruv Tizimi</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            Direktor va Administratorlar uchun
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-300">ID</Label>
                                <Input
                                    id="username"
                                    {...register('username')}
                                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-300">Kirish Kaliti</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                                />
                            </div>

                            {error && <div className="text-red-400 text-sm">{error}</div>}

                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                                {isLoading ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
