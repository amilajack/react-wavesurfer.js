import React, { Component, ReactElement } from "react";
import PropTypes from "prop-types";
import WaveSurfer, { WaveSurferParams } from "wavesurfer.js";
import { capitaliseFirstLetter } from "./helpers";

const wavesurferParams = new Set([
  "audioContext",
  "audioRate",
  "audioScriptProcessor",
  "autoCenter",
  "autoCenterRate",
  "autoCenterImmediately",
  "backend",
  "backgroundColor",
  "barHeight",
  "barRadius",
  "barGap",
  "barWidth",
  "barMinHeight",
  "closeAudioContext",
  "cursorColor",
  "cursorWidth",
  "drawingContextAttributes",
  "duration",
  "fillParent",
  "forceDecode",
  "height",
  "hideScrollbar",
  "interact",
  "loopSelection",
  "maxCanvasWidth",
  "mediaControls",
  "mediaType",
  "minPxPerSec",
  "normalize",
  "partialRender",
  "pixelRatio",
  "plugins",
  "progressColor",
  "removeMediaElementOnDestroy",
  "renderer",
  "responsive",
  "rtl",
  "scrollParent",
  "skipLength",
  "splitChannels",
  "waveColor",
  "xhr",
]);

const EVENTS: ReadonlyArray<string> = [
  "audioprocess",
  "error",
  "finish",
  "loading",
  "mouseup",
  "pause",
  "play",
  "ready",
  "scroll",
  "seek",
  "zoom",
];

/**
 * Throws an error if the prop is defined and not an integer or not positive
 */
function positiveIntegerProptype(
  props: Props,
  propName: keyof Props,
  componentName: string
) {
  const n = props[propName];
  if (
    n !== undefined &&
    (typeof n !== "number" ||
      (typeof n === "string" && n !== parseInt(n, 10)) ||
      n < 0)
  ) {
    return new Error(`Invalid ${propName} supplied to ${componentName},
      expected a positive integer`);
  }
  return null;
}

const resizeThrottler = (fn: () => void) => () => {
  let resizeTimeout;

  if (!resizeTimeout) {
    // @TODO: Throttle raf
    resizeTimeout = requestAnimationFrame(() => {
      resizeTimeout = null;
      fn();
    });
  }
};

type Peaks = number[];

type WaveSurferAudioSource = HTMLElement | Blob | File | string;

export interface Props extends Omit<WaveSurferParams, "container"> {
  src: string | File | Blob;
  playing?: boolean;
  pos?: number;
  mediaElt?: string | HTMLElement;
  audioPeaks?: Peaks;
  volume?: number;
  zoom?: number;
  responsive?: boolean;
  onPositionChange?: (position: number) => void;
  onAudioprocess?: (time: number) => void;
  onError?: (error: Error) => void;
  onFinish?: () => void;
  onLoading?: (percent: number) => void;
  onMouseup?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onReady?: () => void;
  onScroll?: () => void;
  onSeek?: () => void;
  // pxPerSec Number of horizontal pixels per second of
  // audio, if none is set the waveform returns to unzoomed state
  onZoom?: (pxPerSec: number) => void;
}

type State = {
  isReady: boolean;
  pos: number;
  formattedPos: number;
};

export default class WavesurferComponent extends Component<Props, State> {
  private wavesurfer?: WaveSurfer;

  private wavesurferElm?: HTMLElement;

  private handleResize?: EventListenerObject | (() => void);

  state: State = {
    isReady: false,
    pos: 0,
    formattedPos: 0,
  };

  static defaultProps = {
    playing: false,
    pos: 0,
    responsive: true,
    autoCenter: true,
    onPositionChange: () => {},
  };

