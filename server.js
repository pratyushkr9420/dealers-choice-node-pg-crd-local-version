const express = require("express");
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/dealers_choice_crd_db');
const port = process.env.PORT || 3000;
app.use('/public', express.static("public"))
app.use(express.urlencoded({extended:false}));

app.use(async(req,res,next) => {
  if (req.query.method){
    req.method = req.query.method;
  }
  next();
})

app.post("/", async(req,res,next) => {
  try{
    const SQL = `
    INSERT INTO languages(name,description)
    VALUES($1,$2)
    RETURNING *
    `;
    const response = await client.query(SQL, [req.body.name,req.body.description]);
    const program = response.rows[0];
    res.redirect(`/languages/${program.id}`);
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/languages/:id', async(req,res,next) => {
  try{
    const SQL = `
    DELETE FROM languages
    WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.redirect('/');
  }
  catch(ex){
    next(ex);
  }
})



app.get('/', async(req,res,next) => {
  try{
    const SQL = `
  SELECT * FROM languages;
  `
  const response = await client.query(SQL);
  const programs = response.rows;
  res.send(`
  <html>
  <head>
   <link rel = "stylesheet" href = "/public/design.css">
  </head>
  <body>
   <h1>Programming languages and my thoughts on them</h1>
   <div id = "container">
    <ul>
    ${
      programs.map(program => {
        return `<li><a href='/languages/${program.id}'>${program.name}</a></li>`
      }).join(" ")
    }
    </ul>
    <form method = 'POST' action = '/'>
    <input name = "name" placeholder = "insert name of language">
    <input name = "description" placeholder = "insert your thoughts on the language">
    <button>Create</button>
    </form>
    </div>
  </body>
  </html>
  `);
  }
  catch(ex){
    next(ex);
  }
})


app.get('/languages/:id', async(req,res,next) => {
  try{
    const SQL = `
  SELECT * FROM languages
  WHERE id = $1;
  `
  const response = await client.query(SQL, [req.params.id]);
  const program = response.rows[0];
  res.send(`
  <html>
  <head>
   <link rel = "stylesheet" href = "/public/design.css">
  </head>
  <body>
  <h1>${program.name}<h1>
  <p>
   ${program.description}
  </p>
  <a href = "/">back</a>
  <a href = "/languages/${program.id}?method=delete">delete</a>
  </body>
  </html>
  `);
  }
  catch(ex){
    next(ex);
  }
})

const setup = () => {
  app.listen(port, async() => {
    try{
      console.log(`listening on port ${port}`);
      await client.connect();
  
      const SQL = `
      DROP TABLE IF EXISTS languages;
      CREATE TABLE languages(
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT  
        );
      INSERT INTO languages(name,description) VALUES('python','Python is simple, easy to learn and extremely intuitive. Too bad you can only write server side code with it. Can help you do some cool stuff in machine learning');
      INSERT INTO languages(name,description) VALUES('java','Java is the language that can help you learn about object-oriented programing. For me learning Java was like wearing big boy pants as far as programming goes lol!. Dont know much about it yet but seems very useful for learning DSA');
      INSERT INTO languages(name,description) VALUES('javascript','JavaScript very powerful language, kind of wierd. But most effective as it helps you write both client and server side code');
      INSERT INTO languages(name,description) VALUES('C++','Its the least intutive language to learn. Gave me PTSD about coding.');
      `
      await client.query(SQL);
    }
    catch(ex){
      console.log(ex);
    }
  });
  
}
setup();
