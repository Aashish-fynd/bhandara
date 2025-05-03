import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HostAndParticipantsProps {}

const HostAndParticipants: React.FC<HostAndParticipantsProps> = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.host}>Hosted By</Text>
            <Text style={styles.hostName}>Mike Wazowski</Text>
            <Text style={styles.participants}>People Going (24 People)</Text>
            {/* Add logic to display participant avatars */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    host: {
        fontSize: 16,
    },
    hostName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    participants: {
        fontSize: 16,
    },
});

export default HostAndParticipants;
