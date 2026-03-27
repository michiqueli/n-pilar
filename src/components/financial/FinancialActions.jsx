import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FinancialActions = ({
  onOpenIncomeModal,
  onOpenExpenseModal
}) => {
  return (
    <>
      {/* Desktop Actions */}
      <motion.div
        className="hidden md:flex flex-wrap gap-4 justify-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Button
          onClick={onOpenExpenseModal}
          variant="secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Gasto
        </Button>

        <Button
          onClick={onOpenIncomeModal}
          variant="primary"
          size="lg"
        >
          <Receipt className="w-5 h-5 mr-2" />
          Registrar Cobro
        </Button>
      </motion.div>

      {/* Mobile Actions - Fixed Bottom Bar */}
      <motion.div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-3 z-30"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-between items-center gap-3">
          <Button
            onClick={onOpenExpenseModal}
            variant="secondary"
            className="flex-1 h-14 text-base"
          >
            <Plus className="w-6 h-6 mr-2" />
            Gasto
          </Button>
          <Button
            onClick={onOpenIncomeModal}
            variant="primary"
            className="flex-1 h-14 text-base"
          >
            <Receipt className="w-6 h-6 mr-2" />
            Cobro
          </Button>
        </div>
      </motion.div>
    </>
  );
};

export default FinancialActions;
