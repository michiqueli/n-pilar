import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import config from '@/config';
import BusinessLogo from '@/components/BusinessLogo';
import api from '@/lib/api';

const ConsentPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState('');
    const [businessName, setBusinessName] = useState('');

    const handleAccept = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.acceptConsent(token);
            setBusinessName(result.businessName || config.appName);
            setAccepted(true);
        } catch (err) {
            setError(err.message || 'El enlace es inválido o ya fue utilizado.');
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
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>{`Política de privacidad - ${config.appName}`}</title>
            </Helmet>
            <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg"
                >
                    <div className="premium-card p-8 space-y-6">
                        <div className="flex flex-col items-center text-center">
                            <BusinessLogo size="lg" className="mb-4" />
                            <h1 className="text-2xl font-bold text-foreground">{config.appName}</h1>
                        </div>

                        {accepted ? (
                            <div className="text-center space-y-4 py-8">
                                <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
                                <h2 className="text-xl font-bold text-foreground">Consentimiento aceptado</h2>
                                <p className="text-muted-foreground">
                                    Has aceptado la política de privacidad de <strong>{businessName}</strong>.
                                    Ya puedes cerrar esta página.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
                                    <h2 className="text-xl font-bold text-foreground">Política de privacidad</h2>
                                </div>

                                <div className="prose prose-sm max-h-[400px] overflow-y-auto p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground space-y-3">
                                    <p><strong>1. Responsable del tratamiento</strong></p>
                                    <p>El responsable del tratamiento de tus datos personales es el establecimiento al que acudes como cliente.</p>

                                    <p><strong>2. Datos que recopilamos</strong></p>
                                    <p>Recopilamos los siguientes datos: nombre, teléfono, correo electrónico, historial de citas y servicios realizados.</p>

                                    <p><strong>3. Finalidad del tratamiento</strong></p>
                                    <p>Tus datos se utilizan para: gestionar tus citas, enviarte recordatorios, mejorar nuestros servicios y comunicarnos contigo.</p>

                                    <p><strong>4. Base legal</strong></p>
                                    <p>El tratamiento se basa en tu consentimiento explícito, que puedes revocar en cualquier momento.</p>

                                    <p><strong>5. Conservación de datos</strong></p>
                                    <p>Tus datos se conservarán mientras mantengas una relación activa con el establecimiento y durante el tiempo necesario para cumplir con obligaciones legales.</p>

                                    <p><strong>6. Derechos</strong></p>
                                    <p>Tienes derecho a acceder, rectificar, suprimir, portar y oponerte al tratamiento de tus datos. Puedes ejercer estos derechos contactando directamente con el establecimiento.</p>
                                </div>

                                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                                <Button
                                    onClick={handleAccept}
                                    className="w-full"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Procesando...' : 'Acepto la política de privacidad'}
                                </Button>

                                <p className="text-xs text-muted-foreground text-center">
                                    Al hacer clic, confirmas que has leído y aceptas la política de privacidad.
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default ConsentPage;
