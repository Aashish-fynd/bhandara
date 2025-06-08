import React from "react";
import { useLocalSearchParams } from "expo-router";

import ErrorComponent from "@/screens/Error";

export default function NotFoundScreen() {
  const { errorCode, title, description } = useLocalSearchParams();

  return (
    <ErrorComponent
      errorCode={errorCode as string | undefined}
      title={title as string | undefined}
      description={description as string | undefined}
    />
  );
}
