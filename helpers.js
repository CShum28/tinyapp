const { urlDatabase } = require("./database.js");

// emal loopup helper function

function getUserByEmail(email, database) {
  for (const userId in database) {
    if (email === database[userId].email) {
      return database[userId];
      // return true;
    }
  }
  return undefined;
  // return false;
}

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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
