import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CheckInButtonProps {
    onPress?: () => void;
}

const CheckInButton: React.FC<CheckInButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Check In Event</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default CheckInButton;
