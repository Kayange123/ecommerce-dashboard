"use client";
import { useIsMounted } from "@/hooks/useIsMounted";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title?: string;
  description?: string;
}

const AlertModal = ({
  isLoading,
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action can not be undone",
}: AlertModalProps) => {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }
  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button
          disabled={isLoading}
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
          type="submit"
          variant="destructive"
          onClick={onConfirm}
        >
          Continue
        </Button>
      </div>
    </Modal>
  );
};

export default AlertModal;
