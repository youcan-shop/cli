import React, { useState, useEffect } from 'react';
import { Box, Instance, render, Static, Text, useApp, useInput } from 'ink';
import { ReplaySubject } from 'rxjs'
import { map } from 'rxjs/operators'

import { VerticalDivider } from './utils/symbols';
import { HotKeys, HotKeysPropsType } from './HotKeys';
import { Command } from '@/node/cli';

interface SubjectDataType {
  timestamp: string
  buffer: string
  label: string
  color: Parameters<typeof Text>[0]['color']
}

class OutputSubject {
  private readonly subject = new ReplaySubject<SubjectDataType>

  listen(handler: (data: SubjectDataType) => void) {
    let lastLineKey: string | null = null;

    this.subject.pipe(map(item => {
        if (`${item.label}-${item.color}` !== lastLineKey) {
          lastLineKey = `${item.label}-${item.color}`;
          item.label = this.pad(item.label, 10);
          return item;
        }

        return { ...item, label: this.pad('', 10) };
      }),
    )
    .subscribe(handler);
  }

  emit(data: SubjectDataType) {
    this.subject.next(data);
  }

  private pad(subject: string, length: number, char = ' ') {
    return subject.padStart(length, char);
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
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'c' && key.ctrl) {
      cmd.exit(130);
    }
  });

  useEffect(() => {
    outputSubject.listen((data) => {
      setLinesBuffers((previousLines) => [...previousLines, data]);
    });
  }, []);

  useEffect(() => {
    cmd.controller.signal.addEventListener('abort', () => {
      console.clear();
      exit();
    });
  }, []);

  return (
    <>
      <Static items={linesBuffers}>
        {(line, i) => (
          <Box flexDirection="column" key={i}>
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

const renderDevOutput: RenderDevOutputType = ((props) => render(<DevOutput {...props} />, { exitOnCtrlC: false })) as RenderDevOutputType;

renderDevOutput.outputSubject = outputSubject;

export {renderDevOutput};
