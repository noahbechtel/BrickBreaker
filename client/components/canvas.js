import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { sendScore, getScores } from '../store'

class Canvas extends Component {
  componentDidMount () {
    this.props.getScores()
    const canvas = this.refs.canvas
    const ctx = canvas.getContext('2d')

    // ball
    let x = canvas.width / 2

    let dx = 2
    let dy = -2
    const ballRadius = 10
    const paddleHeight = 10
    let paddleWidth = 75
    let paddleY = canvas.height - paddleHeight * 4
    let paddleX = (canvas.width - paddleWidth) / 2
    let y = paddleY - ballRadius
    let rightPressed = false
    let leftPressed = false
    let gameStarted = false
    let gameOver = false
    let score = 0
    let level = 0
    let lives = 3
    let name = ''
    let paralaxX = 2
    let paralaxY = 2
    let currentPower
    let note = ''
    let pSpeed = 7
    let remaining = 0
    let interval
    let visPowers = []
    let powerUps = [
      {
        func: () => {
          paddleWidth = 200
        },
        message: 'Thicc Paddle'
      },
      {
        func: () => {
          paddleWidth = 30
        },
        message: 'Smol Paddle'
      },
      {
        func: () => {
          lives++
        },
        message: 'Life Up!'
      },
      {
        func: () => {
          dx *= 1.5
          dy *= 1.5
        },
        message: 'Aw shit its faster.'
      }
    ]

    let brickWidth
    let brickHeight
    let brickPadding
    let brickOffsetTop
    let brickOffsetLeft
    let brickRowCount
    let brickColumnCount
    let powerUpIds
    let bricks
    let i

    const setup = async () => {
      x = paddleX + paddleWidth / 2
      y = canvas.height - paddleHeight * 5
      dx = 2
      dy = -2
      clearInterval(interval)
      visPowers = []
      gameStarted = false
    }

    const spawnBlocks = () => {
      // blocks
      brickWidth = 75
      brickHeight = 20
      brickPadding = 10
      brickOffsetTop = 30
      brickOffsetLeft = (canvas.width % (brickWidth + brickPadding)) / 2
      brickRowCount = canvas.height / (brickOffsetTop + brickHeight)
      brickColumnCount = Math.round(canvas.width / (15 + brickWidth))
      remaining = brickColumnCount * brickColumnCount * (level + 1)
      powerUpIds = []
      for (let i = (brickRowCount * brickColumnCount) / 10; i > 0; i--) {
        powerUpIds.push(
          Math.round(Math.random() * (brickRowCount * brickColumnCount - 1) + 5)
        )
      }
      bricks = []
      i = 0
      for (var c = 0; c < brickColumnCount; c++) {
        bricks[c] = []
        for (var r = 0; r < brickRowCount; r++) {
          i++
          bricks[c][r] = { x: 0, y: 0, hp: 1 + level }
          if (powerUpIds.includes(i)) {
            bricks[c][r].powerUp =
              powerUps[Math.floor(Math.random() * powerUps.length)]
          }
        }
      }
    }

    const keyDownHandler = evt => {
      if (
        evt.key == 'Right' ||
        (evt.key == 'ArrowRight' && gameStarted === true)
      ) {
        rightPressed = true
      } else if (evt.key == 'Left' || evt.key == 'ArrowLeft') {
        if (!gameStarted) {
          if (dx > 0) dx = -2
        } else leftPressed = true
      } else if (
        (evt.keyCode == 32 && gameStarted === false) ||
        (evt.touches[0] && gameStarted === false)
      ) {
        gameStarted = true
        interval = setInterval(draw, 10)
      }
    }

    const keyUpHandler = evt => {
      if (evt.key == 'Right' || evt.key == 'ArrowRight') {
        rightPressed = false
      } else if (evt.key == 'Left' || evt.key == 'ArrowLeft') {
        leftPressed = false
      }
    }
    canvas.addEventListener('keydown', keyDownHandler, false)
    canvas.addEventListener('keyup', keyUpHandler, false)
    canvas.addEventListener('touchstart', keyDownHandler, false)

    const motionHandler = evt => {
      let tiltX = Math.round(evt.gamma)
      let tiltY = Math.round(evt.beta)

      tiltX > 20 || tiltX < -20 ? (pSpeed = 10) : (pSpeed = 6)

      if (tiltX > 5) {
        rightPressed = true
        leftPressed = false
      } else if (tiltX < -5) {
        rightPressed = false
        leftPressed = true
      } else {
        rightPressed = false
        leftPressed = false
      }

      paralaxX = tiltX / 5
      paralaxY = tiltY / 5
    }

    if (window.DeviceMotionEvent) {
      window.addEventListener('deviceorientation', motionHandler, true)
    }

    const endGame = () => {
      name = prompt('Please enter your name')
      this.props.sendScore(name, score)
      gameOver = true
    }
    const drawBall = () => {
      ctx.beginPath()
      ctx.arc(x + paralaxX, y + paralaxY, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = `#d1d1d1`
      ctx.fill()
      ctx.closePath()
      ctx.beginPath()
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = `#ffffff`
      ctx.fill()
      ctx.closePath()
    }
    const drawLives = () => {
      let buffer = 100
      for (let i = 0; i < lives; i++) {
        ctx.beginPath()
        ctx.arc(x + paralaxX, y + paralaxY, ballRadius, 0, Math.PI * 2)
        ctx.fillStyle = `#d1d1d1`
        ctx.fill()
        ctx.closePath()
        ctx.beginPath()
        ctx.arc(buffer + (20 + ballRadius) * i, 15, ballRadius, 0, Math.PI * 2)
        ctx.fillStyle = `#ffffff`
        ctx.fill()
        ctx.closePath()
      }
    }

    let duration
    const codeHotShot = () => {
      if (duration > 0 && currentPower) {
        currentPower()
        duration--
      } else {
        currentPower = null
      }
    }

    const drawScore = () => {
      ctx.font = '16px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Score: ' + score, 8, 20)
    }
    const drawHighScores = () => {
      ctx.font = '22px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('HighScores', canvas.width / 2, 20)
      let i = 0
      let insert = false
      this.props.scores.map(entry => {
        i += 22

        if (entry.score < score && insert === false) {
          ctx.fillText('-' + name + ': ' + score, canvas.width / 2, 20 + i)
          i += 22
          insert = true
        }
        return ctx.fillText('-' + entry.email + ': ' + entry.score, canvas.width / 2, 20 + i)
      })
    }

    const drawPaddle = () => {
      ctx.beginPath()
      ctx.rect(
        paddleX + paralaxX,
        paddleY + paralaxY,
        paddleWidth,
        paddleHeight
      )
      ctx.fillStyle = '#d1d1d1'
      ctx.fill()
      ctx.closePath()
      ctx.beginPath()
      ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight)
      ctx.fillStyle = '#f2f2f2'
      ctx.fill()
      ctx.closePath()
    }
    const pickColor = (row, z, hp) => {
      let mod = hp * (hp * 7) * -1 + level * 20
      if (z) {
        if (row % 2 === 0) {
          return `rgb(${193 + mod}, ${75 + mod}, ${154 + mod})` // purple foreground
        } else {
          return `rgb(${255 + mod}, ${102 + mod}, ${204 + mod})` // pink foreground
        }
      } else {
        if (row % 2 === 0) {
          return `rgb(${155 + mod}, ${104 + mod}, ${152 + mod})` // purple background
        } else {
          return `rgb(${191 + mod}, ${140 + mod},${204 + mod})` // pink background
        }
      }
    }

