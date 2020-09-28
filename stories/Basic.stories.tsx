import React from "react";
import { Story, Meta } from "@storybook/react";
import WavesurferComponent, { Props } from "../src/index";

export default {
  title: "Basic Usage",
  component: WavesurferComponent,
  argTypes: {
    waveColor: { control: "color" },
    cursorColor: { control: "color" },
    progressColor: { control: "color" },
    backgroundColor: { control: "color" },
  },
} as Meta;

const Template: Story<Props> = (args) => <WavesurferComponent {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  src: "https://freesound.org/data/previews/462/462808_8386274-lq.mp3",
  waveColor: "yellow",
  backgroundColor: "black",
  cursorColor: "red",
  progressColor: "green",
  cursorWidth: 2,
  barWidth: 2,
  playing: false,
  height: 120,
};
