import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { sendScore, getScores } from '../store'

class Canvas extends Component {
  componentDidMount () {
    this.props.getScores()
    const canvas = this.refs.canvas
    const ctx = canvas.getContext('2d')

    const hashCode = str => {
      // java String#hashCode
      var hash = 0
      for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
      }
      return hash
    }

    const intToRGB = i => {
      var c = (i & 0x00ffffff).toString(16).toUpperCase()

      return '00000'.substring(0, 6 - c.length) + c
    }
    // ball
    let x = canvas.width / 2
    let y = 0
    let dx = 2
    let dy = -2
    const ballRadius = 10
    // paddle
    const paddleHeight = 10
    let paddleWidth = 75
    let paddleX = (canvas.width - paddleWidth) / 2
    y = (canvas.width - paddleWidth) / 2 + 2
    let rightPressed = false
    let leftPressed = false
    let gameStarted = false
    let gameOver = false
    let score = 0
    let lives = 3
    let name = ''
    let visPowers = []
    let powerUps = [
      () => {
        paddleWidth = 200
      },
      () => {
        paddleWidth = 30
      },
      () => {
        lives++
      },
      () => {
        dx *= 1.5
        dy *= 1.5
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
        if (powerUpIds.includes(i)) {
          bricks[c][r].powerUp =
            powerUps[Math.round(Math.random() * (powerUps.length - 1) + 1)]
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
      } else if (evt.keyCode == 32 && gameStarted === false) {
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

    const endGame = () => {
      name = prompt('Please enter your name')
      this.props.sendScore(name, score)
      gameOver = true
    }
    const drawBall = () => {
      ctx.beginPath()
      ctx.arc(x, y, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = `#${intToRGB(hashCode(2 + '#0095DD').toString(2))}`
      ctx.fill()
      ctx.closePath()
    }
    const drawLives = () => {
      let buffer = 100
      for (let i = 0; i < lives; i++) {
        ctx.beginPath()
        ctx.arc(buffer + (20 + ballRadius) * i, 15, ballRadius, 0, Math.PI * 2)
        ctx.fillStyle = `#${intToRGB(hashCode(2 + '#0095DD').toString(2))}`
        ctx.fill()
        ctx.closePath()
      }
    }

    const drawScore = () => {
      ctx.font = '16px Arial'
      ctx.fillStyle = '#0095DD'
      ctx.fillText('Score: ' + score, 8, 20)
    }
    const drawHighScores = () => {
      ctx.font = '18px Arial'
      ctx.fillStyle = '#0095DD'
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
      ctx.rect(
        paddleX,
        canvas.height - paddleHeight * 4,
        paddleWidth,
        paddleHeight
      )
      ctx.fillStyle = '#0095DD'
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
            ctx.fillStyle = `#${intToRGB(hashCode((r + c + 24).toString(2)))}`
            ctx.fill()
            ctx.closePath()
          } else {
            if (brick.powerUp) {
              const { x, y, powerUp } = brick
              visPowers.push({ x, y, powerUp })
              brick.powerUp = false
            }
          }
        }
      }
    }

    const drawPowerUps = () => {
      visPowers.map(power => {
        power.y++
        if (power.y < canvas.height) {
          if (
            power.y > canvas.height - paddleHeight * 4 - ballRadius &&
            (power.x > paddleX && power.x < paddleX + paddleWidth)
          ) {
            visPowers.splice(visPowers.indexOf(power), 1)
            power.powerUp()
          } else {
            ctx.beginPath()
            ctx.rect(power.x, power.y, ballRadius, ballRadius)
            ctx.fillStyle = `#${intToRGB(hashCode(power.powerUp))}`
            ctx.fill()
            ctx.closePath()
          }
        } else {
          visPowers.splice(visPowers.indexOf(power), 1)
        }

        return power
      })
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

            if (
              score == brickRowCount * brickColumnCount ||
              this.props.history.location.pathname === '/win'
            ) {
              endGame()
            }
          } else if (b.powerUp && !b.alive) {
            ctx.beginPath()
            ctx.arc(
              b.x + brickWidth / 2,
              b.y + brickHeight / 2,
              ballRadius,
              0,
              Math.PI * 2
            )
            ctx.fillStyle = `#${intToRGB(hashCode(2 + '#0095DD').toString(2))}`
            ctx.fill()
            ctx.closePath()
          }
        }
      }
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!gameOver) {
        if (rightPressed && paddleX < canvas.width - paddleWidth) {
          paddleX += 7
        } else if (leftPressed && paddleX > 0) {
          paddleX -= 7
        }

        if (y + dy < ballRadius) {
          dy *= -1
        } else if (y + dy > canvas.height - ballRadius) {
          if (lives > 0) {
            gameStarted = false
            clearInterval(interval)
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
            dx++
            dy *= -1
          } else dy *= -1
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
        drawLives()
        drawBricks()
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
