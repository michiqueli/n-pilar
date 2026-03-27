import React, { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

const ServiceForm = ({ service, onSave, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sale_price: "",
    duration_min: "",
    service_cost: "",
    category: "Cortes",
    special_tag: "Ninguno",
    active: true,
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (service) {
      setFormData({
        id: service.id,
        name: service.name || "",
        description: service.description || "",
        sale_price: service.sale_price || "",
        duration_min: service.duration_min || "",
        service_cost: service.service_cost || "",
        category: service.category || "Cortes",
        special_tag: service.special_tag || "Ninguno",
        active: service.active !== undefined ? service.active : true,
        image_url: service.image_url || "",
      });
      setPreviewUrl(service.image_url || "");
    }
  }, [service]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.sale_price ||
      !formData.duration_min
    ) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Nombre, precio y duración son campos obligatorios.",
      });
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        const result = await api.uploadFile(imageFile);
        finalImageUrl = result.url;
      }

      const dataToSave = {
        ...formData,
        sale_price: parseFloat(formData.sale_price),
        duration_min: parseInt(formData.duration_min),
        service_cost: parseFloat(formData.service_cost) || 0,
        special_tag:
          formData.special_tag === "Ninguno" ? null : formData.special_tag,
        image_url: finalImageUrl,
      };

      onSave(dataToSave);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl top-12 left-[40%]">
      <DialogHeader>
        <DialogTitle>
          {service ? "Editar Servicio" : "Nuevo Servicio"}
        </DialogTitle>
        <DialogDescription>
          Completa los detalles para gestionar este servicio en tu catálogo.
        </DialogDescription>
      </DialogHeader>
      <form
        id="service-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4"
      >
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">Nombre del Servicio</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: Corte Fade Premium"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Describe qué incluye el servicio, técnicas, productos, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale_price">Precio de Venta ($)</Label>
          <Input
            id="sale_price"
            type="number"
            value={formData.sale_price}
            onChange={handleChange}
            required
            min="0"
            placeholder="Ej: 25"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_cost">Costo del Servicio ($)</Label>
          <Input
            id="service_cost"
            type="number"
            value={formData.service_cost}
            onChange={handleChange}
            min="0"
            placeholder="Ej: 5 (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_min">Duración (min)</Label>
          <Input
            id="duration_min"
            type="number"
            value={formData.duration_min}
            onChange={handleChange}
            required
            min="5"
            step="5"
            placeholder="Ej: 45"
          />
        </div>

        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            onValueChange={(value) => handleSelectChange("category", value)}
            value={formData.category}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cortes">Cortes de Pelo</SelectItem>
              <SelectItem value="Barba">Corte y Arreglo de Barba</SelectItem>
              <SelectItem value="Cejas">Diseño y Arreglo de Cejas</SelectItem>
              <SelectItem value="Combos">Combos</SelectItem>
              <SelectItem value="Adicionales">Servicios Adicionales</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Etiqueta Especial</Label>
          <Select
            onValueChange={(value) => handleSelectChange("special_tag", value)}
            value={formData.special_tag || "Ninguno"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar etiqueta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ninguno">Ninguna</SelectItem>
              <SelectItem value="NUEVO">Nuevo</SelectItem>
              <SelectItem value="MEJOR VALOR">Mejor Valor</SelectItem>
              <SelectItem value="OFERTA">Oferta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label>Imagen del Servicio</Label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <Input
                id="image-upload"
                type="file"
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground">
                Sube una imagen para el servicio.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="active-mode">Servicio Activo</Label>
            <p className="text-xs text-muted-foreground">
              Desactívalo para ocultarlo temporalmente del catálogo.
            </p>
          </div>
          <Switch
            id="active-mode"
            checked={formData.active}
            onCheckedChange={handleSwitchChange}
          />
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="service-form"
          variant="primary"
          disabled={isUploading}
        >
          {isUploading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ServiceForm;
