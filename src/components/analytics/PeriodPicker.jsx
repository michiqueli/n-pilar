import React, { useState } from 'react';
import { DatePickerInput, DatePicker } from '@mantine/dates';
import { MantineProvider } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { DatesProvider } from '@mantine/dates';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const calendarClassNames = {
  calendarHeaderControl: 'h-10 w-10 rounded-full p-0 hover:bg-accent hover:scale-110 transition-transform',
  calendarHeaderLevel: 'text-sm font-medium',
  weekday: 'text-muted-foreground w-9 font-normal text-[0.8rem]',
  day: `h-9 w-9 p-0 font-semibold rounded-md transition-colors hover:bg-accent hover:text-accent-foreground
    data-[in-range]:bg-accent data-[in-range]:text-accent-foreground
    data-[first-in-range]:bg-primary data-[first-in-range]:text-primary-foreground data-[first-in-range]:rounded-l-md
    data-[last-in-range]:bg-primary data-[last-in-range]:text-primary-foreground data-[last-in-range]:rounded-r-md
    data-[selected]:not([data-in-range]):bg-primary data-[selected]:not([data-in-range]):text-primary-foreground
    data-[today]:bg-accent/50 data-[today]:text-accent-foreground
    data-[outside]:text-muted-foreground data-[outside]:opacity-50`,
};

const PeriodPicker = ({ dateRange, setDateRange, quickSelectOptions, onQuickSelect }) => {
  const [open, setOpen] = useState(false);

  const value = [
    dateRange.from ? dayjs(dateRange.from).toDate() : null,
    dateRange.to ? dayjs(dateRange.to).toDate() : null
  ];

  const handleChange = (newValue) => {
    setDateRange({
      from: newValue[0] ? dayjs(newValue[0]).startOf('day').toDate() : null,
      to: newValue[1] ? dayjs(newValue[1]).endOf('day').toDate() : null,
    });
    if (newValue[0] && newValue[1]) {
      setTimeout(() => setOpen(false), 300);
    }
  };

  const handleQuickClick = (val) => {
    if (onQuickSelect) {
      onQuickSelect(val);
      setOpen(false);
    }
  };

  const formattedRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${dayjs(dateRange.from).format('DD/MM/YY')} – ${dayjs(dateRange.to).format('DD/MM/YY')}`;
    }
    if (dateRange.from) {
      return `${dayjs(dateRange.from).format('DD/MM/YY')} – ...`;
    }
    return 'Seleccionar período';
  };

  // Sin atajos: usar el DatePickerInput simple de Mantine
  if (!quickSelectOptions) {
    return (
      <MantineProvider>
        <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1, weekendDays: [0], timezone: 'UTC' }}>
          <DatePickerInput
            type="range"
            placeholder="Selecciona un rango..."
            value={value}
            onChange={handleChange}
            valueFormatter={() => formattedRange()}
            leftSection={<Calendar className="h-4 w-4 text-gray-500" />}
            leftSectionPointerEvents="none"
            clearable={false}
            styles={{
              input: {
                borderRadius: '0.75rem',
                textAlign: 'center',
                fontWeight: 500,
                height: '2.75rem',
                marginTop: '0.5rem',
              },
            }}
            w="100%"
            popoverProps={{ withinPortal: true, zIndex: 9999 }}
            previousIcon={<ChevronLeft className="h-5 w-5" />}
            nextIcon={<ChevronRight className="h-5 w-5" />}
            classNames={calendarClassNames}
          />
        </DatesProvider>
      </MantineProvider>
    );
  }

  // Con atajos: popover custom con lista + calendario
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="w-full justify-start text-left font-medium h-11 mt-2">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{formattedRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-auto max-w-md sm:max-w-none p-0" align="center" sideOffset={8} style={{ zIndex: 9999 }}>
        <MantineProvider>
          <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1, weekendDays: [0], timezone: 'UTC' }}>
            <div className="flex flex-col sm:flex-row">
              {/* Atajos: grid en mobile, columna en desktop */}
              <div className="sm:border-r border-b sm:border-b-0 p-2 grid grid-cols-3 sm:flex sm:flex-col gap-1 sm:min-w-[130px]">
                <p className="hidden sm:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Período</p>
                {quickSelectOptions.map(opt => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    size="sm"
                    className="sm:w-full justify-center sm:justify-start h-7 sm:h-8 text-xs sm:text-sm font-normal hover:bg-primary/10 hover:text-primary px-1 sm:px-3"
                    onClick={() => handleQuickClick(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {/* Calendario */}
              <div className="p-3">
                <DatePicker
                  type="range"
                  value={value}
                  onChange={handleChange}
                  classNames={calendarClassNames}
                  previousIcon={<ChevronLeft className="h-5 w-5" />}
                  nextIcon={<ChevronRight className="h-5 w-5" />}
                />
              </div>
            </div>
          </DatesProvider>
        </MantineProvider>
      </PopoverContent>
    </Popover>
  );
};

export default PeriodPicker;
