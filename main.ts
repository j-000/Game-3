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
    this.image.onload = () => {this.loaded = true};
    this.imageOptions = args.image;
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

class ActorSprite {
  pos: Vector2D;
  image: HTMLImageElement;
  loaded: boolean;
  w: number;
  h: number;

  currentFrame: number;
  maxFrame: number;
  animationTimer: number;
  animationCounter: number;

  constructor(pos: Vector2D, src: string, maxFrame: number){
    this.pos = pos;

    this.currentFrame = 0;
    this.animationTimer = 80;
    this.animationCounter = 0;
    this.maxFrame = maxFrame;
    this.image = new Image();
    this.swapSprite(src, maxFrame);
  }

  swapSprite(src: string, maxFrame: number){
    this.image.src = src;
    this.maxFrame = maxFrame;
    this.image.onload = () => {
      this.loaded = true
      this.w = this.image.width / this.maxFrame
      this.h = this.image.height
    };
  }

  draw(ctx: CanvasRenderingContext2D){
    let cropbox = {
      position: {
        x: this.currentFrame * this.w,
        y: 0
      },
      w: this.w,
      h: this.h
    }
    ctx.drawImage(this.image, 
      cropbox.position.x, 
      cropbox.position.y,
      cropbox.w, 
      cropbox.h,
      this.pos.x, 
      this.pos.y,
      this.w, 
      this.h);
  }

  animate(deltaTime: number){
    this.animationCounter += deltaTime;
    if(this.animationCounter >= this.animationTimer){
      if(this.currentFrame > this.maxFrame - 2) {
        this.currentFrame = 0;
      } else {
        this.currentFrame += 1;
        this.animationCounter = 0;
      }
    }
  }
}



interface PlayerOptions {
  game?: GameEngine
  width: number
  height: number
  jumpFactor: number
  speedFactor: number
}

interface PlayerUpdateOptions {
  gravity: Vector2D
  collisionBlocks: Array<CollisionBlock>
}

class Player{
  game: GameEngine;
  jumpFactor: number;
  speedFactor: number;
  pos: Vector2D;
  vel: Vector2D;
  width: number;
  height: number;
  sprite: ActorSprite

  constructor(args: PlayerOptions) {
    this.width = args.width;
    this.height = args.height;
    this.pos = new Vector2D(400, 200);
    this.vel = new Vector2D(0, 0);
    this.jumpFactor = args.jumpFactor;
    this.speedFactor = args.speedFactor;
    this.game = args.game;
    this.sprite = new ActorSprite(this.pos, './img/king/idle.png', 11);
  }

  draw(ctx: CanvasRenderingContext2D) {
    let ratio = this.sprite.w / this.width;
    ctx.save()
    ctx.translate(-this.sprite.w/ratio, -this.sprite.h/ratio);
    this.sprite.draw(ctx);
    ctx.restore()

    if(this.game.debug.isOn){
      // Player hitbox (implements collisions)
      ctx.beginPath();
      ctx.strokeStyle = 'blue';
      ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
      ctx.stroke();

      // Image box (does not implement collisions)
      ctx.strokeStyle = 'yellow'
      ctx.beginPath()
      ctx.save();
      ctx.translate(-this.sprite.w/ratio, -this.sprite.h/ratio);
      ctx.rect(this.pos.x, this.pos.y, this.sprite.w, this.sprite.h);
      ctx.stroke()
      ctx.restore()
    }

  }

  update(args: PlayerUpdateOptions){
    /**
     * Update must be separated into X-Axis and Y-Axis to avoid errors.
     * First we update position on X-axis and then check for collisions on this axis
     * Then we update position on Y-axis and then check for collision on this axis
     */  
    // Update X-pos with X-vel
    this.pos.x += this.vel.x;
    // Check for collision with blocks in X-axis
    this.checkCollisionXaxis(args.collisionBlocks);
    // Apply gravity - this will update the Y-vel with Gravity.
    this.game.applyGravity(this); 
    // Update Y-position with Y-velocity
    this.pos.y += this.vel.y;
    // Check for collision with blocks in Y-axis
    this.checkCollisionYaxis(args.collisionBlocks)
  }

  checkCollisionYaxis(blocks: Array<CollisionBlock>){
    let player = this;
    for(let block of blocks){
      if(player.pos.x <= block.pos.x + block.w &&
        player.pos.x + player.width >= block.pos.x &&
        player.pos.y + player.height >= block.pos.y &&
        player.pos.y <= block.pos.y + block.h
        ) {
          if(player.vel.y < 0) {
            player.pos.y = block.pos.y + block.h + 0.01;
          }
          if(player.vel.y > 0){
            player.pos.y = block.pos.y - player.height - 0.01;
          }
          player.vel.y = 0;
          break 
      }
    }
  }
  checkCollisionXaxis(blocks: Array<CollisionBlock>){
    let player = this;
    for(let block of blocks){
      if(player.pos.x <= block.pos.x + block.w &&
        player.pos.x + player.width >= block.pos.x &&
        player.pos.y + player.height >= block.pos.y &&
        player.pos.y <= block.pos.y + block.h
        ) {
          // Check if it is a door:
          if(block.constructor.name == 'Door'){
            console.log('Hit a door');
            
          }

          if(player.vel.x < 0) {
            player.pos.x = block.pos.x + block.w + 0.01;
          }
          if(player.vel.x > 0){
            player.pos.x = block.pos.x - player.width - 0.01;
          }
          break 
      }
    }
  }

