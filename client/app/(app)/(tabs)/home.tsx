import HomeScreen from "@/screens/Home";
import React from "react";
import { View } from "tamagui";

const Home = () => (
  <View
    flex={1}
    height="100%"
    width="100%"
    overflow="scroll"
    items={"center"}
  >
    <HomeScreen />
  </View>
);

export default Home;
