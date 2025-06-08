import React from "react";
import { PopoverContentTypeProps, Tooltip, TooltipProps } from "tamagui";

const CustomTooltip = ({
  children,
  trigger,
  tooltipConfig,
  tooltipContentConfig
}: {
  children: React.ReactNode;
  trigger: React.ReactNode;
  tooltipConfig?: Partial<TooltipProps>;
  tooltipContentConfig?: Partial<PopoverContentTypeProps>;
}) => {
  return (
    <Tooltip
      placement="top"
      offset={10}
      {...tooltipConfig}
    >
      <Tooltip.Trigger>{trigger}</Tooltip.Trigger>
      <Tooltip.Content {...tooltipContentConfig}>{children}</Tooltip.Content>
    </Tooltip>
  );
};

export default CustomTooltip;
