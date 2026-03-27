import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import config from '@/config';
import BusinessLogo from '@/components/BusinessLogo';
import api from '@/lib/api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.forgotPassword(email, config.tenantSlug);
            setSent(true);
        } catch {
            // No revelar si el email existe, siempre mostrar éxito
            setSent(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>{`Recuperar contraseña - ${config.appName}`}</title>
            </Helmet>
            <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-secondary">
                <div className="absolute inset-0 h-full w-full bg-cover bg-center z-0">
                    <img alt="Professional salon interior" className="h-full w-full object-cover" src={config.bgImage} />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-md"
                >
                    <div className="bg-card/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/10">
                        <div className="flex flex-col items-center mb-8">
                            <BusinessLogo size="lg" className="mb-4 rounded-2xl" />
                            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
                                Recuperar contraseña
                            </h2>
                        </div>

                        {sent ? (
                            <div className="text-center space-y-4">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                                <p className="text-foreground font-medium">
                                    Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Revisa tu bandeja de entrada y spam.
                                </p>
                                <Link to="/login">
                                    <Button variant="secondary" className="w-full mt-4">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver al login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <p className="text-sm text-muted-foreground text-center">
                                    Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                                </p>
                                <div>
                                    <Label htmlFor="email">Correo electrónico</Label>
                                    <div className="relative mt-2">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            className="pl-10"
                                            placeholder="tu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? 'Enviando...' : 'Enviar enlace'}
                                </Button>
                                <div className="text-center">
                                    <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        <ArrowLeft className="w-3 h-3 inline mr-1" />
                                        Volver al login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