  static propTypes = {
    playing: PropTypes.bool,
    pos: PropTypes.number,
    src: (props: Props, propName: keyof Props, componentName: string) => {
      const prop = props[propName];
      if (
        prop &&
        typeof prop !== "string" &&
        !(prop instanceof window.Blob) &&
        !(prop instanceof window.File)
      ) {
        return new Error(`Invalid ${propName} supplied to ${componentName}
          expected either string or file/blob`);
      }

      return null;
    },
    mediaElt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(window.HTMLElement),
    ]),
    audioPeaks: PropTypes.array,
    volume: PropTypes.number,
    zoom: PropTypes.number,
    responsive: PropTypes.bool,
    onPositionChange: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
    audioRate: PropTypes.number,
    backend: PropTypes.oneOf(["WebAudio", "MediaElement"]),
    barWidth: (props: Props, propName: keyof Props, componentName: string) => {
      const prop = props[propName];
      if (prop !== undefined && typeof prop !== "number") {
        return new Error(`Invalid ${propName} supplied to ${componentName}
          expected either undefined or number`);
      }
      return null;
    },
    cursorColor: PropTypes.string,
    // @ts-ignore
    cursorWidth: positiveIntegerProptype,
    dragSelection: PropTypes.bool,
    fillParent: PropTypes.bool,
    // @ts-ignore
    height: positiveIntegerProptype,
    hideScrollbar: PropTypes.bool,
    interact: PropTypes.bool,
    loopSelection: PropTypes.bool,
    mediaControls: PropTypes.bool,
    // @ts-ignore
    minPxPerSec: positiveIntegerProptype,
    normalize: PropTypes.bool,
    pixelRatio: PropTypes.number,
    progressColor: PropTypes.string,
    scrollParent: PropTypes.bool,
    skipLength: PropTypes.number,
    waveColor: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(window.CanvasGradient),
    ]),
    autoCenter: PropTypes.bool,
  };

  constructor(props: Props) {
    super(props);

    if (typeof WaveSurfer === undefined) {
      throw new Error("WaveSurfer is undefined!");
    }

    this.loadMediaElt = this.loadMediaElt.bind(this);
    this.loadAudio = this.loadAudio.bind(this);
    this.seekTo = this.seekTo.bind(this);

    if (this.props.responsive) {
      this.handleResize = resizeThrottler(() => {
        if (!this.wavesurfer) throw new Error("wavesurfer no defined");
        // pause playback for resize operation
        if (this.props.playing) {
          this.wavesurfer.pause();
        }

        // resize the waveform
        this.wavesurfer.drawBuffer();

        // We allow resize before file isloaded, since we can get wave data from outside,
        // so there might not be a file loaded when resizing
        if (this.state.isReady) {
          // restore previous position
          this.seekTo(this.props.pos as number);
        }

        // restore playback
        if (this.props.playing) {
          this.wavesurfer.play();
        }
      });
    }
  }

  componentDidMount() {
    if (!this.wavesurferElm) throw new Error("Conainer not defined");
    const wavesurferProps = Object.fromEntries(
      Object.entries(this.props).filter(([key]) => wavesurferParams.has(key))
    );
    const options = {
      ...wavesurferProps,
      container: this.wavesurferElm,
    } as WaveSurferParams;
    this.wavesurfer = WaveSurfer.create(options);

    // media element loading is only supported by MediaElement backend
    if (this.props.mediaElt) {
      options.backend = "MediaElement";
    }

    // file was loaded, wave was drawn
    this.wavesurfer.on("ready", () => {
      if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
      this.setState({
        isReady: true,
        pos: this.props.pos as number,
      });

      // set initial position
      if (this.props.pos) {
        this.seekTo(this.props.pos);
      }

      // set initial volume
      if (this.props.volume) {
        this.wavesurfer.setVolume(this.props.volume);
      }

      // set initial playing state
      if (this.props.playing) {
        this.wavesurfer.play();
      }

      // set initial zoom
      if (this.props.zoom) {
        this.wavesurfer.zoom(this.props.zoom);
      }
    });

    this.wavesurfer.on("audioprocess", (pos) => {
      this.setState({
        pos,
      });
      if (this.props.onPositionChange) {
        this.props.onPositionChange(pos);
      }
    });

    // `audioprocess` is not fired when seeking, so we have to plug into the
    // `seek` event and calculate the equivalent in seconds (seek event
    // receives a position float 0-1) – See the README.md for explanation why we
    // need this
    this.wavesurfer.on("seek", (pos) => {
      if (this.state.isReady && this.props.onPositionChange) {
        const formattedPos = this.posToSec(pos);
        this.setState({
          formattedPos,
        });
        this.props.onPositionChange(formattedPos);
      }
    });

    // hook up events to callback handlers passed in as props
    EVENTS.forEach((e) => {
      const { wavesurfer } = this;
      const propCallback = this.props[
        `on${capitaliseFirstLetter(e)}` as keyof Props
      ] as Function;
      if (propCallback) {
        if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
        this.wavesurfer.on(e, (...originalArgs) => {
          propCallback({
            wavesurfer,
            originalArgs,
          });
        });
      }
    });

    // if audioFile prop, load file
    if (this.props.src) {
      this.loadAudio(this.props.src, this.props.audioPeaks);
    }

    // if mediaElt prop, load media Element
    if (this.props.mediaElt) {
      this.loadMediaElt(this.props.mediaElt, this.props.audioPeaks);
    }

    if (this.props.responsive && this.handleResize) {
      window.addEventListener("resize", this.handleResize, false);
    }
  }

  // update wavesurfer rendering manually
  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    let newSource = false;
    let seekToInNewFile: WaveSurfer.ListenerDescriptor;

    // update audioFile
    if (this.props.src !== nextProps.src) {
      this.setState({
        isReady: false,
      });
      this.loadAudio(nextProps.src, nextProps.audioPeaks);
      newSource = true;
    }
    // update mediaElt
    if (nextProps.mediaElt && this.props.mediaElt !== nextProps.mediaElt) {
      this.setState({
        isReady: false,
      });
      this.loadMediaElt(nextProps.mediaElt, nextProps.audioPeaks);
      newSource = true;
    }
    // update peaks
    if (this.props.audioPeaks !== nextProps.audioPeaks) {
      if (nextProps.mediaElt) {
        this.loadMediaElt(nextProps.mediaElt, nextProps.audioPeaks);
      } else {
        this.loadAudio(nextProps.src, nextProps.audioPeaks);
      }
    }
    // update position
    if (
      nextProps.pos !== undefined &&
      this.state.isReady &&
      nextProps.pos !== this.props.pos &&
      nextProps.pos !== this.state.pos
    ) {
      if (newSource) {
        seekToInNewFile = this.wavesurfer.on("ready", () => {
          this.seekTo(nextProps.pos as number);
          seekToInNewFile.un();
        });
      } else {
        this.seekTo(nextProps.pos);
      }
    }
    // update playing state
    if (
      !newSource &&
      (this.props.playing !== nextProps.playing ||
        this.wavesurfer.isPlaying() !== nextProps.playing)
    ) {
      if (nextProps.playing) {
        this.wavesurfer.play();
      } else {
        this.wavesurfer.pause();
      }
    }
    // update volume
    if (nextProps.volume && this.props.volume !== nextProps.volume) {
      this.wavesurfer.setVolume(nextProps.volume);
    }
    // update zoom
    if (this.props.zoom !== nextProps.zoom) {
      this.wavesurfer.zoom(nextProps.zoom);
    }
    // update audioRate
    if (nextProps.audioRate && this.props.audioRate !== nextProps.audioRate) {
      this.wavesurfer.setPlaybackRate(nextProps.audioRate);
    }
    // update backgroundColor
    if (
      nextProps.backgroundColor &&
      this.props.backgroundColor !== nextProps.backgroundColor
    ) {
      this.wavesurfer.setBackgroundColor(nextProps.backgroundColor);
    }
    // update waveColor
    if (nextProps.waveColor && this.props.waveColor !== nextProps.waveColor) {
      this.wavesurfer.setWaveColor(nextProps.waveColor);
    }
    // update progressColor
    if (
      nextProps.progressColor &&
      this.props.progressColor !== nextProps.progressColor
    ) {
      this.wavesurfer.setProgressColor(nextProps.progressColor);
    }
    if (
      nextProps.cursorColor &&
      this.props.cursorColor !== nextProps.cursorColor
    ) {
      this.wavesurfer.setCursorColor(nextProps.cursorColor);
    }
    if (nextProps.height && this.props.height !== nextProps.height) {
      this.wavesurfer.setHeight(nextProps.height);
    }
    // turn responsive on
    if (
      nextProps.responsive &&
      this.props.responsive !== nextProps.responsive &&
      this.handleResize
    ) {
      window.addEventListener("resize", this.handleResize, false);
    }
    // turn responsive off
    if (
      !nextProps.responsive &&
      this.props.responsive !== nextProps.responsive &&
      this.handleResize
    ) {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  componentWillUnmount() {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    // remove all listeners
    // @ts-ignore TS defs are wrong
    EVENTS.forEach((e) => this.wavesurfer.un(e));

    // destroy wavesurfer instance
    this.wavesurfer.destroy();

    if (this.props.responsive && this.handleResize) {
      window.removeEventListener("resize", this.handleResize);
    }
  }

  // receives seconds and transforms this to the position as a float 0-1
  private secToPos(sec: number) {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    return (1 / this.wavesurfer.getDuration()) * sec;
  }

  // receives position as a float 0-1 and transforms this to seconds
  private posToSec(pos: number) {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    return pos * this.wavesurfer.getDuration();
  }

  // pos is in seconds, the 0-1 proportional position we calculate here …
  private seekTo(sec: number) {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    const pos = this.secToPos(sec);
    if (this.props.autoCenter) {
      this.wavesurfer.seekAndCenter(pos);
    } else {
      this.wavesurfer.seekTo(pos);
    }
  }

  // load a media element selector or HTML element
  // if selector, get the HTML element for it
  // and pass to _loadAudio
  private loadMediaElt(
    selectorOrElt: string | HTMLElement,
    audioPeaks?: Peaks
  ) {
    if (selectorOrElt instanceof window.HTMLElement) {
      this.loadAudio(selectorOrElt, audioPeaks);
    } else {
      const elm = document.querySelector(selectorOrElt);
      if (!elm) {
        throw new Error("Media Element not found!");
      }
      this.loadAudio(elm as HTMLElement, audioPeaks);
    }
  }

  // pass audio data to wavesurfer
  private loadAudio(audioFileOrElt: WaveSurferAudioSource, audioPeaks?: Peaks) {
    if (!this.wavesurfer) throw new Error("wavesurfer not initialized");
    if (audioFileOrElt instanceof window.HTMLElement) {
      // media element
      this.wavesurfer.loadMediaElement(audioFileOrElt, audioPeaks);
    } else if (typeof audioFileOrElt === "string") {
      // bog-standard string is handled by load method and ajax call
      this.wavesurfer.load(audioFileOrElt, audioPeaks);
    } else if (audioFileOrElt instanceof window.Blob) {
      // blob or file is loaded with loadBlob method
      this.wavesurfer.loadBlob(audioFileOrElt);
    } else {
      throw new Error(`Wavesurfer.loadAudio expects prop audioFile
        to be either HTMLElement, string or file/blob`);
    }
  }

  render() {
    const childrenWithProps = this.props.children
      ? React.Children.map(this.props.children, (child) =>
          React.cloneElement(child as ReactElement, {
            wavesurfer: this.wavesurfer,
            isReady: this.state.isReady,
          })
        )
      : false;
    return (
      <div>
        <div
          ref={(c) => {
            this.wavesurferElm = c || undefined;
          }}
        />
        {childrenWithProps}
      </div>
    );
  }
}
