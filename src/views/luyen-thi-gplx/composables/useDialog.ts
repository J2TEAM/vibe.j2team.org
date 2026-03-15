import { ref } from "vue";

export type DialogOptions = {
  type: "alert" | "confirm" | "info";
  title: string;
  message: string;
  imageUrl?: string;
  footer?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const dialogState = ref({
  isOpen: false,
  title: "",
  message: "",
  imageUrl: "",
  footer: "",
  type: "alert" as "alert" | "confirm" | "info",
  onConfirm: () => {},
  onCancel: () => {}
});

export function useDialog() {
  function showDialog(options: DialogOptions) {
    dialogState.value = {
      isOpen: true,
      title: options.title,
      message: options.message,
      imageUrl: options.imageUrl || "",
      footer: options.footer || "",
      type: options.type,
      onConfirm: options.onConfirm || (() => {}),
      onCancel: options.onCancel || (() => {})
    };
  }

  function closeDialog(isConfirm: boolean) {
    dialogState.value.isOpen = false;
    if (isConfirm) {
      dialogState.value.onConfirm();
    } else {
      dialogState.value.onCancel();
    }
  }

  return {
    dialogState,
    showDialog,
    closeDialog
  };
}
