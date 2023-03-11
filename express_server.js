const express = require("express");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const methodOverride = require("method-override");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require("./helpers.js");
const app = express();
const PORT = 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cookieSession({
    name: "session",
    keys: ["random-array"],
  })
);
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

const dateTimeTracker = [];
let urlVisitCounter = 1;

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
  },
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
  // if cookie doesn't exist / user isnt logged in
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.status(403).send("<h2>Please login first to view the urls</h2>");
    return;
  } else {
    const user_id = req.session.user_id;
    const user = users[user_id];
    const templateVars = {
      urls: urlsForUser(user_id),
      user,
    };
    res.render("urls_index", templateVars);
  }
});

// Create new key id and longURL

app.get("/urls/new", (req, res) => {
  // cookie doesnt exist & user is not logged in
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    const user_id = req.session.user_id;
    const user = users[user_id];
    templateVars = { user };
    res.render("urls_login", templateVars);
  } else {
    const user_id = req.session.user_id; // just get the user id from cookies (not the users obj)
    const user = users[user_id]; // this is getting it from the obj users
    const templateVars = {
      user,
    };
    res.render("urls_new", templateVars);
  }
});

// View the url and key id directly

app.get("/urls/:id", (req, res) => {
  // cookie doesnt exist & user is not logged in
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    res.send("Please login to view page!");
    return;
  }
  const userUrls = urlsForUser(req.session.user_id);
  const keysOfUserUrls = Object.keys(userUrls);
  const keysOfUrlDatabase = Object.keys(urlDatabase);
  if (!keysOfUrlDatabase.includes(req.params.id)) {
    // if the id does not exist yet
    res.status(403).send("The id does not exist!");
    return;
  } else if (!keysOfUserUrls.includes(req.params.id)) {
    // if user is logged in, but the page does not belong to them
    res.status(403).send("You do not own this url, so you can not view it");
    return;
  } else {
    const user_id = req.session.user_id;
    const user = users[user_id];

    const date = new Date();
    const dateTime =
      ("00" + (date.getMonth() + 1)).slice(-2) +
      "/" +
      ("00" + date.getDate()).slice(-2) +
      "/" +
      date.getFullYear() +
      " " +
      ("00" + date.getHours()).slice(-2) +
      ":" +
      ("00" + date.getMinutes()).slice(-2) +
      ":" +
      ("00" + date.getSeconds()).slice(-2);

    dateTimeTracker.push(dateTime);
    urlVisitCounter++;
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user,
      dateTimeTracker,
      urlVisitCounter,
    };

    res.render("urls_show", templateVars);
  }
  // }
});

// Direct access to website using key id

app.get("/u/:id", (req, res) => {
  const urlInfo = urlDatabase[req.params.id];
  if (!urlInfo) {
    res.status(403).send("<h2>This url does not exist!</h2>");
    return;
  } else {
    const longURL = urlInfo.longURL;
    res.redirect(longURL);
  }
});

// View html example

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// View register page

app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    const user_id = req.session.user_id;
    const user = users[user_id];
    const templateVars = { user };
    res.render("urls_registration", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// View login page

app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];
  if (!user) {
    const user_id = req.session.user_id;
    const user = users[user_id];
    const templateVars = { user };
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls");
  }
});

// POST

// View the list of urls

app.post("/urls/", (req, res) => {
  // user is not logged in
  const userId = req.session.user_id;
  if (!userId) {
    res.status(403).send("<h2>You are not logged in!</h2>");
    return;
  } else {
    const newKey = generateRandomString();
    const createdNewLongURL = req.body.longURL;
    urlDatabase[newKey] = {
      longURL: createdNewLongURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${newKey}`);
  }
});

// Delete the url through key id

// app.post("/urls/:id/delete", (req, res) => { // ORIGINAL LINE
app.delete("/urls/:id", (req, res) => {
  //check user id first
  if (!req.session.user_id) {
    res.status(403).send("You need to login to delete this!");
    return;
  }
  const userUrls = urlsForUser(req.session.user_id);
  const keysOfUserUrls = Object.keys(userUrls);
  const keysOfUrlDatabase = Object.keys(urlDatabase);
  if (!keysOfUrlDatabase.includes(req.params.id)) {
    // check if the id exists or not
    res.status(403).send("This can not be deleted, the id does not exist!");
    return;
  } else if (!keysOfUserUrls.includes(req.params.id)) {
    // check if url belongs to user or not
    res.status(403).send("You do not own this url so you can not delete it!");
    return;
  } else if (keysOfUserUrls.includes(req.params.id)) {
    const id = req.params.id;
    delete urlDatabase[id];
    res.redirect("/urls/");
  }
});

// Update the long url for an id

// app.post("/urls/:id/edit", (req, res) => { ORIGINAL LINE
app.put("/urls/:id", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  const keysOfUserUrls = Object.keys(userUrls);
  if (keysOfUserUrls.includes(req.params.id)) {
    const id = req.params.id;
    const longURL = req.body.longURL;
    const urlReplace = urlDatabase[id];
    urlReplace["longURL"] = longURL; // replace long url instead of the object
    res.redirect("/urls/");
  } else {
    res.status(403).send("You can not edit the url, you do not own it");
  }
});

// View the key and longHRL

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

//log in and log out

app.post("/login", (req, res) => {
  const userObj = getUserByEmail(req.body.email, users);

  if (userObj !== undefined) {
    const result = bcrypt.compareSync(req.body.password, userObj.password);
    // check if password entered matches hashed password
    if (result) {
      // res.cookie("user_id", userObj.id);
      req.session.user_id = userObj.id;
      res.redirect("/urls");
    } else {
      return res.status(403).send("Passwords is incorrect!");
    }
  } else {
    // check if email exists
    return res.status(403).send("The email does not exist!");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
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
  if (getUserByEmail(req.body.email, users) !== undefined) {
    //(!getUserByEmail(req.body.email))
    res.status(400).send("Error 400 - email already exists");
    return;
  }

  // else they can continue w. the new email and password
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newGeneratedID = generateRandomString();
  users[newGeneratedID] = {
    id: newGeneratedID,
    email: req.body.email,
    password: hashedPassword,
  };
  req.session.user_id = newGeneratedID;
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

function urlsForUser(id) {
  let urls = {};
  for (const url in urlDatabase) {
    const urlUserID = urlDatabase[url]["userID"];
    if (urlUserID === id) urls[url] = urlDatabase[url];
  }
  return urls;
}
