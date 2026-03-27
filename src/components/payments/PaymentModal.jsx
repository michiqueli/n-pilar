import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon,
  DollarSign,
  CreditCard,
  Send,
  HelpCircle,
  User,
  Tag,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const paymentMethods = [
  { value: "Efectivo", label: "Efectivo", icon: DollarSign },
  { value: "Tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "Transferencia", label: "Transferencia", icon: Send },
  { value: "Otro", label: "Otro", icon: HelpCircle },
];

const PaymentModal = ({
  isOpen,
  onClose,
  onSave,
  isManual = false,
  prefillData = {},
  clients = [],
  services: initialServices = [],
}) => {
  const { toast } = useToast();
  const [localServices, setLocalServices] = useState(initialServices);
  const [formData, setFormData] = useState({
    date: new Date(),
    clientId: "",
    clientName: "",
    serviceId: "",
    amount: "",
    paymentMethod: "Efectivo",
    notes: "",
  });

  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  
  useEffect(() => {
    if (isOpen) {
      const clientName =
        prefillData.client?.name || prefillData.clientName || "";
      const clientId = prefillData.client?.id || prefillData.clientId || "";
      setFormData({
        date: prefillData.date ? parseISO(prefillData.date) : new Date(),
        clientId: clientId,
        clientName: clientName,
        serviceId: prefillData.serviceId || "",
        amount: prefillData.amount ? prefillData.amount.toString() : "",
        paymentMethod: prefillData.paymentMethod || "Efectivo",
        notes: prefillData.notes || "",
      });
      // También actualizamos el campo de búsqueda para que muestre el nombre
      setClientSearch(clientName);
      setSelectedClientId(clientId);
    }
  }, [isOpen, prefillData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => { setLocalServices(initialServices); }, [initialServices]);

  const handleCreateService = async ({ name, price }) => {
    try {
      const newService = await api.createService({
        name,
        sale_price: price,
        duration_min: 30,
        category: 'Otro',
        active: true,
      });
      setLocalServices(prev => [...prev, newService]);
      handleServiceChange(newService.id.toString());
      toast({ title: "Servicio creado", description: `"${name}" fue agregado.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleServiceChange = (serviceId) => {
    const selectedService = localServices.find((s) => s.id.toString() === serviceId);
    if (selectedService) {
      setFormData((prev) => ({
        ...prev,
        serviceId: selectedService.id,
        amount: selectedService.sale_price.toString(),
      }));
    }
  };

  const handleClientSelect = (client) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client?.id,
      clientName: client?.name,
    }));
    setClientSearch(client?.name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("El monto debe ser un número positivo.");
      return;
    }

    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      type: "income",
    });
  };

  const filteredClients = Array.isArray(clients)
  ? clients.filter(
      (c) =>
        typeof c?.name === "string" &&
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    )
  : [];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background top-12 sm:left-[20%] left-[5%] xl:top-12 xl:left-[35%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" />
            {prefillData.id ? "Editar Ingreso" : "Ingresar Cobro Manual"}
          </DialogTitle>
          <DialogDescription>
            {prefillData.id
              ? "Modifica los detalles de la transacción."
              : "Añade un ingreso que no provenga de una cita."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='secondary'
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1 premium-input bg-white",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "dd-MM-yyyy", { locale: es })
                    ) : (
                      <span>Elige una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleChange("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="service">Servicio</Label>
              {isManual ? (
                <SearchableSelect
                  id="service"
                  items={localServices}
                  value={formData.serviceId?.toString()}
                  onSelect={(service) => service && handleServiceChange(service.id.toString())}
                  onCreateNew={handleCreateService}
                  placeholder="Buscar servicio..."
                  renderSelected={(service) => service.name}
                  renderItem={(service) => (
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">${service.sale_price}</p>
                    </div>
                  )}
                  className="mt-1"
                />
              ) : (
                <Input
                  value={prefillData.service || ""}
                  className="mt-1"
                  readOnly
                  disabled
                />
              )}
            </div>
          </div>

          <div>
            <Label>Cliente</Label>
            {isManual ? (
              <SearchableSelect
                items={clients}
                value={formData.clientId?.toString()}
                onSelect={(client) => client && handleClientSelect(client)}
                placeholder="Buscar cliente..."
                renderSelected={(client) => client.name}
                renderItem={(client) => (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{client.name}</span>
                  </div>
                )}
                className="mt-1"
              />
            ) : (
              <div className="flex items-center gap-2 mt-1 rounded-lg border bg-muted p-3 text-foreground">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{formData.clientName}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Monto ($)</Label>
            <div className="relative mt-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="pl-10 font-bold"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label>Método de pago</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = formData.paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => handleChange("paymentMethod", method.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Añadir una nota sobre el pago..."
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto">
              <DollarSign className="w-4 h-4 mr-2" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
