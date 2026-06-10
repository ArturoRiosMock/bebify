import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, PartyPopper, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

export interface EventFormData {
  eventType: string;
  schoolName: string;
  graduateName: string;
  tableNumber: string;
}

interface PurchaseTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (eventData: EventFormData | null) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

type PurchaseType = 'personal' | 'evento';

export const PurchaseTypeDialog = ({
  open,
  onClose,
  onConfirm,
  loading,
  error,
}: PurchaseTypeDialogProps) => {
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('personal');

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormData>();

  useEffect(() => {
    if (open) {
      setPurchaseType('personal');
      reset();
    }
  }, [open, reset]);

  const handleClose = () => {
    setPurchaseType('personal');
    reset();
    onClose();
  };

  const handleContinue = () => {
    if (purchaseType === 'personal') {
      onConfirm(null);
      return;
    }
    handleSubmit((data) => onConfirm(data))();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#212121] text-xl">
            Tipo de compra
          </DialogTitle>
          <DialogDescription>
            Selecciona si esta compra es personal o para un evento.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={purchaseType}
          onValueChange={(v) => setPurchaseType(v as PurchaseType)}
          className="grid grid-cols-2 gap-3 mt-2"
        >
          <label
            htmlFor="personal"
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              purchaseType === 'personal'
                ? 'border-[#0c3c1f] bg-[#0c3c1f]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <RadioGroupItem value="personal" id="personal" className="sr-only" />
            <ShoppingBag
              className={`w-8 h-8 ${
                purchaseType === 'personal' ? 'text-[#0c3c1f]' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                purchaseType === 'personal' ? 'text-[#0c3c1f]' : 'text-gray-600'
              }`}
            >
              Compra Personal
            </span>
          </label>

          <label
            htmlFor="evento"
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              purchaseType === 'evento'
                ? 'border-[#0c3c1f] bg-[#0c3c1f]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <RadioGroupItem value="evento" id="evento" className="sr-only" />
            <PartyPopper
              className={`w-8 h-8 ${
                purchaseType === 'evento' ? 'text-[#0c3c1f]' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-sm font-semibold ${
                purchaseType === 'evento' ? 'text-[#0c3c1f]' : 'text-gray-600'
              }`}
            >
              Compra para Evento
            </span>
          </label>
        </RadioGroup>

        <AnimatePresence mode="wait">
          {purchaseType === 'evento' && (
            <motion.div
              key="event-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2 pb-1">
                {/* Tipo de evento */}
                <div className="space-y-2">
                  <Label className="text-[#212121] font-semibold text-sm">
                    Tipo de evento: <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="eventType"
                    control={control}
                    rules={{ required: 'Selecciona el tipo de evento' }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={
                            errors.eventType ? 'border-red-500' : ''
                          }
                        >
                          <SelectValue placeholder="-- Por favor seleccione --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="graduacion">
                            Graduación
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.eventType && (
                    <p className="text-red-500 text-xs">
                      {errors.eventType.message}
                    </p>
                  )}
                </div>

                {/* Nombre de la escuela */}
                <div className="space-y-2">
                  <Label className="text-[#212121] font-semibold text-sm">
                    Nombre de la escuela:{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="schoolName"
                    control={control}
                    rules={{ required: 'El nombre de la escuela es obligatorio' }}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={errors.schoolName ? 'border-red-500' : ''}
                        >
                          <SelectValue placeholder="-- Por favor seleccione --" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Colegio Irlandes Femenil">
                            Colegio Irlandes Femenil
                          </SelectItem>
                          <SelectItem value="Ibero Ingenieria Quimica">
                            Ibero Ingenieria Quimica
                          </SelectItem>
                          <SelectItem value="Prepa Tec Zona Esmeralda">
                            Prepa Tec Zona Esmeralda
                          </SelectItem>
                          <SelectItem value="Alexander Bain">
                            Alexander Bain
                          </SelectItem>
                          <SelectItem value="Del Bosque">Del Bosque</SelectItem>
                          <SelectItem value="Humanitree">Humanitree</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.schoolName && (
                    <p className="text-red-500 text-xs">
                      {errors.schoolName.message}
                    </p>
                  )}
                </div>

                {/* Nombre del graduado */}
                <div className="space-y-2">
                  <Label className="text-[#212121] font-semibold text-sm">
                    Nombre del graduado:{' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="graduateName"
                    control={control}
                    rules={{ required: 'El nombre del graduado es obligatorio' }}
                    render={({ field }) => (
                      <Input
                        placeholder="Ejemplo: Juan Pérez"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className={errors.graduateName ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.graduateName && (
                    <p className="text-red-500 text-xs">
                      {errors.graduateName.message}
                    </p>
                  )}
                </div>

                {/* Número de mesa */}
                <div className="space-y-2">
                  <Label className="text-[#212121] font-semibold text-sm">
                    Número de mesa: <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="tableNumber"
                    control={control}
                    rules={{ required: 'El número de mesa es obligatorio' }}
                    render={({ field }) => (
                      <Input
                        placeholder="Ejemplo: 5 o N/A"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        className={errors.tableNumber ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.tableNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.tableNumber.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <DialogFooter className="mt-2 gap-2 sm:gap-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 sm:flex-none py-2.5 px-5 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 sm:flex-none py-2.5 px-5 bg-[#0c3c1f] text-white rounded-lg font-bold text-sm hover:bg-[#0a3019] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Continuar al pago'
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
