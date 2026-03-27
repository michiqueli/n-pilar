import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const FinancialIndicators = ({ financialSummary }) => {
  return (
    <motion.div
      className="space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="premium-card p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/10 flex items-center justify-center mr-2 md:mr-3">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              </div>
              <span className="text-xs md:text-sm text-green-500 font-semibold tracking-wide">
                INGRESOS
              </span>
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-foreground mb-1">
              ${financialSummary.totalIncome.toLocaleString()}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">Ingresos Totales</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-2 md:mr-3">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              </div>
              <span className="text-xs md:text-sm text-red-500 font-semibold tracking-wide">
                GASTOS
              </span>
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-foreground mb-1">
              ${financialSummary.totalExpenses.toLocaleString()}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">Gastos Totales</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mr-2 md:mr-3">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <span className="text-xs md:text-sm text-primary font-semibold tracking-wide">
                NETO
              </span>
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-foreground mb-1">
              ${financialSummary.netProfit.toLocaleString()}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">Ganancia Neta</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default FinancialIndicators;
