// setup for mom, who can connect to heroku db no problem unlike p4a
require('dotenv').config({ path:'/home/codabool/codadash/.env' })
const express = require('express')
const { format } = require('timeago.js')
const { Pool } = require('pg')
const app = express()
const cors = require('cors')

app.use(cors())

const pool_remote = new Pool({
  connectionString: process.env.PG_REMOTE_URI,
  ssl: { rejectUnauthorized: false },
  max: 1
})
const pool_local = new Pool({
  connectionString: process.env.PG_LOCAL_URI
})

async function query(q, values, p) {
  return await p.query(q, values)
    .then(res => {
      return res
    })
    .catch(err => {
      console.log('query error', err)
      return {err: err.message} // passes to nearest error handler
    })
}

// app.get('/blog', async (req, res) => {
//   try {
//     const result = await query('SELECT * FROM post', [], pool_remote)
//     let totalViews = 0
//     for (const page in result.rows) {
//       console.log(totalViews, ' + ', Number(result.rows[page].views))
//       totalViews = totalViews + Number(result.rows[page].views)
//     }
//     const inReview = await query("SELECT * FROM comment WHERE status='review'", [], pool_remote)
//     res.status(200).json({stat: result.rows, inReview: inReview.rows, totalViews})
//   } catch (err) {
//     res.status(400).send('General Error Cannot Stats')
//   }
// });

app.get('/', async (req, res) => {
  try {
    // remote pg connection
    const result = await query('SELECT * FROM post', [], pool_remote)
    let totalViews = 0
    for (const page in result.rows) {
      totalViews = totalViews + Number(result.rows[page].views)
    }
    const inReview = await query("SELECT * FROM comment WHERE status='review'", [], pool_remote)

    // local pg connection
    const p4a = await query('SELECT * FROM p4a', [], pool_local)
    p4a.rows[0]['Last Ran'] = format(p4a.rows[0]['Last Ran']) // make time ago more readable
    const p8a = await query('SELECT * FROM p8a', [], pool_local)
    p8a.rows[0]['Last Ran'] = format(p8a.rows[0]['Last Ran'])
    const mom = await query('SELECT * FROM mom', [], pool_local)
    mom.rows[0]['Last Ran'] = format(mom.rows[0]['Last Ran'])
    res.status(200).json({ p4a: p4a.rows[0], p8a: p8a.rows[0], mom: mom.rows[0], stat: result.rows, inReview: inReview.rows, totalViews})
  } catch (err) {
    res.status(400).send('General Error Cannot Stats')
  }
});

app.use((req, res) => {
  res.status(404).send("Sorry, that route doesn't exist");
});

app.listen(3001, () => {
  console.log('Express started at ', 3001, 'http://localhost:3001');
});