  /**
   * A Vector2D is based on linear algebra definition 
   * of a vector.
   * Methods either provide a mathematical result or a
   * new modified vector.
   */
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


  /**
   * A Point is just a visible representation of a Vector2D 
   * on the canvas.
   */
  class Point {
    pos: Vector2D;
    name: string;
    radius: number;
    constructor(pos: Vector2D, name: string) {
      /**
       * pos  - Vector2D of x,y position
       * name - A reference name for the point 
       */
      this.pos = pos;
      this.radius = 4; // Default radius to 5 pixels.
      this.name = name;
    }

    draw(ctx: CanvasRenderingContext2D){
      /**
       * Draw a white circle fill white
       * and the property name on top.
       */
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.fillText(this.name, this.pos.x, this.pos.y - 10)
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.restore();
    }
  }


  /**
   * A CollisionBlock is an abstract element where it does not 
   * get drawn onto the canvas. It only serves to check whether
   * the player or others collide with certain areas of the map.
   */
  class CollisionBlock {
    pos: Vector2D;
    w: number;
    h: number;
    constructor(x: number, y: number, w: number, h: number){
      /**
       * x, y - positions on X and Y axis.
       * w, h - width and height
       */
      this.pos = new Vector2D(x, y);
      this.w = w;
      this.h = h;
    }
    draw(ctx: CanvasRenderingContext2D){
      /**
       * Draws a red rectangle with red color fill.
       */
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
      /**
       * Draws a yellow circle.
       * This represents the reference point (origin) of the block.
       */
      ctx.fillStyle = 'yellow';
      ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }


  /**
   * A SpawnPlace only contains a point.
   * This is where the player will respawn 
   * on level load.
   */
  class SpawnPlace extends Point{
    constructor(x: number, y: number){
      /**
       * x, y - positions on X and Y axis.
       */
      let pos = new Vector2D(x, y);
      super(pos, '[SpawnPlace]');
    }
  }


  /**
   * A MapSprite represents the background sprite.
   * Usually these don't animate.
   */
  class MapSprite {
    pos: Vector2D;
    image: CanvasImageSource;
    loaded: boolean;
    imageSetup: ImageSetup = {
      src: '',
      sw: 0,
      sh: 0  
    };
    tiles: TilesSetup = {
      xCount: 0,
      yCount: 0,
      width: 0
    };

    constructor(args: MapSpriteOptions) {
      /**
       * pos - Vector2D of x,y position
       * image - HTML Image Element
       * loaded - boolean flag
       * imageSetup - ImageSetup
       * tiles - TilesSetup
       */
      this.pos = new Vector2D(0, 0);
      this.image = new Image();
      this.image.src = args.imageSetup.src;
      this.image.onload = () => { // FIXME: remove this to use <img> html
        this.loaded = true;
      };
      this.tiles = args.tiles;
      this.imageSetup = args.imageSetup;    
    }

    draw(ctx: CanvasRenderingContext2D) {
      /**
       * Draw the map image onto the canvas;
       * Assumes image will cover 100% of the canvas.
       */
      if (!this.loaded) return // Skip if not loaded
      ctx.drawImage(
        this.image,
        this.pos.x, 
        this.pos.y,
        GAME.canvas.width,
        GAME.canvas.height);
    }
  }


  /**
   * ActorSprite manages a charater's srite sheet
   * animation and swapping.
   * Draw method should be implemented in the Parent class
   * due to custom configurations needed for Parent class.
   */
  class ActorSprite {
    pos: Vector2D;
    image: HTMLImageElement;
    w: number;
    h: number;
    currentFrame: number;
    maxFrame: number;
    animationTimer: number;
    animationCounter: number;
    scale: number;

    constructor(pos: Vector2D, img: HTMLImageElement, scale: number = 1){
      this.pos = pos;
      this.scale = scale;
      this.currentFrame = 0;
      this.animationTimer = 90;
      this.animationCounter = 0;
      this.maxFrame = Number(img.getAttribute('maxFrames'));    
      this.image = img;
      this.updateDimensions();
      this.updateAnimationDuration(this.image);
    }

    updateDimensions() {
      /**
       * Update the dimensions of the sprite considering the
       * new image and the xRatio to make it responsive.
       * w and h are used to draw the player sprite image correctly inside the 
       * player's hitbox.
       */
      // Width of 1 frame is the whole img / # of frames.
      this.w = (this.image.width / this.maxFrame) * GAME.xRatio * this.scale;
      /**
       * Height is taken from the image and only scaled by the game's yRatio.
       * It is assumed sprite sheets only contain 1 row.
       */
      this.h = this.image.height * GAME.yRatio * this.scale;
    }

    updateAnimationDuration(img: HTMLImageElement){
      let duration = img.getAttribute('duration');
      if(duration){
        this.animationTimer = Number(duration);
      }
    }

    swapSprite(img: HTMLImageElement){ 
      /**
       * Swap the current Image element with the new reference provided.
       * img (args) should be already loaded. 
       */    
      this.image = img;
      this.maxFrame = Number(this.image.getAttribute('maxFrames'));
      this.updateAnimationDuration(img);
    }

    cropbox() {
      /**
       * Build cropbox used in draw method of Parent class.
       * This crop box will return dimensions and a point to 
       * crop the sprite sheet. Used in ctx.drawImage 9-args version.
       */
      let frameWidth = (this.image.width / this.maxFrame);
      return {
        position: {
          x: this.currentFrame * frameWidth,
          y: 0 // y is always 0 as we assume sprite sheets ar 1 row only
        },
        w: this.w,
        h: this.h 
      }
    }

    animate(deltaTime: number){
      /**
       * Add the deltaTime to the animaton counter.
       * deltaTime - time it takes for 1 frame to be rendered.
       * At 60 fps/hz ~ 16.7 ms.
       */
      this.animationCounter += deltaTime;
      /**
       * If the timer is ready, moveFrame().
       */
      if(this.animationCounter >= this.animationTimer){
        this.moveFrame();
      }
    }

    moveFrame(){
      /**
       * Frames are 0-indexed, so we must account for this
       * by subtracting 1 from the maxFrame condition
       */
      if(this.currentFrame >= this.maxFrame - 1) {
        this.currentFrame = 0;
      } else {
        this.currentFrame += 1;
        /**
         * Reset the animation counter for next loop
         */
        this.animationCounter = 0
      }
    }
  }


  /**
   * Interfaces for some
   */
  interface ImageSetup {
    src: string;
    sw: number;
    sh: number;
  }
  interface TilesSetup {
    xCount: number
    yCount: number
    width: number // assuming squares only
  }
  interface MapSpriteOptions {
    imageSetup: ImageSetup
    tiles: TilesSetup
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
  interface ActorSpriteOptions {
    pos: Vector2D
    src: string
    maxFrame: number
    animationTimer: number
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
    direction: string;
    player_images: any // FIXME no anys!
    lives: number;

    constructor(args: PlayerOptions) {
      this.lives = 3;
      this.width = args.width;
      this.height = args.height;    
      this.pos = new Vector2D(0,0);
      this.vel = new Vector2D(0,0);
      this.jumpFactor = args.jumpFactor;
      this.speedFactor = args.speedFactor;
      this.game = args.game;
      this.direction = 'right';
      this.player_images = {
        idle_right: document.getElementById('player_idle_right') as HTMLImageElement, // [ ] refactor repeating remove type 
        idle_left: document.getElementById('player_idle_left') as HTMLImageElement, // [ ] refactor repeating remove type 
        runLeft: document.getElementById('player_runleft') as HTMLImageElement,
        runRight: document.getElementById('player_runright') as HTMLImageElement,
        enterDoor: document.getElementById('player_enterdoor') as HTMLImageElement,
        attack: document.getElementById('player_attack') as HTMLImageElement
      }
      this.sprite = new ActorSprite(this.pos, this.player_images.idle_right);
    }

    draw(ctx: CanvasRenderingContext2D) {    
      /**
       * Draw player sprite
       */
      let cropbox = this.sprite.cropbox();    
      let frameWidth = this.sprite.image.width / this.sprite.maxFrame;
      ctx.save();
      // Align image with player's reference point
      ctx.translate(  
        -(this.sprite.w-this.width)/2, 
        -(this.sprite.h-this.height)/2
      );
      ctx.drawImage(this.sprite.image, 
        // Get the cropped image from the whole sprite sheet
        cropbox.position.x, 
        cropbox.position.y,
        frameWidth,
        this.sprite.image.height, // Doesn't need update as we assume sprite sheet is 1 row only
        // Draw it on the screen  
        this.pos.x, 
        this.pos.y, 
        this.sprite.w, 
        this.sprite.h
      );
      ctx.restore();

      /**
       * [Debug mode] 
       * Should be drawn on top (after) sprite.
       */
      if(this.game.debug.isOn){
        /**
         * Drawm player's hitbox
         */
        ctx.beginPath();
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'blue';
        ctx.fillText('[Hitbox]', this.pos.x + 2, this.pos.y + this.height/2)
        ctx.rect(this.pos.x, this.pos.y, this.width, this.height);
        ctx.stroke();

        /**
         * Draw player's point of reference (origin)
         */
        ctx.fillStyle = 'white';
        ctx.fillText('[Ref.]', this.pos.x, this.pos.y - 10);
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.arc(this.pos.x, this.pos.y, 5, 0, Math.PI * 2);
        ctx.fill();

        /**
         * Draw player's image box (cropbox from sprite sheet)
         */
        ctx.save();
        ctx.beginPath();
        // Translater image box to be centered around 
        // the player's hitbox evenly.
        ctx.translate(  
          -(this.sprite.w-this.width)/2, 
          -(this.sprite.h-this.height)/2
        );
        ctx.fillStyle = 'yellow';
        ctx.fillText('[Cropbox]', this.pos.x, this.pos.y - 10)
        ctx.strokeStyle = 'yellow';
        ctx.rect(this.pos.x, this.pos.y, 
        this.sprite.w, this.sprite.h);
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
        // check if it is a door! // [ ] player entering door logic
        if(block.constructor.name == 'Door'){
          if(player.pos.x + player.width >= block.pos.x
            ){
              // let g = block as Door;
              // console.log(block);
              // console.log('Hit a door');
              // don't use break otherwise below logic won't run!
          }
        }

        if(player.pos.x <= block.pos.x + block.w &&
          player.pos.x + player.width >= block.pos.x &&
          player.pos.y + player.height >= block.pos.y &&
          player.pos.y <= block.pos.y + block.h
          ) {
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
    
    animate(deltaTime: number){
      this.sprite.animate(deltaTime);
    }

    move(direction: string) {
      switch (direction) {
        case 'ArrowLeft':
          this.vel.x = -this.speedFactor;
          this.sprite.swapSprite(this.player_images.runLeft);
          this.direction = 'left';
          break;
        case 'ArrowRight':
          this.vel.x = this.speedFactor;
          this.sprite.swapSprite(this.player_images.runRight);
          this.direction = 'right';
          break;
      }
    }

    enterDoor(){
      this.sprite.swapSprite(this.player_images.enterDoor);
    }

    attack(){   
      this.sprite.swapSprite(this.player_images.attack);
    }

    jump() {
      if (this.vel.y == 0) {
        this.vel = this.vel.add(new Vector2D(0, this.jumpFactor));
      }
    }
  }



  /**
   * A Door is an game actor in that it performs some animations
   * and influences game flow.
   */
  class Door extends Point{
    sprite: ActorSprite; 
    open: boolean;
    fullOpen: boolean;
    constructor(x: number, y: number){  
      /**
       * sprite - ActorSprite
       */ 
      let pos = new Vector2D(x, y);
      super(pos, '[Door]');
      let door_image = document.getElementById('doorOpen') as HTMLImageElement;
      this.sprite = new ActorSprite(this.pos, door_image);
      this.open = false;
    } 

    animate(deltaTime: number){    
      if(this.open){
        this.sprite.animate(deltaTime);
      } else {
        this.sprite.currentFrame = 0;
      }
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
      let cropbox = this.sprite.cropbox();
      let frameWidth = (this.sprite.image.width / this.sprite.maxFrame);
      ctx.save();    
      ctx.translate(0, (-this.sprite.h+15)/2);
      ctx.drawImage(this.sprite.image,
        /**
         * cropbox is what needs to be cropped from original image
         * no scalling required.
         */
        cropbox.position.x, 
        cropbox.position.y,
        frameWidth, 
        this.sprite.image.height,
        /**
         * This is how the cropped image is going to be displayed.
         * This does need to be scalled by xRatio (in this case
         * happens in the ActorSprite class).
         */
        this.pos.x, 
        this.pos.y, 
        this.sprite.w, 
        this.sprite.h
      );
      ctx.restore();
      /**
       * [Debug mode]
       * Draw door's point of reference
       * Draw sprite outline (cropbox)
       */
      if(GAME.debug.isOn){
        /**
         * Draw reference point (origin)
         */
        super.draw(ctx);
        /**
         * Draw door cropbox outline
         */
        ctx.save();
        ctx.translate(0, (-this.sprite.h+15)/2);
        ctx.beginPath()
        ctx.strokeStyle = 'black';
        ctx.rect(this.pos.x, this.pos.y, this.sprite.w, this.sprite.h);
        ctx.stroke();
        ctx.restore();
      } 
    }
  }

  interface GameEngineOptions {
    gravity: number
    scale?: number
    player?: PlayerOptions
    startLevel: number
  }

  interface Debug {
    isOn: boolean
    fps: string
    timer: number
  }

  const ONE_SECOND = 1000;

  /**
   * Extending the Array class with a custom function
   * to find an item by its constructor name.
   */
  class List<T> extends Array<T> {
    constructor(){
      super();
    }
    findByConstructorName(name: String): T{
      return super.find(i => i.constructor.name === name);
    }
  }

  class Heart {
    sprite: ActorSprite;
    pos: Vector2D;
    constructor(pos: Vector2D){
      let img = document.getElementById('heart_idle') as HTMLImageElement;
      this.pos = pos;
      this.sprite = new ActorSprite(this.pos, img, 2.5);
    }
    
    animate(deltaTime: number){
      this.sprite.animate(deltaTime)
    }

    draw(ctx: CanvasRenderingContext2D){
      let cropbox = this.sprite.cropbox();
      let frameWidth = (this.sprite.image.width / this.sprite.maxFrame);
      ctx.save();
      ctx.drawImage(this.sprite.image,
        /**
         * cropbox is what needs to be cropped from original image
         * no scalling required.
         */
        cropbox.position.x, 
        cropbox.position.y,
        frameWidth, 
        this.sprite.image.height,
        /**
         * This is how the cropped image is going to be displayed.
         * This does need to be scalled by xRatio (in this case
         * happens in the ActorSprite class).
         */
        this.pos.x + 22, 
        this.pos.y + 20, 
        this.sprite.w, 
        this.sprite.h);
      ctx.restore();

    }
  }


  class GameEngine {
    canvas: HTMLCanvasElement;
    gravity: Vector2D;
    player: Player;
    background: MapSprite;
    debug: Debug
    blocks: List<any>; // [ ] no anys
    startLevel: number;
    currentLevel: number;
    xRatio: number;
    yRatio: number;

    constructor(canvas: HTMLCanvasElement, args: GameEngineOptions) {
      this.debug = {
        isOn: true,
        timer: 0,
        fps: '0'
      }
      this.currentLevel = 1;
      this.startLevel = args.startLevel;
      this.canvas = canvas;
      this.gravity = new Vector2D(0, args.gravity);
      // Calculate the ratio of the image and the canvas (makes window responsive)
      this.initBackground();
      this.xRatio = this.canvas.width / this.background.imageSetup.sw;
      this.yRatio = this.canvas.height / this.background.imageSetup.sh;

      // Add event listeners for key presses
      window.addEventListener('keydown', e => this.handleKeyPressed(e));
      window.addEventListener('keyup', e => this.handleKeyReleased(e));
    }


    start(args: PlayerOptions){
      this.initBlocks();
      this.initPlayer(args);
      this.initHearts()
    }

    initHearts(){
      // Create Hearts
      for (let i = 0; i < this.player.lives; i++) {
        this.blocks.push(new Heart(new Vector2D((22*i), 0)))      
      }
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
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ],
          image: {
            src: './img/backgroundLevel1.png',
            sw: 1024, // [ ] find a way to remove this
            sh: 576   // and this.
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
      this.background = new MapSprite({
        imageSetup: this.LEVELS[this.startLevel].image,
        tiles: this.LEVELS[this.startLevel].tiles
      });
    }
    
    initPlayer(options: PlayerOptions){
      this.player = new Player({
        game: this, // add reference to game object
        ...options
      });

      /**
       * There should only be one spawn place per game level.
       * Place the player on this location when game starts or
       * when player respawns.
       */
      let block = this.blocks.findByConstructorName('SpawnPlace') as SpawnPlace;
      if(block){
        /**
         * Exact positoin is offset by half the player's width
         * to place it on top of the point.
         * Using a buffer to avoid the edge case where the player 
         * spawns on the edge of a collision block.
         */
        let buffer = this.player.width / 2;
        this.player.pos.x = block.pos.x + buffer
        /**
         * Gravity will affect this. It's possible the player won't end up on the y-value of the point if there's a collision block.
         */
        this.player.pos.y = block.pos.y;
      }

      /**
       * Player dimensions should be responsive to the 
       * canvas dimensions.
       */
      this.player.width *= this.xRatio;
      this.player.height *= this.yRatio;
    }

    initBlocks(){
      this.blocks = new List<CollisionBlock>();
      // loop through the 2D array in columns and rows
      for(let col = 0; col < this.background.tiles.xCount; col++){
        for(let row = 0; row < this.background.tiles.yCount; row++){
          // Get an entry value
          let block = this.LEVELS[this.currentLevel].collisions[row][col];
          let tileW = this.background.tiles.width;
          let x = Math.floor(tileW * col * this.xRatio); // x position
          let y = Math.floor(tileW * row * this.yRatio); // y position
          let w = Math.floor(tileW * this.xRatio);       // w 
          let h = Math.floor(tileW * this.yRatio);       // h 
          if(block === 292){
            this.blocks.push(new CollisionBlock(x, y, w, h));
          }
          if(block === 267) {
            this.blocks.push(new SpawnPlace(x, y));
          }
          if(block === 290) {
            this.blocks.push(new Door(x, y));          
          }
        }
      }
    }

    handleKeyReleased(e: KeyboardEvent) {
      /**
       * If user releases left/right arrow key
       * stop the player from moving and
       * set the sprite back to idle.
       */
      let released = [
        'ArrowRight', 'ArrowLeft', 'ArrowUp', 'a'
      ].find(s => s == e.key);
      if (released) {
        this.player.stop();
        if(this.player.direction == 'left') {
          this.player.sprite.swapSprite(this.player.player_images.idle_left);
        } else {
          this.player.sprite.swapSprite(this.player.player_images.idle_right);
        }
        if(e.key == 'ArrowUp'){
          let door = this.blocks.findByConstructorName('Door') as Door;
          door.open = false;
        }
      }
    }

    handleKeyPressed(e: KeyboardEvent) {
      switch (e.key) {
        case ' ':
          this.player.jump();
          break;
        case 'ArrowLeft':
          this.player.move('ArrowLeft');
          break;
        case 'ArrowRight':
          this.player.move('ArrowRight')
          break;
        case 'ArrowUp':
          let door = this.blocks.findByConstructorName('Door') as Door;
          if(door){
            let distanceToDoor = this.player.pos.distanceTo(door.pos);
            if(this.player.pos.x >= door.pos.x && distanceToDoor < this.player.width){
              door.open = true
              this.player.enterDoor();
            }
          }
          break;
        case 'a':
          this.player.attack();
          break;
        /**
         * [Debug Mode]
         * Toggle debug mode by pressing "d"
         */
        case 'd':
          this.debug.isOn = !this.debug.isOn;
          break
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
      /**
       * No need to check down side as applyGravity() already does it.
       */
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
       * Extras:
       * Lives bar
       */
      ctx.save();
      let lives_bar = document.getElementById('lives_bar') as HTMLImageElement;
      let scale = 2
      ctx.drawImage(lives_bar, 
        0, 0, lives_bar.width*scale, lives_bar.height*scale);
      ctx.restore();
        
      /**
       * [Debug mode]
       * Collision blocks
       * Drawing only needs to happen in debug mode. 
       * Checkign for collisions doesn't require drawing them.
       */
      if(this.blocks){
        for(let block of this.blocks){
          switch (block.constructor.name) {
            case 'Door':
              let door = block as Door;
              door.draw(ctx);
              door.animate(deltaTime);
              break;
            case 'Heart':
              let heart = block as Heart;
              heart.draw(ctx);
              heart.animate(deltaTime);
            case 'SpawnPlace':
              if(this.debug.isOn){        
                let spawplace = block as SpawnPlace;
                spawplace.draw(ctx);
              }
              break;
            case 'CollisionBlock':
              if(this.debug.isOn){
                block.draw(ctx);
              }
              break          
          }
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
      if(this.player){      
        this.player.draw(ctx);
        this.player.animate(deltaTime);
        this.player.update({
          gravity: this.gravity,
          collisionBlocks: this.blocks
        })
      }

      // Reset timer
      if (this.debug.timer > ONE_SECOND) {
        this.debug.fps = (1000 / deltaTime).toFixed();
        this.debug.timer = 0;
      }
    }
  }

  let GAME: GameEngine;
  // Once all HTML and images are loaded
  window.addEventListener('load', () => {
    let scale = 0.9;
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
    GAME = new GameEngine(canvas, {
      scale,
      gravity: 1,
      startLevel: 1
    });
    // Current work around to avoid undefined game properties 
    // used in other methods // [ ] refactor this better
    GAME.start({ 
      width: 50,
      height: 50,
      jumpFactor: -20,
      speedFactor: 5
    })
    
    let lastTime = 0;
    function animate(timeStamp: number) {
      // [Helper] calculate time it takes to animate 1 frame.
      // Used to calculate FPS metric and to standardize periodic functions.
      const deltaTime = timeStamp - lastTime;
      lastTime = timeStamp;
      // Reset canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Render new frame
      GAME.render(ctx, deltaTime);
      // Loop
      requestAnimationFrame(animate);
    }
    // Loop
    requestAnimationFrame(animate);
  })