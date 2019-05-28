import axios from 'axios'
import history from '../history'

/**
 * ACTION TYPES
 */

const GET_SCORES = 'GET_SCORES'

/**
 * INITIAL STATE
 */

/**
 * ACTION CREATORS
 */
const setScores = scores => ({ type: GET_SCORES, scores })

/**
 * THUNK CREATORS
 */
export const sendScore = (user, score) => async () => {
  try {
    await axios.post('/api/users/scores', { user, score })
  } catch (err) {
    console.error(err)
  }
}
export const getScores = () => async dispatch => {
  try {
    const res = await axios.get('/api/users/scores')
    dispatch(setScores(res.data))
  } catch (err) {
    console.error(err)
  }
}

/**
 * REDUCER
 */
export default function (state = {}, action) {
  switch (action.type) {
    case GET_SCORES:
      return action.scores
    default:
      return state
  }
}
