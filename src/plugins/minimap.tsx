import { Component } from "react";
import MinimapPlugin from "wavesurfer.js/dist/plugin/wavesurfer.minimap";
import { ListenerDescriptor } from "wavesurfer.js";

type Props = {
  isReady: boolean;
  wavesurfer: WaveSurfer;
  options: {};
};

class Minimap extends Component<Props> {
  private map = undefined;

  private readyListener?: ListenerDescriptor;

  static defaultProps = {
    isReady: false,
    options: {},
  };

  componentDidMount() {
    this.map = undefined;

    // on('ready') returns an event descriptor which is an
    // object which has the property un, which is the un method
    // properly bound to this callback, we cache it and can call
    // it alter to just remove this event listener
    this.readyListener = this.props.wavesurfer.on("ready", () => {
      this.init();
    });
  }

  componentWillUnmount() {
    this.readyListener.un();
  }

  private init() {
    this.map = MinimapPlugin.create(this.props.wavesurfer, this.props);
    this.map.render();
  }

  render() {
    return false;
  }
}

export default Minimap;
