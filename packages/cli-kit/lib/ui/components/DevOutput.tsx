import React from 'react';

import { Box, Instance, render, Static, Text, useInput } from 'ink';
import { HotKeys, HotKeysPropsType } from './HotKeys';
import { VerticalDivider } from './utils/symbols';
import { useState, useEffect } from 'react';
import { Command } from '@/node/cli';
import { map } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

interface SubjectDataType {
  timestamp: string
  buffer: string
  label: string
  color: Parameters<typeof Text>[0]['color']
}

class OutputSubject {
  private readonly subject = new ReplaySubject<SubjectDataType>

  listen(handler: (data: SubjectDataType) => void): void {
    let lastLineKey: string | null = null;

    this.subject.pipe(map(item => {
      const currentLineKey = `${item.label}-${item.color}`;

        if (currentLineKey !== lastLineKey) {
          lastLineKey = currentLineKey;
          return {...item, label: this.pad(item.label, 10)};
        }

        return { ...item, label: this.pad('', 10) };
      }),
    )
    .subscribe(handler);
  }

  emit(data: SubjectDataType): void {
    this.subject.next(data);
  }

  private pad(subject: string, length: number, char = ' '): string {
    return subject.padEnd(length, char);
  }
}

const outputSubject = new OutputSubject;

export type DevOutputPropsType = {
  hotKeys?: HotKeysPropsType['hotKeys']
  cmd: Command
};

interface RenderDevOutputType {
  (props: DevOutputPropsType): Instance;
  outputSubject: OutputSubject;
}

export const DevOutput = ({cmd, hotKeys = []} : DevOutputPropsType) => {
  const [linesBuffers, setLinesBuffers] = useState<SubjectDataType[]>([]);

  useInput((input, key) => {
    if (input === 'c' && key.ctrl) cmd.exit(130);
  });

  useEffect(() => {
    outputSubject.listen((data) => {
      setLinesBuffers((previousLines) => [...previousLines, data]);
    });
  }, []);

  return (
    <>
      <Static items={linesBuffers}>
        {(line, i) => (
          <Box flexDirection='column' key={i}>
            <Text>
              <Text>{line.timestamp} <VerticalDivider /></Text>
              <Text color={line.color}>{line.label}</Text>
              <Text>{' '}<VerticalDivider />{' '}{line.buffer}</Text>
            </Text>
          </Box>
        )}
      </Static>
      <Box flexDirection='column' paddingTop={1}>
        <HotKeys hotKeys={hotKeys} />
      </Box>
    </>
  );
};

const renderDevOutput: RenderDevOutputType =
  ((props) => render(<DevOutput {...props} />, { exitOnCtrlC: false })) as RenderDevOutputType;

renderDevOutput.outputSubject = outputSubject;

export { renderDevOutput };
