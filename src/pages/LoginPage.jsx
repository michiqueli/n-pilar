import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import config from '@/config';
import BusinessLogo from '@/components/BusinessLogo';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceId = async () => {
        await webAuthnLogin();
    };

    return (
        <>
            <Helmet>
                <title>{`Iniciar Sesión - ${config.appName}`}</title>
            </Helmet>
            <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-secondary">
                <div className="absolute inset-0 h-full w-full bg-cover bg-center z-0">
                    <img alt="Professional salon interior" className="h-full w-full object-cover" src={config.bgImage} />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="relative z-10 w-full max-w-md"
                >
                    <div className="bg-card/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex flex-col items-center mb-8">
                            <BusinessLogo size="xl" className="mb-4" />
                            <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
                                {config.appName}
                            </h2>
                            <p className="mt-2 text-center text-sm text-muted-foreground">
                                Inicia sesión con tus credenciales
                            </p>
                        </div>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="email-address">Correo electrónico</Label>
                                    <div className="relative mt-2">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="email-address"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="pl-10"
                                            placeholder="tu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="password">Contraseña</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            className="pl-10"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            {/*}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={setRememberMe} />
                                    <Label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                                        Recuérdame
                                    </Label>
                                </div>
                            </div>
                            */}
                            <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div>
                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                                </Button>
                            </div>
                            {/*
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-card/80 px-2 text-muted-foreground backdrop-blur-lg">O continúa con</span>
                                </div>
                            </div>
                            
                            <div>
                                <Button type="button" variant="secondary" className="w-full" size="lg" onClick={handleFaceId}>
                                    <Fingerprint className="mr-2 h-5 w-5" />
                                    Face ID / Biometría
                                </Button>
                            </div>
                            */}
                        </form>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default LoginPage;
