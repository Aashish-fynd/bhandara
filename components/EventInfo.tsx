import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

interface EventInfoProps {}

const EventInfo: React.FC<EventInfoProps> = () => {
    return (
        <View style={styles.infoContainer}>
            <View style={styles.dateContainer}>
                <Text style={styles.date}>Sep 15</Text>
                <Text style={styles.time}>7:30am - 9am</Text>
            </View>
            <MapView style={styles.map} />
            <Text style={styles.location}>4517 Washington Ave. Manchester Lorem Ipsum</Text>
            <Text style={styles.directionButton}>Get Direction</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    infoContainer: {
        marginBottom: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        backgroundColor: '#ccc',
        padding: 8,
        marginRight: 16,
    },
    time: {
        fontSize: 16,
    },
    map: {
        width: 100,
        height: 100,
        marginRight: 16,
    },
    location: {
        fontSize: 16,
    },
    directionButton: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
});

export default EventInfo;
