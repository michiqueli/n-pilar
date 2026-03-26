import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import FinancialIndicators from "@/components/financial/FinancialIndicators";
import TransactionTable from "@/components/financial/TransactionTable";
import EmptyTransactionsState from "@/components/financial/EmptyTransactionsState";
import PaymentModal from "@/components/payments/PaymentModal";
import ExpenseForm from "@/components/accounting/ExpenseForm";
import FinancialActions from "@/components/financial/FinancialActions";
import FilterBar from "@/components/financial/FilterBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import api from "@/lib/api";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const FinancialDashboard = () => {
    const { toast } = useToast();
    const [allTransactions, setAllTransactions] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isIncomeModalOpen, setIncomeModalOpen] = useState(false);
    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [filters, setFilters] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
    const [transactionToDuplicate, setTransactionToDuplicate] = useState(null);

    useEffect(() => {
        const fetchFinancialData = async () => {
            setLoading(true);
            try {
                const [paymentsData, expensesData, clientsData, servicesData] = await Promise.all([
                    api.getPayments(),
                    api.getExpenses(),
                    api.getClients(),
                    api.getActiveServices()
                ]);

                const incomeTransactions = (paymentsData || []).map((p) => ({
                    id: p.id, type: "income", clientName: p.clients?.name || p.client?.name || "Cliente no especificado",
                    service: p.services?.name || p.service?.name || "Ingreso manual", amount: p.amount,
                    paymentMethod: p.method, date: p.payment_at, confirmed: p.status === "COMPLETED",
                    appointmentId: p.appointment_id, notes: p.notes, clientId: p.client_id, serviceId: p.service_id
                }));

                const expenseTransactions = (expensesData || []).map((e) => ({
                    id: e.id, type: "expense", description: e.description,
                    category: e.category || "Gastos", amount: e.amount,
                    paymentMethod: e.payment_method || "N/A",
                    date: e.expense_date, receipt: !!e.image_url, notes: e.notes
                }));

                const combinedTransactions = [...incomeTransactions, ...expenseTransactions]
                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                setAllTransactions(combinedTransactions);
                setClients(clientsData || []);
                setServices(servicesData || []);
            } catch (error) {
                console.error("Error fetching financial data:", error);
                toast({ variant: "destructive", title: "Error al cargar datos", description: "No se pudieron obtener los movimientos financieros." });
            } finally {
                setLoading(false);
            }
        };
        fetchFinancialData();
    }, [toast]);

    const filteredTransactions = useMemo(() => {
        if (!filters) { return allTransactions; }
        return allTransactions.filter((t) => {
            const transactionDate = startOfDay(parseISO(t.date));
            const from = filters.dateRange?.from ? startOfDay(filters.dateRange.from) : null;
            const to = filters.dateRange?.to ? endOfDay(filters.dateRange.to) : null;
            if (from && transactionDate < from) return false;
            if (to && transactionDate > to) return false;
            if (filters.type && t.type !== filters.type) return false;
            if (filters.paymentMethod && t.paymentMethod !== filters.paymentMethod) return false;
            if (filters.minAmount && t.amount < parseFloat(filters.minAmount)) return false;
            if (filters.maxAmount && t.amount > parseFloat(filters.maxAmount)) return false;
            if (filters.category) {
                if (t.type === "income" && t.service !== filters.category) return false;
                if (t.type === "expense" && t.category !== filters.category) return false;
            }
            return true;
        });
    }, [allTransactions, filters]);

    const financialSummary = useMemo(() => {
        const transactionsToSummarize = filters ? filteredTransactions : allTransactions;
        const income = transactionsToSummarize.filter((t) => t.type === "income" && t.confirmed);
        const expenses = transactionsToSummarize.filter((t) => t.type === "expense");
        const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
        const netProfit = totalIncome - totalExpenses;
        const avgTicket = income.length > 0 ? totalIncome / income.length : 0;
        return { totalIncome, totalExpenses, netProfit, avgTicket };
    }, [allTransactions, filteredTransactions, filters]);

    const handleSaveTransaction = async (transactionData) => {
        try {
            if (editingTransaction && editingTransaction.id) {
                if (editingTransaction.type === 'income') {
                    const data = await api.updatePayment(editingTransaction.id, {
                        client_id: transactionData.clientId, service_id: transactionData.serviceId,
                        amount: transactionData.amount, method: transactionData.paymentMethod,
                        notes: transactionData.notes, payment_at: transactionData.date,
                    });
                    const updatedTx = { ...data, type: 'income', clientName: data.clients?.name || data.client?.name, service: data.services?.name || data.service?.name, date: data.payment_at, confirmed: true, clientId: data.client_id, serviceId: data.service_id };
                    setAllTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTx : t));
                    toast({ title: "✅ Ingreso Actualizado" });
                } else {
                    const data = await api.updateExpense(editingTransaction.id, {
                        description: transactionData.description,
                        amount: transactionData.amount,
                        expense_date: transactionData.date,
                        notes: transactionData.notes,
                        category: transactionData.category,
                        payment_method: transactionData.paymentMethod,
                    });
                    const updatedTx = { ...data, type: 'expense', paymentMethod: data.payment_method, date: data.expense_date };
                    setAllTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTx : t));
                    toast({ title: "✅ Gasto Actualizado" });
                }
            } else {
                if (transactionData.type === "income") {
                    const data = await api.createPayment({
                        client_id: transactionData.clientId, service_id: transactionData.serviceId,
                        amount: transactionData.amount, method: transactionData.paymentMethod,
                        status: "COMPLETED", notes: transactionData.notes, payment_at: transactionData.date,
                    });
                    const newTransaction = { id: data.id, type: "income", clientName: data.clients?.name || data.client?.name, service: data.services?.name || data.service?.name, amount: data.amount, paymentMethod: data.method, date: data.payment_at, confirmed: true, clientId: data.client_id, serviceId: data.service_id };
                    setAllTransactions((prev) => [newTransaction, ...prev]);
                    toast({ title: "🎉 Nuevo ingreso registrado" });
                } else if (transactionData.type === "expense") {
                    const data = await api.createExpense({
                        description: transactionData.description,
                        amount: transactionData.amount,
                        expense_date: transactionData.date,
                        notes: transactionData.notes,
                        category: transactionData.category,
                        payment_method: transactionData.paymentMethod,
                    });
                    const newTransaction = { id: data.id, type: "expense", description: data.description, category: data.category, amount: data.amount, paymentMethod: data.payment_method, date: data.expense_date, receipt: false };
                    setAllTransactions((prev) => [newTransaction, ...prev]);
                    toast({ title: "🎉 Nuevo gasto registrado" });
                }
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error al guardar", description: "No se pudo guardar la transacción. " + error.message });
        } finally {
            setEditingTransaction(null);
            setIncomeModalOpen(false);
            setExpenseModalOpen(false);
        }
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction(transaction);
        if (transaction.type === 'income') {
            setIncomeModalOpen(true);
        } else {
            setExpenseModalOpen(true);
        }
    };

    const handleDuplicateTransaction = (transaction) => {
        setTransactionToDuplicate(transaction);
        setIsDuplicateConfirmOpen(true);
    };

    const confirmDuplicate = async () => {
        if (!transactionToDuplicate) return;
        const { id, ...duplicatedData } = transactionToDuplicate;
        const saveData = { ...duplicatedData, type: transactionToDuplicate.type, date: new Date() };
        await handleSaveTransaction(saveData);
        setIsDuplicateConfirmOpen(false);
        setTransactionToDuplicate(null);
    };

    const handleDeleteTransaction = (transaction) => {
        setTransactionToDelete(transaction);
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;
        try {
            if (transactionToDelete.type === 'income') {
                await api.deletePayment(transactionToDelete.id);
            } else {
                await api.deleteExpense(transactionToDelete.id);
            }
            setAllTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
            toast({ title: "🗑️ Transacción Eliminada" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
        } finally {
            setIsConfirmOpen(false);
            setTransactionToDelete(null);
        }
    };

    const openIncomeModal = () => {
        setEditingTransaction(null);
        setIncomeModalOpen(true);
    };

    const openExpenseModal = () => {
        setEditingTransaction(null);
        setExpenseModalOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Cargando datos financieros...</div>;
    }

    return (
        <>
            <FilterBar onApplyFilters={setFilters} onClearFilters={() => setFilters(null)} />
            <div className="space-y-6 pb-24 md:pb-0">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <FinancialIndicators financialSummary={financialSummary} />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <FinancialActions
                        onOpenIncomeModal={openIncomeModal}
                        onOpenExpenseModal={openExpenseModal}
                    />
                </div>


                {filteredTransactions.length > 0 ? (
                    <TransactionTable
                        transactions={filteredTransactions}
                        onEdit={handleEditTransaction}
                        onDuplicate={handleDuplicateTransaction}
                        onDelete={handleDeleteTransaction}
                    />
                ) : allTransactions.length > 0 ? (
                    <Alert variant="info">
                        <Info className="h-4 w-4" />
                        <AlertTitle>No se encontraron resultados</AlertTitle>
                        <AlertDescription>Prueba a ajustar o limpiar los filtros para ver tus movimientos.</AlertDescription>
                    </Alert>
                ) : (
                    <EmptyTransactionsState onOpenIncomeModal={openIncomeModal} onOpenExpenseModal={openExpenseModal} />
                )}
            </div>

            <div className="md:hidden fixed bottom-4 right-4 z-50">
                <FinancialActions onOpenIncomeModal={openIncomeModal} onOpenExpenseModal={openExpenseModal} />
            </div>

            <PaymentModal
                isOpen={isIncomeModalOpen}
                onClose={() => { setIncomeModalOpen(false); setEditingTransaction(null); }}
                onSave={handleSaveTransaction}
                isManual={true}
                prefillData={editingTransaction || {}}
                clients={clients}
                services={services}
            />

            <Dialog open={isExpenseModalOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingTransaction(null); setExpenseModalOpen(isOpen); }}>
                <ExpenseForm
                    onSave={handleSaveTransaction}
                    onClose={() => { setExpenseModalOpen(false); setEditingTransaction(null); }}
                    transaction={editingTransaction}
                />
            </Dialog>

            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Transacción?"
                description="Estás a punto de eliminar este movimiento. Esta acción es permanente."
            />

            <ConfirmationDialog
                isOpen={isDuplicateConfirmOpen}
                onClose={() => setIsDuplicateConfirmOpen(false)}
                onConfirm={confirmDuplicate}
                title="¿Duplicar Transacción?"
                description="Esto creará una nueva transacción con los mismos datos pero con la fecha de hoy. ¿Quieres continuar?"
            />
        </>
    );
};

export default FinancialDashboard;