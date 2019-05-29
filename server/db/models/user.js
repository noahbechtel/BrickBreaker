const Sequelize = require('sequelize')
const db = require('../db')

const User = db.define('user', {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'Anon'
  },
  score: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
})

module.exports = User
