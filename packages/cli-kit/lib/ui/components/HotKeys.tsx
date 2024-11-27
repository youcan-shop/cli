import React from "react";

import { Box, render, Text, useInput } from "ink";

import { RightChevron, VerticalDivider } from "./utils/symbols";

type KeyType = {
  keyboardKey: string
  description: string
  handler: () => void
}

const HotKey = ({ keyboardKey, description, handler } : KeyType) => {
  useInput((input) => {
    if (input === keyboardKey) handler();
  });

  return (
    <Box flexDirection="column">
      <Text>
        <RightChevron /> Press <Text dimColor>{keyboardKey}</Text> <VerticalDivider /> {description}
      </Text>
    </Box>
  );
}

export type HotKeysPropsType = {
  hotKeys: KeyType[],
};

export const HotKeys = ({ hotKeys } : HotKeysPropsType) => {
  return (<Box flexDirection="column">{hotKeys.map((hotKey) => <HotKey key={hotKey.keyboardKey} {...hotKey} />)}</Box>);
}

export const renderHotKeys = (props: HotKeysPropsType) => render(<HotKeys {...props} />, { exitOnCtrlC: false });
