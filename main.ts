class Vector2D {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vector2D(0, 0); // Handle zero vector case
    }
    return new Vector2D(this.x / mag, this.y / mag);
  }

  dotProduct(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  crossProduct(other: Vector2D): number {
    return this.x * other.y - this.y * other.x;
  }

  distanceTo(other: Vector2D): number {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  angleTo(other: Vector2D): number {
    const dot = this.dotProduct(other);
    const magProduct = this.magnitude() * other.magnitude();
    return Math.acos(dot / magProduct);
  }

  projectOnto(other: Vector2D): Vector2D {
    const mag = other.magnitude();
    const scalarProjection = this.dotProduct(other) / (mag * mag);
    return other.normalize().scale(scalarProjection);
  }

  rotate(angle: number): Vector2D {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const newX = this.x * cosAngle - this.y * sinAngle;
    const newY = this.x * sinAngle + this.y * cosAngle;
    return new Vector2D(newX, newY);
  }

  perpendicularTo(clockwise: boolean = false): Vector2D {
    const sign = clockwise ? 1 : -1;
    return new Vector2D(-sign * this.y, sign * this.x);
  }

  equals(other: Vector2D): boolean {
    return this.x === other.x && this.y === other.y;
  }

  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x,
      this.y + other.y);
  }

  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2D {
    if (scalar === 0) {
      throw new Error("Division by zero");
    }
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  getAngle(): number {
    return Math.atan2(this.y, this.x);
  }

  getDirection(): Vector2D {
    return this.normalize();
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  scale(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }
}

const collisions = {
  level_1: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0],
    [0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0],
    [0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0],
    [0, 292, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0],
    [0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
}

class RectangleHitbox {
  pos: Vector2D;
  vel: Vector2D;
  width: number;
  height: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.pos = new Vector2D(0, 0);
    this.vel = new Vector2D(0, 0);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  update() {
    this.pos = this.pos.add(this.vel);
  }

}

interface PlayerOptions {
  width: number
  height: number
  jumpFactor: number
  speedFactor: number
}

class Player extends RectangleHitbox {
  jumpFactor: number;
  speedFactor: number;

  constructor(args: PlayerOptions) {
    super(args.width, args.height);
    this.jumpFactor = args.jumpFactor;
    this.speedFactor = args.speedFactor;
  }

  stop() {
    this.vel = this.vel.multiply(0);
  }

  move(direction: string) {
    switch (direction) {
      case 'ArrowLeft':
        this.vel.x = -this.speedFactor
        break;
      case 'ArrowRight':
        this.vel.x = this.speedFactor
        break;
    }
  }

  jump() {
    if (this.vel.y == 0) {
      this.vel = this.vel.add(new Vector2D(0, this.jumpFactor));
    }
  }
}

interface TilesOptions {
  xCount: number
  yCount: number
  width: number // assuming squares only
  flag: number  // number used to identify a collision block.
}
interface SpriteOptions {
  x: number
  y: number
  image: ImageOptions
  tiles: TilesOptions
}

interface ImageOptions {
  src: string;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
}

class Sprite {
  pos: Vector2D;
  image: CanvasImageSource;
  imageOptions: ImageOptions;
  loaded: boolean;
  tiles: TilesOptions;

  constructor(args: SpriteOptions) {
    this.pos = new Vector2D(args.x, args.y);
    this.image = new Image();
    this.image.src = args.image.src;
    this.image.onload = () => {
      this.loaded = true
    }
    this.imageOptions = {
      src: args.image.src,
      sw: args.image.sw,
      sh: args.image.sh,
      dw: args.image.dw,
      dh: args.image.dh
    }
    this.tiles = args.tiles;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.loaded) return // Skip if not loaded
    let img = this.image as HTMLImageElement;
    let w = this.imageOptions.dw || img.width;
    let h = this.imageOptions.dh || img.height;
    ctx.drawImage(
      this.image,
      this.pos.x, this.pos.y,
      w, h);
  }
}


class CollisionBlock {
  pos: Vector2D;
  w: number;
  h: number;
  constructor(x: number, y: number, w: number, h: number){
    this.pos = new Vector2D(x, y);
    this.w = w;
    this.h = h;
  }
  draw(ctx: CanvasRenderingContext2D){
    ctx.rect(this.pos.x, this.pos.y, this.w, this.h);
    ctx.stroke();
  }
}


interface GameEngineOptions {
  gravity: number
  scale?: number
}

interface Debug {
  isOn: boolean
  fps: string
  timer: number
}


const ONE_SECOND = 1000;

class GameEngine {
  canvas: HTMLCanvasElement;
  gravity: Vector2D;
  player: Player;
  background: Sprite;
  debug: Debug
  blocks: Array<CollisionBlock>;

  constructor(canvas: HTMLCanvasElement, args: GameEngineOptions) {
    this.canvas = canvas;
    this.gravity = new Vector2D(0, args.gravity);
    this.player = new Player({
      width: 50,
      height: 50,
      jumpFactor: -15,
      speedFactor: 2
    });
    this.debug = {
      isOn: true,
      timer: 0,
      fps: '0'
    }
    this.background = new Sprite({
      x: 0, 
      y: 0,
      image: {
        src: './img/backgroundLevel1.png',
        sw: 1024,
        sh: 576,
        dw: this.canvas.width,
        dh: this.canvas.height,
      },
      tiles: {
        xCount: 16,
        yCount: 9,
        width: 64,
        flag: 292
      }
    })
    
    this.blocks = new Array<CollisionBlock>();
    this.initCollisionBlocks();

    window.addEventListener('keydown', e => this.handleKeyPressed(e));
    window.addEventListener('keyup', e => this.handleKeyReleased(e));
  }

