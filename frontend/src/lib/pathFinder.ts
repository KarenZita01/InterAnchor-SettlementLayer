export interface Anchor {
  id: string;
  name: string;
  domain: string;
  supportedAssets: string[];
}

export interface LiquidityPool {
  id: number;
  assetA: string;
  anchorA: string;
  assetB: string;
  anchorB: string;
  reserveA: bigint;
  reserveB: bigint;
  feeBps: number;
  isActive: boolean;
}

export interface SwapPath {
  sourceAsset: string;
  sourceAnchor: string;
  targetAsset: string;
  targetAnchor: string;
  hops: SwapHop[];
  estimatedRate: number;
  totalFee: number;
  priceImpactBps: number;
  estimatedAmountOut?: bigint;
}

export interface SwapHop {
  poolId: number;
  assetIn: string;
  anchorIn: string;
  assetOut: string;
  anchorOut: string;
  amountIn: bigint;
  estimatedAmountOut: bigint;
  fee: bigint;
}

export interface PathFinderConfig {
  maxHops: number;
  maxSlippageBps: number;
  pools: LiquidityPool[];
}

export class PathFinder {
  private config: PathFinderConfig;

  constructor(config: PathFinderConfig) {
    this.config = config;
  }

  findOptimalPath(
    sourceAsset: string,
    sourceAnchor: string,
    targetAsset: string,
    targetAnchor: string,
    amountIn: bigint
  ): SwapPath | null {
    if (sourceAsset === targetAsset && sourceAnchor === targetAnchor) {
      return {
        sourceAsset,
        sourceAnchor,
        targetAsset,
        targetAnchor,
        hops: [],
        estimatedRate: 1,
        totalFee: 0,
        priceImpactBps: 0,
      };
    }

    const graph = this.buildGraph();
    const paths = this.findAllPaths(
      graph,
      `${sourceAsset}:${sourceAnchor}`,
      `${targetAsset}:${targetAnchor}`,
      this.config.maxHops
    );

    if (paths.length === 0) {
      return null;
    }

    let bestPath: SwapPath | null = null;
    let bestOutput = BigInt(0);

    for (const path of paths) {
      const result = this.evaluatePath(path, amountIn);
      if (result && result.estimatedAmountOut !== undefined && result.estimatedAmountOut > bestOutput) {
        bestOutput = result.estimatedAmountOut;
        bestPath = result;
      }
    }

    return bestPath;
  }

  private buildGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const pool of this.config.pools) {
      if (!pool.isActive) continue;

      const nodeA = `${pool.assetA}:${pool.anchorA}`;
      const nodeB = `${pool.assetB}:${pool.anchorB}`;

      if (!graph.has(nodeA)) graph.set(nodeA, []);
      if (!graph.has(nodeB)) graph.set(nodeB, []);

      graph.get(nodeA)!.push(nodeB);
      graph.get(nodeB)!.push(nodeA);
    }

    return graph;
  }

  private findAllPaths(
    graph: Map<string, string[]>,
    start: string,
    end: string,
    maxHops: number
  ): string[][] {
    const allPaths: string[][] = [];
    const visited = new Set<string>();

    const dfs = (current: string, path: string[], hops: number) => {
      if (hops > maxHops) return;
      if (current === end) {
        allPaths.push([...path]);
        return;
      }

      visited.add(current);
      const neighbors = graph.get(current) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          path.push(neighbor);
          dfs(neighbor, path, hops + 1);
          path.pop();
        }
      }

      visited.delete(current);
    };

    dfs(start, [start], 0);
    return allPaths;
  }

  private evaluatePath(path: string[], amountIn: bigint): SwapPath | null {
    if (path.length < 2) return null;

    const hops: SwapHop[] = [];
    let currentAmount = amountIn;
    let totalFee = BigInt(0);

    for (let i = 0; i < path.length - 1; i++) {
      const [assetIn, anchorIn] = path[i].split(':');
      const [assetOut, anchorOut] = path[i + 1].split(':');

      const pool = this.findPool(assetIn, anchorIn, assetOut, anchorOut);
      if (!pool) return null;

      const fee = (currentAmount * BigInt(pool.feeBps)) / BigInt(10000);
      const amountAfterFee = currentAmount - fee;

      let amountOut: bigint;
      if (pool.assetA === assetIn && pool.anchorA === anchorIn) {
        amountOut = (amountAfterFee * pool.reserveB) / (pool.reserveA + amountAfterFee);
      } else {
        amountOut = (amountAfterFee * pool.reserveA) / (pool.reserveB + amountAfterFee);
      }

      hops.push({
        poolId: pool.id,
        assetIn,
        anchorIn,
        assetOut,
        anchorOut,
        amountIn: currentAmount,
        estimatedAmountOut: amountOut,
        fee,
      });

      totalFee += fee;
      currentAmount = amountOut;
    }

    const estimatedRate = Number(currentAmount) / Number(amountIn);
    const priceImpactBps = Number((BigInt(10000) - (currentAmount * BigInt(10000)) / amountIn));

    return {
      sourceAsset: path[0].split(':')[0],
      sourceAnchor: path[0].split(':')[1],
      targetAsset: path[path.length - 1].split(':')[0],
      targetAnchor: path[path.length - 1].split(':')[1],
      hops,
      estimatedRate,
      totalFee: Number(totalFee),
      priceImpactBps,
    };
  }

  private findPool(
    assetA: string,
    anchorA: string,
    assetB: string,
    anchorB: string
  ): LiquidityPool | null {
    return this.config.pools.find(
      (p) =>
        (p.assetA === assetA && p.anchorA === anchorA && p.assetB === assetB && p.anchorB === anchorB) ||
        (p.assetA === assetB && p.anchorA === anchorB && p.assetB === assetA && p.anchorB === anchorA)
    ) || null;
  }

  getBestRate(
    sourceAsset: string,
    sourceAnchor: string,
    targetAsset: string,
    targetAnchor: string,
    amounts: bigint[]
  ): { amount: bigint; rate: number } | null {
    let bestResult: { amount: bigint; rate: number } | null = null;

    for (const amount of amounts) {
      const path = this.findOptimalPath(sourceAsset, sourceAnchor, targetAsset, targetAnchor, amount);
      if (path && path.estimatedAmountOut !== undefined && path.estimatedAmountOut > BigInt(0)) {
        const rate = Number(path.estimatedAmountOut) / Number(amount);
        if (!bestResult || rate > bestResult.rate) {
          bestResult = { amount, rate };
        }
      }
    }

    return bestResult;
  }
}
