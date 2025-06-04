'use client';

import { Button, Paper, Snackbar, Typography } from '@mui/material';
import { useState, useTransition } from 'react';
import DataGrid from '#components/DataGrid';
import { refundPaymentAction } from './actions';
import { RefundDialog } from './RefundDialog';
import type { Payment, UserSubscription } from '@azzapp/data';
import type { GridColDef } from '@mui/x-data-grid';

export const PaymentList = ({
  payments,
  subscription,
}: {
  subscription: UserSubscription;
  payments: Payment[];
}) => {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openRefundDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setRefundDialogOpen(true);
  };

  const closeRefundDialog = () => {
    setRefundDialogOpen(false);
    setSelectedPayment(null);
  };

  const [isPending, startTransition] = useTransition();

  const confirmRefund = async () => {
    if (!selectedPayment) return;

    startTransition(async () => {
      try {
        await refundPaymentAction(selectedPayment.id);
        closeRefundDialog();
        setMessage('Refund request sent successfully.');
      } catch (err) {
        setMessage(`An error occurred ${err}`);
      }
    });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Payment ID', flex: 1 },
    {
      field: 'amount',
      headerName: 'Amount (€)',
      flex: 1,
      valueFormatter: (value: number) => `${(value / 100).toFixed(2)}`,
    },
    {
      field: 'taxes',
      headerName: 'Taxes (€)',
      flex: 1,
      valueFormatter: (value: number) => `${(value / 100).toFixed(2)}`,
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      valueFormatter: (value: Date) => value.toLocaleDateString(),
    },
    { field: 'status', headerName: 'Status', flex: 1 },
    {
      field: 'invoicePdfUrl',
      headerName: 'Invoice',
      flex: 1,
      renderCell: params =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer">
            Download
          </a>
        ) : (
          '—'
        ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: params => {
        const payment = params.row;
        const shouldShowRefund =
          payment.status === 'paid' && subscription.issuer === 'web';

        return shouldShowRefund ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => openRefundDialog(payment)}
          >
            Refund
          </Button>
        ) : (
          '—'
        );
      },
    },
  ];

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant="h6" mb={2}>
        Payments
      </Typography>
      <DataGrid rows={payments} columns={columns} getRowId={row => row.id} />
      <RefundDialog
        open={refundDialogOpen}
        onClose={closeRefundDialog}
        onConfirm={confirmRefund}
        payment={selectedPayment}
        isPending={isPending}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={!!message}
        onClose={() => {
          setMessage(null);
        }}
        message={message}
      />
    </Paper>
  );
};
