const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@exmaple.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// GET

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// View all current urls

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_index", templateVars);
});

// Create new key id and longURL

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"]; // just get the user id from cookies (not the users obj)
  console.log(user_id);
  const user = users[user_id]; // this is getting it from the obj users
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

// View the url and key id directly

app.get("/urls/:id", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user,
  };
  res.render("urls_show", templateVars);
});

// Direct access to website using key id

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// View html example

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// View register page

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_registration", templateVars);
});

// View login page

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

// POST

// View the list of urls

app.post("/urls/", (req, res) => {
  const newKey = generateRandomString();
  urlDatabase[newKey] = req.body.longURL;
  res.redirect(`/urls/${newKey}`);
});

// Delete the url through key id

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls/");
});

// Update the long url for an id

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls/");
});

// View the key and longHRL

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

//log in and log out

app.post("/login", (req, res) => {
  console.log("--/login");
  const userObj = getUserByEmail(req.body.email);

  console.log(req.body);
  if (userObj !== null) {
    // check if passwords in user object match with what was entered
    if (userObj.password !== req.body.password) {
      res.status(403).send("Passwords is incorrect!");
      return;
    }
    res.cookie("user_id", userObj.id);
    res.redirect("/urls");
  } else {
    // check if email exists
    res.status(403).send("The email does not exist!");
    return;
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// register

app.post("/register", (req, res) => {
  // check if they did not enter anything for email / password
  if (req.body.password.length < 1 || req.body.email < 1) {
    res.status(400).send("Error 400 - password / email does not exist");
    return;
  }

  // check to see if email already exists
  // if (getUserByEmail().includes(req.body.email)) {
  //   res.status(400).send("Error 400 - email already exists");
  // }
  if (getUserByEmail(req.body.email) !== null) {
    //(!getUserByEmail(req.body.email))
    res.status(400).send("Error 400 - email already exists");
    return;
  }

  // else they can continue w. the new email and password
  const newGeneratedID = generateRandomString();
  users[newGeneratedID] = req.body;
  users[newGeneratedID]["id"] = newGeneratedID;
  res.cookie("user_id", newGeneratedID);
  res.redirect("/urls");
});

// listen

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// 6 string generator

function generateRandomString() {
  let randomString = "";
  const characters =
    "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomString;
}

// emal loopup helper function

function getUserByEmail(email) {
  for (const user in users) {
    if (email === users[user]["email"]) {
      return users[user];
      // return true;
    }
  }
  return null;
  // return false;
}
