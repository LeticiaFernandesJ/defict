import { Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  titulo?: string;
  descricao?: string;
  confirmarLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmação de exclusão (fiel ao modal de delete da referência). */
export function ConfirmDialog({
  open,
  titulo = 'Excluir registro?',
  descricao = 'Essa ação não pode ser desfeita.',
  confirmarLabel = 'Excluir',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-vermelho/10">
          <Trash2 className="text-vermelho" size={24} />
        </div>
        <h2 className="mb-1.5 font-display text-[19px] font-semibold text-ink">{titulo}</h2>
        <p className="mb-5 text-sm text-textSecondary">{descricao}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 !bg-vermelho"
          >
            {confirmarLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
