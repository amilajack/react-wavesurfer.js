import { Component } from "react";
import RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import { capitaliseFirstLetter } from "../helpers";

const REGIONS_EVENTS: ReadonlyArray<string> = [
  "region-in",
  "region-out",
  "region-mouseenter",
  "region-mouseleave",
  "region-click",
  "region-dblclick",
  "region-updated",
  "region-update-end",
  "region-removed",
  "region-play",
];

const REGION_EVENTS: ReadonlyArray<string> = [
  "in",
  "out",
  "remove",
  "update",
  "click",
  "dbclick",
  "over",
  "leave",
];

type Props = {
  isReady: boolean;
  wavesurfer: WaveSurfer;
  regions: {};
};

class Regions extends Component<Props> {
  state = {};

  static defaultProps = {
    regions: [],
  };

  componentDidMount() {
    if (this.props.isReady) {
      this.init.call(this);
    }

    this.props.wavesurfer.on("ready", this.init.bind(this));
  }

  componentWillReceiveProps(nextProps: Props) {
    // only update if the wavesurfer instance has been ready
    if (!this.props.isReady) {
      return;
    }

    // cache reference to old regions
    const oldRegions = Object.create(this.props.wavesurfer.regions.list);

    for (const newRegionId in nextProps.regions) {
      if ({}.hasOwnProperty.call(nextProps.regions, newRegionId)) {
        const newRegion = nextProps.regions[newRegionId];

        // remove from oldRegions
        delete oldRegions[newRegionId];

        // new regions
        if (!this.props.wavesurfer.regions.list[newRegionId]) {
          this.hookUpRegionEvents(nextProps.wavesurfer.addRegion(newRegion));

          // update regions
        } else if (
          oldRegions[newRegionId] &&
          (oldRegions[newRegionId].start !== newRegion.start ||
            oldRegions[newRegionId].end !== newRegion.end)
        ) {
          nextProps.wavesurfer.regions.list[newRegionId].update({
            start: newRegion.start,
            end: newRegion.end,
          });
        }
      }
    }

    // remove any old regions
    for (const oldRegionId in oldRegions) {
      if ({}.hasOwnProperty.call(oldRegions, oldRegionId)) {
        nextProps.wavesurfer.regions.list[oldRegionId].remove();
      }
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    REGION_EVENTS.forEach((e) => {
      this.props.wavesurfer.un(e);
    });
  }

  private init() {
    const { wavesurfer, regions } = this.props;
    let newRegionId;

    REGIONS_EVENTS.forEach((e) => {
      const propCallback = this.props[`on${capitaliseFirstLetter(e)}`];
      if (!propCallback) return;

      wavesurfer.on(e, (...originalArgs) => {
        propCallback({
          wavesurfer,
          originalArgs,
        });
      });
    });

    // add regions and hook up callbacks to region objects
    for (newRegionId in regions) {
      if ({}.hasOwnProperty.call(regions, newRegionId)) {
        this.hookUpRegionEvents(wavesurfer.addRegion(regions[newRegionId]));
      }
    }
  }

  private hookUpRegionEvents(region) {
    REGION_EVENTS.forEach((e) => {
      const propCallback = this.props[
        `onSingleRegion${capitaliseFirstLetter(e)}`
      ];
      const { wavesurfer } = this.props;
      if (propCallback) {
        region.on(e, (...originalArgs) => {
          propCallback({
            wavesurfer,
            originalArgs,
            region,
          });
        });
      }
    });

    region.on("remove", () => {
      REGION_EVENTS.forEach((e) => {
        region.un(e);
      });
    });
  }

  render() {
    return false;
  }
}

export default Regions;
