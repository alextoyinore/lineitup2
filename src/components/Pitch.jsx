import React, { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Path, Arrow, Image } from 'react-konva';

const JERSEY_PATH = "M 9 2 Q 12 5 15 2 L 20 3 L 23 8 L 19 11 L 17 8 L 17 22 L 7 22 L 7 8 L 5 11 L 1 8 L 4 3 Z";
const PATH_WIDTH = 24;
const PATH_HEIGHT = 24;

const PlayerNode = ({ player, width, height, isRecording, updatePlayer, teamColors, onNameClick, onNumberClick, onPositionClick, ui, currentTool, onPlayerDragEnd, isVertical, isSelected, onSelect }) => {
  const groupRef = useRef(null);
  const isFirstRender = useRef(true);

  const absoluteX = isVertical ? (player.relativeY / 100) * width : (player.relativeX / 100) * width;
  const absoluteY = isVertical ? ((100 - player.relativeX) / 100) * height : (player.relativeY / 100) * height;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (groupRef.current) {
      groupRef.current.to({
        x: absoluteX,
        y: absoluteY,
        duration: 1.2,
        easing: Konva.Easings.EaseInOut
      });
    }
  }, [absoluteX, absoluteY]);

  const isBench = player.relativeY > 90;
  const baseScale = Math.min(width, height) * 0.003 * ui.jerseyScaleMult;
  const playerScale = isBench ? baseScale * 0.7 : baseScale;
  const jerseyColor = teamColors[player.team] || '#ffffff';
  const isInteractive = currentTool === 'pointer';

  const handleDragEnd = (e) => {
    if (!isInteractive) return;
    const newRelativeX = isVertical ? 100 - (e.target.y() / height) * 100 : (e.target.x() / width) * 100;
    const newRelativeY = isVertical ? (e.target.x() / width) * 100 : (e.target.y() / height) * 100;
    if (onPlayerDragEnd) {
      onPlayerDragEnd(player, newRelativeX, newRelativeY, e.target.x(), e.target.y());
    } else {
      updatePlayer(player.id, { relativeX: newRelativeX, relativeY: newRelativeY });
    }
  };

  const handleMouseEnter = (e) => {
    if (!isRecording && isInteractive) e.target.getStage().container().style.cursor = 'grab';
  };

  const handleMouseLeave = (e) => {
    e.target.getStage().container().style.cursor = 'default';
  };

  const handleDragStart = (e) => {
    if (!isRecording && isInteractive) e.target.getStage().container().style.cursor = 'grabbing';
  };

  const handleClick = (e) => {
    if (!isInteractive || isRecording) return;
    // Don't trigger if it was a drag
    if (e.target.getStage().isDragging()) return;
    
    onSelect(player.id, e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey);
    // Prevent stage click from clearing
    e.cancelBubble = true;
  };

  return (
    <Group
      ref={groupRef}
      x={isFirstRender.current ? absoluteX : groupRef.current?.x() || absoluteX}
      y={isFirstRender.current ? absoluteY : groupRef.current?.y() || absoluteY}
      draggable={isInteractive}
      listening={isInteractive}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTap={handleClick}
    >
      {isSelected && (
        <Circle
          radius={16 * playerScale}
          fill="transparent"
          stroke="#facc15"
          strokeWidth={2}
          dash={[4, 2]}
          opacity={0.8}
        />
      )}
      <Path
        data={JERSEY_PATH}
        fill={jerseyColor}
        stroke="#000"
        strokeWidth={ui.jerseyHasBorder ? 1 : 0}
        scaleX={playerScale}
        scaleY={playerScale}
        offsetX={PATH_WIDTH / 2}
        offsetY={PATH_HEIGHT / 2}
      />
      {ui.showPositionBadge && (
        <Text
          text={player.positionStr || ''}
          fill={ui.jerseyNumberColor}
          opacity={ui.positionBadgeOpacity}
          fontSize={6 * playerScale}
          fontFamily="Inter"
          fontStyle="bold"
          align="right"
          width={PATH_WIDTH * playerScale}
          offsetX={(PATH_WIDTH * playerScale) / 2 - (6 * playerScale)}
          offsetY={(PATH_HEIGHT * playerScale) / 2 - (18 * playerScale)}
          shadowColor={ui.textHasShadow ? '#000' : 'transparent'}
          shadowBlur={ui.textHasShadow ? 2 : 0}
          onDblClick={(e) => onPositionClick(e, player)}
          onDblTap={(e) => onPositionClick(e, player)}
          onMouseEnter={(e) => { if (isInteractive) { e.cancelBubble = true; e.target.getStage().container().style.cursor = 'text'; } }}
          onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
        />
      )}
      <Text
        text={(player.number ?? '').toString()}
        fill={ui.jerseyNumberColor}
        opacity={ui.jerseyNumberOpacity}
        fontSize={ui.jerseyNumberFontSize * playerScale}
        fontFamily="Outfit"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        width={PATH_WIDTH * playerScale}
        height={PATH_HEIGHT * playerScale}
        offsetX={(PATH_WIDTH * playerScale) / 2}
        offsetY={(PATH_HEIGHT * playerScale) / 2 - (2 * playerScale)}
        shadowColor={ui.textHasShadow ? '#000' : 'transparent'}
        shadowBlur={ui.textHasShadow ? 2 : 0}
        onDblClick={(e) => onNumberClick(e, player)}
        onDblTap={(e) => onNumberClick(e, player)}
        onMouseEnter={(e) => { if (isInteractive) { e.cancelBubble = true; e.target.getStage().container().style.cursor = 'text'; } }}
        onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
      />
      <Text
        text={player.name || ''}
        y={(PATH_HEIGHT / 2) * playerScale + 5}
        fill="#FFFFFF"
        fontSize={ui.playerNameFontSize * playerScale}
        fontFamily="Inter"
        fontStyle="bold"
        align="center"
        width={100}
        offsetX={50}
        shadowColor={ui.textHasShadow ? '#000' : 'transparent'}
        shadowBlur={ui.textHasShadow ? 3 : 0}
        onDblClick={(e) => onNameClick(e, player)}
        onDblTap={(e) => onNameClick(e, player)}
        onMouseEnter={(e) => { if (isInteractive) { e.cancelBubble = true; e.target.getStage().container().style.cursor = 'text'; } }}
        onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
      />

      {/* OVR Badge */}
      {ui.showOvrBadge && player.grade > 0 && (
        <Group x={12 * playerScale} y={-12 * playerScale} opacity={ui.ovrBadgeOpacity}>
          <Circle
            radius={6 * playerScale}
            fill="#1e293b"
            stroke="#facc15"
            strokeWidth={0.5}
            shadowBlur={2}
          />
          <Text
            text={player.grade.toString()}
            fill="#facc15"
            fontSize={5 * playerScale}
            fontFamily="Inter"
            fontStyle="bold"
            align="center"
            verticalAlign="middle"
            width={12 * playerScale}
            height={12 * playerScale}
            offsetX={6 * playerScale}
            offsetY={6 * playerScale}
          />
        </Group>
      )}

      {/* Versatility Indicator (Dot if player has 2+ positions) */}
      {player.positionStr?.includes(',') && (
        <Circle
          x={-12 * playerScale}
          y={-12 * playerScale}
          radius={2 * playerScale}
          fill="#10b981"
          shadowBlur={2}
        />
      )}
    </Group>
  );
};

