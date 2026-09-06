export const LIGHTNING_DRAW_SECONDS = 0.9;

const CELL_SIZE = 2;
const STAGE_COUNT = 20;
const cellKey = (x, y) => `${x},${y}`;

// Every turn lands on the same two-unit grid as the surrounding pixel scenery.
// Keep the leaders asymmetric; their forks are authored points on a parent path.
const CHANNELS = [
  [
    { points: [[0, 0], [2, 8], [-6, 18], [-4, 26], [-16, 38], [-12, 48], [-24, 60], [-20, 68], [-34, 82], [-28, 88], [-32, 100], [-42, 112], [-38, 126], [-48, 138], [-44, 150], [-54, 164], [-50, 180], [-60, 194]] },
    { parent: 0, points: [[-16, 38], [-4, 46], [6, 42], [14, 54], [10, 62], [24, 76], [20, 90], [34, 102], [30, 112], [42, 126]] },
    { parent: 1, points: [[14, 54], [28, 56], [36, 64], [46, 68]] },
    { parent: 0, points: [[-32, 100], [-18, 108], [-18, 120], [-2, 128], [-8, 142], [8, 158], [6, 174], [16, 188]] },
    { parent: 0, points: [[-24, 60], [-38, 66], [-38, 80], [-52, 90], [-48, 104]] },
  ],
  [
    { points: [[0, 0], [-4, 12], [6, 22], [4, 32], [18, 46], [12, 58], [26, 70], [22, 82], [36, 96], [30, 108], [42, 124], [36, 138], [50, 150], [46, 166], [56, 180], [52, 196]] },
    { parent: 0, points: [[18, 46], [4, 50], [-6, 44], [-18, 58], [-14, 70], [-30, 82], [-26, 96], [-42, 108], [-38, 122]] },
    { parent: 1, points: [[-18, 58], [-32, 62], [-36, 72], [-48, 78]] },
    { parent: 0, points: [[30, 108], [12, 116], [14, 128], [-4, 140], [0, 154], [-14, 166], [-10, 184]] },
    { parent: 0, points: [[26, 70], [42, 76], [40, 88], [54, 102], [50, 116]] },
  ],
];

function rasterize(points) {
  const cells = [];
  let x = points[0][0] / CELL_SIZE;
  let y = points[0][1] / CELL_SIZE;
  const append = () => cells.push({ x, y, key: cellKey(x, y) });
  append();

  for (const [targetX, targetY] of points.slice(1)) {
    const endX = targetX / CELL_SIZE;
    const endY = targetY / CELL_SIZE;
    const dx = Math.abs(endX - x);
    const dy = Math.abs(endY - y);
    const sx = Math.sign(endX - x);
    const sy = Math.sign(endY - y);
    let error = dx - dy;

    while (x !== endX || y !== endY) {
      const twiceError = 2 * error;
      if (twiceError > -dy) {
        error -= dy;
        x += sx;
        append();
      }
      if (twiceError < dx) {
        error += dx;
        y += sy;
        append();
      }
    }
  }

  return cells;
}

function cellPath({ x, y }) {
  return `M${x * CELL_SIZE} ${y * CELL_SIZE}h${CELL_SIZE}v${CELL_SIZE}h-${CELL_SIZE}z`;
}

function createBolt(x, y, channels) {
  const paths = [];
  for (const { points, parent } of channels) {
    const cells = rasterize(points);
    const fork = parent === undefined ? null : paths[parent].cells.find((cell) => cell.key === cells[0].key);
    const startsAt = fork ? fork.arrival + 1 : 0;
    paths.push({
      fork,
      cells: cells.map((cell, index) => ({ ...cell, arrival: startsAt + index })),
    });
  }

  const lastArrival = Math.max(...paths.map(({ cells }) => cells.at(-1).arrival));
  const core = new Map();
  for (const { cells, fork } of paths) {
    // A side leader starts in the next frame after its junction lights up.
    const firstStage = fork ? fork.stage + 1 : 0;
    for (const cell of cells) {
      cell.stage = Math.min(STAGE_COUNT - 1, Math.max(firstStage, Math.floor(cell.arrival / lastArrival * (STAGE_COUNT - 1))));
      const previous = core.get(cell.key);
      if (!previous || previous.stage > cell.stage) core.set(cell.key, cell);
    }
  }

  const edge = new Map();
  for (const { x: cellX, y: cellY, stage } of core.values()) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const edgeX = cellX + dx;
      const edgeY = cellY + dy;
      const key = cellKey(edgeX, edgeY);
      if (core.has(key)) continue;
      const previous = edge.get(key);
      if (!previous || previous.stage > stage) edge.set(key, { x: edgeX, y: edgeY, stage });
    }
  }

  const stages = Array.from({ length: STAGE_COUNT }, () => ({ core: '', edge: '' }));
  for (const cell of core.values()) stages[cell.stage].core += cellPath(cell);
  // Excluding every final core cell keeps later edges from painting over a leader.
  for (const cell of edge.values()) stages[cell.stage].edge += cellPath(cell);
  return { x, y, stages };
}

export const LIGHTNING_BOLTS = [
  createBolt(104, 108, CHANNELS[0]),
  createBolt(699, 117, CHANNELS[1]),
];
