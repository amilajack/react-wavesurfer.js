import React from "react";
import { Story, Meta } from "@storybook/react";
import WavesurferComponent, { Props } from "../index";

export default {
  title: "Basic Usage",
  component: WavesurferComponent,
  argTypes: {
    waveColor: { control: "color" },
    backgroundColor: { control: "color" },
  },
} as Meta;

const Template: Story<Props> = (args) => <WavesurferComponent {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  src: "https://freesound.org/data/previews/462/462808_8386274-lq.mp3",
  waveColor: "red",
  backgroundColor: "white",
  barWidth: 3,
  cursorWidth: 10,
};
