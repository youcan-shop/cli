import React, {useState, useEffect} from 'react';
import {Box, Instance, render, Static, Text} from 'ink';
import { Subject } from 'rxjs'

interface DataSubjectType {
	timestamp: string
	buffer: string
	label: string
	color: Parameters<typeof Text>[0]['color']
}

class OutputObservable {
	private readonly subject = new Subject<DataSubjectType>();
	listen(handler: (data: DataSubjectType) => void) {
	  this.subject.subscribe(handler);
	}

	emit(data: DataSubjectType) {
	  this.subject.next(data);
	}
}

const observable = new OutputObservable;

interface RenderDevOutputType {
	(): Instance;
	observable: OutputObservable;
}

export const DevOutput = () => {
	const [linesBuffers, setLinesBuffers] = useState<DataSubjectType[]>([]);

	useEffect(() => {
		observable.listen((data) => {
			setLinesBuffers((previousLines) => [...previousLines, data]);
		});
	}, []);

	return (
		<>
			<Static items={linesBuffers}>
				{(line, i) => (
					<Box flexDirection="column" key={i}>
						<Text>
							<Text>{line.timestamp} │ {' '}</Text>
							<Text color={line.color}>{line.label}</Text>
							<Text>{' '} │ {' '} {line.buffer}</Text>
						</Text>
					</Box>
				)}
			</Static>
			<Box marginTop={1}>
				<Text dimColor>Completed tests: {linesBuffers.length}</Text>
			</Box>
		</>
	);
};

const renderFn: RenderDevOutputType = (() => render(<DevOutput />)) as RenderDevOutputType;

renderFn.observable = observable;

export const renderDevOutput = renderFn;
