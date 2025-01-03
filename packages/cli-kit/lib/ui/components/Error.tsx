import React from 'react';
import { Box, Newline, render, Text } from 'ink';

type ErrorPropsType = {
    message: string
    suggestions?: string[]
}

const Error = ({ message, suggestions = [] }: ErrorPropsType) => {
    return (
        <>
            <Newline />
            <Box flexDirection='column' borderStyle='round' borderColor='red' paddingLeft={1}>
                <Text color='redBright'>Error</Text>
                <Text color='white'>{message}</Text>
                {suggestions.length > 0 && (
                    <Box marginTop={1} flexDirection='column'>
                        <Text color='yellow'>Suggestions:</Text>
                        {suggestions.map((suggestion, index) => (
                            <Text key={index}> - {suggestion}</Text>
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
  }

export const renderError = (props: ErrorPropsType) => render(<Error {...props} />);
