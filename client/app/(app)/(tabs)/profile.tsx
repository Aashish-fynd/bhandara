import React from "react";
import ProfileScreen from "@/screens/Profile";
import { View } from "tamagui";

const Profile = () => (
  <View
    flex={1}
    height="100%"
    width="100%"
    overflow="scroll"
  >
    <ProfileScreen />
  </View>
);

export default Profile;
