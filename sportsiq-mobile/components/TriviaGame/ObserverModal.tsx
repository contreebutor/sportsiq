import { Modal, Pressable, Text, View } from "react-native";

interface ObserverModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ObserverModal({ visible, onClose }: ObserverModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-8 bg-black/60"
      >
        <Pressable
          onPress={() => {}}
          className="w-full items-center rounded-2xl border border-white/[0.08] bg-[#0D1124] p-6"
        >
          <Text className="mb-2.5 text-[34px]">👁</Text>
          <Text className="mb-2 text-center text-lg font-black text-slate-50">
            You're observing this game
          </Text>
          <Text className="mb-5 text-center text-sm leading-5 text-slate-400">
            Join the next game from the lobby to lock in picks and earn IQ.
          </Text>
          <Pressable
            onPress={onClose}
            className="self-stretch items-center rounded-xl bg-brand-purple py-3"
          >
            <Text className="text-sm font-black text-white">Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
