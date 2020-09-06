import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Wavesurfer from "../src/index";

// @HACK: jsdom doesn't support HTMLMediaElement/audio playback
window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

describe("component basics", () => {
  test("should render with minimal props", async () => {
    render(<Wavesurfer src="https://my-audio.mp3" />);
  });

  test("should allow basic props", async () => {
    render(<Wavesurfer volume={0.5} src="https://my-audio.mp3" />);
    const onReady = jest.fn();
    render(
      <Wavesurfer onReady={onReady} volume={0.5} src="https://my-audio.mp3" />
    );
  });
});

describe("component events", () => {
  test("should allow onReady", async () => {
    const onReady = jest.fn();
    render(<Wavesurfer onReady={onReady} src="https://my-audio.mp3" />);
  });

  test("should allow onReady", async () => {
    const fn = jest.fn();
    render(
      <Wavesurfer
        onPlay={fn}
        onPositionChange={fn}
        src="https://my-audio.mp3"
      />
    );
  });
});