    // rgb(155, 104, 152) //purple background
    // rgb(193, 75, 154) //purple foreground
    // rgb(191, 140, 204) //pink background
    // rgb(255, 102, 204)//pink foreground

    const drawBricks = () => {
      if (score === 0 && !gameStarted) {
        spawnBlocks()
        setup()
      }
      for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
          let brick = bricks[c][r]
          let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
          let brickY = r * (brickHeight + brickPadding) + brickOffsetTop
          brick.x = brickX
          brick.y = brickY
          if (brick.hp) {
            ctx.beginPath()
            ctx.rect(
              brickX + paralaxX,
              brickY + paralaxY,
              brickWidth,
              brickHeight
            )
            // if (r % 2 === 0) ctx.fillStyle = `#9b6898`
            // else ctx.fillStyle = '#c14b9a'
            ctx.fillStyle = pickColor(r, 0, brick.hp)
            ctx.fill()
            ctx.closePath()
            ctx.beginPath()
            ctx.rect(brickX, brickY, brickWidth, brickHeight)
            ctx.fillStyle = pickColor(r, 1, brick.hp)
            // if (r % 2 === 0) ctx.fillStyle = `#bf8ccc`
            // else ctx.fillStyle = '#ff66cc'
            ctx.fill()
            ctx.closePath()
          } else {
            if (brick.powerUp && !brick.hp) {
              const { x, y, powerUp } = brick
              visPowers.push({
                x: x + brickWidth / 2,
                y: y + brickHeight / 2,
                powerUp
              })
              brick.powerUp = false
            }
          }
        }
      }
    }

    const drawStar = (cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3
      let x = cx
      let y = cy
      let step = Math.PI / spikes

      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)
      for (i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius
        y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }
      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
      ctx.fillStyle = 'white'
      ctx.fill()
    }

    const drawPowerUps = () => {
      let id = 0
      visPowers.map(power => {
        if (power.y < canvas.height) {
          if (
            power.y > paddleY &&
            power.y < paddleY + paddleHeight &&
            power.x > paddleX &&
            power.x < paddleX + paddleWidth
          ) {
            visPowers.splice(id, 1)
            power.y = canvas.height + 1
            power.powerUp.func()
            note = power.powerUp.message
          } else {
            drawStar(power.x, power.y, 4, ballRadius, ballRadius - 5)
          }
        } else {
          visPowers.splice(id, 1)
        }
        id++
        power.y++
      })
    }
    let timer = 440
    const drawMessage = () => {
      if (note !== '' && timer > 0) {
        ctx.font = '30px Arial'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(note, canvas.width / 2, canvas.height / 1.5)
        timer--
      } else {
        note = ''
        timer = 440
      }
    }
    const collisionDetection = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          let b = bricks[c][r]
          if (
            x > b.x &&
            x < b.x + brickWidth &&
            y > b.y &&
            y < b.y + brickHeight &&
            b.hp
          ) {
            dy = -dy
            b.hp--
            if (!b.hp) {
              remaining--
            }
            score += 10
          }
        }
      }
      if (!remaining) {
        level++
        x = paddleX + paddleWidth / 2
        y = canvas.height - paddleHeight * 5
        dx = 8
        dy = -8
        gameStarted = false
        clearInterval(interval)
        spawnBlocks()
        draw()
      }
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#26e8cc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (!gameOver) {
        if (rightPressed && paddleX < canvas.width - paddleWidth) {
          paddleX += pSpeed
        } else if (leftPressed && paddleX > 0) {
          paddleX -= pSpeed
        }

        if (y + dy < ballRadius) {
          dy *= -1
        } else if (y + dy > canvas.height - ballRadius) {
          if (lives > 0) {
            setup()
            lives--
          } else {
            endGame()
          }
        }
        if (
          y > canvas.height - paddleHeight * 4 - ballRadius &&
          (x > paddleX && x < paddleX + paddleWidth)
        ) {
          if (rightPressed || leftPressed) {
            y--
            dx++
            dy *= -1
          } else {
            dy *= -1
            y--
          }
        }

        if (
          x + dx < ballRadius ||
          x + dx > canvas.width - ballRadius ||
          (x + dx === paddleX + paddleWidth - ballRadius &&
            x + dx === paddleX - ballRadius &&
            y > canvas.height - paddleHeight * 4 - ballRadius)
        ) {
          dx *= -1
        }
        drawMessage()
        drawLives()
        drawBricks()
        codeHotShot()
        drawBall()
        drawPaddle()
        collisionDetection()
        drawScore()
        drawPowerUps()
        x += dx
        y += dy
      } else {
        clearInterval(interval)
        drawHighScores()
      }
    }
    if (gameStarted === false) {
      draw()
    }
  }
  render () {
    return (
      <div>
        <canvas
          ref='canvas'
          width={screen.width - 20}
          height={screen.height - 100}
          onKeyPress={this.keyPress}
          tabIndex='0'
        />
      </div>
    )
  }
}
const mapState = state => {
  return {
    scores: state.user
  }
}
const mapDispatch = dispatch => {
  return {
    sendScore (user, score) {
      dispatch(sendScore(user, score))
    },
    getScores () {
      dispatch(getScores())
    }
  }
}
export default withRouter(
  connect(
    mapState,
    mapDispatch
  )(Canvas)
)

// for (let i = 0; i < 6; i++) {
//   for (let j = 0; j < 6; j++) {
//     ctx.fillStyle = `rgb(
//         ${Math.floor(255 - 42.5 * i)},
//         ${Math.floor(255 - 42.5 * j)},
//         0)`;
//     ctx.fillRect(j * 25, i * 25, 25, 25);
//   }
// }
