const router = require('express').Router()
const { User } = require('../db/models')
module.exports = router

router.post('/scores', async (req, res, next) => {
  try {
    const user = await User.findOrCreate({
      where: { email: req.body.user },
      defaults: {
        score: req.body.score
      }
    })
    if (user.score < req.bodyscore) {
      user.update({ score: req.body.score })
    }
  } catch (err) {
    next(err)
  }
})

router.get('/scores', async (req, res, next) => {
  try {
    const scores = await User.findAll({
      order: [['score', 'DESC']],
      limit: 10
    })
    res.json(scores)
  } catch (err) {
    next(err)
  }
})
