const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

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
  if (!req.cookies["user_id"]) {
    res.status(403).send("<h2>Please login first to view the urls</h2>");
    return;
  } else {
    const user_id = req.cookies["user_id"];
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
  // cookie doesnt exist AKA user is not logged in
  if (!req.cookies["user_id"]) {
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    templateVars = { user };
    res.render("urls_login", templateVars);
  } else {
    const user_id = req.cookies["user_id"]; // just get the user id from cookies (not the users obj)
    const user = users[user_id]; // this is getting it from the obj users
    const templateVars = {
      user,
    };
    res.render("urls_new", templateVars);
  }
});

// View the url and key id directly

app.get("/urls/:id", (req, res) => {
  // if user is not logged in / cookie does not exist
  if (!req.cookies["user_id"]) {
    res.send("Please login to view page!");
    return;
  }
  const userUrls = urlsForUser(req.cookies["user_id"]);
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
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user,
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
  if (!req.cookies["user_id"]) {
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    const templateVars = { user };
    res.render("urls_registration", templateVars);
  } else if (req.cookies["user_id"]) {
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    const templateVars = {
      urls: urlDatabase,
      user,
    };
    res.render("urls_index", templateVars);
  }
});

// View login page

app.get("/login", (req, res) => {
  if (!req.cookies["user_id"]) {
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    const templateVars = { user };
    res.render("urls_login", templateVars);
  } else if (req.cookies["user_id"]) {
    const user_id = req.cookies["user_id"];
    const user = users[user_id];
    const templateVars = {
      urls: urlDatabase,
      user,
    };
    res.render("urls_index", templateVars);
  }
});

// POST

// View the list of urls

app.post("/urls/", (req, res) => {
  // user is not logged in
  const userId = req.cookies["user_id"];
  if (!userId) {
    res.status(403).send("<h2>You are not logged in!</h2>");
    return;
  } else {
    const newKey = generateRandomString();
    const createdNewLongURL = req.body.longURL;
    urlDatabase[newKey] = {
      longURL: createdNewLongURL,
      userID: req.cookies["user_id"],
    };
    res.redirect(`/urls/${newKey}`);
  }
});

// Delete the url through key id

app.post("/urls/:id/delete", (req, res) => {
  //check user id first
  if (!req.cookies["user_id"]) {
    res.status(403).send("You need to login to delete this!");
    return;
  }
  const userUrls = urlsForUser(req.cookies["user_id"]);
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

app.post("/urls/:id/edit", (req, res) => {
  const userUrls = urlsForUser(req.cookies["user_id"]);
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
  const userObj = getUserByEmail(req.body.email);
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

// function to compared ids to URLS

function urlsForUser(id) {
  let urls = {};
  for (const url in urlDatabase) {
    const urlUserID = urlDatabase[url]["userID"];
    if (urlUserID === id) urls[url] = urlDatabase[url];
  }
  return urls;
}
