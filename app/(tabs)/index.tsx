import AuthForm from "@/screens/Auth";
import OnBoarding from "@/screens/OnBoarding";
import React from "react";
import { Text, View } from "tamagui";

const index = () => {
  return (
    <>
      {/* <AuthForm isLoginForm={true} /> */}
      <OnBoarding />
    </>
  );
};

export default index;