const BallNode = ({ ball, width, height, ui, updateBall, currentTool, isRecording }) => {
  const groupRef = useRef(null);
  const isVertical = ui.orientation === 'vertical';
  
  const absoluteX = isVertical ? (ball.relativeY / 100) * width : (ball.relativeX / 100) * width;
  const absoluteY = isVertical ? ((100 - ball.relativeX) / 100) * height : (ball.relativeY / 100) * height;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.to({
        x: absoluteX,
        y: absoluteY,
        duration: 1.2,
        easing: Konva.Easings.EaseInOut
      });
    }
  }, [absoluteX, absoluteY]);

  const ballSize = Math.min(width, height) * 0.012;
  const isInteractive = currentTool === 'pointer';

  const handleDragEnd = (e) => {
    const newRelativeX = isVertical ? 100 - (e.target.y() / height) * 100 : (e.target.x() / width) * 100;
    const newRelativeY = isVertical ? (e.target.x() / width) * 100 : (e.target.y() / height) * 100;
    updateBall({ relativeX: newRelativeX, relativeY: newRelativeY });
  };

  return (
    <Group
      ref={groupRef}
      x={absoluteX}
      y={absoluteY}
      draggable={isInteractive}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => { if (isInteractive && !isRecording) e.target.getStage().container().style.cursor = 'grab'; }}
      onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
    >
      <Circle
        radius={ballSize}
        fill="#FFFFFF"
        stroke="#000"
        strokeWidth={0.5}
        shadowBlur={6}
        shadowOpacity={0.4}
      />
      {/* Soccer Ball Pattern (Pentagons) */}
      {[0, 72, 144, 216, 288].map(rot => (
        <Path 
          key={rot}
          data="M 0 -1 L 0.95 -0.31 L 0.59 0.81 L -0.59 0.81 L -0.95 -0.31 Z"
          fill="#000"
          scaleX={ballSize * 0.4}
          scaleY={ballSize * 0.4}
          rotation={rot}
          y={-ballSize * 0.6}
        />
      ))}
      <Path 
        data="M 0 -1 L 0.95 -0.31 L 0.59 0.81 L -0.59 0.81 L -0.95 -0.31 Z"
        fill="#000"
        scaleX={ballSize * 0.45}
        scaleY={ballSize * 0.45}
      />
      {/* Outer seam */}
      <Circle radius={ballSize} stroke="#000" strokeWidth={0.2} opacity={0.2} />
    </Group>
  );
};