  initCollisionBlocks(){
    // loop through the 2D array in columns and rows
    for(let col = 0; col < this.background.tiles.xCount; col++){
      for(let row = 0; row < this.background.tiles.yCount; row++){
        // Get an entry value
        let block = collisions.level_1[row][col];
        // Calculate the ratio of the image and the canvas (makes window responsive)
        let xRatio = this.canvas.width / this.background.imageOptions.sw;
        let yRatio = this.canvas.height / this.background.imageOptions.sh;
        let tileW = this.background.tiles.width;
        let x = Math.floor(tileW * col * xRatio); // x position
        let y = Math.floor(tileW * row * yRatio); // y position
        let w = Math.floor(tileW * xRatio);       // w 
        let h = Math.floor(tileW * yRatio);       // h 
        if(block === this.background.tiles.flag){
          this.blocks.push(new CollisionBlock(x, y, w, h));
        }
      }
    }
  }

  handleKeyReleased(e: KeyboardEvent) {
    const LEFT = 'ArrowLeft';
    const RIGHT = 'ArrowRight';
    if (e.key == RIGHT || e.key == LEFT) {
      this.player.stop();
    }
  }

  handleKeyPressed(e: KeyboardEvent) {
    const SPACE = ' ';
    const LEFT = 'ArrowLeft';
    const RIGHT = 'ArrowRight';
    const D = 'd';
    if (e.key == SPACE) {
      this.player.jump();
    }
    if (e.key == RIGHT) {
      this.player.move(RIGHT);
    }
    if (e.key == LEFT) {
      this.player.move(LEFT);
    }
    if (e.key == D) {
      this.debug.isOn = !this.debug.isOn // toggle debug mode
      console.log(this);
    }
  }

  checkCanvasCollision(p: Player) {
    let playerSides = {
      left: p.pos.x,
      right: p.pos.x + p.width,
      up: p.pos.y,
      down: p.pos.y + p.height
    }
    let hasHitLeftSide = playerSides.left <= 0;
    let hasHitUpSide = playerSides.up <= 0;
    let hasHitRightSide = playerSides.right >= this.canvas.width;
    let hasHitDownSide = playerSides.down >= this.canvas.height;
    if (hasHitLeftSide) {
      this.player.pos.x = 0;
      this.player.vel.x = 0;
    }
    if (hasHitUpSide) {
      this.player.vel.y = 0;
      this.player.pos.y = 0;
    }
    if (hasHitRightSide) {
      this.player.vel.x = 0;
      this.player.pos.x = this.canvas.width - this.player.width;
    }
    if (hasHitDownSide) {
      this.player.vel.y = 0;
      this.player.pos.y = this.canvas.height - this.player.height;
    }
  }

  applyGravity(body: Player) {
    let bottom = body.pos.y + body.height;
    if (bottom < this.canvas.height) {
      body.vel = body.vel.add(this.gravity);
    } else {
      /**
       * Should only set vel.y to 0; Leave vel.x unchanged.
       */
      body.vel.y = 0;
      /**
      Y-vel may contain more pixels than the diference between
      the bottom side of the player and the canvas height, making the player sink below y-axis.
      To prevent this, we manually set the player position on the ground.
      */
      body.pos.y = this.canvas.height - body.height;
    }
  }

  render(ctx: CanvasRenderingContext2D, deltaTime: number): void {
    // Add deltaTime to timer;
    this.debug.timer += deltaTime;

    /**
     * Background
     */
    this.background.draw(ctx);
    
    // collision blocks (64 x 64 but consider scale of 0.8)
    if(this.debug.isOn) {
      for(let block of this.blocks){
        block.draw(ctx)
      }
    }
    

    /**
     * [Debug mode]
     * Draw FPS indicator; Updates every second.
     */
    if (this.debug.isOn) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.fillText(`[ ${this.debug.fps} fps ]`, 10, 10);
      ctx.restore();

      if (this.debug.timer >= ONE_SECOND) {
        this.debug.fps = (1000 / deltaTime).toFixed();
        this.debug.timer = 0; // reset timer
      }
    }

    /**
     * Player
     */
    this.player.draw(ctx);
    this.player.update();
    this.checkCanvasCollision(this.player);
    this.applyGravity(this.player);

  }

}


function animate() {
  // Once all HTML and images are loaded
  window.addEventListener('load', () => {
    let scale = 0.8;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    // Get the browser window dimensions (not more than 80%)
    const windowWidth = window.innerWidth * scale;
    const windowHeight = window.innerHeight * scale;
    const aspectRatio = 16 / 9;

    // Calculate the maximum dimensions while maintaining the aspect ratio
    let canvasWidth: number, canvasHeight: number;
    if (windowWidth / windowHeight > aspectRatio) {
      // If window is wider than the aspect ratio
      canvasWidth = windowHeight * aspectRatio;
      canvasHeight = windowHeight;
    } else {
      // If window is taller than the aspect ratio
      canvasWidth = windowWidth;
      canvasHeight = windowWidth / aspectRatio;
    }

    // Set the canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Get canvas context and set some global defaults
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    // Instanciate a Game instance
    game = new GameEngine(canvas, {
      scale,
      gravity: 1
    });
    
    let lastTime = 0;
    function animate(timeStamp: number) {
      // [Helper] calculate time it takes to animate 1 frame.
      // Used to calculate FPS metric and to standardize periodic functions.
      const deltaTime = timeStamp - lastTime;
      lastTime = timeStamp;
      // Reset canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Render new frame
      game.render(ctx, deltaTime);
      // Loop
      requestAnimationFrame(animate);
    }
    // Loop
    requestAnimationFrame(animate);
  })
}
let game: GameEngine;
animate();