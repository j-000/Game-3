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

  add(other: Vector2D): Vector2D{
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

  draw(ctx: CanvasRenderingContext2D){
    ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  update(){    
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

  constructor(args: PlayerOptions){
    super(args.width, args.height);
    this.jumpFactor = args.jumpFactor;
    this.speedFactor = args.speedFactor;
  }
  
  stop(){
    this.vel = this.vel.multiply(0);
  }

  move(direction: string){
    switch (direction){
      case 'ArrowLeft':
        this.vel.x = -this.speedFactor
        break;
      case 'ArrowRight':
        this.vel.x = this.speedFactor
        break;
    }
  }

  jump(){
    this.vel = this.vel.add(new Vector2D(0, this.jumpFactor));
  }
}

interface GameEngineOptions {
  gravity: number
}

class GameEngine {
  canvas: HTMLCanvasElement;
  gravity: Vector2D;
  player: Player;

  constructor(canvas: HTMLCanvasElement, args: GameEngineOptions){
    this.canvas = canvas;
    this.gravity = new Vector2D(0, args.gravity);
    this.player = new Player({
      width: 50,
      height: 50,
      jumpFactor: -15,
      speedFactor: 2
    });
    window.addEventListener('keydown', e => this.handleKeyPressed(e));
    window.addEventListener('keyup', e => this.handleKeyReleased(e));
  }

  handleKeyReleased(e: KeyboardEvent){
    const LEFT = 'ArrowLeft';
    const RIGHT = 'ArrowRight';
    if(e.key == RIGHT || e.key == LEFT){
      this.player.stop();
    }
  }
  
  handleKeyPressed(e: KeyboardEvent){
    const SPACE = ' ';
    const LEFT = 'ArrowLeft';
    const RIGHT = 'ArrowRight';
    if(e.key == SPACE){
      this.player.jump();
    }
    if(e.key == RIGHT){
      this.player.move(RIGHT);
    }
    if(e.key == LEFT){
      this.player.move(LEFT);
    }
  }

  checkCanvasCollision(p: Player){
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
    if(hasHitLeftSide){
      this.player.pos.x = 0;
      this.player.vel.x = 0;
    }
    if(hasHitUpSide){
      this.player.vel.y = 0;
      this.player.pos.y = 0;
    }
    if(hasHitRightSide){
      this.player.vel.x = 0;
      this.player.pos.x = this.canvas.width - this.player.width;
    }
    if(hasHitDownSide){
      this.player.vel.y = 0;
      this.player.pos.y = this.canvas.height - this.player.height;
    }
  }

  applyGravity(body: Player){
    let bottom = body.pos.y + body.height;
    if(bottom < this.canvas.height){
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
    // Draw game
    
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
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    // Get the browser window dimensions (not more than 80%)
    const windowWidth = window.innerWidth * 0.8;
    const windowHeight = window.innerHeight * 0.8;
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
    ctx.lineWidth = 2;

    // Instanciate a Game instance
    game = new GameEngine(canvas, {
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