import React, { Component } from "react";
import PropTypes from "prop-types";
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline";

interface WaveSurferTimelineOpts {
  height: number;
  notchPercentHeight: number;
  labelPadding: number;
  unlabeledNotchColor: string;
  primaryColor: string;
  secondaryColor: string;
  primaryFontColor: string;
  secondaryFontColor: string;
  fontFamily: string;
  fontSize: number;
  duration: null | number;
  zoomDebounce: boolean;
  offset: number;
  formatTimeCallback: (secs: number, pxPerSec: number) => number;
  timeInterval: (pxPerSec: number) => number;
  primaryLabelInterval: (pxPerSec: number) => number;
  secondaryLabelInterval: (pxPerSec: number) => number;
}

interface Props extends WaveSurferTimelineOpts {
  isReady: boolean;
  wavesurfer: WaveSurfer;
}

class TimelineComponent extends Component<Props> {
  private timeline = null;

  private timelineElm?: HTMLElement;

  static propTypes = {
    isReady: PropTypes.bool.isRequired,
    options: PropTypes.object.isRequired,
    wavesurfer: PropTypes.object,
  };

  static defaultProps = {
    isReady: false,
    height: 20,
    notchPercentHeight: 90,
    labelPadding: 5,
    unlabeledNotchColor: "#c0c0c0",
    primaryColor: "#000",
    secondaryColor: "#c0c0c0",
    primaryFontColor: "#000",
    secondaryFontColor: "#000",
    fontFamily: "Arial",
    fontSize: 10,
    duration: null,
    zoomDebounce: false,
    offset: 0,
  };

  componentDidMount() {
    if (this.props.isReady) this.init();
    this.props.wavesurfer.on("ready", this.init.bind(this));
  }

  private init() {
    this.timeline = TimelinePlugin.create({
      ...this.props,
      container: this.timelineElm,
      wavesurfer: this.props.wavesurfer,
    });
  }

  render() {
    return (
      <div
        ref={(c) => {
          this.timelineElm = c || undefined;
        }}
      />
    );
  }
}

export default TimelineComponent;
