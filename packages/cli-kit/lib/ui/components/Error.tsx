import React from 'react';
import { Box, Newline, render, Text } from 'ink';
import { X } from './utils/symbols';

type ErrorPropsType = {
    message: string;
    suggestions?: string[];
}

const Error = ({ message, suggestions = [] }: ErrorPropsType) => {
    return (
        <>
            <Newline />
            <Box flexDirection='column' borderStyle='round' borderColor='red'>
                <Text color='redBright'>
                    <X /> Error
                </Text>
                <Text color='white'>{message}</Text>
                {suggestions.length > 0 && (
                    <Box marginTop={1} flexDirection='column'>
                        <Text color='yellow'>Suggestions:</Text>
                        {suggestions.map((suggestion, index) => (
                            <Text key={index}>- {suggestion}</Text>
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
  }

export const renderError = (props: ErrorPropsType) => render(<Error {...props} />);
