react-wavesurfer.js
================

![Test](https://github.com/amilajack/react-wavesurfer/workflows/Test/badge.svg)
[![NPM version](https://badge.fury.io/js/react-wavesurfer.js.svg)](http://badge.fury.io/js/react-wavesurfer.js)
[![Dependency Status](https://img.shields.io/david/amilajack/react-wavesurfer.js.svg)](https://david-dm.org/amilajack/react-wavesurfer.js)
[![npm](https://img.shields.io/npm/dm/react-wavesurfer.js.svg)](https://npm-stat.com/charts.html?package=react-wavesurfer.js)

## Installation

```bash
# NPM
npm install wavesurfer.js react-wavesurfer.js
# Yarn
yarn add wavesurfer.js react-wavesurfer.js
```

## Basic Usage

```tsx
import React, { useState } from 'react';
import Wavesurfer from 'react-wavesurfer';

function MyWaveform() {
  const [position, setPosition] = useState(0);
  const [muted, setMuted] = useState(false);

  const handlePositionChange = (position) => { /* ... */ };
  const onReady = () => console.log('done loading!');

  return (
    <Wavesurfer
      src="path/to/audio/file.mp3"
      position={position}
      onPositionChange={handlePositionChange}
      onReady={onReady}
      playing={playing}
      muted={muted}
    />
  );
}
```

## Zooming

```tsx
import React, { useState } from 'react';
import Wavesurfer from 'react-wavesurfer';

function MyWaveform() {
  const [zoomLevel, setZoomLevel] = useState(0);

  const handleInput = (e) => {
    setZoomLevel(e.value)
  };

  return (
    <>
      <input
        type="range"
        min="1"
        max="100"
        value="0"
        onInput={handleInput}
      />
      <Wavesurfer
        src="path/to/audio/file.mp3"
        zoomLevel={zoomLevel}
      />
    </>
  );
}
```

## MiniMap and Timeline

```tsx
import React, { useState } from 'react';
import Wavesurfer from 'react-wavesurfer';
import MiniMap from 'react-wavesurfer/plugins/minimap';
import Timeline from 'react-wavesurfer/plugins/timeline';

function MyWaveform() {
  return (
    <Wavesurfer
      src="path/to/audio/file.mp3"
      zoomLevel={zoomLevel}
    >
      <MiniMap
        height={30}
        waveColor="#ddd"
        progressColor="#999"
        cursorColor="#999"
      />
      <Timeline
        height={100}
        primaryColor="green"
      />
    </>
  );
}
```
