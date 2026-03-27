import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import config from '@/config';
import BusinessLogo from '@/components/BusinessLogo';
import api from '@/lib/api';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            await api.resetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'El enlace es inválido o ha expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                    <h2 className="text-xl font-bold text-foreground">Enlace inválido</h2>
                    <Link to="/login"><Button>Ir al login</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{`Nueva contraseña - ${config.appName}`}</title>
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
                            <BusinessLogo size="lg" className="mb-4" />
                            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
                                Nueva contraseña
                            </h2>
                        </div>

                        {success ? (
                            <div className="text-center space-y-4">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                                <p className="text-foreground font-medium">
                                    Tu contraseña ha sido actualizada correctamente.
                                </p>
                                <Link to="/login">
                                    <Button className="w-full mt-4">
                                        Ir al login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="password">Nueva contraseña</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            className="pl-10"
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="confirm">Confirmar contraseña</Label>
                                    <div className="relative mt-2">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            id="confirm"
                                            type="password"
                                            required
                                            className="pl-10"
                                            placeholder="Repetir contraseña"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                    {isLoading ? 'Guardando...' : 'Cambiar contraseña'}
                                </Button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
