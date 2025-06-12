import { CardWrapper } from "@/components/ui/common-styles";
import React from "react";
import { Image } from "tamagui";

interface IProps {
  type: "image" | "video";
  file: string;
}

const AssetPreview = ({ type, file }: IProps) => {
  const renderPreview = () => {
    switch (type) {
      case "image":
        return (
          <Image
            src={file}
            height={50}
            width={50}
          />
        );
    }
  };

  return (
    <CardWrapper
      rounded={"$3"}
      p={0}
    >
      {renderPreview()}
    </CardWrapper>
  );
};

export default AssetPreview;
