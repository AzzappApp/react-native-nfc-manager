import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  Button,
} from '@mui/material';
import type { Payment } from '@azzapp/data';

export const RefundDialog = ({
  open,
  onClose,
  onConfirm,
  payment,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment: Payment | null;
  isPending: boolean;
}) => {
  if (!payment) return null;

  const totalRefund = ((payment.amount + payment.taxes) / 100).toFixed(2);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Refund</DialogTitle>
      <DialogContent>
        <Typography>
          You are about to refund&nbsp;
          <Typography component="span" fontWeight="bold">
            {totalRefund}
          </Typography>
          .
        </Typography>
        <Typography color="error" mt={1}>
          This action is irreversible.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          loading={isPending}
        >
          Confirm Refund
        </Button>
      </DialogActions>
    </Dialog>
  );
};
