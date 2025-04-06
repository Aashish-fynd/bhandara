import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface EventHeaderProps {}

const EventHeader: React.FC<EventHeaderProps> = () => {
    return (
        <View style={styles.headerContainer}>
            {/*<Image source={require('./path/to/image.jpg')} style={styles.image} />*/}
            <Text style={styles.title}>Basketball Offline Class On Sritex</Text>
            <Text style={styles.capacity}>24/50</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    image: {
        width: 80,
        height: 80,
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    capacity: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: 'white',
        borderRadius: 50,
        padding: 8,
    },
});

export default EventHeader;
