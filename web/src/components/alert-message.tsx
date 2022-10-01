import React from "react";
import { Alert, Flashbar, FlashbarProps } from "@cloudscape-design/components";

interface MessageProps {
  message: string;
}

export const FooterMessage = ({ message }: MessageProps) => {
  const [visible, setVisible] = React.useState(true);
  return (
    <Alert
      onDismiss={() => setVisible(false)}
      visible={visible}
      dismissAriaLabel="Close alert"
      // header="Known issues/limitations"
    >
      {message}
    </Alert>
  );
};

export const HeaderMessage = () => {
  const [items, setItems] = React.useState<FlashbarProps.MessageDefinition[]>([
    {
      type: "info",
      dismissible: true,
      dismissLabel: "Dismiss message",
      onDismiss: () => setItems([]),
      content: (
        <>This demo of reading from OpenSearch is using a dummy dataset.</>
      ),
      id: "message_1",
    },
  ]);
  return <Flashbar items={items} />;
};