const CameraFeed = ({ stream, width, height }) => {
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (stream) {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      videoRef.current = video;

      const layer = imageRef.current?.getLayer();

      const anim = new Konva.Animation(() => {
        // No logic needed, just forcing redraw for the video content
      }, layer);

      anim.start();
      return () => {
        anim.stop();
        video.pause();
        video.srcObject = null;
      };
    }
  }, [stream]);

  return (
    <Group draggable x={width - 180} y={20}>
      <Rect
        width={160}
        height={120}
        fill="#000"
        cornerRadius={8}
        stroke="#fff"
        strokeWidth={2}
        shadowBlur={10}
        shadowOpacity={0.5}
      />
      <Group clipFunc={(ctx) => ctx.rect(0, 0, 160, 120)}>
        <Image
          ref={imageRef}
          image={videoRef.current}
          width={160}
          height={120}
          cornerRadius={8}
        />
      </Group>
    </Group>
  );
};


const Pitch = React.forwardRef(({ 
  players, updatePlayer, ball, updateBall, isRecording, teamColors, ui, currentTool, inkColor, drawings, setDrawings, cameraStream,
  selectedPlayerIds = [], togglePlayerSelection, clearSelection
}, ref) => {
  const containerRef = useRef(null);
  const layerRef = useRef(null);
  
  const getAbsCoords = (relX, relY) => {
    const width = containerRef.current?.offsetWidth || 800;
    const height = containerRef.current?.offsetHeight || 500;
    const isVertical = width < height;
    if (isVertical) {
      return {
        x: (relY / 100) * width,
        y: ((100 - relX) / 100) * height
      };
    }
    return {
      x: (relX / 100) * width,
      y: (relY / 100) * height
    };
  };

  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [editingNode, setEditingNode] = useState(null);
  const isDrawingRef = useRef(false);
  const [activePolyPoints, setActivePolyPoints] = useState([]); // Array of {x, y} relative
  const [ghostPoint, setGhostPoint] = useState(null); // {x, y} relative
  const canvasMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (ref && layerRef.current) {
      ref.current = {
        getCanvas: () => layerRef.current.getNativeCanvasElement(),
        getStage: () => layerRef.current.getStage()
      };
    }
  }, [ref]);

  useEffect(() => {
    let timeoutId;
    const updateSize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight
          });
        }
      }, 50);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { observer.disconnect(); clearTimeout(timeoutId); };
  }, []);

  const { width, height } = dimensions;
  const isVertical = width < height;

  // Use a smaller pitch height if substitute area is enabled to leave room at the bottom
  const pitchHeightModifier = ui.showSubsArea ? 0.90 : 1;
  const pHeight = height * pitchHeightModifier;

  const pitchBgColors = [ui.pitchColor1, ui.pitchColor2];
  const lineColor = ui.pitchLineColor;
  const strokeWidth = ui.lineThickness;
  const lineOpacity = 0.8;
  const midX = width / 2;
  const midY = isVertical ? height / 2 : pHeight / 2;

  const pWidth = isVertical ? width : width; // Placeholder, for clarity
  const pitchVisualHeight = isVertical ? height : pHeight;

  // MARKING CALCULATIONS
  // If vertical: X (width) handles the 0-100 Width (sidelines), Y (height) handles the 0-100 Length (goals)
  const penBoxLen = (isVertical ? height : width) * 0.16;
  const penBoxWid = (isVertical ? width : height) * 0.44;
  const goalBoxLen = (isVertical ? height : width) * 0.05;
  const goalBoxWid = (isVertical ? width : height) * 0.2;
  const centerCircleRad = (isVertical ? width : width) * 0.09;

  const numStripes = 10;
  const stripes = useMemo(() => {
    if (isVertical) {
      const stripeHeight = height / numStripes;
      return Array.from({ length: numStripes }).map((_, i) => (
        <Rect key={`stripe-${i}`} x={0} y={i * stripeHeight} width={width} height={stripeHeight} fill={pitchBgColors[i % 2]} />
      ));
    } else {
      const stripeWidth = width / numStripes;
      return Array.from({ length: numStripes }).map((_, i) => (
        <Rect key={`stripe-${i}`} x={i * stripeWidth} y={0} width={stripeWidth} height={pHeight} fill={pitchBgColors[i % 2]} />
      ));
    }
  }, [width, height, pHeight, pitchBgColors, isVertical]);

  const hexToRgba = (hex, alpha) => {
    const validHex = /^#([0-9A-F]{3}){1,2}$/i.test(hex) ? hex : '#FFFFFF';
    let r = 0, g = 0, b = 0;
    if (validHex.length === 4) {
      r = parseInt(validHex[1] + validHex[1], 16);
      g = parseInt(validHex[2] + validHex[2], 16);
      b = parseInt(validHex[3] + validHex[3], 16);
    } else if (validHex.length === 7) {
      r = parseInt(validHex.slice(1, 3), 16);
      g = parseInt(validHex.slice(3, 5), 16);
      b = parseInt(validHex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleNameClick = (e, player) => {
    const pos = e.target.getAbsolutePosition();
    setEditingNode({ id: player.id, type: 'name', value: player.name, x: pos.x, y: pos.y });
  };
  const handleNumberClick = (e, player) => {
    const pos = e.target.getAbsolutePosition();
    setEditingNode({ id: player.id, type: 'number', value: player.number, x: pos.x, y: pos.y });
  };
  const handlePositionClick = (e, player) => {
    const pos = e.target.getAbsolutePosition();
    setEditingNode({ id: player.id, type: 'position', value: player.positionStr, x: pos.x, y: pos.y });
  };

  const saveEdit = (val) => {
    if (editingNode) {
      if (editingNode.type === 'name') updatePlayer(editingNode.id, { name: val });
      else if (editingNode.type === 'number') updatePlayer(editingNode.id, { number: val });
      else updatePlayer(editingNode.id, { positionStr: val });
    }
    setEditingNode(null);
  };

  const handlePlayerDragEnd = (draggedPlayer, newRelX, newRelY, absX, absY) => {
    const swapThreshold = Math.min(width, height) * 0.05; // 5% of screen
    let swapped = false;
    for (const p of players) {
      if (p.id !== draggedPlayer.id && p.team === draggedPlayer.team) {
        const pAbsX = isVertical ? (p.relativeY / 100) * width : (p.relativeX / 100) * width;
        const pAbsY = isVertical ? ((100 - p.relativeX) / 100) * height : (p.relativeY / 100) * height;
        const dist = Math.hypot(absX - pAbsX, absY - pAbsY);

        if (dist < swapThreshold) {
          // Swap positions
          updatePlayer(draggedPlayer.id, { relativeX: p.relativeX, relativeY: p.relativeY });
          updatePlayer(p.id, { relativeX: draggedPlayer.relativeX, relativeY: draggedPlayer.relativeY });
          swapped = true;
          break;
        }
      }
    }

    if (!swapped) {
      updatePlayer(draggedPlayer.id, { relativeX: newRelX, relativeY: newRelY });
    }
  };

  const handleStageMouseDown = (e) => {
    if (currentTool === 'pointer') {
      // If clicking the stage (not a player), clear selection
      if (e.target === e.target.getStage()) {
        clearSelection?.();
      }
      return;
    }
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relX = isVertical ? 100 - (pos.y / height) * 100 : (pos.x / width) * 100;
    const relY = isVertical ? (pos.x / width) * 100 : (pos.y / height) * 100;

    if (currentTool === 'polygon') {
      // Check if clicking near the first point to close
      if (activePolyPoints.length >= 3) {
        const firstPoint = activePolyPoints[0];
        const dist = Math.hypot(relX - firstPoint.x, relY - firstPoint.y);
        // If within 2% of the stage width, close it
        if (dist < 2) {
          finishPolygon();
          return;
        }
      }
      setActivePolyPoints([...activePolyPoints, { x: relX, y: relY }]);
      return;
    }

    isDrawingRef.current = true;
    setDrawings([...drawings, {
      tool: currentTool,
      color: inkColor,
      hasFill: ui.zoneHasFill,
      points: [relX, relY, relX, relY]
    }]);
  };

  const finishPolygon = () => {
    if (activePolyPoints.length < 3) {
      setActivePolyPoints([]);
      setGhostPoint(null);
      return;
    }

    // Flatten points for the drawings array
    const flatPoints = activePolyPoints.reduce((acc, p) => [...acc, p.x, p.y], []);

    setDrawings([...drawings, {
      tool: 'polygon',
      color: inkColor,
      hasFill: ui.zoneHasFill,
      points: flatPoints
    }]);

    setActivePolyPoints([]);
    setGhostPoint(null);
  };

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const relX = isVertical ? 100 - (pos.y / height) * 100 : (pos.x / width) * 100;
    const relY = isVertical ? (pos.x / width) * 100 : (pos.y / height) * 100;
    canvasMousePos.current = { x: relX, y: relY };

    if (currentTool === 'polygon') {
      if (activePolyPoints.length > 0) {
        setGhostPoint({ x: relX, y: relY });
      }
      return;
    }

    if (currentTool === 'pointer' || !isDrawingRef.current) return;

    setDrawings(prevDrawings => {
      let lastLine = { ...prevDrawings[prevDrawings.length - 1] };
      if (lastLine.tool === 'circle' || lastLine.tool === 'rect') {
        lastLine.points = [lastLine.points[0], lastLine.points[1], relX, relY];
      } else {
        lastLine.points = lastLine.points.concat([relX, relY]);
      }
      prevDrawings.splice(prevDrawings.length - 1, 1, lastLine);
      return [...prevDrawings];
    });
  };

  const handleStageMouseUp = () => { isDrawingRef.current = false; };

  const handleStageDblClick = () => {
    if (currentTool === 'polygon' && activePolyPoints.length >= 3) {
      finishPolygon();
    }
  };

  return (
    <div className="pitch-boundary" style={{ borderRadius: '0', border: 'none', cursor: currentTool !== 'pointer' ? 'crosshair' : 'default' }} ref={containerRef}>

      {editingNode && (
        <input
          autoFocus
          value={editingNode.value}
          onChange={(e) => setEditingNode({ ...editingNode, value: e.target.value })}
          onBlur={(e) => saveEdit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(e.target.value); }}
          style={{ position: 'absolute', top: editingNode.y + 'px', left: editingNode.x + 'px', transform: 'translate(-50%, -50%)', background: 'white', border: '2px solid #000', borderRadius: '4px', padding: '2px 4px', fontSize: '14px', fontFamily: 'Inter', fontWeight: 'bold', textAlign: 'center', color: '#000', width: '80px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        />
      )}

      <Stage width={width} height={height} onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onDblClick={handleStageDblClick} onTouchStart={handleStageMouseDown} onTouchMove={handleStageMouseMove} onTouchEnd={handleStageMouseUp}>
        <Layer ref={layerRef}>
          {stripes}

          {/* Main Pitch Bounds */}
          <Rect x={10} y={10} width={width - 20} height={pitchVisualHeight - 20} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />

          {/* Center Line & Circles */}
          {isVertical ? (
            <Line points={[10, midY, width - 10, midY]} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
          ) : (
            <Line points={[midX, 10, midX, pHeight - 10]} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
          )}

          <Circle x={midX} y={midY} radius={centerCircleRad} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
          <Circle x={midX} y={midY} radius={strokeWidth * 1.5} fill={lineColor} opacity={lineOpacity} />

          {/* Penalty Areas */}
          {isVertical ? (
            <>
              {/* Top Goal Area (Away) */}
              <Rect x={(width - penBoxWid) / 2} y={10} width={penBoxWid} height={penBoxLen} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Rect x={(width - goalBoxWid) / 2} y={10} width={goalBoxWid} height={goalBoxLen} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Circle x={midX} y={10 + penBoxLen} radius={centerCircleRad * 0.8} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} clipFunc={(ctx) => { ctx.rect(0, 10 + penBoxLen, width, height); }} />

              {/* Bottom Goal Area (Home) */}
              <Rect x={(width - penBoxWid) / 2} y={pitchVisualHeight - 10 - penBoxLen} width={penBoxWid} height={penBoxLen} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Rect x={(width - goalBoxWid) / 2} y={pitchVisualHeight - 10 - goalBoxLen} width={goalBoxWid} height={goalBoxLen} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Circle x={midX} y={pitchVisualHeight - 10 - penBoxLen} radius={centerCircleRad * 0.8} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} clipFunc={(ctx) => { ctx.rect(0, 0, width, pitchVisualHeight - 10 - penBoxLen); }} />
            </>
          ) : (
            <>
              {/* Left Goal Area (Home) */}
              <Rect x={10} y={(pHeight - penBoxWid) / 2} width={penBoxLen} height={penBoxWid} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Rect x={10} y={(pHeight - goalBoxWid) / 2} width={goalBoxLen} height={goalBoxWid} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Circle x={10 + penBoxLen} y={midY} radius={centerCircleRad * 0.8} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} clipFunc={(ctx) => { ctx.rect(10 + penBoxLen, 0, width, pHeight); }} />

              {/* Right Goal Area (Away) */}
              <Rect x={width - 10 - penBoxLen} y={(pHeight - penBoxWid) / 2} width={penBoxLen} height={penBoxWid} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Rect x={width - 10 - goalBoxLen} y={(pHeight - goalBoxWid) / 2} width={goalBoxLen} height={goalBoxWid} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} />
              <Circle x={width - 10 - penBoxLen} y={midY} radius={centerCircleRad * 0.8} stroke={lineColor} strokeWidth={strokeWidth} opacity={lineOpacity} clipFunc={(ctx) => { ctx.rect(0, 0, width - 10 - penBoxLen, pHeight); }} />
            </>
          )}

          {/* Substitute Bench */}
          {ui.showSubsArea && (
            <Group x={0} y={pitchVisualHeight}>
              <Rect width={width} height={height - pitchVisualHeight} fill="#111827" />
              <Line points={[0, 0, width, 0]} stroke="#FFFFFF" strokeWidth={4} opacity={0.6} dash={[10, 10]} />
              <Text x={15} y={15} text="BENCH" fill="#FFF" opacity={0.3} fontSize={16} fontFamily="Outfit" fontStyle="bold" />
            </Group>
          )}

          {/* Vectors & Zones */}
          {drawings && drawings.map((line, i) => {
            const isFilled = line.hasFill;
            const dynamicFill = isFilled ? hexToRgba(line.color, 0.35) : 'transparent';

            // Map relative points back to absolute pixels
            const absPoints = line.points.map((p, idx) => {
              if (isVertical) {
                // line.points is [relX1, relY1, relX2, relY2, ...]
                // For vertical, absX = relY * width, absY = (100 - relX) * height
                return idx % 2 === 0 
                  ? (line.points[idx + 1] / 100 * width) 
                  : ((100 - line.points[idx - 1]) / 100 * height);
              }
              return idx % 2 === 0 ? (p / 100 * width) : (p / 100 * height);
            });

            if (line.tool === 'circle') {
              const radius = Math.sqrt(Math.pow(absPoints[2] - absPoints[0], 2) + Math.pow(absPoints[3] - absPoints[1], 2));
              return <Circle key={i} x={absPoints[0]} y={absPoints[1]} radius={radius} stroke={line.color} strokeWidth={ui.lineThickness} fill={dynamicFill} />;
            }
            if (line.tool === 'rect') {
              return <Rect key={i} x={Math.min(absPoints[0], absPoints[2])} y={Math.min(absPoints[1], absPoints[3])} width={Math.abs(absPoints[2] - absPoints[0])} height={Math.abs(absPoints[3] - absPoints[1])} stroke={line.color} strokeWidth={ui.lineThickness} fill={dynamicFill} />;
            }
            if (line.tool === 'dashed_arrow') {
              return <Arrow key={i} points={absPoints} stroke={line.color} strokeWidth={ui.lineThickness + 2} dash={[15, 10]} fill={line.color} tension={0.5} lineCap="round" lineJoin="round" pointerLength={15} pointerWidth={15} />;
            }
            if (line.tool === 'arrow') {
              return <Arrow key={i} points={absPoints} stroke={line.color} strokeWidth={ui.lineThickness + 2} fill={line.color} tension={0.5} lineCap="round" lineJoin="round" pointerLength={15} pointerWidth={15} />;
            }
            if (line.tool === 'polygon') {
              return <Line key={i} points={absPoints} closed fill={dynamicFill} stroke={line.color} strokeWidth={ui.lineThickness} tension={0.2} />;
            }
            return <Line key={i} points={absPoints} stroke={line.color} strokeWidth={ui.lineThickness + 2} tension={0.5} lineCap="round" lineJoin="round" />;
          })}

          {/* Active Polygon Preview */}
          {activePolyPoints.length > 0 && (
            <Group>
              <Line
                points={activePolyPoints.reduce((acc, p) => {
                  const coords = getAbsCoords(p.x, p.y);
                  return [...acc, coords.x, coords.y];
                }, ghostPoint ? (() => {
                  const coords = getAbsCoords(ghostPoint.x, ghostPoint.y);
                  return [coords.x, coords.y];
                })() : [])}
                stroke={inkColor}
                strokeWidth={ui.lineThickness}
                dash={[10, 5]}
              />
              {activePolyPoints.map((p, idx) => {
                const coords = getAbsCoords(p.x, p.y);
                return (
                  <Circle
                    key={idx}
                    x={coords.x}
                    y={coords.y}
                    radius={idx === 0 ? 6 : 4}
                    fill={idx === 0 ? "#fff" : inkColor}
                    stroke={inkColor}
                    strokeWidth={2}
                  />
                );
              })}
            </Group>
          )}

          {ui.showBall && ball && (
            <BallNode 
              ball={ball} 
              width={width} 
              height={height} 
              ui={ui}
              updateBall={updateBall}
              currentTool={currentTool}
              isRecording={isRecording}
            />
          )}

          {players.filter(p => ui.showSubsArea || p.relativeY <= 90).map(player => (
            <PlayerNode 
              key={player.id} 
              player={player} 
              width={width} 
              height={height} 
              updatePlayer={updatePlayer} 
              isRecording={isRecording} 
              teamColors={teamColors} 
              onNameClick={handleNameClick} 
              onNumberClick={handleNumberClick} 
              onPositionClick={handlePositionClick} 
              ui={ui} 
              currentTool={currentTool} 
              onPlayerDragEnd={handlePlayerDragEnd} 
              isVertical={isVertical}
              isSelected={selectedPlayerIds.includes(player.id)}
              onSelect={togglePlayerSelection}
            />
          ))}

          {cameraStream && (
            <CameraFeed stream={cameraStream} width={width} height={height} />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

export default Pitch;
