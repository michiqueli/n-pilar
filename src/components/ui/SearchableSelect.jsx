import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, Plus, Check, X, Loader2 } from 'lucide-react';

const SearchableSelect = ({
  items = [],
  value,
  onSelect,
  onCreateNew,
  placeholder = 'Buscar...',
  renderItem,
  renderSelected,
  filterFn,
  className,
  id,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const containerRef = useRef(null);
  const priceRef = useRef(null);

  // Sync display text when value or items change
  useEffect(() => {
    if (value && !isOpen && !isCreating) {
      const selected = items.find(item => item.id?.toString() === value?.toString());
      if (selected && renderSelected) {
        setSearch(renderSelected(selected));
      }
    }
    if (!value && !isOpen && !isCreating) {
      setSearch('');
    }
  }, [value, items]);

  const filtered = filterFn
    ? items.filter(item => filterFn(item, search))
    : items.filter(item =>
        (item.name || '').toLowerCase().includes(search.toLowerCase())
      );

  const handleSelect = (item) => {
    onSelect(item);
    setSearch(renderSelected ? renderSelected(item) : item.name || '');
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (isCreating) return;
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (isCreating) return;
    setTimeout(() => {
      setIsOpen(false);
      // Restore display text for selected value
      if (value) {
        const selected = items.find(item => item.id?.toString() === value?.toString());
        if (selected && renderSelected) {
          setSearch(renderSelected(selected));
        }
      } else {
        setSearch('');
      }
    }, 200);
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
    setIsOpen(true);
    if (value) {
      onSelect(null);
    }
  };

  const handleStartCreate = () => {
    setNewItemName(search.trim());
    setNewItemPrice('');
    setIsCreating(true);
    setIsOpen(false);
    setTimeout(() => priceRef.current?.focus(), 50);
  };

  const handleConfirmCreate = async () => {
    if (!newItemName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateNew({
        name: newItemName.trim(),
        price: newItemPrice ? parseFloat(newItemPrice) : 0,
      });
    } finally {
      setIsCreating(false);
      setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setSearch('');
  };

  const hasResults = filtered.length > 0;
  const showCreateNew = onCreateNew && search.trim() && !hasResults;

  if (isCreating) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <div className="border rounded-md p-3 space-y-2 bg-card shadow-lg">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium text-primary">Crear nuevo</span>
          </div>
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Nombre"
            className="text-sm"
          />
          <Input
            ref={priceRef}
            type="number"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            placeholder="Precio (opcional)"
            className="text-sm"
            min="0"
            step="0.01"
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancelCreate} disabled={isSubmitting}>
              <X className="w-3 h-3 mr-1" />Cancelar
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleConfirmCreate} disabled={!newItemName.trim() || isSubmitting}>
              {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              Crear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          value={search}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
      </div>
      {isOpen && (
        <div className="absolute z-30 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {hasResults ? (
            filtered.map(item => (
              <div
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className={cn(
                  "p-3 cursor-pointer hover:bg-accent transition-colors",
                  value?.toString() === item.id?.toString() && "bg-primary/10"
                )}
              >
                {renderItem ? renderItem(item) : (
                  <p className="font-medium">{item.name}</p>
                )}
              </div>
            ))
          ) : showCreateNew ? (
            <div
              onMouseDown={handleStartCreate}
              className="p-3 cursor-pointer hover:bg-accent flex items-center gap-2 text-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Crear "{search.trim()}"</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center p-4">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
