/**
 * Unit Tests for Button Component
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../src/design-system/components/Button';
import { ThemeProvider } from '../../../src/design-system/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Button Component', () => {
    it('renders correctly with default props', () => {
        const { getByText } = renderWithTheme(<Button>Click Me</Button>);
        expect(getByText('Click Me')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const onPressMock = jest.fn();
        const { getByText } = renderWithTheme(
            <Button onPress={onPressMock}>Press Me</Button>
        );

        fireEvent.press(getByText('Press Me'));
        expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        const onPressMock = jest.fn();
        const { getByText } = renderWithTheme(
            <Button disabled onPress={onPressMock}>Disabled</Button>
        );

        fireEvent.press(getByText('Disabled'));
        expect(onPressMock).not.toHaveBeenCalled();
    });

    it('renders with different variants', () => {
        const { getByText: getPrimary } = renderWithTheme(
            <Button variant="primary">Primary</Button>
        );
        const { getByText: getOutline } = renderWithTheme(
            <Button variant="outline">Outline</Button>
        );

        expect(getPrimary('Primary')).toBeTruthy();
        expect(getOutline('Outline')).toBeTruthy();
    });
});
