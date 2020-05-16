import {VGA} from './VGA';

export interface Renderable {
  render(ctx: CanvasRenderingContext2D): void;
}

/**
 * Class that renders VGA memory into canvas
 *
 * @export
 * @class VGACanvasRenderer
 * @implements {Renderable}
 */
export class VGACanvasRenderer implements Renderable {
  constructor(
    public readonly vga: VGA,
  ) {}

  render(ctx: CanvasRenderingContext2D): void {
    const {width, height} = ctx.canvas;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }
}
