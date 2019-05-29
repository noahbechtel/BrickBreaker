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
    let lives = 3
    let name = ''
    let currentPower
    let note = ''
    let pSpeed = 7
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

    // blocks
    let brickWidth = 75
    let brickHeight = 20
    let brickPadding = 10
    let brickOffsetTop = 30
    let brickOffsetLeft = 30
    let brickRowCount = (canvas.width * 0.33) / (brickOffsetTop + brickHeight)
    let brickColumnCount = canvas.width / (brickOffsetLeft + brickWidth - 10)
    let powerUpIds = []
    for (let i = (brickRowCount * brickColumnCount) / 10; i > 0; i--) {
      powerUpIds.push(
        Math.round(Math.random() * (brickRowCount * brickColumnCount - 1) + 5)
      )
    }
    let bricks = []
    let i = 0
    for (var c = 0; c < brickColumnCount; c++) {
      bricks[c] = []
      for (var r = 0; r < brickRowCount; r++) {
        i++
        bricks[c][r] = { x: 0, y: 0, alive: true }

        // .includes(i)
        if (powerUpIds) {
          bricks[c][r].powerUp =
            powerUps[Math.floor(Math.random() * powerUps.length)]
        }
      }
    }

    let interval

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
      let tilt = Math.round(evt.gamma)
      tilt > 20 || tilt < -20 ? (pSpeed = 10) : (pSpeed = 6)
      if (tilt > 5) {
        rightPressed = true
        leftPressed = false
      } else if (tilt < -5) {
        rightPressed = false
        leftPressed = true
      } else {
        rightPressed = false
        leftPressed = false
      }
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
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = `#ffffff`
      ctx.fill()
      ctx.closePath()
    }
    const drawLives = () => {
      let buffer = 100
      for (let i = 0; i < lives; i++) {
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
      ctx.font = '18px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('HighScores', 8, 20)
      let i = 0
      let insert = false
      this.props.scores.map(entry => {
        i += 22

        if (entry.score < score && insert === false) {
          ctx.fillText('-' + name + ': ' + score, 8, 20 + i)
          i += 22
          insert = true
        }
        return ctx.fillText('-' + entry.email + ': ' + entry.score, 8, 20 + i)
      })
    }

    const drawPaddle = () => {
      ctx.beginPath()
      ctx.rect(paddleX, paddleY, paddleWidth, paddleHeight)
      ctx.fillStyle = '#f2f2f2'
      ctx.fill()
      ctx.closePath()
    }

    const drawBricks = () => {
      for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
          let brick = bricks[c][r]
          let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
          let brickY = r * (brickHeight + brickPadding) + brickOffsetTop
          brick.x = brickX
          brick.y = brickY
          if (brick.alive) {
            ctx.beginPath()
            ctx.rect(brickX, brickY, brickWidth, brickHeight)
            if (r % 2 === 0) ctx.fillStyle = `#bf8ccc`
            else ctx.fillStyle = '#ff66cc'
            ctx.fill()
            ctx.closePath()
          } else {
            if (brick.powerUp) {
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
      for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
          var b = bricks[c][r]
          if (
            x > b.x &&
            x < b.x + brickWidth &&
            y > b.y &&
            y < b.y + brickHeight &&
            b.alive
          ) {
            dy = -dy
            b.alive = false
            score += 10

            if (score == brickRowCount * brickColumnCount) {
              endGame()
            }
          }
        }
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
            gameStarted = false
            clearInterval(interval)
            visPowers = []
            lives--
            x = paddleX + paddleWidth / 2
            y = canvas.height - paddleHeight * 5
            dx = 2
            dy = -2
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
