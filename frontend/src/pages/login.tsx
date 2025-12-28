import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import api from '@/services/api';
import type { LoginResponse } from '@/types/auth.types';

const loginSchema = z.object({
    username: z.string().min(3, 'Foydalanuvchi nomi kamida 3 harf bo\'lishi kerak'),
    password: z.string().min(5, 'Parol kamida 5 belgidan iborat bo\'lishi kerak'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            // API call to login
            const response = await api.post<LoginResponse>('/auth/login', data);

            const { token, user } = response.data;

            // Save to store
            login(token, user);

            // Redirect to profile
            navigate('/profile');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Tizimga kirishda xatolik yuz berdi');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="w-full shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Tizimga Kirish</CardTitle>
                        <CardDescription className="text-center">
                            Login va parolingizni kiriting (Ishchilar uchun)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Login</Label>
                                <Input
                                    id="username"
                                    placeholder="Ismingiz yoki login"
                                    {...register('username')}
                                    autoComplete="username"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-500">{errors.username.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Parol</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    {...register('password')}
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Kirilmoqda...' : 'Kirish'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm text-muted-foreground">
                        <p>Muammo bo'lsa managerga murojaat qiling</p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
