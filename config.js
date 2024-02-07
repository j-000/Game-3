let master = {
  player: {
    setup: {
      width: 50,
      height: 50,
      speedFactor: 5,
      jumpFactor: -20
    },
    animations: {
      idle: {
        src: "./img/king/idle.png",
        maxFrames: 11
      },
      runLeft: {
        src: "./img/king/runLeft.png",
        maxFrames: 8
      },
      runRight: {
        src: "./img/king/runRight.png",
        maxFrames: 8
      },
      enterDoor: {
        src: "./img/king/enterDoor.png",
        maxFrames: 8
      }
    }
  },
  levels: {
    1: {
      background:{
         src: "./img/backgroundLevel1.png",
         width: 1024,
         height: 576,
         xTiles: 16,
         yTiles: 9,
         tileWidth: 64
        },
      blocks: {
        array: [
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
        flags: {
          collision: 292,
          spawn: 267,
          door: 290
        }
      }
    }
  },
  game: {
    gravity: 1,
    startLevel: 1
  }
}

export default master;