  stop() {
    this.vel = this.vel.multiply(0);
  }

  move(direction: string) {
    switch (direction) {
      case 'ArrowLeft':
        this.vel.x = -this.speedFactor;
        break;
      case 'ArrowRight':
        this.vel.x = this.speedFactor;
        break;
    }
  }

  jump() {
    if (this.vel.y == 0) {
      this.vel = this.vel.add(new Vector2D(0, this.jumpFactor));
    }
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
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
    ctx.fillStyle = 'yellow'
    ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
    ctx.fill()
  }
}


class SpawnPlace extends CollisionBlock{
  pos: Vector2D;
  constructor(x: number, y: number, w: number, h: number){
    super(x, y, w, h);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
    ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
  }
}

class Door extends CollisionBlock{
  pos: Vector2D;
  constructor(x: number, y: number, w: number, h: number){
    super(x, y, w, h);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath()
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'
    ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
  }
}

interface GameEngineOptions {
  gravity: number
  scale?: number
  player: PlayerOptions
  startLevel: number
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
  blocks: Array<any>;
  startLevel: number;

  constructor(canvas: HTMLCanvasElement, args: GameEngineOptions) {
    this.debug = {
      isOn: true,
      timer: 0,
      fps: '0'
    }
    this.startLevel = args.startLevel;
    this.canvas = canvas;
    this.gravity = new Vector2D(0, args.gravity);

    this.initBackground();
    this.initBlocks();
    this.initPlayer(args.player);

    // Add event listeners for key presses
    window.addEventListener('keydown', e => this.handleKeyPressed(e));
    window.addEventListener('keyup', e => this.handleKeyReleased(e));
  }

  get LEVELS(){
    return {
      1: {
        collisions: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0],
          [0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0],
          [0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0],
          [0, 292, 292, 267, 0, 0, 0, 0, 0, 0, 0, 0, 290, 0, 292, 0],
          [0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
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
      }
    }
  }

  initBackground(){
    this.background = new Sprite({
      x: 0, 
      y: 0,
      image: this.LEVELS[this.startLevel].image,
      tiles: this.LEVELS[this.startLevel].tiles
    })
  }
  
  initPlayer(options: PlayerOptions){
    this.player = new Player({
      game: this, // add reference to game object
      ...options
    });

    /**
     * There should only be one spawn place per game level.
     * Place the player on this locatoin when game starts or
     * when player respawns.
     */
    this.blocks.forEach(block => {      
      if(block.constructor.name == 'SpawnPlace'){
        this.player.pos.x = block.pos.x;
        this.player.pos.y = block.pos.y;
      }
    })

  }

  initBlocks(){
    this.blocks = new Array<CollisionBlock>();
    // loop through the 2D array in columns and rows
    for(let col = 0; col < this.background.tiles.xCount; col++){
      for(let row = 0; row < this.background.tiles.yCount; row++){
        // Get an entry value
        let block = this.LEVELS[1].collisions[row][col];
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
        if(block === 267) {
          this.blocks.push(new SpawnPlace(x, y, w, h));
        }
        if(block === 290) {
          this.blocks.push(new Door(x, y, w, h));
        }

      }
    }
  }

  handleKeyReleased(e: KeyboardEvent) {
    const LEFT = 'ArrowLeft';
    const RIGHT = 'ArrowRight';
    if (e.key == RIGHT || e.key == LEFT) {
      this.player.stop();
      this.player.sprite.swapSprite('./img/king/idle.png', 11);
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
      this.player.sprite.swapSprite('./img/king/runRight.png', 8);
    }
    if (e.key == LEFT) {
      this.player.move(LEFT);
      this.player.sprite.swapSprite('./img/king/runLeft.png', 8);
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
    let hasHitDownSide = playerSides.down + p.height >= this.canvas.height;
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
       * Y-vel may contain more pixels than the diference between
       * the bottom side of the player and the canvas height, making the player sink below y-axis.
       * To prevent this, we manually set the player position on the ground.
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
    
    /**
     * [Debug mode]
     * Collision blocks
     * Drawing only needs to happen in debug mode. 
     * Checkign for collisions doesn't require drawing them.
     */
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
    }

    /**
     * Player
     */
    this.player.draw(ctx);
    this.player.sprite.animate(deltaTime);
    this.player.update({
      gravity: this.gravity,
      collisionBlocks: this.blocks
    })


    // Reset timer
    if (this.debug.timer > ONE_SECOND) {
      this.debug.fps = (1000 / deltaTime).toFixed();
      this.debug.timer = 0;
    }
  }
}


function main() {
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
      gravity: 1,
      startLevel: 1,
      player : { 
        width: 50,
        height: 50,
        jumpFactor: -20,
        speedFactor: 5
      }
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
main();