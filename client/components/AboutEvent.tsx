import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AboutEventProps {}

const AboutEvent: React.FC<AboutEventProps> = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>About Event</Text>
            <Text style={styles.description}>
                Unlock Your Potential On The Court With Our Basketball Offline Class At Sritex! Designed For Players Of All Skill Levels, This Hands-On Class Will Help You Sharpen Your Fundamentals, Enhance Your Game Strategy, And Build Teamwork Skills In A Fun, Supportive Environment. Whether You're A Beginner Looking To Learn The Basics Or An Advanced Player Aiming To Elevate Your Performance, Our Experienced Coaches Will Guide You Through Drills, Exercises, And Live Games. Join Us And Become The Best Version Of Yourself On The Court!
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
    },
});

export default AboutEvent;
