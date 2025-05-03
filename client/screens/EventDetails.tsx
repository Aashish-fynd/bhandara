import React from "react";
import { View, StyleSheet } from "react-native";
import EventInfo from "@/components/EventInfo";
import HostAndParticipants from "@/components/HostAndParticipants";
import AboutEvent from "@/components/AboutEvent";
import CheckInButton from "@/components/CheckInButton";
import EventHeader from "@/components/EventHeader";

const EventDetails: React.FC = () => {
  return (
    <View style={styles.container}>
      <EventHeader />
      <EventInfo />
      <HostAndParticipants />
      <AboutEvent />
      <CheckInButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0e6d2",
    padding: 16
  }
});

export default EventDetails;
