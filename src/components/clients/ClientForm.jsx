import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const ClientForm = ({
  isOpen,
  onClose,
  selectedClient,
  formData,
  onInputChange,
  onSubmit,
  services = [],
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg mx-auto p-0 top-12 sm:left-[20%] left-[5%] fixed xl:top-12 xl:left-[35%]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <DialogHeader className="p-6">
                <DialogTitle>{selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                <DialogDescription>
                  Completa los datos para añadir o actualizar un cliente en tu cartera.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4 px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => onInputChange('name', e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => onInputChange('phone', e.target.value)}
                      placeholder="+34 612 345 678"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => onInputChange('email', e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <Label>Servicio Preferido</Label>
                  <Select
                    onValueChange={(value) => onInputChange('preferred_service_id', value === 'none' ? null : value)}
                    value={formData.preferred_service_id || 'none'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin definir</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notas y Preferencias</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => onInputChange('notes', e.target.value)}
                    placeholder="Alergias, preferencias, productos usados, etc."
                  />
                </div>

                <DialogFooter className="p-6 bg-muted -mx-6 -mb-0 rounded-b-2xl">
                  <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" className="w-full sm:w-auto">
                    {selectedClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ClientForm;
